/**
 * Giọng đọc mẫu: danh sách câu (cue) của từng bài. Dùng ở hai nơi phải khớp nhau từng câu:
 * - lúc build (scripts/voice-text.ts → gen_voice.py tạo âm thanh, ghi mốc thời gian từng câu),
 * - trong app (tô sáng câu đang đọc theo mốc thời gian).
 * Đổi chữ bài nào thì mã băm của bài đó đổi, app biết cần tải lại.
 */
import { KINH } from '../data/kinh';
import { PRAYERS } from '../data/prayers';
import type { PrayerField } from '../data/types';
import { buildPrayer } from './prayer';

/** `p`: với kinh là số thứ tự dòng trong bài; với văn khấn là số thứ tự đoạn. `field`: chỗ người khấn tự đọc (tên, địa chỉ...). */
export type Cue = { text?: string; field?: PrayerField; p: number };
export type VoiceItem = { id: string; title: string; kind: 'kinh' | 'khan'; cues: Cue[]; pace: number };

export const kinhVoiceId = (kinhId: string) => `kinh-${kinhId}`;
export const khanVoiceId = (prayerId: string) => `khan-${prayerId}`;

/**
 * Giọng tạo sẵn và nhịp đọc. `pace` là độ dài âm so với tốc độ thường của giọng (1,2 = chậm hơn 20 %).
 * Đổi giọng (VOICE_ENGINE) hay nhịp thì mã băm mọi bài đổi theo, app biết cần tải lại.
 * - 'piper': giọng Piper vais1000 đang đăng (mã băm giữ kiểu cũ để bản đã cài vẫn dùng được).
 * - 'google-chirp3hd-charon': giọng Google Chirp 3 HD, đọc chậm như người khấn. Bật khi đã tạo xong giọng trên CI
 *   (cần secret GOOGLE_TTS_KEY), cùng lúc phát hành bản app mới.
 */
export const VOICE_ENGINE = 'piper' as 'piper' | 'google-chirp3hd-charon';
const PACE = {
  piper: { kinh: 1.35, khan: 1.12 },
  'google-chirp3hd-charon': { kinh: 1.12, khan: 1.18 },
}[VOICE_ENGINE];
const KINH_PACE = PACE.kinh;
const KHAN_PACE = PACE.khan;

export function kinhCues(kinhId: string): Cue[] {
  const k = KINH.find((x) => x.id === kinhId);
  if (!k) return [];
  const out: Cue[] = [];
  let i = 0;
  for (const para of k.paras) for (const line of para.l) out.push({ text: line, p: i++ });
  return out;
}

export function khanCues(prayerId: string): Cue[] {
  const pr = PRAYERS.find((x) => x.id === prayerId);
  if (!pr) return [];
  const out: Cue[] = [];
  buildPrayer(pr.body, {}).forEach((para, p) => {
    for (let r = 0; r < (para.repeat ?? 1); r++) {
      for (const s of para.segments) {
        if (s.field) out.push({ field: s.field, p });
        else if (/\p{L}/u.test(s.text)) out.push({ text: s.text.trim(), p });
      }
    }
  });
  return out;
}

export function voiceItems(): VoiceItem[] {
  return [
    ...KINH.map((k) => ({
      id: kinhVoiceId(k.id),
      title: k.title,
      kind: 'kinh' as const,
      cues: kinhCues(k.id),
      pace: KINH_PACE,
    })),
    ...PRAYERS.map((p) => ({
      id: khanVoiceId(p.id),
      title: p.title,
      kind: 'khan' as const,
      cues: khanCues(p.id),
      pace: KHAN_PACE,
    })),
  ];
}

/** Băm FNV-1a 32 bit: nhỏ, đồng bộ, đủ để biết nội dung đổi (không dùng cho bảo mật). */
export function hashCues(cues: Cue[], pace: number): string {
  const body = [pace, cues.map((c) => c.text ?? `{${c.field}}`)];
  const s = JSON.stringify(VOICE_ENGINE === 'piper' ? body : [VOICE_ENGINE, ...body]);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Câu đang đọc ở mốc `ms`: tìm nhị phân trên mốc bắt đầu. Trước câu đầu trả -1. */
export function cueAt(starts: number[], ms: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= ms) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}
