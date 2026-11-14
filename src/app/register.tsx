import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getProvider } from '../services/authProviders';
import { useAuth } from '../store/AuthContext';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';

const EMOJIS = ['⚡', '🧢', '🔥', '💧', '🪨', '😼', '🦊', '🧬', '🍄', '🌸'];
const COLORS = ['#E3350D', '#FFCB05', '#3B4CCA', '#3FB950', '#FF7A1A', '#B065C9', '#4EA5D9', '#F2F5F7'];

export default function Register() {
  const { register, event } = useDex();
  const { session } = useAuth();
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const suggested = session?.identity.displayName?.slice(0, 20) ?? '';
  const pseudoValue = pseudo ?? suggested;

  const submit = () => {
    const p = pseudoValue.trim();
    if (p.length < 2) {
      setError('Le pseudo doit contenir au moins 2 caractères.');
      return;
    }
    setError(null);
    register(p, emoji, color);
    router.replace('/dex');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Art2Dex</Text>
      <Text style={styles.subtitle}>
        Le Pokédex de la convention {event.name} {event.edition} — inscris-toi pour recevoir ta carte et ton QR personnel.
      </Text>

      {session ? (
        <View style={styles.authChip}>
          <Text style={styles.authChipText}>
            Compte lié : {getProvider(session.identity.provider).label}
            {session.identity.email ? ` · ${session.identity.email}` : ''}
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>Pseudo</Text>
      <TextInput
        style={styles.input}
        placeholder="Ton pseudo"
        placeholderTextColor={colors.muted}
        value={pseudoValue}
        onChangeText={setPseudo}
        maxLength={20}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Avatar</Text>
      <View style={styles.row}>
        {EMOJIS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.swatch, emoji === e && styles.swatchSel]}
            onPress={() => setEmoji(e)}
          >
            <Text style={styles.swatchEmoji}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Couleur de carte</Text>
      <View style={styles.row}>
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSel]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.cta} onPress={submit}>
        <Text style={styles.ctaText}>Créer ma carte 🪪</Text>
      </TouchableOpacity>

      <Link href="/admin" style={styles.adminLink}>
        <Text style={styles.adminText}>⚙️ Admin</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    color: colors.red,
    fontSize: 40,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radius.btn,
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSel: {
    borderColor: colors.yellow,
  },
  swatchEmoji: {
    fontSize: 22,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorDotSel: {
    borderColor: colors.text,
  },
  error: {
    color: colors.danger,
    marginTop: 14,
    fontWeight: '600',
  },
  authChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  authChipText: {
    color: colors.yellow,
    fontSize: 12,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: colors.red,
    borderRadius: radius.btn,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
  },
  adminLink: {
    alignSelf: 'center',
    marginTop: 22,
  },
  adminText: {
    color: colors.muted,
    fontSize: 13,
  },
});
