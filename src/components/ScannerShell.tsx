import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  onQr: (data: string) => void;
  hint: string;
  children?: React.ReactNode;
};

export function ScannerShell({ onQr, hint, children }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const lockRef = useRef(0);
  const [msg, setMsg] = useState<string | null>(null);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Chargement de la caméra…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>La caméra est nécessaire pour scanner les QR codes.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          const now = Date.now();
          if (now - lockRef.current < 1500) return;
          lockRef.current = now;
          setMsg(null);
          onQr(data);
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>{hint}</Text>
        {msg ? <Text style={styles.error}>{msg}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function ScannerMessage({ text, tone = 'error' }: { text: string; tone?: 'error' | 'info' }) {
  return <Text style={tone === 'error' ? styles.error : styles.msg}>{text}</Text>;
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
    padding: 24,
    gap: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  frame: {
    width: 220,
    height: 220,
    borderWidth: 4,
    borderColor: colors.yellow,
    borderRadius: radius.btn,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  hint: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  msg: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
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
    paddingVertical: 10,
  },
  btnText: {
    color: colors.ink,
    fontWeight: '800',
  },
});
