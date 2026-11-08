/** Chọn giọng tiếng Việt từ danh sách giọng của máy. Hàm thuần, có kiểm thử. */
export type V = { identifier: string; language?: string; quality?: string; name?: string };

/** Chọn giọng tiếng Việt tốt nhất: ưu tiên giọng chạy trên máy (không cần mạng), chất lượng cao. */
export function pickViVoice(voices: V[]): V | undefined {
  const vi = voices.filter((v) => (v.language ?? '').toLowerCase().replace('_', '-').startsWith('vi'));
  const score = (v: V) =>
    (/network/i.test(v.identifier) ? 0 : 2) + (v.quality === 'Enhanced' ? 1 : 0) + (/vi-?vn/i.test(v.language ?? '') ? 1 : 0);
  return vi.sort((a, b) => score(b) - score(a))[0];
}
