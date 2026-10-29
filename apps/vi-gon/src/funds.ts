import { Fund } from './types';

export const FREE_FUNDS = 1;

/** Số cần để dành mỗi tháng để kịp hạn (làm tròn lên nghìn đồng). */
export function monthlyNeed(f: Pick<Fund, 'goal' | 'saved' | 'deadline'>, now = Date.now()) {
  if (!f.deadline) return null;
  const months = Math.max(1, Math.ceil((f.deadline - now) / (30.4 * 86400000)));
  return Math.max(0, Math.ceil((f.goal - f.saved) / months / 1000) * 1000);
}
