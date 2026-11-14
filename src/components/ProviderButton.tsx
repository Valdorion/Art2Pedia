import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProviderSignIn, type SignInResult } from '../hooks/useProviderSignIn';
import { getProvider } from '../services/authProviders';
import { colors, radius } from '../theme';
import type { AuthProviderId } from '../types';

export function ProviderButton({
  providerId,
  onSignedIn,
}: {
  providerId: AuthProviderId;
  onSignedIn: (result: SignInResult) => void;
}) {
  const def = getProvider(providerId);
  const { signIn, busy, configured, available, error } = useProviderSignIn(providerId);
  const disabled = busy || !configured || !available;
  const darkText = def.id === 'google';

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: def.brandColor, opacity: disabled ? 0.45 : 1 }]}
        disabled={disabled}
        onPress={async () => {
          const r = await signIn();
          if (r) onSignedIn(r);
        }}
      >
        {busy ? (
          <ActivityIndicator color={darkText ? '#141414' : '#FFFFFF'} />
        ) : (
          <Text style={[styles.label, { color: darkText ? '#141414' : '#FFFFFF' }]}>
            Se connecter avec {def.label}
          </Text>
        )}
      </TouchableOpacity>
      {!configured ? (
        <Text style={styles.hint}>à configurer : {def.clientIdEnvKey} dans .env (voir .env.example)</Text>
      ) : null}
      {!available ? <Text style={styles.hint}>Sign in with Apple natif : iOS uniquement (dev build)</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  btn: {
    borderRadius: radius.btn,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    fontWeight: '800',
    fontSize: 15,
  },
  hint: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
});
