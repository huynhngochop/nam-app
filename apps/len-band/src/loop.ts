/** Nhãn và mốc của vòng sửa lỗi (khớp với state machine ở backend: 1 → 3 → 7 → 14 ngày, đúng 3 lần thì đóng). */
import type { LearnerError } from './api';

export const RECALL_DAYS = [1, 3, 7, 14] as const;
export const CLOSE_AFTER = 3;

export function statusLabel(e: Pick<LearnerError, 'status' | 'streak'>): {
  label: string;
  tone: 'negative' | 'warning' | 'positive';
} {
  if (e.status === 'closed') return { label: 'đã sửa dứt', tone: 'positive' };
  if (e.status === 'recalling') return { label: `đang gài lại · ${e.streak}/${CLOSE_AFTER}`, tone: 'warning' };
  return { label: 'mới · sửa ngay', tone: 'negative' };
}

export type Milestone = { label: string; state: 'done' | 'next' | 'todo' };
/** Hành trình của một lỗi để vẽ dòng thời gian. */
export function milestones(e: Pick<LearnerError, 'status' | 'repair_ok' | 'streak'>): Milestone[] {
  const out: Milestone[] = [{ label: 'Bắt lỗi', state: 'done' }];
  const repaired = e.status !== 'repairing';
  out.push({ label: `Sửa ngay (${Math.min(e.repair_ok, 2)}/2)`, state: repaired ? 'done' : 'next' });
  const okCount = e.status === 'closed' ? CLOSE_AFTER : e.streak;
  RECALL_DAYS.slice(0, CLOSE_AFTER).forEach((d, i) => {
    out.push({
      label: `Gài lại ngày ${d}`,
      state: !repaired ? 'todo' : i < okCount ? 'done' : i === okCount ? 'next' : 'todo',
    });
  });
  out.push({ label: 'Kiểm tra giữ lâu ngày 14', state: e.status === 'closed' ? 'next' : 'todo' });
  return out;
}

/** Lỗi mới cần "Sửa ngay", lỗi gần nhất trước. */
export function toRepair(list: LearnerError[]): LearnerError[] {
  return list.filter((e) => e.status === 'repairing').sort((a, b) => (a.last_seen_at < b.last_seen_at ? 1 : -1));
}
export function dueCount(list: LearnerError[], now = Date.now()): number {
  return list.filter((e) => e.next_due_at && new Date(e.next_due_at).getTime() <= now).length;
}

/** Che bớt câu ở lần nói thứ 2 để người học phải tự nhớ, không đọc theo. */
export function maskSentence(s: string): string {
  return s
    .split(' ')
    .map((w, i) => (i === 0 || w.length <= 2 ? w : `${w[0]}${'_'.repeat(Math.min(6, w.length - 1))}`))
    .join(' ');
}
