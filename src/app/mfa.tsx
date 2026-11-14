import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { useDex } from '../store/DexContext';
import { useMfa } from '../store/MfaContext';
import { colors, radius } from '../theme';
import { mfaGateRequired, TRUST_DAYS } from '../utils/mfa';

export default function MfaGate() {
  const { hydrated: authHydrated, session } = useAuth();
  const { hydrated, me } = useDex();
  const { hydrated: mfaHydrated, configFor, verifyTotp, confirmDeviceKey, trustDevice } = useMfa();
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cfg = me ? configFor(me.id) : null;

  useEffect(() => {
    if (!authHydrated || !hydrated || !mfaHydrated) return;
    if (!me) {
      router.replace(session ? '/dex' : '/login');
      return;
    }
    if (session || !mfaGateRequired(cfg)) router.replace('/dex');
  }, [authHydrated, hydrated, mfaHydrated, session, me, cfg]);

  if (!me || !cfg || !mfaGateRequired(cfg)) return <View style={styles.container} />;

  const finish = async (ok: boolean, what: string) => {
    if (!ok) {
      setError(`${what} invalide.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (remember) await trustDevice(me.id);
      router.replace('/dex');
    } finally {
      setBusy(false);
    }
  };

  const onVerifyCode = async () => {
    setBusy(true);
    try {
      await finish(await verifyTotp(me.id, code), 'Code');
    } finally {
      setBusy(false);
    }
  };

  const onDeviceKey = async () => {
    setBusy(true);
    try {
      await finish(await confirmDeviceKey(me.id), 'Clé d’appareil');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔐 Vérification en deux étapes</Text>
      <Text style={styles.subtitle}>
        Ce compte local est protégé par MFA. Valide un second facteur pour continuer.
      </Text>

      {cfg.totpEnabled ? (
        <View style={styles.section}>
          <Text style={styles.label}>Code de l’application d’authentification (6 chiffres)</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={colors.muted}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.cta} onPress={onVerifyCode} disabled={busy || code.length !== 6}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Vérifier le code</Text>}
          </TouchableOpacity>
        </View>
      ) : null}

      {cfg.deviceKeyEnabled ? (
        <View style={styles.section}>
          <Text style={styles.label}>Clé de cet appareil</Text>
          <TouchableOpacity style={[styles.cta, styles.ctaAlt]} onPress={onDeviceKey} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Confirmer avec la clé d’appareil</Text>}
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={styles.rememberRow} onPress={() => setRemember((r) => !r)}>
        <View style={[styles.checkbox, remember && styles.checkboxOn]}>
          {remember ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.rememberText}>Mémoriser cet appareil pendant {TRUST_DAYS} jours</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 90,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
    gap: 10,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: colors.red,
    borderRadius: radius.btn,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaAlt: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    borderColor: colors.yellow,
    backgroundColor: colors.panel2,
  },
  check: {
    color: colors.yellow,
    fontWeight: '900',
  },
  rememberText: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
  },
  error: {
    color: colors.danger,
    marginTop: 14,
    fontWeight: '600',
  },
});
