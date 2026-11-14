import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNow } from '../hooks/useNow';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';
import type { LeaderboardEntry } from '../types';
import { isEventOver, isPlayWindow, windowInfo } from '../utils/eventWindow';

type BoardTab = 'collection' | 'global';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function clock(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function rankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function BoardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <View style={[styles.row, entry.isMe && styles.rowMe]}>
      <Text style={styles.rank}>{rankBadge(entry.rank)}</Text>
      <View style={[styles.avatar, { backgroundColor: entry.color }]}>
        <Text style={styles.avatarEmoji}>{entry.emoji}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {entry.label}
          {entry.isMe ? ' (toi)' : ''}
        </Text>
        <Text style={styles.rowSub}>
          {entry.score} carte{entry.score > 1 ? 's' : ''} débloquée{entry.score > 1 ? 's' : ''}
          {entry.holoCount > 0 ? ` · ✨ ${entry.holoCount}` : ''}
        </Text>
      </View>
      <Text style={styles.score}>{entry.score}</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { hydrated, me, myCollection, globalLeaderboard, collectionBoard, leaderboardAnonymized, setLeaderboardAnonymized, event } = useDex();
  const now = useNow(1000);
  const [tab, setTab] = useState<BoardTab>('global');

  if (!hydrated) return <View style={styles.container} />;
  if (!me) {
    router.replace('/register');
    return <View style={styles.container} />;
  }

  const live = isPlayWindow(now, event);
  const over = isEventOver(now, event);
  const info = windowInfo(now, event);
  const entries = tab === 'collection' ? collectionBoard : globalLeaderboard;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏆 Classements</Text>
      <Text style={styles.subtitle}>
        {live
          ? `🟢 En direct pendant l’event — mis à jour à ${clock(now)}`
          : over
            ? `🏁 Classement final de ${event.name} ${event.edition}`
            : info.label}
      </Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'global' && styles.tabActive]} onPress={() => setTab('global')}>
          <Text style={[styles.tabText, tab === 'global' && styles.tabTextActive]}>Convention</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'collection' && styles.tabActive]} onPress={() => setTab('collection')}>
          <Text style={[styles.tabText, tab === 'collection' && styles.tabTextActive]}>Ma collection</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.privacyRow}>
        <Text style={styles.privacyText}>Pseudos visibles</Text>
        <Switch
          value={!leaderboardAnonymized}
          onValueChange={(v) => setLeaderboardAnonymized(!v)}
          trackColor={{ false: colors.border, true: colors.yellow }}
          thumbColor={colors.ink}
        />
      </View>
      {leaderboardAnonymized ? <Text style={styles.muted}>Les autres participants apparaissent sous un numéro anonymisé.</Text> : null}

      {tab === 'collection' && !myCollection ? (
        <View style={styles.emptyBox}>
          <Text style={styles.muted}>Tu ne fais partie d’aucune collection.</Text>
          <Link href="/collection" style={styles.inlineLink}>
            <Text style={styles.inlineLinkText}>Créer ou rejoindre une collection →</Text>
          </Link>
        </View>
      ) : entries.length === 0 ? (
        <Text style={styles.muted}>Aucun participant pour le moment.</Text>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            {tab === 'collection' ? `Collection ${myCollection?.name ?? ''} (${entries.length} membre${entries.length > 1 ? 's' : ''})` : `Tous les participants (${entries.length})`}
          </Text>
          <View style={styles.board}>
            {entries.map((e) => (
              <BoardRow key={e.playerId} entry={e} />
            ))}
          </View>
        </>
      )}

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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },
  tabText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.ink,
    fontWeight: '800',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  privacyText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyBox: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    padding: 14,
    gap: 8,
  },
  inlineLink: {
    alignSelf: 'flex-start',
  },
  inlineLinkText: {
    color: colors.yellow,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 6,
  },
  board: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowMe: {
    borderColor: colors.yellow,
  },
  rank: {
    width: 34,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '900',
    fontSize: 15,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  rowSub: {
    color: colors.muted,
    fontSize: 12,
  },
  score: {
    color: colors.yellow,
    fontWeight: '900',
    fontSize: 18,
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
