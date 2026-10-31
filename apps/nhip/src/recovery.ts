import type { Session } from './store';

/**
 * Trạng thái phiên khi mở màn Hẹn giờ (lỗi N1, N2).
 * - expired: phiên Pomodoro đang chạy đã qua giờ kết thúc (kể cả khi app bị tắt) → tính là hoàn thành.
 * - stale: lần mở đầu tiên sau khi app khởi động, nhịp ghi cuối cũ hơn 90 giây → app đã bị tắt giữa phiên, hỏi người dùng.
 * - active: phiên vẫn đang chạy (vd. người dùng bấm Back khỏi màn phiên) → hiện "Quay lại phiên", không chặn màn.
 */
export type SessionState = 'none' | 'active' | 'expired' | 'stale';

export function classifySession(s: Session | null, now: number, firstOpenSinceLaunch: boolean): SessionState {
  if (!s) return 'none';
  if (s.mode === 'pomodoro' && s.status === 'running' && s.endAt <= now) return 'expired';
  if (firstOpenSinceLaunch && now - s.lastHeartbeatAt > 90_000) return 'stale';
  return 'active';
}
