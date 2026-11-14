import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { DexProvider } from '../store/DexContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <DexProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </DexProvider>
  );
}
