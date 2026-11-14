import { hmacSha1 } from './sha1';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Uint8Array): string {
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const b of bytes) {
    buffer = (buffer << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(buffer >> bits) & 0x1f];
    }
  }
  if (bits > 0) out += B32[(buffer << (5 - bits)) & 0x1f];
  return out;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const v = B32.indexOf(ch);
    if (v === -1) throw new Error('invalid base32 character');
    buffer = (buffer << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

export function hotp(secret: Uint8Array, counter: number, digits = 6): string {
  const buf = new Uint8Array(8);
  const dv = new DataView(buf.buffer);
  dv.setUint32(0, Math.floor(counter / 2 ** 32));
  dv.setUint32(4, counter >>> 0);
  const hash = hmacSha1(secret, buf);
  const offset = hash[hash.length - 1] & 0x0f;
  const bin =
    ((hash[offset] & 0x7f) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3];
  return String((bin >>> 0) % 10 ** digits).padStart(digits, '0');
}

export function totpAt(secret: Uint8Array, timeMs: number, stepSec = 30, digits = 6): string {
  return hotp(secret, Math.floor(timeMs / 1000 / stepSec), digits);
}

export function verifyTotp(
  secret: Uint8Array,
  code: string,
  nowMs: number = Date.now(),
  window = 1,
  stepSec = 30,
  digits = 6,
): boolean {
  const clean = code.replace(/\s/g, '');
  if (!new RegExp(`^\\d{${digits}}$`).test(clean)) return false;
  const counter = Math.floor(nowMs / 1000 / stepSec);
  for (let w = -window; w <= window; w++) {
    if (hotp(secret, counter + w, digits) === clean) return true;
  }
  return false;
}

export function otpauthUri(issuer: string, account: string, secretB32: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
