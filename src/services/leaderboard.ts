import type { CollectionGroup, EventConfig, LeaderboardEntry, Player } from '../types';
import { isEventDay, isEventOver } from '../utils/eventWindow';

export type LeaderboardOptions = { anonymize?: boolean; viewerId?: string };

function photoInEvent(createdAt: string, event: EventConfig): boolean {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return false;
  return isEventDay(d, event) && !isEventOver(d, event);
}

export function playerStats(players: Player[], playerId: string, event: EventConfig): { score: number; holoCount: number } {
  let score = 0;
  let holoCount = 0;
  for (const p of players) {
    for (const ph of p.photos) {
      if (ph.withPlayerId === playerId && photoInEvent(ph.createdAt, event)) {
        score += 1;
        if (ph.holographic) holoCount += 1;
      }
    }
  }
  return { score, holoCount };
}

function anonLabel(playerId: string): string {
  let h = 0;
  for (const ch of playerId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `Joueur #${(h % 900) + 100}`;
}

export function buildLeaderboard(players: Player[], memberIds: string[] | null, event: EventConfig, opts: LeaderboardOptions = {}): LeaderboardEntry[] {
  const pool = memberIds ? players.filter((p) => memberIds.includes(p.id)) : players;
  const entries: LeaderboardEntry[] = pool.map((p) => {
    const { score, holoCount } = playerStats(players, p.id, event);
    const isMe = p.id === opts.viewerId;
    return {
      rank: 0,
      playerId: p.id,
      label: opts.anonymize && !isMe ? anonLabel(p.id) : p.pseudo,
      emoji: p.emoji,
      color: p.color,
      score,
      holoCount,
      isMe,
    };
  });
  entries.sort((a, b) => b.score - a.score || b.holoCount - a.holoCount || a.label.localeCompare(b.label));
  entries.forEach((e, i) => {
    const prev = entries[i - 1];
    e.rank = prev && prev.score === e.score && prev.holoCount === e.holoCount ? prev.rank : i + 1;
  });
  return entries;
}

export function collectionLeaderboard(players: Player[], group: CollectionGroup, event: EventConfig, opts: LeaderboardOptions = {}): LeaderboardEntry[] {
  return buildLeaderboard(players, group.memberIds, event, opts);
}

export function eventLeaderboard(players: Player[], event: EventConfig, opts: LeaderboardOptions = {}): LeaderboardEntry[] {
  return buildLeaderboard(players, null, event, opts);
}
