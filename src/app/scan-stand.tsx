import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScannerShell } from '../components/ScannerShell';
import { WindowBanner } from '../components/DexHeader';
import { STANDS } from '../config';
import { useNow } from '../hooks/useNow';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';
import { isPlayWindow } from '../utils/eventWindow';
import { parseQr } from '../utils/qr';
import { reasonText } from '../utils/reasons';

const STAND_LIST = STANDS as readonly string[];

export default function ScanStand() {
  const { event, game, rechargeFromStand } = useDex();
  const now = useNow();
  const [error, setError] = useState<string | null>(null);
  const open = isPlayWindow(now, event);

  if (!open) {
    return (
      <View style={styles.center}>
        <Text style={styles.blockedTitle}>🔋 Recharge indisponible</Text>
        <WindowBanner now={now} event={event} />
        <Text style={styles.msg}>{reasonText('hors-fenetre')}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/dex')}>
          <Text style={styles.btnText}>Retour au Pokédex</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScannerShell
        hint={`Scanne le QR d’un stand du salon pour recharger +${game.qrRechargeAmount} photos (${STAND_LIST.join(', ')})`}
        onQr={(data) => {
          const parsed = parseQr(data);
          if (!parsed || parsed.kind !== 'stand') {
            setError('Ce n’est pas un QR de stand Art2Dex.');
            return;
          }
          if (!STAND_LIST.includes(parsed.id)) {
            setError(`Stand inconnu : ${parsed.id}`);
            return;
          }
          const res = rechargeFromStand(parsed.id);
          if (res.ok) {
            setError(null);
            Alert.alert('🔋 Recharge !', `+${res.amount} photos via le stand ${parsed.id}.`);
            router.replace('/dex');
          } else {
            setError(reasonText(res.reason));
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
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 16,
  },
  blockedTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  msg: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  btn: {
    backgroundColor: colors.yellow,
    borderRadius: radius.btn,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  btnText: {
    color: colors.ink,
    fontWeight: '800',
  },
});
