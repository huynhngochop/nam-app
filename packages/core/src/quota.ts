import { dateKey } from './format';

/** Đếm lượt theo ngày (giới hạn phía máy; máy chủ vẫn phải kiểm lại). */
export type DailyQuota = { day: string; used: number };
export function quotaLeft(q: DailyQuota | undefined, limit: number, now = new Date()): number {
  if (!q || q.day !== dateKey(now)) return limit;
  return Math.max(0, limit - q.used);
}
export function quotaUse(q: DailyQuota | undefined, now = new Date()): DailyQuota {
  const day = dateKey(now);
  return { day, used: q && q.day === day ? q.used + 1 : 1 };
}
