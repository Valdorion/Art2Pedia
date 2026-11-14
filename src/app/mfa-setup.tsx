import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useDex } from '../store/DexContext';
import { useMfa } from '../store/MfaContext';
import { colors, radius } from '../theme';
import { isDeviceTrusted, MFA_ISSUER, mfaEnabled, TRUST_DAYS } from '../utils/mfa';
import { base32Decode, otpauthUri, verifyTotp } from '../utils/totp';

export default function MfaSetup() {
  const { hydrated, me } = useDex();
  const { hydrated: mfaHydrated, configFor, newTotpSecret, enableTotp, enableDeviceKey, disableMfa } = useMfa();
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const cfg = me ? configFor(me.id) : null;

  useEffect(() => {
    if (hydrated && !me) router.replace('/login');
  }, [hydrated, me]);

  if (!me || !mfaHydrated) return <View style={styles.container} />;

  const startTotp = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      setSecret(await newTotpSecret());
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const activateTotp = async () => {
    if (!secret) return;
    setBusy(true);
    setError(null);
    try {
      const ok = verifyTotp(base32Decode(secret), code);
      if (!ok) {
        setError('Code invalide, réessaie avec le code actuel de ton application.');
        return;
      }
      await enableTotp(me.id, secret);
      setSecret(null);
      setCode('');
      setInfo('MFA activé avec ton application d’authentification. ✅');
    } finally {
      setBusy(false);
    }
  };

  const activateDeviceKey = async () => {
    setBusy(true);
    setError(null);
    try {
      await enableDeviceKey(me.id);
      setInfo('Clé d’appareil créée et enregistrée sur cet appareil. ✅');
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    setError(null);
    try {
      await disableMfa(me.id);
      setSecret(null);
      setCode('');
      setInfo('MFA désactivé.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔐 MFA — compte local</Text>
      <Text style={styles.subtitle}>
        Protège ton compte local (hors ligne) par un second facteur : application d’authentification (TOTP) ou clé
        d’appareil. Un appareil mémorisé {TRUST_DAYS} jours n’est pas re-vérifié.
      </Text>

      {cfg && mfaEnabled(cfg) ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            MFA actif{cfg.totpEnabled ? ' · application d’authentification' : ''}
            {cfg.deviceKeyEnabled ? ' · clé d’appareil' : ''}
          </Text>
          <Text style={styles.statusSub}>
            {isDeviceTrusted(cfg) && cfg.trustedUntil
              ? `Cet appareil est mémorisé jusqu’au ${new Date(cfg.trustedUntil).toLocaleDateString('fr-FR')}.`
              : 'Cet appareil n’est pas mémorisé.'}
          </Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={turnOff} disabled={busy}>
            <Text style={styles.dangerText}>Désactiver le MFA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>1. Application d’authentification (TOTP)</Text>
          {secret ? (
            <View style={styles.qrBox}>
              <QRCode value={otpauthUri(MFA_ISSUER, me.pseudo, secret)} size={170} backgroundColor="#FFFFFF" color="#141414" />
              <Text style={styles.qrHint}>Scanne ce QR avec ton application d’authentification, puis entre le code à 6 chiffres.</Text>
              <Text style={styles.secretText}>Clé manuelle : {secret}</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor={colors.muted}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity style={styles.cta} onPress={activateTotp} disabled={busy || code.length !== 6}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Activer le TOTP</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cta} onPress={startTotp} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Générer un QR code TOTP</Text>}
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>2. Clé d’appareil</Text>
          <Text style={styles.muted}>
            Génère une clé secrète stockée uniquement dans le trousseau sécurisé de cet appareil (expo-secure-store).
          </Text>
          <TouchableOpacity style={[styles.cta, styles.ctaAlt]} onPress={activateDeviceKey} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Créer une clé d’appareil</Text>}
          </TouchableOpacity>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <Link href="/my-card" style={styles.backLink}>
        <Text style={styles.backText}>← Retour à ma carte</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 8,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  statusBox: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    padding: 14,
    gap: 8,
  },
  statusText: {
    color: colors.green,
    fontWeight: '800',
    fontSize: 14,
  },
  statusSub: {
    color: colors.muted,
    fontSize: 12,
  },
  qrBox: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    maxWidth: '100%',
  },
  qrHint: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 240,
    textAlign: 'center',
  },
  secretText: {
    color: colors.ink,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
    width: 180,
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
  dangerBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.btn,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dangerText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontWeight: '600',
  },
  info: {
    color: colors.green,
    fontWeight: '600',
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 16,
  },
  backText: {
    color: colors.muted,
    fontSize: 13,
  },
});
