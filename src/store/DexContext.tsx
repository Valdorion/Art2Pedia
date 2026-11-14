import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_EVENT, DEFAULT_GAME } from '../config';
import { MOCK_PLAYERS } from '../data/mockPlayers';
import { addDuoPhoto, addQrUnlock, cardPhotoInCollection, getCardView, resolveCardView, sharedCollection } from '../services/game';
import { collectionLeaderboard, eventLeaderboard } from '../services/leaderboard';
import { loadState, saveState } from '../services/storage';
import { useAuth } from './AuthContext';
import type { CardView, CollectionGroup, DailyPhoto, EventConfig, GameConfig, LeaderboardEntry, Me, Photo, Player } from '../types';
import { dayKey, isPlayWindow } from '../utils/eventWindow';
import { holoChance, rollHolographic } from '../utils/holo';
import { newId } from '../utils/id';
import { consumeOne, effectiveStock, recharge, type StockState } from '../utils/photoStock';
import { playerQr } from '../utils/qr';
import { codeSecret, currentCode, verifyCode, type DigestFn } from '../utils/validationCode';

const expoDigest: DigestFn = (data) => digestStringAsync(CryptoDigestAlgorithm.SHA256, data);

type State = {
  hydrated: boolean;
  me: Me | null;
  players: Player[];
  stock: StockState;
  scannedStands: string[];
  event: EventConfig;
  game: GameConfig;
  collections: CollectionGroup[];
  usedCodes: string[];
  leaderboardAnonymized: boolean;
};

type UnlockResult = { ok: boolean; reason?: string; holographic?: boolean };

type DexContextValue = State & {
  register: (pseudo: string, emoji: string, color: string) => void;
  saveEventConfig: (patch: Partial<EventConfig>) => void;
  saveGameConfig: (patch: Partial<GameConfig>) => void;
  takeDuoPhoto: (targetId: string, uri: string | null, emoji?: string) => { ok: boolean; reason?: string };
  rechargeFromStand: (standId: string) => { ok: boolean; amount?: number; reason?: string };
  setDailyPhoto: (emoji: string, uri?: string | null) => void;
  createCollection: (name: string) => CollectionGroup;
  joinCollection: (groupId: string) => { ok: boolean; reason?: string };
  revealCollection: (groupId: string) => void;
  myCollection: CollectionGroup | null;
  unlockWithQr: (targetId: string) => UnlockResult;
  getValidationCode: (playerId: string, at?: Date) => Promise<string>;
  validateWithCode: (targetId: string, input: string) => Promise<UnlockResult>;
  myQr: string | null;
  cardViewOf: (player: Player) => CardView;
  myCardView: () => CardView;
  capturedCount: number;
  setLeaderboardAnonymized: (anonymized: boolean) => void;
  globalLeaderboard: LeaderboardEntry[];
  collectionBoard: LeaderboardEntry[];
};

const DexContext = createContext<DexContextValue | null>(null);

const INITIAL: State = {
  hydrated: false,
  me: null,
  players: MOCK_PLAYERS,
  stock: { stock: DEFAULT_GAME.freePhotosPerMorning, lastResetDay: null },
  scannedStands: [],
  event: DEFAULT_EVENT,
  game: DEFAULT_GAME,
  collections: [],
  usedCodes: [],
  leaderboardAnonymized: false,
};

