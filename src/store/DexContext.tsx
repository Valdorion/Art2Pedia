import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_EVENT, DEFAULT_GAME } from '../config';
import { MOCK_PLAYERS } from '../data/mockPlayers';
import { addDuoPhoto, getCardView } from '../services/game';
import { loadState, saveState } from '../services/storage';
import { useAuth } from './AuthContext';
import type { CardView, EventConfig, GameConfig, Me, Photo, Player } from '../types';
import { dayKey, isPlayWindow } from '../utils/eventWindow';
import { newId } from '../utils/id';
import { consumeOne, effectiveStock, recharge, type StockState } from '../utils/photoStock';
import { playerQr } from '../utils/qr';

type State = {
  hydrated: boolean;
  me: Me | null;
  players: Player[];
  stock: StockState;
  scannedStands: string[];
  event: EventConfig;
  game: GameConfig;
};

type DexContextValue = State & {
  register: (pseudo: string, emoji: string, color: string) => void;
  saveEventConfig: (patch: Partial<EventConfig>) => void;
  saveGameConfig: (patch: Partial<GameConfig>) => void;
  takeDuoPhoto: (targetId: string, uri: string | null, emoji?: string) => { ok: boolean; reason?: string };
  rechargeFromStand: (standId: string) => { ok: boolean; amount?: number; reason?: string };
  myQr: string | null;
  cardViewOf: (player: Player) => CardView;
  capturedCount: number;
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
    const photo: Photo = { id: newId(), uri, emoji, withPlayerId: targetId, createdAt: now.toISOString() };
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

  const myQr = state.me ? playerQr(state.me.id) : null;

  const cardViewOf = (player: Player): CardView => getCardView(player, state.me?.id ?? '');

  const capturedCount = useMemo(() => {
    const meId = state.me?.id;
    if (!meId) return 0;
    return state.players.filter((p) => p.id !== meId && getCardView(p, meId).status === 'captured').length;
  }, [state.players, state.me]);

  const value: DexContextValue = {
    ...state,
    register,
    saveEventConfig,
    saveGameConfig,
    takeDuoPhoto,
    rechargeFromStand,
    myQr,
    cardViewOf,
    capturedCount,
  };

  return <DexContext.Provider value={value}>{children}</DexContext.Provider>;
}

export function useDex(): DexContextValue {
  const ctx = useContext(DexContext);
  if (!ctx) throw new Error('useDex must be used inside DexProvider');
  return ctx;
}
