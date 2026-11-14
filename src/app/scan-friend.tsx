import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScannerShell } from '../components/ScannerShell';
import { colors } from '../theme';
import { parseQr } from '../utils/qr';

export default function ScanFriend() {
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <ScannerShell
        hint="Scanne le QR personnel d’un autre joueur pour voir sa carte"
        onQr={(data) => {
          const parsed = parseQr(data);
          if (!parsed) {
            setError('QR non reconnu : scanne un QR Art2Dex (joueur ou stand).');
            return;
          }
          setError(null);
          if (parsed.kind === 'player') {
            router.replace({ pathname: '/card/[id]', params: { id: parsed.id } });
          } else {
            router.replace('/scan-stand');
          }
        }}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScannerShell>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
