import { fetchErrors, serverEnabled } from './api';
import { useBand7 } from './store';

/** Tải lại sổ lỗi từ máy chủ (không chặn giao diện; lỗi mạng thì giữ bản đã lưu). */
export async function refreshErrors(force = false): Promise<void> {
  const s = useBand7.getState();
  if (!serverEnabled() || !s.auth) return;
  if (!force && Date.now() - s.errorsSyncedAt < 60_000) return;
  try {
    s.cacheErrors(await fetchErrors());
  } catch {
    /* ngoại tuyến: dùng bản đã lưu */
  }
}
