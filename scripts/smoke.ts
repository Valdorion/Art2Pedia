import assert from 'node:assert/strict';
import { DEFAULT_EVENT, DEFAULT_GAME, QR_PREFIX_PLAYER, QR_PREFIX_STAND, STANDS } from '../src/config';
import { addDuoPhoto, getCardView } from '../src/services/game';
import type { EventConfig, GameConfig, Photo, Player } from '../src/types';
import { dayKey, isEventDay, isPlayWindow, windowInfo } from '../src/utils/eventWindow';
import { consumeOne, effectiveStock, recharge, type StockState } from '../src/utils/photoStock';
import { parseQr, playerQr, standQr } from '../src/utils/qr';

// --- Fenêtre de jeu, config par défaut 2025 (sam 25 / dim 26 oct, 9h-19h) ---
assert.equal(isEventDay(new Date(2025, 9, 24)), false, 'ven 24/10 hors événement');
assert.equal(isEventDay(new Date(2025, 9, 25)), true, 'sam 25/10 jour d’événement');
assert.equal(isEventDay(new Date(2025, 9, 26)), true, 'dim 26/10 jour d’événement');
assert.equal(isEventDay(new Date(2025, 9, 27)), false, 'lun 27/10 hors événement');
assert.equal(isPlayWindow(new Date(2025, 9, 25, 8, 59)), false, '8h59 fermé');
assert.equal(isPlayWindow(new Date(2025, 9, 25, 9, 0)), true, '9h00 ouvert');
assert.equal(isPlayWindow(new Date(2025, 9, 25, 18, 59)), true, '18h59 ouvert');
assert.equal(isPlayWindow(new Date(2025, 9, 25, 19, 0)), false, '19h00 fermé');
assert.equal(isPlayWindow(new Date(2025, 9, 24, 12, 0)), false, 'jour hors événement = fermé même à midi');

const wiOpen = windowInfo(new Date(2025, 9, 25, 12, 0));
assert.equal(wiOpen.open, true);
assert.equal(wiOpen.isEventDay, true);
const wiClosed = windowInfo(new Date(2025, 9, 25, 20, 0));
assert.equal(wiClosed.open, false);
assert.equal(wiClosed.isEventDay, true);
const wiOut = windowInfo(new Date(2025, 9, 27, 12, 0));
assert.equal(wiOut.open, false);
assert.equal(wiOut.isEventDay, false);

// --- Config admin 2026 (sam 24 / dim 25 oct 2026, 10h-18h) ---
const ev26: EventConfig = { name: 'Art2Play', edition: '2026', startDate: '2026-10-24', endDate: '2026-10-25', openHour: 10, closeHour: 18 };
assert.equal(isEventDay(new Date(2026, 9, 23), ev26), false);
assert.equal(isEventDay(new Date(2026, 9, 24), ev26), true);
assert.equal(isEventDay(new Date(2026, 9, 25), ev26), true);
assert.equal(isEventDay(new Date(2026, 9, 26), ev26), false);
assert.equal(isPlayWindow(new Date(2026, 9, 24, 9, 59), ev26), false);
assert.equal(isPlayWindow(new Date(2026, 9, 24, 10, 0), ev26), true);
assert.equal(isPlayWindow(new Date(2026, 9, 25, 17, 59), ev26), true);
assert.equal(isPlayWindow(new Date(2026, 9, 25, 18, 0), ev26), false);

