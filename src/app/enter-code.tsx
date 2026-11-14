import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';
import { reasonText } from '../utils/reasons';

export default function EnterCode() {
  const { target } = useLocalSearchParams<{ target: string }>();
  const { players, game, validateWithCode } = useDex();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const player = players.find((p) => p.id === target);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await validateWithCode(target, code);
      if (res.ok) {
        Alert.alert(
          res.holographic ? '✨ Carte holographique capturée !' : '★ Carte capturée !',
          `Photo validée avec ${player?.pseudo ?? 'ce joueur'} grâce à son code temporaire.`,
        );
        router.replace({ pathname: '/card/[id]', params: { id: target } });
      } else {
        setError(reasonText(res.reason));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔢 Code de validation</Text>
      <Text style={styles.subtitle}>
        {player?.pseudo ?? 'Ce joueur'} te montre son code temporaire (type MFA, {game.codeTtlSeconds}s, usage unique) sur sa carte. Saisis-le
        ici pour valider la photo prise avec lui.
      </Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="000000"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={[styles.cta, (busy || code.length !== 6) && styles.ctaDisabled]} disabled={busy || code.length !== 6} onPress={submit}>
        <Text style={styles.ctaText}>{busy ? 'Vérification…' : 'Valider la photo'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.btn,
    color: colors.yellow,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    paddingVertical: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cta: {
    backgroundColor: colors.red,
    borderRadius: radius.btn,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  back: {
    alignSelf: 'center',
    marginTop: 6,
  },
  backText: {
    color: colors.muted,
    fontSize: 13,
  },
});
