import AsyncStorage from '@react-native-async-storage/async-storage';
import PocketBase, { AsyncAuthStore } from 'pocketbase';

import { POCKETBASE_URL, STORAGE_KEYS } from '@/constants/config';

const authStore = new AsyncAuthStore({
  save: (serialized) => AsyncStorage.setItem(STORAGE_KEYS.pbAuth, serialized),
  clear: () => AsyncStorage.removeItem(STORAGE_KEYS.pbAuth),
  initial: AsyncStorage.getItem(STORAGE_KEYS.pbAuth),
});

export const pb = new PocketBase(POCKETBASE_URL);
pb.authStore = authStore;
