import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'art2dex/state/v1';

export async function loadState(): Promise<unknown> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveState(state: unknown): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
