import type { CardView, Photo, Player } from '../types';

export function getCardView(player: Player, viewerId: string): CardView {
  const withMe = player.photos.filter((ph) => ph.withPlayerId === viewerId);
  if (withMe.length > 0) return { status: 'captured', photo: withMe[withMe.length - 1] };
  const last = player.photos.length > 0 ? player.photos[player.photos.length - 1] : null;
  return last ? { status: 'seen', photo: last } : { status: 'unknown', photo: null };
}

export function addDuoPhoto(players: Player[], aId: string, bId: string, photo: Photo): Player[] {
  return players.map((p) => {
    if (p.id === aId) return { ...p, photos: [...p.photos, { ...photo, withPlayerId: bId }] };
    if (p.id === bId) return { ...p, photos: [...p.photos, { ...photo, withPlayerId: aId }] };
    return p;
  });
}
