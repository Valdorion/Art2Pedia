import type { GameConfig } from '../types';

export function clampChance(c: number): number {
  if (!Number.isFinite(c)) return 0;
  return Math.min(1, Math.max(0, c));
}

export function holoChance(game: Pick<GameConfig, 'holoChanceClassic' | 'holoChanceCollection'>, inCollection: boolean): number {
  return clampChance(inCollection ? game.holoChanceCollection : game.holoChanceClassic);
}

export function rollHolographic(chance: number, rng: () => number = Math.random): boolean {
  return rng() < clampChance(chance);
}
