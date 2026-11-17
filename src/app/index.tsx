import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useDex } from '../store/DexContext';
import { colors } from '../theme';

export default function Index() {
  const { hydrated, me } = useDex();

  useEffect(() => {
    if (hydrated) router.replace(me ? '/dex' : '/register');
  }, [hydrated, me]);

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
