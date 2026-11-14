import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const WEB_PREFIX = 'art2dex/secure/';

export async function setSecure(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(WEB_PREFIX + key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, { keychainService: 'art2dex' });
}

export async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(WEB_PREFIX + key);
  return SecureStore.getItemAsync(key, { keychainService: 'art2dex' });
}

export async function deleteSecure(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(WEB_PREFIX + key);
    return;
  }
  await SecureStore.deleteItemAsync(key, { keychainService: 'art2dex' });
}
