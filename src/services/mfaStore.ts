import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { MfaConfig } from '../utils/mfa';
import { trustUntilFrom } from '../utils/mfa';
import { base32Decode, base32Encode, verifyTotp } from '../utils/totp';
import { bytesToHex } from '../utils/sha1';
import { deleteSecure, getSecure, setSecure } from './secureStorage';

const CONFIGS_KEY = 'art2dex/mfa/v1';
const secretKey = (accountId: string) => `art2dex/mfa/secret/${accountId}`;

type MfaSecret = { totpSecret?: string; deviceKey?: string; deviceKeyHash?: string };

export async function loadConfigs(): Promise<Record<string, MfaConfig>> {
  try {
    const raw = await AsyncStorage.getItem(CONFIGS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, MfaConfig>;
    return {};
  } catch {
    return {};
  }
}

async function saveConfigs(configs: Record<string, MfaConfig>): Promise<void> {
  await AsyncStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
}

async function loadSecret(accountId: string): Promise<MfaSecret> {
  const raw = await getSecure(secretKey(accountId));
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as MfaSecret) : {};
  } catch {
    return {};
  }
}

async function saveSecret(accountId: string, secret: MfaSecret): Promise<void> {
  await setSecure(secretKey(accountId), JSON.stringify(secret));
}

export async function getConfig(accountId: string): Promise<MfaConfig | null> {
  const configs = await loadConfigs();
  return configs[accountId] ?? null;
}

export async function generateTotpSecret(): Promise<string> {
  return base32Encode(await Crypto.getRandomBytesAsync(20));
}

export async function enableTotp(accountId: string, secretB32: string): Promise<void> {
  const configs = await loadConfigs();
  const prev = configs[accountId] ?? { accountId, totpEnabled: false, deviceKeyEnabled: false, trustedUntil: null };
  configs[accountId] = { ...prev, totpEnabled: true };
  await saveConfigs(configs);
  const secret = await loadSecret(accountId);
  await saveSecret(accountId, { ...secret, totpSecret: secretB32 });
}

export async function verifyTotpCode(accountId: string, code: string, nowMs: number = Date.now()): Promise<boolean> {
  const secret = await loadSecret(accountId);
  if (!secret.totpSecret) return false;
  try {
    return verifyTotp(base32Decode(secret.totpSecret), code, nowMs);
  } catch {
    return false;
  }
}

export async function generateDeviceKey(): Promise<{ key: string; hash: string }> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = bytesToHex(bytes);
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);
  return { key, hash };
}

export async function enableDeviceKey(accountId: string): Promise<void> {
  const { key, hash } = await generateDeviceKey();
  const configs = await loadConfigs();
  const prev = configs[accountId] ?? { accountId, totpEnabled: false, deviceKeyEnabled: false, trustedUntil: null };
  configs[accountId] = { ...prev, deviceKeyEnabled: true };
  await saveConfigs(configs);
  const secret = await loadSecret(accountId);
  await saveSecret(accountId, { ...secret, deviceKey: key, deviceKeyHash: hash });
}

export async function confirmDeviceKey(accountId: string): Promise<boolean> {
  const secret = await loadSecret(accountId);
  if (!secret.deviceKey || !secret.deviceKeyHash) return false;
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, secret.deviceKey);
  return hash === secret.deviceKeyHash;
}

export async function disableMfa(accountId: string): Promise<void> {
  const configs = await loadConfigs();
  const prev = configs[accountId];
  if (!prev) return;
  configs[accountId] = { ...prev, totpEnabled: false, deviceKeyEnabled: false, trustedUntil: null };
  await saveConfigs(configs);
  await deleteSecure(secretKey(accountId));
}

export async function trustDevice(accountId: string, now: Date = new Date()): Promise<void> {
  const configs = await loadConfigs();
  const prev = configs[accountId];
  if (!prev) return;
  configs[accountId] = { ...prev, trustedUntil: trustUntilFrom(now) };
  await saveConfigs(configs);
}
