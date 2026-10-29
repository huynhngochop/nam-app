import { AiUnavailableError, callAi, shortMoney, vnd } from '@nam/core';
import { byCategory, totals } from './db';
import { catOf, periodOf } from './store';
import { Category } from './types';

export type Insight = { icon: 'trending-up' | 'trending-down' | 'alert-triangle' | 'check-circle'; text: string };
export type MonthSummary = {
  label: string; income: number; expense: number; saved: number; avgSaved: number;
  insights: Insight[]; suggestion: { text: string; categoryId: string; limit: number } | null; viaAi: boolean; count: number;
};

/** Tổng kết một kỳ (VG-23). Mặc định viết bằng mẫu trên máy; chỉ khi người dùng bật "AI viết nhận xét" mới gửi SỐ TỔNG theo danh mục. */
export function buildSummary(offset: number, ctx: { cats: Category[]; startDay: number; budgets: Record<string, number> }): MonthSummary {
  const p = periodOf(ctx.startDay, offset);
  const prev = periodOf(ctx.startDay, offset - 1);
  const t = totals(p.from, p.to);
  const cats = byCategory(p.from, p.to);
  const prevCats = byCategory(prev.from, prev.to);
  const hist = Array.from({ length: 6 }, (_, k) => { const q = periodOf(ctx.startDay, offset - 1 - k); const x = totals(q.from, q.to); return x.count ? x.income - x.expense : null; }).filter((x): x is number => x != null);
  const avgSaved = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : 0;

  const insights: Insight[] = [];
  for (const c of cats.slice(0, 4)) {
    const before = prevCats.find((x) => x.categoryId === c.categoryId)?.total ?? 0;
    const name = catOf(c.categoryId, ctx.cats).name;
    const limit = ctx.budgets[c.categoryId];
    if (limit && c.total > limit) insights.push({ icon: 'alert-triangle', text: `${name} vượt ngân sách ${vnd(c.total - limit)}.` });
    else if (before && c.total > before * 1.1) insights.push({ icon: 'trending-up', text: `${name} tăng ${Math.round(((c.total - before) / before) * 100)}% (${shortMoney(before)} → ${shortMoney(c.total)}).` });
    else if (before && c.total < before * 0.9) insights.push({ icon: 'trending-down', text: `${name} giảm ${Math.round(((before - c.total) / before) * 100)}%.` });
    else insights.push({ icon: 'check-circle', text: `${name} ổn định: ${shortMoney(c.total)}.` });
  }

  const over = cats.map((c) => ({ ...c, before: prevCats.find((x) => x.categoryId === c.categoryId)?.total ?? 0 })).filter((c) => c.before && c.total > c.before * 1.1).sort((a, b) => b.total - b.before - (a.total - a.before))[0];
  const suggestion = over ? { text: `Đặt hạn mức ${catOf(over.categoryId, ctx.cats).name} ${shortMoney(Math.round(over.before / 100000) * 100000)} cho kỳ tới.`, categoryId: over.categoryId, limit: Math.round(over.before / 100000) * 100000 } : null;

  return { label: p.label, income: t.income, expense: t.expense, saved: t.income - t.expense, avgSaved, insights, suggestion, viaAi: false, count: t.count };
}

export async function aiRewrite(s: MonthSummary, cats: Category[], raw: { categoryId: string; total: number }[]): Promise<MonthSummary> {
  try {
    const r = await callAi<{ insights: string[]; suggestion?: string }>('finance-summary', {
      period: s.label,
      // Chỉ số tổng, làm tròn đến nghìn — không có nơi chi, ghi chú, tài khoản.
      totals: { income: Math.round(s.income / 1000) * 1000, expense: Math.round(s.expense / 1000) * 1000, avgSaved: Math.round(s.avgSaved / 1000) * 1000 },
      categories: raw.slice(0, 8).map((x) => ({ name: catOf(x.categoryId, cats).name, total: Math.round(x.total / 1000) * 1000 })),
    }, { timeoutMs: 12000 });
    if (!Array.isArray(r.insights) || !r.insights.length) return s;
    return { ...s, insights: r.insights.slice(0, 4).map((text) => ({ icon: 'check-circle', text: String(text).slice(0, 160) })), viaAi: true };
  } catch (e) {
    if (e instanceof AiUnavailableError) return s;
    return s;
  }
}
