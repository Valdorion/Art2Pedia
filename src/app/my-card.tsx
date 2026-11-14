import { Link, router } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CardVisual } from '../components/CardVisual';
import { getProvider } from '../services/authProviders';
import { useAuth } from '../store/AuthContext';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';
import type { CardView, Photo } from '../types';

export default function MyCard() {
  const { hydrated, me, players, myQr, capturedCount } = useDex();
  const { hydrated: authHydrated, session, signOut } = useAuth();

  useEffect(() => {
    if (!authHydrated || !hydrated) return;
    if (!session) router.replace('/login');
    else if (!me) router.replace('/register');
  }, [authHydrated, hydrated, session, me]);

  if (!me || !myQr) {
    return <View style={styles.container} />;
  }

  const myPlayer = players.find((p) => p.id === me.id);
  const myPhotos = myPlayer?.photos ?? [];
  const view: CardView = { status: 'captured', photo: myPhotos.length > 0 ? myPhotos[myPhotos.length - 1] : null };
  const total = players.filter((p) => p.id !== me.id).length;
  const pseudoOf = (id: string) => players.find((p) => p.id === id)?.pseudo ?? id;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ma carte</Text>
      <CardVisual player={{ id: me.id, pseudo: me.pseudo, emoji: me.emoji, color: me.color, photos: myPhotos }} view={view} large />

      <View style={styles.qrBox}>
        <QRCode value={myQr} size={180} backgroundColor="#FFFFFF" color="#141414" />
        <Text style={styles.qrHint}>Montre ce QR pour qu’on te photographie 📸</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{capturedCount}/{total}</Text>
          <Text style={styles.statLabel}>cartes capturées</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{myPhotos.length}</Text>
          <Text style={styles.statLabel}>photos de duo</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Mes photos de duo</Text>
      {myPhotos.length === 0 ? (
        <Text style={styles.muted}>Aucune photo de duo pour le moment.</Text>
      ) : (
        <FlatList
          horizontal
          data={myPhotos}
          keyExtractor={(p: Photo) => p.id}
          renderItem={({ item }) => (
            <View style={styles.photoTile}>
              {item.uri ? (
                <Image source={{ uri: item.uri }} style={styles.photoImg} resizeMode="cover" />
              ) : (
                <View style={styles.photoEmojiBox}>
                  <Text style={styles.photoEmoji}>{item.emoji}</Text>
                </View>
              )}
              <Text style={styles.photoWith} numberOfLines={1}>
                avec {pseudoOf(item.withPlayerId)}
              </Text>
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {me.auth ? (
        <View style={styles.authRow}>
          <Text style={styles.authText}>
            Compte {getProvider(me.auth.provider).label}
            {me.auth.email ? ` · ${me.auth.email}` : ''}
          </Text>
        </View>
      ) : null}

      <View style={styles.links}>
        <Link href="/dex" style={styles.linkBtn}>
          <Text style={styles.linkText}>📖 Voir le Pokédex</Text>
        </Link>
        <Link href="/admin" style={styles.linkBtn}>
          <Text style={styles.linkText}>⚙️ Admin</Text>
        </Link>
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => {
          await signOut();
          router.replace('/login');
        }}
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  qrBox: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  qrHint: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 220,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    color: colors.yellow,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
  },
  photoTile: {
    width: 110,
    marginRight: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    aspectRatio: 1,
  },
  photoEmojiBox: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel2,
  },
  photoEmoji: {
    fontSize: 36,
  },
  photoWith: {
    color: colors.text,
    fontSize: 11,
    padding: 6,
  },
  links: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  linkBtn: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  authRow: {
    alignSelf: 'center',
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  authText: {
    color: colors.yellow,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.btn,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
  },
});
