/**
 * Giọng đọc AI đóng sẵn trong bản cài (src/data/voiceBundle.ts, sinh trên CI bằng scripts/voice_ai.py bundle).
 * Bài nào có bản đóng sẵn khớp nội dung thì nghe ngay không cần tải; bài chưa có thì app tải giọng mẫu qua mạng.
 */
export type BundledVoice = {
  /** require('…m4a') */
  asset: number;
  bytes: number;
  ms: number;
  hash: string;
  /** [bắt đầu ms, dài ms] cho từng câu (cue), kể cả chỗ người khấn tự đọc. */
  cues: [number, number][];
};
export type BundledVoices = Record<string, BundledVoice>;

/** Bản đóng sẵn của bài, chỉ khi còn khớp mã băm nội dung (đổi chữ mà chưa đóng gói lại thì không dùng). */
export function bundledMatch(all: BundledVoices, id: string, hash: string | undefined): BundledVoice | null {
  const b = Object.prototype.hasOwnProperty.call(all, id) ? all[id] : undefined;
  return b && hash && b.hash === hash ? b : null;
}
