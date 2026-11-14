import assert from 'node:assert/strict';
import { DEFAULT_EVENT, DEFAULT_GAME, QR_PREFIX_PLAYER, QR_PREFIX_STAND, STANDS } from '../src/config';
import { getProvider, normalizeProfile, PROVIDERS, resolveAuthClients } from '../src/services/authProviders';
import { addDuoPhoto, addQrUnlock, cardPhotoInCollection, collectionPhotos, getCardView, isCollectionRevealed, resolveCardView, sharedCollection } from '../src/services/game';
import type { CardView, CollectionGroup, EventConfig, GameConfig, Photo, Player } from '../src/types';
import { dayKey, isEventDay, isEventOver, isPlayWindow, windowInfo } from '../src/utils/eventWindow';
import { clampChance, holoChance, rollHolographic } from '../src/utils/holo';
import { codeForWindow, codeKey, codeSecret, currentCode, normalizeCode, verifyCode, windowIndexFor, type DigestFn } from '../src/utils/validationCode';
import { decodeJwtPayload } from '../src/utils/jwt';
import { consumeOne, effectiveStock, recharge, type StockState } from '../src/utils/photoStock';
import { parseQr, playerQr, standQr } from '../src/utils/qr';
import { isSessionExpired } from '../src/utils/session';

