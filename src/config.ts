import type { EventConfig, GameConfig } from './types';

export const DEFAULT_EVENT: EventConfig = { name: 'Art2Play', edition: '2025', startDate: '2025-10-25', endDate: '2025-10-26', openHour: 9, closeHour: 19 };
export const DEFAULT_GAME: GameConfig = {
  freePhotosPerMorning: 5,
  qrRechargeAmount: 5,
  maxScansPerStandPerDay: 1,
  mode: 'classic',
  holoChanceClassic: 0.02,
  holoChanceCollection: 0.15,
  codeTtlSeconds: 30,
};

export const STANDS = ['stand-accueil', 'stand-artistes', 'stand-jeux-indes', 'stand-cosplay', 'stand-restauration'] as const;

export const QR_PREFIX_PLAYER = 'art2dex://player/';
export const QR_PREFIX_STAND = 'art2dex://stand/';

export const DAILY_PHOTO_EMOJIS = ['📸', '🤳', '😎', '🦄', '🔥', '🌟', '🐉', '🎮'];
