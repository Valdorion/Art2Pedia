import { dayKey } from './eventWindow';

export type DigestFn = (data: string) => Promise<string>;
export type CodeVerify = { ok: true; matchedKey: string } | { ok: false; reason: 'format' | 'mismatch' | 'reused' };

export const CODE_LENGTH = 6;

export function codeSecret(playerId: string, at: Date): string {
  return `${playerId}@${dayKey(at)}`;
}

export function windowIndexFor(now: Date, ttlSeconds: number): number {
  const ttl = ttlSeconds > 0 ? ttlSeconds : 30;
  return Math.floor(now.getTime() / 1000 / ttl);
}

export function codeKey(secret: string, windowIndex: number): string {
  return `${secret}#${windowIndex}`;
}

export function normalizeCode(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  return digits.length === CODE_LENGTH ? digits : null;
}

export async function codeForWindow(secret: string, windowIndex: number, ttlSeconds: number, digest: DigestFn): Promise<string> {
  const ttl = ttlSeconds > 0 ? ttlSeconds : 30;
  const hex = await digest(`${secret}:${windowIndex}:${ttl}`);
  let n = 0;
  for (const ch of hex) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return String(n % 10 ** CODE_LENGTH).padStart(CODE_LENGTH, '0');
}

export async function currentCode(secret: string, now: Date, ttlSeconds: number, digest: DigestFn): Promise<string> {
  return codeForWindow(secret, windowIndexFor(now, ttlSeconds), ttlSeconds, digest);
}

export async function verifyCode(
  secret: string,
  input: string,
  now: Date,
  ttlSeconds: number,
  usedKeys: string[],
  digest: DigestFn,
  graceWindows = 1,
): Promise<CodeVerify> {
  const code = normalizeCode(input);
  if (!code) return { ok: false, reason: 'format' };
  const wi = windowIndexFor(now, ttlSeconds);
  for (let offset = 0; offset <= graceWindows; offset++) {
    const candidateWi = wi - offset;
    const candidate = await codeForWindow(secret, candidateWi, ttlSeconds, digest);
    if (candidate === code) {
      const key = codeKey(secret, candidateWi);
      if (usedKeys.includes(key)) return { ok: false, reason: 'reused' };
      return { ok: true, matchedKey: key };
    }
  }
  return { ok: false, reason: 'mismatch' };
}
