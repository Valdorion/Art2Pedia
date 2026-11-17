import type { Photo, Player } from '../types';
import { newId } from '../utils/id';

const AT = '2025-10-25T10:30:00.000Z';

function demoPhoto(withPlayerId: string, emoji: string, at: string = AT): Photo {
  return { id: newId(), uri: null, emoji, withPlayerId, createdAt: at };
}

const players: Player[] = [
  { id: 'p-pika', pseudo: 'PikaNoob', emoji: '⚡', color: '#FFCB05', photos: [] },
  { id: 'p-sacha', pseudo: 'SachaDu92', emoji: '🧢', color: '#3B4CCA', photos: [] },
  { id: 'p-rocket', pseudo: 'TeamRocket', emoji: '🚀', color: '#8B2E2E', photos: [] },
  { id: 'p-bulbi', pseudo: 'BulbiFan', emoji: '🌱', color: '#3FB950', photos: [] },
  { id: 'p-dracau', pseudo: 'DracaufeuX', emoji: '🔥', color: '#FF7A1A', photos: [] },
  { id: 'p-misty', pseudo: 'MistyOndine', emoji: '💧', color: '#4EA5D9', photos: [] },
  { id: 'p-pierre', pseudo: 'PierreLeRoc', emoji: '🪨', color: '#9AA3AD', photos: [] },
  { id: 'p-jessie', pseudo: 'JessieMiaouss', emoji: '😼', color: '#B065C9', photos: [] },
  { id: 'p-evoli', pseudo: 'EvoliLover', emoji: '🦊', color: '#C98A4B', photos: [] },
  { id: 'p-ronflex', pseudo: 'RonflexDodo', emoji: '😴', color: '#E8D9A0', photos: [] },
  { id: 'p-mewtwo', pseudo: 'MewtwoLab', emoji: '🧬', color: '#C9A7E8', photos: [] },
  { id: 'p-link', pseudo: 'LinkHylia', emoji: '⚔️', color: '#3FB950', photos: [] },
  { id: 'p-zelda', pseudo: 'PrincesseZ', emoji: '👑', color: '#FFCB05', photos: [] },
  { id: 'p-kirby', pseudo: 'KirbyGumi', emoji: '🌸', color: '#F7A8C4', photos: [] },
  { id: 'p-mario', pseudo: 'MarioKart8', emoji: '🍄', color: '#E3350D', photos: [] },
  { id: 'p-sonic', pseudo: 'SonicFast', emoji: '💨', color: '#2D6CDF', photos: [] },
  { id: 'p-goku', pseudo: 'Kakarotto', emoji: '🐉', color: '#FF7A1A', photos: [] },
  { id: 'p-naruto', pseudo: 'Naruto Uzumaki', emoji: '🍥', color: '#FF8C1A', photos: [] },
  { id: 'p-luffy', pseudo: 'RoiDesPirates', emoji: '🏴‍☠️', color: '#E3350D', photos: [] },
  { id: 'p-totoro', pseudo: 'TotoroBus', emoji: '🌳', color: '#7A8B99', photos: [] },
  { id: 'p-kiki', pseudo: 'KikiLivrMail', emoji: '🧹', color: '#6B4E9B', photos: [] },
  { id: 'p-ash', pseudo: 'SachaPallet', emoji: '🏆', color: '#3B4CCA', photos: [] },
  { id: 'p-serena', pseudo: 'SerenaKalos', emoji: '🎀', color: '#F7A8C4', photos: [] },
];

function linkDuo(aId: string, bId: string, emoji: string, at: string = AT): void {
  const a = players.find((p) => p.id === aId);
  const b = players.find((p) => p.id === bId);
  if (!a || !b) return;
  a.photos.push(demoPhoto(bId, emoji, at));
  b.photos.push(demoPhoto(aId, emoji, at));
}

linkDuo('p-pika', 'p-sacha', '🤝');
linkDuo('p-pika', 'p-misty', '📸');
linkDuo('p-rocket', 'p-jessie', '🤳');
linkDuo('p-dracau', 'p-goku', '🔥');
linkDuo('p-link', 'p-zelda', '⚔️');
linkDuo('p-mario', 'p-luffy', '🍖');
linkDuo('p-kirby', 'p-totoro', '😴');
linkDuo('p-ash', 'p-serena', '🏆');

export const MOCK_PLAYERS: Player[] = players;
