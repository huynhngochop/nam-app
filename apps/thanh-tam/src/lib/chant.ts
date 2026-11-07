import type { ChantLine } from '../data/kinh';

/**
 * Bộ đếm nhịp của màn tụng. Một tiếng mõ cho một chữ; hết dòng thì sang dòng sau.
 * Hết một bài: lặp lại nếu bài cần tụng nhiều lần, rồi thỉnh chuông và nghỉ vài nhịp trước bài kế.
 * Thuần hàm (không hẹn giờ, không âm thanh) để kiểm thử được.
 */
export type ChantPos = { idx: number; rep: number; beat: number; gap: number; done: boolean };

/** Số nhịp nghỉ sau tiếng chuông (đủ để chuông ngân). */
export const BELL_GAP = 3;

export const startPos = (): ChantPos => ({ idx: 0, rep: 1, beat: 0, gap: BELL_GAP, done: false });

export function stepStart(lines: ChantLine[], step: number): number {
  const i = lines.findIndex((l) => l.step === step);
  return i < 0 ? 0 : i;
}

/** Sang dòng kế tiếp. `bell` = cần thỉnh chuông (qua bài mới hoặc hết buổi). */
export function nextLine(pos: ChantPos, lines: ChantLine[]): { pos: ChantPos; bell: boolean } {
  const cur = lines[pos.idx];
  if (!cur || pos.done) return { pos: { ...pos, done: true }, bell: false };
  const nx = lines[pos.idx + 1];
  if (nx && nx.step === cur.step) return { pos: { ...pos, idx: pos.idx + 1, beat: 0, gap: 0 }, bell: false };
  if (pos.rep < cur.times)
    return { pos: { ...pos, idx: stepStart(lines, cur.step), rep: pos.rep + 1, beat: 0, gap: 0 }, bell: false };
  if (!nx) return { pos: { ...pos, beat: 0, gap: 0, done: true }, bell: true };
  return { pos: { idx: pos.idx + 1, rep: 1, beat: 0, gap: BELL_GAP, done: false }, bell: true };
}

/** Một nhịp. `mo` = gõ mõ ở nhịp này. */
export function tick(pos: ChantPos, lines: ChantLine[]): { pos: ChantPos; mo: boolean; bell: boolean } {
  if (pos.done || !lines.length) return { pos: { ...pos, done: true }, mo: false, bell: false };
  if (pos.gap > 0) return { pos: { ...pos, gap: pos.gap - 1 }, mo: false, bell: false };
  const beat = pos.beat + 1;
  if (beat < Math.max(1, lines[pos.idx].syl)) return { pos: { ...pos, beat }, mo: true, bell: false };
  const n = nextLine(pos, lines);
  return { pos: n.pos, mo: true, bell: n.bell };
}

/** Nhảy tới đầu một bài (bước) bất kỳ. */
export const gotoStep = (lines: ChantLine[], step: number): ChantPos => ({
  idx: stepStart(lines, step),
  rep: 1,
  beat: 0,
  gap: BELL_GAP,
  done: false,
});

/** Nhảy tới một dòng (chạm vào dòng): giữ lần lặp nếu vẫn trong bài đang tụng. */
export const gotoLine = (pos: ChantPos, lines: ChantLine[], idx: number): ChantPos => ({
  idx,
  rep: lines[idx]?.step === lines[pos.idx]?.step ? pos.rep : 1,
  beat: 0,
  gap: 0,
  done: false,
});
