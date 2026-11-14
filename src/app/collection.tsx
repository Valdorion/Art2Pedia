import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNow } from '../hooks/useNow';
import { collectionPhotos, isCollectionRevealed } from '../services/game';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';
import { dayKey, isEventOver } from '../utils/eventWindow';
import { reasonText } from '../utils/reasons';

export default function CollectionScreen() {
  const { hydrated, me, players, collections, myCollection, game, event, createCollection, joinCollection, revealCollection } = useDex();
  const now = useNow();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  if (!hydrated) return <View style={styles.container} />;
  if (!me) {
    router.replace('/register');
    return <View style={styles.container} />;
  }

  const eventOver = isEventOver(now, event);
  const pseudoOf = (id: string) => players.find((p) => p.id === id)?.pseudo ?? id;
  const gallery = myCollection ? collectionPhotos(players, myCollection) : [];
  const revealed = myCollection ? isCollectionRevealed(myCollection, now, event) : false;

  const onCreate = () => {
    createCollection(name);
    setName('');
    setMsg('✅ Collection créée, tu en es le premier membre.');
  };

  const onJoin = (groupId: string) => {
    const res = joinCollection(groupId);
    setMsg(res.ok ? '✅ Tu as rejoint la collection.' : reasonText(res.reason));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🃏 Collections</Text>
      <Text style={styles.subtitle}>
        Mode actuel : {game.mode === 'collection' ? 'Collection' : 'Classique'} — en mode Collection, les photos du groupe restent masquées et
        regroupées ici pendant tout l’event ; elles ne sont révélées qu’à la fin (le {event.endDate} à {event.closeHour}h00).
      </Text>

      <Text style={styles.sectionTitle}>Créer une collection</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={name}
          onChangeText={setName}
          placeholder="Nom du groupe (ex. team artistes)"
          placeholderTextColor={colors.muted}
        />
        <TouchableOpacity style={styles.cta} onPress={onCreate}>
          <Text style={styles.ctaText}>Créer</Text>
        </TouchableOpacity>
      </View>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <Text style={styles.sectionTitle}>Collections ({collections.length})</Text>
      {collections.length === 0 ? (
        <Text style={styles.muted}>Aucune collection pour le moment.</Text>
      ) : (
        collections.map((c) => {
          const isMember = c.memberIds.includes(me.id);
          const isRevealed = isCollectionRevealed(c, now, event);
          return (
            <View key={c.id} style={styles.groupCard}>
              <View style={styles.groupHead}>
                <Text style={styles.groupName}>{c.name}</Text>
                <Text style={[styles.pill, { color: isRevealed ? colors.green : colors.yellow }]}>
                  {isRevealed ? 'Révélée' : '🔒 Masquée'}
                </Text>
              </View>
              <Text style={styles.muted}>
                {c.memberIds.length} membre(s) : {c.memberIds.map(pseudoOf).join(', ')}
              </Text>
              {!isMember ? (
                <TouchableOpacity style={styles.joinBtn} onPress={() => onJoin(c.id)}>
                  <Text style={styles.joinText}>Rejoindre</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}

      {myCollection ? (
        <>
          <Text style={styles.sectionTitle}>Ma collection : {myCollection.name}</Text>
          <Text style={styles.muted}>
            Membres : {myCollection.memberIds.map(pseudoOf).join(', ')} · {gallery.length} photo(s) de groupe
          </Text>
          {revealed ? (
            gallery.length === 0 ? (
              <Text style={styles.muted}>Aucune photo de groupe révélée.</Text>
            ) : (
              <View style={styles.gallery}>
                {gallery.map((ph) => (
                  <View key={ph.id} style={styles.photoTile}>
                    <View style={styles.photoEmojiBox}>
                      <Text style={styles.photoEmoji}>{ph.emoji}</Text>
                    </View>
                    <Text style={styles.photoWith} numberOfLines={1}>
                      avec {pseudoOf(ph.withPlayerId)}
                      {ph.holographic ? ' ✨' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )
          ) : (
            <View style={styles.lockedBox}>
              <Text style={styles.lockedTitle}>🔒 {gallery.length} photo(s) masquée(s)</Text>
              <Text style={styles.muted}>
                Elles seront révélées uniquement à la fin de l’event{eventOver ? ' (event terminé)' : ` (le ${event.endDate} à ${event.closeHour}h00)`}.
              </Text>
              <TouchableOpacity style={styles.revealBtn} onPress={() => revealCollection(myCollection.id)}>
                <Text style={styles.revealText}>Révéler maintenant (admin)</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.muted}>Tu ne fais partie d’aucune collection : crée-en une ou rejoins-en une.</Text>
      )}

      <Text style={styles.muted}>Photo du jour (définie ce matin, affichée sur les cartes) : {dayKey(now)}</Text>

      <Link href="/leaderboard" style={styles.backLink}>
        <Text style={styles.backText}>🏆 Voir les classements →</Text>
      </Link>

      <Link href="/dex" style={styles.backLink}>
        <Text style={styles.backText}>← Retour au Pokédex</Text>
      </Link>
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
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: radius.btn,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ctaText: {
    color: colors.ink,
    fontWeight: '800',
  },
  msg: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '600',
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  groupCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    padding: 12,
    gap: 6,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  pill: {
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: colors.panel2,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  joinBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  joinText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  lockedBox: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    padding: 14,
    gap: 8,
  },
  lockedTitle: {
    color: colors.yellow,
    fontWeight: '800',
    fontSize: 14,
  },
  revealBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: radius.btn,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  revealText: {
    color: colors.yellow,
    fontWeight: '700',
    fontSize: 12,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: 100,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    overflow: 'hidden',
  },
  photoEmojiBox: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel2,
  },
  photoEmoji: {
    fontSize: 34,
  },
  photoWith: {
    color: colors.text,
    fontSize: 11,
    padding: 6,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 16,
  },
  backText: {
    color: colors.muted,
    fontSize: 13,
  },
});
