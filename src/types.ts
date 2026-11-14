export type Photo = { id: string; uri: string | null; emoji: string; withPlayerId: string; createdAt: string };
export type Player = { id: string; pseudo: string; emoji: string; color: string; photos: Photo[] };
export type Me = { id: string; pseudo: string; emoji: string; color: string; createdAt: string };
export type CardStatus = 'captured' | 'seen' | 'unknown';
export type CardView = { status: CardStatus; photo: Photo | null };
export type EventConfig = { name: string; edition: string; startDate: string; endDate: string; openHour: number; closeHour: number };
export type GameConfig = { freePhotosPerMorning: number; qrRechargeAmount: number; maxScansPerStandPerDay: number };
