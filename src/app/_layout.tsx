import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider } from '../store/AuthContext';
import { DexProvider } from '../store/DexContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DexProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </DexProvider>
    </AuthProvider>
  );
}
