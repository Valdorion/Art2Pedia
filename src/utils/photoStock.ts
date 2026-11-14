import { DEFAULT_EVENT, DEFAULT_GAME } from '../config';
import type { EventConfig, GameConfig } from '../types';
import { dayKey, isEventDay } from './eventWindow';

export type StockState = { stock: number; lastResetDay: string | null };

export function effectiveStock(
  s: StockState,
  now = new Date(),
  game: GameConfig = DEFAULT_GAME,
  event: EventConfig = DEFAULT_EVENT,
): StockState {
  if (isEventDay(now, event) && s.lastResetDay !== dayKey(now)) {
    return { stock: game.freePhotosPerMorning, lastResetDay: dayKey(now) };
  }
  return s;
}

export function consumeOne(s: StockState): StockState {
  return { ...s, stock: Math.max(0, s.stock - 1) };
}

export function recharge(s: StockState, amount: number = DEFAULT_GAME.qrRechargeAmount): StockState {
  return { ...s, stock: s.stock + amount };
}
