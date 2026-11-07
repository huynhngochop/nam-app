import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { lastAutoAt } from './db';
import { ingestText } from './ingest';
import { useVi } from './store';

/**
 * Cầu nối bộ đọc thông báo ngân hàng.
 *
 * Android: module native trong modules/vi-gon-notification-listener (NotificationListenerService, Expo Modules API).
 *   Thông báo đến khi app đang tắt được xếp hàng trên máy và lấy ra bằng drainPending() lúc mở app.
 *   Bản web / Expo Go không có module → app chạy ở chế độ nhập nhanh / dán tin.
 *
 * iOS: Apple không cho đọc thông báo app khác. Thay thế: Phím tắt (Shortcuts) → Tự động hóa "Khi nhận tin nhắn chứa…" →
 *   Mở URL  vigon://import?text=[Nội dung tin]  — màn import.tsx nhận và xử lý.
 */
type Posted = { packageName: string; title: string; text: string; postedAt: number };
type NativeListener = {
  isPermissionGranted(): Promise<boolean>;
  openPermissionSettings(): void;
  drainPending(): Posted[];
  setAllowedApps(list: string[]): void;
  addListener(ev: 'notification', cb: (e: Posted) => void): { remove(): void };
};

let native: NativeListener | null = null;
try {
  native = Platform.OS === 'android' ? requireOptionalNativeModule<NativeListener>('ViGonNotificationListener') : null;
} catch {
  native = null;
}

export const listenerSupported = () => native != null;

export async function checkPermission(): Promise<'granted' | 'lost' | 'unsupported'> {
  if (!native) return 'unsupported';
  const ok = await native.isPermissionGranted().catch(() => false);
  return ok ? 'granted' : 'lost';
}

export function openPermissionSettings() {
  native?.openPermissionSettings();
}

/** Gọi khi app mở / quay lại: cập nhật trạng thái quyền, ghi lại thời điểm mất quyền (VG-17). */
export async function refreshListenerState() {
  const s = useVi.getState();
  const st = await checkPermission();
  if (st === 'lost' && s.listenerState === 'granted')
    s.set({ listenerState: 'lost', lostSince: lastAutoAt() ?? Date.now() });
  else if (st === 'granted') s.set({ listenerState: 'granted', lostSince: null });
  else if (st === 'unsupported' && s.listenerState !== 'unsupported') s.set({ listenerState: 'unsupported' });
}

const take = (e: Posted) => {
  const allowed = useVi.getState().allowedApps;
  if (allowed.length && !allowed.includes(e.packageName)) return;
  ingestText(`${e.title} ${e.text}`.trim(), { app: e.packageName, source: 'auto', postedAt: e.postedAt });
};

/** Nghe thông báo mới + xử lý thông báo đến lúc app tắt. Gọi lại khi app quay về trước (drain là rẻ). */
export function startListening() {
  if (!native) return () => {};
  const n = native;
  const sub = n.addListener('notification', take);
  drainPending();
  // Lọc ngay ở phía native để không xếp hàng thông báo của app không chọn.
  n.setAllowedApps(useVi.getState().allowedApps);
  const unsub = useVi.subscribe((st, prev) => {
    if (st.allowedApps !== prev.allowedApps) n.setAllowedApps(st.allowedApps);
  });
  return () => {
    sub.remove();
    unsub();
  };
}

/** Lấy các thông báo đã xếp hàng (gọi khi app quay lại từ nền). */
export function drainPending() {
  if (!native) return;
  try {
    for (const e of native.drainPending().sort((a, b) => a.postedAt - b.postedAt)) take(e);
  } catch {}
}
