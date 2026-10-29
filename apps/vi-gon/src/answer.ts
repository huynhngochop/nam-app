import { shortMoney, vnd } from '@nam/core';
import { byCategory, listTx, totals } from './db';
import { Intent, PERIOD_LABEL, periodRange } from './ask';
import { catOf, periodOf } from './store';
import { Category, Fund } from './types';

export type Answer = { headline: string; detail: string; bars?: { label: string; value: number }[]; txFilter?: { from: number; to: number; categoryId?: string; kind?: 'expense' | 'income' } };

/** Tính câu trả lời hoàn toàn trên máy từ cách hiểu (Intent). */
export function computeAnswer(i: Intent, ctx: { cats: Category[]; funds: Fund[]; startDay: number; monthlyBudget: number; budgets: Record<string, number> }): Answer {
  const r = periodRange(i.period, ctx.startDay);
  const pl = PERIOD_LABEL(i.period);
  const cat = i.categoryId ? catOf(i.categoryId, ctx.cats) : null;
  const sumOf = (from: number, to: number) => (cat ? (byCategory(from, to, i.kind).find((x) => x.categoryId === cat.id)?.total ?? 0) : i.kind === 'income' ? totals(from, to).income : totals(from, to).expense);
  const countOf = (from: number, to: number) => (cat ? (byCategory(from, to, i.kind).find((x) => x.categoryId === cat.id)?.count ?? 0) : listTx({ from, to, kind: i.kind, status: 'confirmed' }).length);
  const what = cat ? cat.name : i.kind === 'income' ? 'Tổng thu' : 'Tổng chi';

  if (i.metric === 'fund_eta') {
    const f = ctx.funds.find((x) => x.id === i.fundId);
    if (!f) return { headline: 'Không tìm thấy quỹ', detail: 'Kiểm tra tên quỹ trong tab Quỹ.' };
    const left = Math.max(0, f.goal - f.saved);
    if (!left) return { headline: 'Đã đủ!', detail: `Quỹ ${f.name} đã đạt ${vnd(f.goal)}.` };
    const months = Math.max(1, (Date.now() - f.createdAt) / (30 * 86400000));
    const pace = f.saved / months;
    if (pace < 1000) return { headline: `Còn thiếu ${vnd(left)}`, detail: `Quỹ ${f.name} chưa có tiền góp đều — chưa ước được thời gian.` };
    const need = Math.ceil(left / pace);
    return { headline: `Khoảng ${need} tháng nữa`, detail: `Quỹ ${f.name}: còn thiếu ${vnd(left)}, bạn đang góp trung bình ${shortMoney(pace)}/tháng.` };
  }

  if (i.metric === 'left') {
    const p = periodOf(ctx.startDay);
    const limit = cat ? ctx.budgets[cat.id] ?? 0 : ctx.monthlyBudget;
    if (!limit) return { headline: 'Chưa đặt ngân sách', detail: `Đặt ngân sách ${cat ? cat.name : 'tháng'} để Ví Gọn tính phần còn lại.` };
    const spent = cat ? byCategory(p.from, p.to).find((x) => x.categoryId === cat.id)?.total ?? 0 : totals(p.from, p.to).expense;
    const daysLeft = Math.max(1, Math.ceil((p.to - Date.now()) / 86400000));
    const left = limit - spent;
    return left >= 0
      ? { headline: vnd(left), detail: `Còn lại của ngân sách ${cat ? cat.name : 'tháng'} · ≈ ${shortMoney(left / daysLeft)}/ngày trong ${daysLeft} ngày`, txFilter: { from: p.from, to: p.to, categoryId: cat?.id, kind: 'expense' } }
      : { headline: `Vượt ${vnd(-left)}`, detail: `Đã chi ${vnd(spent)} / ngân sách ${vnd(limit)}`, txFilter: { from: p.from, to: p.to, categoryId: cat?.id, kind: 'expense' } };
  }

  if (i.metric === 'top' || (i.metric === 'change' && !cat)) {
    const now = byCategory(r.from, r.to, i.kind);
    const prev = byCategory(r.prevFrom, r.prevTo, i.kind);
    if (i.metric === 'top') {
      if (!now.length) return { headline: 'Chưa có giao dịch', detail: `Không có khoản ${i.kind === 'income' ? 'thu' : 'chi'} nào ${pl}.` };
      return {
        headline: `${catOf(now[0].categoryId, ctx.cats).name}: ${vnd(now[0].total)}`,
        detail: `Nhiều nhất ${pl} · ${now[0].count} giao dịch`,
        bars: now.slice(0, 6).map((x) => ({ label: catOf(x.categoryId, ctx.cats).name.split(' ')[0], value: x.total })),
        txFilter: { from: r.from, to: r.to, categoryId: now[0].categoryId, kind: i.kind },
      };
    }
    const diffs = now.map((x) => ({ ...x, diff: x.total - (prev.find((p) => p.categoryId === x.categoryId)?.total ?? 0) })).sort((a, b) => b.diff - a.diff);
    if (!diffs.length || diffs[0].diff <= 0) return { headline: 'Không khoản nào tăng', detail: `So với kỳ trước, chi tiêu ${pl} không tăng ở danh mục nào.` };
    const top = diffs[0];
    const before = top.total - top.diff;
    return {
      headline: `${catOf(top.categoryId, ctx.cats).name} tăng ${vnd(top.diff)}`,
      detail: before ? `▲ ${Math.round((top.diff / before) * 100)}% so với kỳ trước (${shortMoney(before)} → ${shortMoney(top.total)})` : `Kỳ trước chưa chi khoản này`,
      txFilter: { from: r.from, to: r.to, categoryId: top.categoryId, kind: i.kind },
    };
  }

  const cur = sumOf(r.from, r.to);
  const prev = sumOf(r.prevFrom, r.prevTo);
  const n = countOf(r.from, r.to);
  const filter = { from: r.from, to: r.to, categoryId: cat?.id, kind: i.kind };
  const changeTxt = prev ? ` · ${cur >= prev ? '▲' : '▼'} ${Math.abs(Math.round(((cur - prev) / prev) * 100))}% so với kỳ trước` : '';
  if (i.metric === 'count') return { headline: `${n} lần`, detail: `${what} ${pl} · ${vnd(cur)}`, txFilter: filter };
  if (i.metric === 'average') {
    const days = Math.max(1, Math.ceil((Math.min(Date.now(), r.to) - r.from) / 86400000));
    return { headline: `${vnd(Math.round(cur / days))}/ngày`, detail: `${what} ${pl}: ${vnd(cur)} trong ${days} ngày`, txFilter: filter };
  }
  // 6 kỳ gần nhất cho biểu đồ (theo tháng)
  const bars = Array.from({ length: 6 }, (_, k) => {
    const p = periodOf(ctx.startDay, k - 5);
    const v = cat ? byCategory(p.from, p.to, i.kind).find((x) => x.categoryId === cat.id)?.total ?? 0 : i.kind === 'income' ? totals(p.from, p.to).income : totals(p.from, p.to).expense;
    return { label: `T${p.month}`, value: v };
  });
  return { headline: vnd(cur), detail: `${what} · ${pl} · ${n} giao dịch${changeTxt}`, bars: i.period.includes('month') ? bars : undefined, txFilter: filter };
}