export function DexProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const stateRef = useRef<State>(INITIAL);
  const { session } = useAuth();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = (await loadState()) as Partial<State> | null;
        if (!alive) return;
        if (raw && typeof raw === 'object') {
          const me = (raw.me as Me | null) ?? null;
          let players = Array.isArray(raw.players) ? (raw.players as Player[]) : MOCK_PLAYERS;
          if (me && !players.some((p) => p.id === me.id)) {
            players = [...players, { id: me.id, pseudo: me.pseudo, emoji: me.emoji, color: me.color, photos: [] }];
          }
          setState({
            hydrated: true,
            me,
            players,
            stock: (raw.stock as StockState) ?? { stock: DEFAULT_GAME.freePhotosPerMorning, lastResetDay: null },
            scannedStands: Array.isArray(raw.scannedStands) ? (raw.scannedStands as string[]) : [],
            event: { ...DEFAULT_EVENT, ...(raw.event as Partial<EventConfig> | undefined) },
            game: { ...DEFAULT_GAME, ...(raw.game as Partial<GameConfig> | undefined) },
            collections: Array.isArray(raw.collections) ? (raw.collections as CollectionGroup[]) : [],
            usedCodes: Array.isArray(raw.usedCodes) ? (raw.usedCodes as string[]) : [],
            leaderboardAnonymized: typeof raw.leaderboardAnonymized === 'boolean' ? (raw.leaderboardAnonymized as boolean) : false,
          });
        } else {
          setState((s) => ({ ...s, hydrated: true }));
        }
      } catch {
        if (alive) setState((s) => ({ ...s, hydrated: true }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const s = stateRef.current;
    const now = new Date();
    void saveState({
      me: s.me,
      players: s.players,
      stock: effectiveStock(s.stock, now, s.game, s.event),
      scannedStands: s.scannedStands,
      event: s.event,
      game: s.game,
      collections: s.collections,
      usedCodes: s.usedCodes,
      leaderboardAnonymized: s.leaderboardAnonymized,
    });
  }, [state]);

  const register = (pseudo: string, emoji: string, color: string) => {
    const me: Me = { id: `me-${newId()}`, pseudo, emoji, color, createdAt: new Date().toISOString(), auth: session?.identity ?? null };
    setState((prev) => ({
      ...prev,
      me,
      players: prev.players.some((p) => p.id === me.id)
        ? prev.players
        : [...prev.players, { id: me.id, pseudo, emoji, color, photos: [] }],
    }));
  };

  const saveEventConfig = (patch: Partial<EventConfig>) => {
    setState((prev) => ({ ...prev, event: { ...prev.event, ...patch } }));
  };

  const saveGameConfig = (patch: Partial<GameConfig>) => {
    setState((prev) => ({ ...prev, game: { ...prev.game, ...patch } }));
  };

  const takeDuoPhoto = (targetId: string, uri: string | null, emoji = '🤳'): { ok: boolean; reason?: string } => {
    const s = stateRef.current;
    if (!s.me) return { ok: false, reason: 'no-me' };
    const now = new Date();
    if (!isPlayWindow(now, s.event)) return { ok: false, reason: 'hors-fenetre' };
    const stock = effectiveStock(s.stock, now, s.game, s.event);
    if (stock.stock <= 0) return { ok: false, reason: 'stock-vide' };
    const target = s.players.find((p) => p.id === targetId);
    if (!target) return { ok: false, reason: 'cible-inconnue' };
    const photo: Photo = { id: newId(), uri, emoji, withPlayerId: targetId, createdAt: now.toISOString(), via: 'duo' };
    setState((prev) => {
      if (!prev.me) return prev;
      const pNow = new Date();
      return {
        ...prev,
        stock: consumeOne(effectiveStock(prev.stock, pNow, prev.game, prev.event)),
        players: addDuoPhoto(prev.players, prev.me.id, targetId, photo),
      };
    });
    return { ok: true };
  };

  const rechargeFromStand = (standId: string): { ok: boolean; amount?: number; reason?: string } => {
    const s = stateRef.current;
    if (!s.me) return { ok: false, reason: 'no-me' };
    const now = new Date();
    if (!isPlayWindow(now, s.event)) return { ok: false, reason: 'hors-fenetre' };
    const key = `${standId}@${dayKey(now)}`;
    if (s.scannedStands.includes(key)) return { ok: false, reason: 'stand-deja-scanne' };
    const amount = s.game.qrRechargeAmount;
    setState((prev) => ({
      ...prev,
      stock: recharge(effectiveStock(prev.stock, now, prev.game, prev.event), prev.game.qrRechargeAmount),
      scannedStands: [...prev.scannedStands, key],
    }));
    return { ok: true, amount };
  };

  const setDailyPhoto = (emoji: string, uri: string | null = null) => {
    const now = new Date();
    const daily: DailyPhoto = { day: dayKey(now), uri, emoji, setAt: now.toISOString() };
    setState((prev) => {
      if (!prev.me) return prev;
      return {
        ...prev,
        players: prev.players.map((p) => (p.id === prev.me!.id ? { ...p, dailyPhoto: daily } : p)),
      };
    });
  };

  const createCollection = (name: string): CollectionGroup => {
    const now = new Date();
    const meId = stateRef.current.me?.id;
    const group: CollectionGroup = {
      id: `col-${newId()}`,
      name: name.trim() || 'Collection',
      memberIds: meId ? [meId] : [],
      createdAt: now.toISOString(),
      revealed: false,
    };
    setState((prev) => ({ ...prev, collections: [...prev.collections, group] }));
    return group;
  };

  const joinCollection = (groupId: string): { ok: boolean; reason?: string } => {
    const s = stateRef.current;
    if (!s.me) return { ok: false, reason: 'no-me' };
    const group = s.collections.find((c) => c.id === groupId);
    if (!group) return { ok: false, reason: 'groupe-inconnu' };
    if (group.memberIds.includes(s.me.id)) return { ok: false, reason: 'deja-membre' };
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) => (c.id === groupId ? { ...c, memberIds: [...c.memberIds, s.me!.id] } : c)),
    }));
    return { ok: true };
  };

  const revealCollection = (groupId: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) => (c.id === groupId ? { ...c, revealed: true } : c)),
    }));
  };

  const myCollection = useMemo(
    () => state.collections.find((g) => state.me !== null && g.memberIds.includes(state.me.id)) ?? null,
    [state.collections, state.me],
  );

  const unlockWithQr = (targetId: string): UnlockResult => {
    const s = stateRef.current;
    if (!s.me) return { ok: false, reason: 'no-me' };
    const now = new Date();
    if (!isPlayWindow(now, s.event)) return { ok: false, reason: 'hors-fenetre' };
    if (s.game.mode !== 'classic') return { ok: false, reason: 'mode-collection' };
    const target = s.players.find((p) => p.id === targetId);
    if (!target) return { ok: false, reason: 'cible-inconnue' };
    if (getCardView(target, s.me.id).status === 'captured') return { ok: false, reason: 'deja-capturee' };
    const inCollection = s.collections.some((g) => g.memberIds.includes(target.id));
    const holographic = rollHolographic(holoChance(s.game, inCollection));
    const shared = sharedCollection(s.collections, s.me.id, target.id);
    const photo: Photo = {
      id: newId(),
      uri: target.dailyPhoto?.uri ?? null,
      emoji: target.dailyPhoto?.emoji ?? target.emoji,
      withPlayerId: s.me.id,
      createdAt: now.toISOString(),
      via: 'qr',
      groupId: shared?.id,
      holographic,
    };
    setState((prev) => ({ ...prev, players: addQrUnlock(prev.players, s.me!.id, targetId, photo) }));
    return { ok: true, holographic };
  };

  const getValidationCode = (playerId: string, at = new Date()): Promise<string> => {
    return currentCode(codeSecret(playerId, at), at, stateRef.current.game.codeTtlSeconds, expoDigest);
  };

  const validateWithCode = async (targetId: string, input: string): Promise<UnlockResult> => {
    const s = stateRef.current;
    if (!s.me) return { ok: false, reason: 'no-me' };
    const now = new Date();
    if (!isPlayWindow(now, s.event)) return { ok: false, reason: 'hors-fenetre' };
    if (s.game.mode !== 'collection') return { ok: false, reason: 'mode-classique' };
    const target = s.players.find((p) => p.id === targetId);
    if (!target) return { ok: false, reason: 'cible-inconnue' };
    if (getCardView(target, s.me.id).status === 'captured') return { ok: false, reason: 'deja-capturee' };
    const res = await verifyCode(codeSecret(target.id, now), input, now, s.game.codeTtlSeconds, s.usedCodes, expoDigest);
    if (!res.ok) return { ok: false, reason: res.reason };
    const shared = sharedCollection(s.collections, s.me.id, target.id);
    const holographic = rollHolographic(holoChance(s.game, !!shared));
    const photo: Photo = {
      id: newId(),
      uri: null,
      emoji: '🤝',
      withPlayerId: s.me.id,
      createdAt: now.toISOString(),
      via: 'code',
      groupId: shared?.id,
      holographic,
    };
    setState((prev) => ({
      ...prev,
      players: addDuoPhoto(prev.players, s.me!.id, targetId, photo),
      usedCodes: [...prev.usedCodes, res.matchedKey],
    }));
    return { ok: true, holographic };
  };

  const myQr = state.me ? playerQr(state.me.id) : null;

  const cardViewOf = (player: Player): CardView =>
    resolveCardView(player, state.me?.id ?? '', { mode: state.game.mode, collections: state.collections, now: new Date(), event: state.event });

  const myCardView = (): CardView => {
    const meId = state.me?.id;
    const myPlayer = state.players.find((p) => p.id === meId);
    if (!meId || !myPlayer) return { status: 'unknown', photo: null, holographic: false, masked: false };
    const last = myPlayer.photos.length > 0 ? myPlayer.photos[myPlayer.photos.length - 1] : null;
    const base: CardView = { status: 'captured', photo: last, holographic: last?.holographic ?? false, masked: false };
    if (state.game.mode !== 'collection') return base;
    const extra = cardPhotoInCollection(myPlayer, base, state.collections, new Date(), state.event);
    return { ...base, photo: extra.photo, masked: extra.masked };
  };

  const capturedCount = useMemo(() => {
    const meId = state.me?.id;
    if (!meId) return 0;
    return state.players.filter((p) => p.id !== meId && getCardView(p, meId).status === 'captured').length;
  }, [state.players, state.me]);

  const setLeaderboardAnonymized = (anonymized: boolean) => {
    setState((prev) => ({ ...prev, leaderboardAnonymized: anonymized }));
  };

  const leaderboardOpts = useMemo(
    () => ({ anonymize: state.leaderboardAnonymized, viewerId: state.me?.id ?? '' }),
    [state.leaderboardAnonymized, state.me?.id],
  );

  const globalLeaderboard = useMemo(() => eventLeaderboard(state.players, state.event, leaderboardOpts), [state.players, state.event, leaderboardOpts]);

  const collectionBoard = useMemo(() => {
    const group = state.collections.find((g) => state.me !== null && g.memberIds.includes(state.me.id));
    return group ? collectionLeaderboard(state.players, group, state.event, leaderboardOpts) : [];
  }, [state.players, state.collections, state.event, state.me, leaderboardOpts]);

  const value: DexContextValue = {
    ...state,
    register,
    saveEventConfig,
    saveGameConfig,
    takeDuoPhoto,
    rechargeFromStand,
    setDailyPhoto,
    createCollection,
    joinCollection,
    revealCollection,
    myCollection,
    unlockWithQr,
    getValidationCode,
    validateWithCode,
    myQr,
    cardViewOf,
    myCardView,
    capturedCount,
    setLeaderboardAnonymized,
    globalLeaderboard,
    collectionBoard,
  };

  return <DexContext.Provider value={value}>{children}</DexContext.Provider>;
}

export function useDex(): DexContextValue {
  const ctx = useContext(DexContext);
  if (!ctx) throw new Error('useDex must be used inside DexProvider');
  return ctx;
}
