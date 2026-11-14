import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider } from '../store/AuthContext';
import { DexProvider } from '../store/DexContext';
import { MfaProvider } from '../store/MfaContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <MfaProvider>
        <DexProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
        </DexProvider>
      </MfaProvider>
    </AuthProvider>
  );
}
