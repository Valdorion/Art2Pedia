import { DEFAULT_EVENT } from '../config';
import type { CardView, CollectionGroup, EventConfig, GameMode, Photo, Player } from '../types';
import { dayKey, isEventOver } from '../utils/eventWindow';

export function getCardView(player: Player, viewerId: string): CardView {
  const withMe = player.photos.filter((ph) => ph.withPlayerId === viewerId);
  if (withMe.length > 0) {
    const photo = withMe[withMe.length - 1];
    return { status: 'captured', photo, holographic: photo.holographic ?? false, masked: false };
  }
  const last = player.photos.length > 0 ? player.photos[player.photos.length - 1] : null;
  return last
    ? { status: 'seen', photo: last, holographic: false, masked: false }
    : { status: 'unknown', photo: null, holographic: false, masked: false };
}

export function addDuoPhoto(players: Player[], aId: string, bId: string, photo: Photo): Player[] {
  return players.map((p) => {
    if (p.id === aId) return { ...p, photos: [...p.photos, { ...photo, withPlayerId: bId }] };
    if (p.id === bId) return { ...p, photos: [...p.photos, { ...photo, withPlayerId: aId }] };
    return p;
  });
}

export function addQrUnlock(players: Player[], viewerId: string, targetId: string, photo: Photo): Player[] {
  return players.map((p) =>
    p.id === targetId ? { ...p, photos: [...p.photos, { ...photo, withPlayerId: viewerId, via: 'qr' as const }] } : p,
  );
}

export function isCollectionRevealed(group: CollectionGroup | undefined, now: Date, event: EventConfig): boolean {
  if (!group) return false;
  return group.revealed || isEventOver(now, event);
}

export function cardPhotoInCollection(
  player: Player,
  base: CardView,
  collections: CollectionGroup[],
  now: Date,
  event: EventConfig,
): { photo: Photo | null; masked: boolean } {
  const today = dayKey(now);
  const daily = player.dailyPhoto && player.dailyPhoto.day === today ? player.dailyPhoto : null;
  const group = collections.find((g) => g.memberIds.includes(player.id));
  const revealed = isCollectionRevealed(group, now, event);
  const hidden = base.status === 'captured' && !!base.photo?.groupId && !revealed;
  if (daily) {
    return {
      photo: { id: `daily-${player.id}-${daily.day}`, uri: daily.uri, emoji: daily.emoji, withPlayerId: player.id, createdAt: daily.setAt },
      masked: false,
    };
  }
  if (hidden) return { photo: null, masked: true };
  return { photo: base.photo, masked: false };
}

export function resolveCardView(
  player: Player,
  viewerId: string,
  opts: { mode: GameMode; collections: CollectionGroup[]; now?: Date; event?: EventConfig },
): CardView {
  const base = getCardView(player, viewerId);
  if (opts.mode !== 'collection') return base;
  const now = opts.now ?? new Date();
  const event = opts.event ?? DEFAULT_EVENT;
  const extra = cardPhotoInCollection(player, base, opts.collections, now, event);
  return { ...base, photo: extra.photo, masked: extra.masked };
}

export function sharedCollection(collections: CollectionGroup[], aId: string, bId: string): CollectionGroup | undefined {
  return collections.find((g) => g.memberIds.includes(aId) && g.memberIds.includes(bId));
}

export function collectionPhotos(players: Player[], group: CollectionGroup): Photo[] {
  const ids = new Set(group.memberIds);
  return players
    .filter((p) => ids.has(p.id))
    .flatMap((p) => p.photos.filter((ph) => ph.groupId === group.id));
}
