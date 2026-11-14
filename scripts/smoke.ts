import assert from 'node:assert/strict';
import { DEFAULT_EVENT, DEFAULT_GAME, QR_PREFIX_PLAYER, QR_PREFIX_STAND, STANDS } from '../src/config';
import { getProvider, normalizeProfile, PROVIDERS, resolveAuthClients } from '../src/services/authProviders';
import { addDuoPhoto, getCardView } from '../src/services/game';
import type { EventConfig, GameConfig, Photo, Player } from '../src/types';
import { dayKey, isEventDay, isPlayWindow, windowInfo } from '../src/utils/eventWindow';
import { decodeJwtPayload } from '../src/utils/jwt';
import { consumeOne, effectiveStock, recharge, type StockState } from '../src/utils/photoStock';
import { parseQr, playerQr, standQr } from '../src/utils/qr';
import { isSessionExpired } from '../src/utils/session';

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

// --- Providers OAuth ---
assert.deepEqual(
  PROVIDERS.map((p) => p.id),
  ['google', 'apple', 'microsoft', 'discord', 'twitch'],
  'les 5 providers demandés',
);
for (const p of PROVIDERS) {
  assert.ok(p.discovery.authorizationEndpoint.startsWith('https://'), `${p.id} authorize en https`);
  assert.ok(p.discovery.tokenEndpoint.startsWith('https://'), `${p.id} token en https`);
  assert.ok(p.scopes.length > 0, `${p.id} a des scopes`);
  assert.ok(p.clientIdEnvKey.startsWith('EXPO_PUBLIC_'), `${p.id} client id via env`);
}
assert.equal(getProvider('discord').label, 'Discord');
assert.throws(() => getProvider('facebook' as never), 'provider inconnu rejeté');

const clients = resolveAuthClients({ EXPO_PUBLIC_GOOGLE_CLIENT_ID: 'g-123', EXPO_PUBLIC_DISCORD_CLIENT_SECRET: 'sec' });
assert.equal(clients.google.clientId, 'g-123');
assert.equal(clients.google.clientSecret, undefined, 'pas de secret google');
assert.equal(clients.discord.clientId, '', 'client id manquant = chaîne vide');
assert.equal(clients.discord.clientSecret, 'sec', 'secret discord optionnel transmis');
assert.equal(clients.twitch.clientId, '');

// --- Normalisation des profils ---
assert.deepEqual(normalizeProfile('google', { sub: 'g1', name: 'Ada Lovelace', email: 'ada@ex.com', picture: 'https://pic' }), {
  provider: 'google',
  providerUserId: 'g1',
  displayName: 'Ada Lovelace',
  email: 'ada@ex.com',
  avatarUrl: 'https://pic',
});
assert.equal(normalizeProfile('google', { name: 'SansSub' }), null, 'sans sub = rejeté');
const ms = normalizeProfile('microsoft', { sub: 'm1', name: 'Bob', preferred_username: 'bob@contoso.com' });
assert.equal(ms?.email, 'bob@contoso.com', 'email microsoft via preferred_username');
assert.equal(ms?.displayName, 'Bob');
const dc = normalizeProfile('discord', { id: '42', username: 'dee', global_name: null, avatar: 'a1b2', email: null });
assert.equal(dc?.displayName, 'dee', 'discord: username si pas de global_name');
assert.equal(dc?.avatarUrl, 'https://cdn.discordapp.com/avatars/42/a1b2.png', 'avatar discord CDN');
assert.equal(dc?.email, null);
const tw = normalizeProfile('twitch', { sub: 't1', preferred_username: 'twitty', email: 't@x.io', picture: 'p' });
assert.equal(tw?.displayName, 'twitty');
assert.equal(tw?.avatarUrl, 'p');

// --- JWT (Apple) ---
const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const appleJwt = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({ sub: 'a1', email: 'priv@icloud.com' })}.sig`;
assert.deepEqual(decodeJwtPayload(appleJwt), { sub: 'a1', email: 'priv@icloud.com' }, 'payload JWT décodé');
assert.equal(decodeJwtPayload('pas-un-jwt'), null);
assert.equal(decodeJwtPayload(`x.${b64url('chaine')}.y`), null, 'payload non-objet = null');
const ap = normalizeProfile('apple', decodeJwtPayload(appleJwt) ?? {}, 'Jean Dupont');
assert.equal(ap?.providerUserId, 'a1');
assert.equal(ap?.displayName, 'Jean Dupont', 'nom Apple natif en fallback');
assert.equal(ap?.email, 'priv@icloud.com');

// --- Expiry de session ---
assert.equal(isSessionExpired({ tokens: { accessToken: 'x', expiresAt: null } }), false, 'sans expiry = jamais expiré');
assert.equal(isSessionExpired({ tokens: { accessToken: 'x', expiresAt: new Date(Date.now() - 1000).toISOString() } }), true, 'expiré');
assert.equal(isSessionExpired({ tokens: { accessToken: 'x', expiresAt: new Date(Date.now() + 60000).toISOString() } }), false, 'encore valide');

console.log('✅ smoke tests OK');