async function main() {
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
const game8: GameConfig = { freePhotosPerMorning: 8, qrRechargeAmount: 10, maxScansPerStandPerDay: 1, mode: 'collection', holoChanceClassic: 0.05, holoChanceCollection: 0.2, codeTtlSeconds: 60 };
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
assert.deepEqual(getCardView(alice, 'me'), { status: 'unknown', photo: null, holographic: false, masked: false }, 'jamais photographiée = unknown');
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
assert.equal(getCardView(daveP, 'me').holographic, false, 'pas holo par défaut');
const holoPhoto: Photo = { ...duo, id: 'duo-holo', holographic: true };
const holoAfter = addDuoPhoto([mk('me', []), mk('dave', [])], 'me', 'dave', holoPhoto);
assert.equal(getCardView(holoAfter.find((p) => p.id === 'dave')!, 'me').holographic, true, 'photo holographic => carte holo pour le viewer');

// --- addQrUnlock : déblocage one-way par scan QR (mode classique) ---
const qrPhoto: Photo = { id: 'qr1', uri: null, emoji: '⚡', withPlayerId: 'me', createdAt: '2025-10-25T12:00:00.000Z', via: 'qr', holographic: true };
const qrAfter = addQrUnlock([mk('me', []), mk('bob', []), mk('eve', [])], 'me', 'bob', qrPhoto);
assert.equal(getCardView(qrAfter.find((p) => p.id === 'bob')!, 'me').status, 'captured', 'QR unlock capture la carte cible');
assert.equal(getCardView(qrAfter.find((p) => p.id === 'bob')!, 'me').holographic, true);
assert.equal(qrAfter.find((p) => p.id === 'me')!.photos.length, 0, 'le viewer ne reçoit pas de photo');
assert.equal(qrAfter.find((p) => p.id === 'eve')!.photos.length, 0, 'les autres ne sont pas touchés');

// --- Fin d'event (révélation des collections) ---
assert.equal(isEventOver(new Date(2025, 9, 25, 12, 0)), false, 'jour 1 à midi : event pas terminé');
assert.equal(isEventOver(new Date(2025, 9, 26, 18, 59)), false, 'dernier jour avant closeHour : pas terminé');
assert.equal(isEventOver(new Date(2025, 9, 26, 19, 0)), true, 'dernier jour à closeHour : terminé');
assert.equal(isEventOver(new Date(2025, 9, 27, 9, 0)), true, 'lendemain : terminé');

// --- Holo : probabilité faible, plus forte en collection ---
const gameHolo: GameConfig = { ...DEFAULT_GAME, mode: 'classic', holoChanceClassic: 0.02, holoChanceCollection: 0.15, codeTtlSeconds: 30 };
assert.equal(holoChance(gameHolo, false), 0.02, 'chance classique faible');
assert.equal(holoChance(gameHolo, true), 0.15, 'chance collection plus élevée');
assert.ok(holoChance(gameHolo, true) > holoChance(gameHolo, false), 'collection > classique');
assert.equal(clampChance(2), 1);
assert.equal(clampChance(-1), 0);
assert.equal(clampChance(NaN), 0);
assert.equal(rollHolographic(0.02, () => 0.5), false, 'rng 0.5 vs 2% => pas holo');
assert.equal(rollHolographic(0.02, () => 0.01), true, 'rng 0.01 vs 2% => holo');
assert.equal(rollHolographic(0.15, () => 0.1), true, 'rng 0.1 vs 15% => holo');
assert.equal(rollHolographic(0, () => 0), false, 'chance 0 => jamais holo');
assert.equal(rollHolographic(1, () => 0.999), true, 'chance 100% => toujours holo');

// --- Code temporaire type MFA ---
const fakeDigest: DigestFn = async (data) => {
  let h = 0;
  for (const ch of data) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(8, '0');
};
const t0 = new Date(2025, 9, 25, 10, 0, 0); // 2025-10-25T10:00:00 local
assert.equal(windowIndexFor(new Date(0), 30), 0);
assert.equal(windowIndexFor(new Date(29_999), 30), 0);
assert.equal(windowIndexFor(new Date(30_000), 30), 1);
assert.equal(windowIndexFor(new Date(90_000), 30), 3);
assert.equal(normalizeCode('123456'), '123456');
assert.equal(normalizeCode('12 34 56'), '123456', 'espaces ignorés');
assert.equal(normalizeCode('12345'), null);
assert.equal(normalizeCode('1234567'), null);
assert.equal(normalizeCode('abcdef'), null);
const secret = codeSecret('p-pika', t0);
assert.equal(secret, `p-pika@${dayKey(t0)}`, 'secret lié au joueur + jour');
const wi = windowIndexFor(t0, 30);
const codeNow = await codeForWindow(secret, wi, 30, fakeDigest);
assert.match(codeNow, /^\d{6}$/, 'code = 6 chiffres');
const codeNow2 = await currentCode(secret, t0, 30, fakeDigest);
assert.equal(codeNow2, codeNow, 'currentCode = fenêtre courante');
const codeNext = await codeForWindow(secret, wi + 1, 30, fakeDigest);
assert.notEqual(codeNow, await codeForWindow(secret, wi + 5, 30, fakeDigest), 'fenêtres différentes => codes différents (très probablement)');
const vOk = await verifyCode(secret, codeNow, t0, 30, [], fakeDigest);
assert.equal(vOk.ok, true, 'code courant accepté');
if (vOk.ok) assert.equal(vOk.matchedKey, codeKey(secret, wi));
const vPrev = await verifyCode(secret, await codeForWindow(secret, wi - 1, 30, fakeDigest), t0, 30, [], fakeDigest);
assert.equal(vPrev.ok, true, 'fenêtre précédente acceptée (tolérance 1)');
const vOld = await verifyCode(secret, await codeForWindow(secret, wi - 2, 30, fakeDigest), t0, 30, [], fakeDigest);
assert.equal(vOld.ok, false, 'fenêtre -2 refusée');
if (!vOld.ok) assert.equal(vOld.reason, 'mismatch');
const vBad = await verifyCode(secret, '000000', t0, 30, [], fakeDigest);
assert.equal(vBad.ok, false);
if (!vBad.ok) assert.equal(vBad.reason, 'mismatch');
const vFormat = await verifyCode(secret, '12', t0, 30, [], fakeDigest);
assert.equal(vFormat.ok, false);
if (!vFormat.ok) assert.equal(vFormat.reason, 'format');
const used = vOk.ok ? [vOk.matchedKey] : [];
const vReused = await verifyCode(secret, codeNow, t0, 30, used, fakeDigest);
assert.equal(vReused.ok, false, 'code déjà utilisé refusé');
if (!vReused.ok) assert.equal(vReused.reason, 'reused');

// --- Mode Collection : masquage + photo du jour + galerie ---
const ev = DEFAULT_EVENT;
const duringEvent = new Date(2025, 9, 25, 12, 0);
const afterEvent = new Date(2025, 9, 27, 12, 0);
const col: CollectionGroup = { id: 'col-1', name: 'Team', memberIds: ['me', 'bob'], createdAt: '2025-10-25T09:00:00.000Z', revealed: false };
const groupPhoto: Photo = { id: 'g1', uri: null, emoji: '🤝', withPlayerId: 'me', createdAt: '2025-10-25T11:00:00.000Z', via: 'code', groupId: 'col-1', holographic: true };
const bobCol: Player = { ...mk('bob', [photo('x', '📸')]), dailyPhoto: { day: dayKey(duringEvent), uri: null, emoji: '😎', setAt: '2025-10-25T08:30:00.000Z' } };
const bobCaptured: Player = { ...bobCol, photos: [...bobCol.photos, groupPhoto] };

// pendant l'event : photo du jour affichée sur la carte, photo de groupe masquée
const vDuring = resolveCardView(bobCaptured, 'me', { mode: 'collection', collections: [col], now: duringEvent, event: ev });
assert.equal(vDuring.status, 'captured');
assert.equal(vDuring.photo?.emoji, '😎', 'pendant l’event la carte affiche la photo du jour');
assert.equal(vDuring.holographic, true, 'holo conservé');
assert.equal(vDuring.masked, false, 'la photo du jour masque le verrou');
const vDuringNoDaily = resolveCardView({ ...bobCaptured, dailyPhoto: null }, 'me', { mode: 'collection', collections: [col], now: duringEvent, event: ev });
assert.equal(vDuringNoDaily.masked, true, 'sans photo du jour, la photo de groupe reste masquée pendant l’event');
assert.equal(vDuringNoDaily.photo, null);
// après l'event : la photo de groupe est révélée
const vAfter = resolveCardView({ ...bobCaptured, dailyPhoto: null }, 'me', { mode: 'collection', collections: [col], now: afterEvent, event: ev });
assert.equal(vAfter.masked, false, 'après l’event la photo est révélée');
assert.equal(vAfter.photo?.id, 'g1');
// révélation manuelle avant la fin
const colRevealed: CollectionGroup = { ...col, revealed: true };
assert.equal(isCollectionRevealed(colRevealed, duringEvent, ev), true);
assert.equal(isCollectionRevealed(col, duringEvent, ev), false);
assert.equal(isCollectionRevealed(col, afterEvent, ev), true, 'révélation auto à la fin de l’event');
const vManual = resolveCardView({ ...bobCaptured, dailyPhoto: null }, 'me', { mode: 'collection', collections: [colRevealed], now: duringEvent, event: ev });
assert.equal(vManual.masked, false, 'révélation manuelle => photo visible');
// mode classique : aucun masquage
const vClassic = resolveCardView(bobCaptured, 'me', { mode: 'classic', collections: [col], now: duringEvent, event: ev });
assert.equal(vClassic.masked, false);
assert.equal(vClassic.photo?.id, 'g1', 'en classique on voit la dernière photo');
// photo du jour d'un autre jour = ignorée
const bobOldDaily: Player = { ...bobCaptured, dailyPhoto: { day: '2025-10-24', uri: null, emoji: '🐉', setAt: '2025-10-24T08:00:00.000Z' } };
const vOldDaily = resolveCardView(bobOldDaily, 'me', { mode: 'collection', collections: [col], now: duringEvent, event: ev });
assert.equal(vOldDaily.masked, true, 'photo du jour d’hier non prise en compte => masquée');

// --- Collection : groupe commun + galerie ---
assert.equal(sharedCollection([col], 'me', 'bob')?.id, 'col-1');
assert.equal(sharedCollection([col], 'me', 'eve'), undefined, 'pas de collection commune avec eve');
const gallery = collectionPhotos([bobCaptured, mk('me', []), mk('eve', [groupPhoto])], col);
assert.equal(gallery.length, 1, 'seules les photos du groupe comptent (eve n’est pas membre)');
assert.equal(gallery[0].id, 'g1');

// --- cardPhotoInCollection en direct ---
const baseCaptured: CardView = getCardView(bobCaptured, 'me');
const extra = cardPhotoInCollection(bobCol, baseCaptured, [col], duringEvent, ev);
assert.equal(extra.photo?.emoji, '😎', 'photo du jour prioritaire en collection');

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

}

void main();
