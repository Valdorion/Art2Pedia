import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProviderButton } from '../components/ProviderButton';
import type { SignInResult } from '../hooks/useProviderSignIn';
import { PROVIDERS } from '../services/authProviders';
import { useAuth } from '../store/AuthContext';
import { useDex } from '../store/DexContext';
import { colors } from '../theme';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const { hydrated: authHydrated, session, signIn } = useAuth();
  const { hydrated, me } = useDex();

  useEffect(() => {
    if (authHydrated && hydrated && session) router.replace(me ? '/dex' : '/register');
  }, [authHydrated, hydrated, session, me]);

  const handleSignedIn = async (result: SignInResult) => {
    await signIn(result);
    router.replace(me ? '/dex' : '/register');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Art2Dex</Text>
      <Text style={styles.subtitle}>
        Connecte-toi ou crée ton compte avec un provider pour recevoir ta carte Pokédex et ton QR personnel à l&apos;Art2Play.
      </Text>

      <View style={styles.buttons}>
        {PROVIDERS.map((p) => (
          <ProviderButton key={p.id} providerId={p.id} onSignedIn={handleSignedIn} />
        ))}
      </View>

      <Link href="/register" style={styles.demoLink}>
        <Text style={styles.demoText}>Continuer en mode démo (hors ligne, sans compte)</Text>
      </Link>
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
    color: colors.red,
    fontSize: 40,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 20,
  },
  buttons: {
    gap: 14,
  },
  demoLink: {
    alignSelf: 'center',
    marginTop: 28,
  },
  demoText: {
    color: colors.muted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
