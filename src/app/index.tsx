import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { useDex } from '../store/DexContext';
import { useMfa } from '../store/MfaContext';
import { colors } from '../theme';
import { mfaGateRequired } from '../utils/mfa';

export default function Index() {
  const { hydrated: authHydrated, session } = useAuth();
  const { hydrated, me } = useDex();
  const { hydrated: mfaHydrated, configFor } = useMfa();

  useEffect(() => {
    if (!authHydrated || !hydrated || !mfaHydrated) return;
    if (session) {
      router.replace(me ? '/dex' : '/register');
      return;
    }
    if (!me) {
      router.replace('/login');
      return;
    }
    router.replace(mfaGateRequired(configFor(me.id)) ? '/mfa' : '/dex');
  }, [authHydrated, hydrated, mfaHydrated, session, me, configFor]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.yellow} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
