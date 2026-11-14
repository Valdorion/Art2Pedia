import type { AuthSession } from '../types';

export function isSessionExpired(session: Pick<AuthSession, 'tokens'>, now: Date = new Date()): boolean {
  const expiresAt = session.tokens.expiresAt;
  if (!expiresAt) return false;
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() <= now.getTime();
}
