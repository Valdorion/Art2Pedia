import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { useDex } from '../store/DexContext';
import { colors } from '../theme';

export default function Index() {
  const { hydrated: authHydrated, session } = useAuth();
  const { hydrated, me } = useDex();

  useEffect(() => {
    if (!authHydrated || !hydrated) return;
    if (!session) router.replace('/login');
    else if (!me) router.replace('/register');
    else router.replace('/dex');
  }, [authHydrated, hydrated, session, me]);

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
