import { QR_PREFIX_PLAYER, QR_PREFIX_STAND } from '../config';

export type ParsedQr = { kind: 'player' | 'stand'; id: string };

export function playerQr(id: string): string {
  return `${QR_PREFIX_PLAYER}${id}`;
}

export function standQr(id: string): string {
  return `${QR_PREFIX_STAND}${id}`;
}

export function parseQr(data: string): ParsedQr | null {
  if (data.startsWith(QR_PREFIX_PLAYER)) return { kind: 'player', id: data.slice(QR_PREFIX_PLAYER.length) };
  if (data.startsWith(QR_PREFIX_STAND)) return { kind: 'stand', id: data.slice(QR_PREFIX_STAND.length) };
  return null;
}
