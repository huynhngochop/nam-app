import { fetchErrors, fetchTopics, serverEnabled } from './api';
import { useBand7 } from './store';
import { registerRemoteTopics } from './topics';

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

/** Đề mới theo quý: tải tối đa 1 lần/ngày, lưu lại để dùng khi ngoại tuyến. */
export async function refreshTopics(): Promise<void> {
  const s = useBand7.getState();
  registerRemoteTopics(s.remoteTopics);
  if (!serverEnabled() || !s.auth || Date.now() - s.topicsSyncedAt < 86_400_000) return;
  try {
    const list = await fetchTopics();
    useBand7.setState({ remoteTopics: list, topicsSyncedAt: Date.now() });
    registerRemoteTopics(list);
  } catch {
    /* giữ đề đã lưu */
  }
}
