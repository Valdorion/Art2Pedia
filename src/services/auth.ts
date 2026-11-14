import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSession } from '../types';
import { deleteSecure, getSecure, setSecure } from './secureStorage';

const SESSION_KEY = 'art2dex/auth/v1';
const TOKENS_KEY = 'art2dex/tokens/v1';

export async function loadSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { identity, createdAt } = parsed as { identity?: unknown; createdAt?: unknown };
    if (!identity || typeof identity !== 'object') return null;
    const tokensRaw = await getSecure(TOKENS_KEY);
    let tokens = { accessToken: '' };
    if (tokensRaw) {
      const t: unknown = JSON.parse(tokensRaw);
      if (t && typeof t === 'object') tokens = t as typeof tokens;
    }
    return {
      identity: identity as AuthSession['identity'],
      tokens,
      createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ identity: session.identity, createdAt: session.createdAt }));
  await setSecure(TOKENS_KEY, JSON.stringify(session.tokens));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
  await deleteSecure(TOKENS_KEY);
}
