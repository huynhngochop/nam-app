import { parseBankText } from './parse';

type Leg = { raw: string | null };
type Kind = 'expense' | 'income';

/**
 * Bỏ đánh dấu "chuyển nội bộ" (lỗi V4): trả lại đúng chiều thu/chi cho từng chân.
 * Chiều lấy từ tin ngân hàng gốc; thiếu tin gốc thì suy từ chân kia (hai chân luôn ngược chiều).
 * Không đoán được → null, màn hình hỏi người dùng.
 */
export function untransferKinds(self: Leg, pair: Leg | null): { self: Kind | null; pair: Kind | null } {
  const kindOf = (l: Leg | null): Kind | null => (l?.raw ? (parseBankText(l.raw)?.kind ?? null) : null);
  const flip = (k: Kind): Kind => (k === 'income' ? 'expense' : 'income');
  let a = kindOf(self);
  let b = kindOf(pair);
  if (!a && b) a = flip(b);
  if (a && !b && pair) b = flip(a);
  return { self: a, pair: pair ? b : null };
}
