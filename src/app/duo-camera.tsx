import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNow } from '../hooks/useNow';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';
import { isPlayWindow } from '../utils/eventWindow';
import { effectiveStock } from '../utils/photoStock';
import { reasonText } from '../utils/reasons';

export default function DuoCamera() {
  const { target } = useLocalSearchParams<{ target: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const { players, takeDuoPhoto, stock, event, game } = useDex();
  const now = useNow();

  const player = players.find((p) => p.id === target);
  const open = isPlayWindow(now, event);
  const eff = effectiveStock(stock, now, game, event).stock;
  const reason = !open ? 'hors-fenetre' : eff <= 0 ? 'stock-vide' : undefined;

  const shoot = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      const res = takeDuoPhoto(target, pic?.uri ?? null);
      if (res.ok) {
        Alert.alert('★ Capturé !', `Photo de duo avec ${player?.pseudo ?? 'ce joueur'} ajoutée sur vos 2 cartes.`);
        router.replace({ pathname: '/card/[id]', params: { id: target } });
      } else {
        Alert.alert('Photo impossible', reasonText(res.reason));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>La caméra est nécessaire pour prendre la photo de duo.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (reason) {
    return (
      <View style={styles.center}>
        <Text style={styles.blockedTitle}>📸 Photo indisponible</Text>
        <Text style={styles.msg}>{reasonText(reason)}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/dex')}>
          <Text style={styles.btnText}>Retour au Pokédex</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
      <View style={styles.topOverlay}>
        <Text style={styles.topTitle}>Photo avec {player?.pseudo ?? '…'}</Text>
        <Text style={styles.topStock}>📸 {eff} restantes</Text>
      </View>
      <View style={styles.bottomOverlay}>
        <TouchableOpacity style={[styles.shutter, busy && styles.shutterBusy]} onPress={shoot} disabled={busy}>
          <Text style={styles.shutterText}>📸</Text>
        </TouchableOpacity>
      </View>
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
  msg: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  blockedTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
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
  topOverlay: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
  },
  topTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  topStock: {
    color: colors.yellow,
    fontSize: 15,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.red,
    borderWidth: 5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBusy: {
    opacity: 0.5,
  },
  shutterText: {
    fontSize: 32,
  },
});
