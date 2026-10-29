import Storage from 'expo-sqlite/kv-store';
import { createJSONStorage } from 'zustand/middleware';

/** Bộ lưu bền trên máy (SQLite key-value) cho zustand persist — nhanh hơn AsyncStorage, chạy cả iOS/Android. */
export const kvStorage = createJSONStorage(() => ({
  getItem: (k: string) => Storage.getItem(k),
  setItem: (k: string, v: string) => Storage.setItem(k, v),
  removeItem: (k: string) => Storage.removeItem(k),
}));
