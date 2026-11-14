import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ScannerShell } from '../components/ScannerShell';
import { useDex } from '../store/DexContext';
import { colors } from '../theme';
import { parseQr } from '../utils/qr';
import { reasonText } from '../utils/reasons';

export default function ScanFriend() {
  const { game, unlockWithQr } = useDex();
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <ScannerShell
        hint={
          game.mode === 'collection'
            ? "Scanne le QR d'un joueur pour voir sa carte, puis valide la photo avec son code temporaire"
            : "Scanne le QR personnel d'un autre joueur pour débloquer sa carte"
        }
        onQr={(data) => {
          const parsed = parseQr(data);
          if (!parsed) {
            setError('QR non reconnu : scanne un QR Art2Dex (joueur ou stand).');
            return;
          }
          setError(null);
          if (parsed.kind === 'player') {
            if (game.mode === 'classic') {
              const res = unlockWithQr(parsed.id);
              if (res.ok) {
                Alert.alert(
                  res.holographic ? '✨ Carte holographique !' : '★ Carte débloquée !',
                  res.holographic
                    ? 'Coup de chance : sa carte est débloquée en version holographique.'
                    : 'Sa carte est maintenant dans ton Pokédex.',
                );
              } else if (res.reason && res.reason !== 'deja-capturee') {
                setError(reasonText(res.reason));
              }
            }
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