// --- Stock de photos ---
const game8: GameConfig = { freePhotosPerMorning: 8, qrRechargeAmount: 10, maxScansPerStandPerDay: 1 };
const morning = new Date(2025, 9, 25, 9, 5);
let s: StockState = { stock: 0, lastResetDay: null };
s = effectiveStock(s, morning, DEFAULT_GAME, DEFAULT_EVENT);
assert.equal(s.stock, 5, 'reset à 5 le matin d’un jour d’événement');
assert.equal(s.lastResetDay, dayKey(morning));
const sameDay = effectiveStock({ stock: 2, lastResetDay: dayKey(morning) }, new Date(2025, 9, 25, 15, 0), DEFAULT_GAME, DEFAULT_EVENT);
assert.equal(sameDay.stock, 2, 'pas de reset le même jour');
const nextDay = effectiveStock({ stock: 2, lastResetDay: dayKey(morning) }, new Date(2025, 9, 26, 9, 5), DEFAULT_GAME, DEFAULT_EVENT);
assert.equal(nextDay.stock, 5, 'reset le jour d’événement suivant');
const outDay = effectiveStock({ stock: 2, lastResetDay: dayKey(morning) }, new Date(2025, 9, 27, 10, 0), DEFAULT_GAME, DEFAULT_EVENT);
assert.equal(outDay.stock, 2, 'pas de reset hors événement');
const s8 = effectiveStock({ stock: 0, lastResetDay: null }, new Date(2026, 9, 24, 10, 5), game8, ev26);
assert.equal(s8.stock, 8, 'reset selon config admin (8 photos)');
assert.equal(consumeOne({ stock: 3, lastResetDay: 'x' }).stock, 2);
assert.equal(consumeOne({ stock: 0, lastResetDay: 'x' }).stock, 0, 'stock jamais négatif');
assert.equal(recharge({ stock: 3, lastResetDay: 'x' }).stock, 8, 'recharge défaut +5');
assert.equal(recharge({ stock: 3, lastResetDay: 'x' }, game8.qrRechargeAmount).stock, 13, 'recharge config admin +10');

// --- États des cartes ---
const mk = (id: string, photos: Photo[]): Player => ({ id, pseudo: id, emoji: '❓', color: '#FFFFFF', photos });
const photo = (withPlayerId: string, emoji = '📸'): Photo => ({
  id: `ph-${withPlayerId}-${emoji}`,
  uri: null,
  emoji,
  withPlayerId,
  createdAt: '2025-10-25T10:00:00.000Z',
});
const alice = mk('alice', []);
assert.deepEqual(getCardView(alice, 'me'), { status: 'unknown', photo: null }, 'jamais photographiée = unknown');
const bob = mk('bob', [photo('carol', '🔥')]);
const vBob = getCardView(bob, 'me');
assert.equal(vBob.status, 'seen', 'photographiée mais pas avec moi = seen');
assert.equal(vBob.photo?.emoji, '🔥', 'on voit sa DERNIÈRE photo');
const carol = mk('carol', [photo('x', '📸'), photo('me', '🤝')]);
const vCarol = getCardView(carol, 'me');
assert.equal(vCarol.status, 'captured', 'photo de duo avec moi = captured');
assert.equal(vCarol.photo?.emoji, '🤝', 'la photo de duo remplace l’ancienne');

const duo: Photo = { id: 'duo1', uri: null, emoji: '🤳', withPlayerId: 'me', createdAt: '2025-10-25T11:00:00.000Z' };
const after = addDuoPhoto([mk('me', []), mk('dave', []), mk('eve', [])], 'me', 'dave', duo);
const meP = after.find((p) => p.id === 'me');
const daveP = after.find((p) => p.id === 'dave');
const eveP = after.find((p) => p.id === 'eve');
assert.ok(meP && daveP && eveP);
assert.equal(meP.photos.length, 1);
assert.equal(meP.photos[0].withPlayerId, 'dave', 'la photo est posée sur ma carte avec l’autre joueur');
assert.equal(daveP.photos.length, 1);
assert.equal(daveP.photos[0].withPlayerId, 'me');
assert.equal(daveP.photos[0].id, 'duo1');
assert.equal(eveP.photos.length, 0, 'les autres joueurs ne sont pas touchés');
assert.equal(getCardView(daveP, 'me').status, 'captured', 'la carte de dave passe capturée pour moi');

// --- QR ---
assert.equal(QR_PREFIX_PLAYER, 'art2dex://player/');
assert.equal(QR_PREFIX_STAND, 'art2dex://stand/');
assert.equal(playerQr('me-123'), 'art2dex://player/me-123');
assert.equal(standQr('stand-accueil'), 'art2dex://stand/stand-accueil');
assert.deepEqual(parseQr('art2dex://player/abc'), { kind: 'player', id: 'abc' });
assert.deepEqual(parseQr('art2dex://stand/stand-cosplay'), { kind: 'stand', id: 'stand-cosplay' });
assert.equal(parseQr('https://example.com'), null);
assert.equal(parseQr('art2dex://'), null);
assert.equal(STANDS.length, 5);
assert.ok(STANDS.includes('stand-restauration'));

console.log('✅ smoke tests OK');
