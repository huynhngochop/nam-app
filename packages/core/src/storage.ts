import Storage from 'expo-sqlite/kv-store';
import { AppState } from 'react-native';
import { createJSONStorage } from 'zustand/middleware';
import { createDebouncedStorage } from './debouncedStorage';

export { createDebouncedStorage } from './debouncedStorage';

const kv = () => ({
  getItem: (k: string) => Storage.getItem(k),
  setItem: (k: string, v: string) => Storage.setItem(k, v),
  removeItem: (k: string) => Storage.removeItem(k),
});

/** Bộ lưu bền trên máy (SQLite key-value) cho zustand persist — nhanh hơn AsyncStorage, chạy cả iOS/Android. */
export const kvStorage = createJSONStorage(() => kv());

/**
 * Như `kvStorage` nhưng gom các lần ghi (IT3) — dùng cho store lớn. Ghi ngay khi app chuyển nền / tắt màn,
 * nên không mất thay đổi nếu hệ điều hành dừng app.
 */
export function bigKvStorage<S>(delayMs = 400) {
  const s = createDebouncedStorage<S>(kv, delayMs);
  AppState.addEventListener('change', (st) => {
    if (st !== 'active') s.flush();
  });
  return s;
}
