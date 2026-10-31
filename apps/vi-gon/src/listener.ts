import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { lastAutoAt } from './db';
import { ingestText } from './ingest';
import { useVi } from './store';

/**
 * Cầu nối bộ đọc thông báo ngân hàng.
 *
 * Android: cần một module native NotificationListenerService (không có sẵn trong Expo).
 *   Khi thêm module (ví dụ tự viết bằng Expo Modules API, tên "ViGonNotificationListener"), nó cần cung cấp:
 *     isPermissionGranted(): Promise<boolean>
 *     openPermissionSettings(): void
 *     addListener('notification', (e: { packageName: string; title: string; text: string; postedAt: number }) => void)
 *   File này tự nhận module nếu có; nếu không, app chạy ở chế độ nhập nhanh / dán tin.
 *
 * iOS: Apple không cho đọc thông báo app khác. Thay thế: Phím tắt (Shortcuts) → Tự động hóa "Khi nhận tin nhắn chứa…" →
 *   Mở URL  vigon://import?text=[Nội dung tin]  — màn import.tsx nhận và xử lý.
 */
type NativeListener = {
  isPermissionGranted(): Promise<boolean>;
  openPermissionSettings(): void;
  addListener(
    ev: 'notification',
    cb: (e: { packageName: string; title: string; text: string; postedAt: number }) => void,
  ): { remove(): void };
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

export function startListening() {
  if (!native) return () => {};
  const sub = native.addListener('notification', (e) => {
    const allowed = useVi.getState().allowedApps;
    if (allowed.length && !allowed.includes(e.packageName)) return;
    ingestText(`${e.title} ${e.text}`.trim(), { app: e.packageName, source: 'auto', postedAt: e.postedAt });
  });
  return () => sub.remove();
}
