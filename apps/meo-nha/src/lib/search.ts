import { fold } from '@nam/core';
import { CategoryId, Tip, TIPS } from '../data/tips';

/** Tìm kiếm trên máy, không phân biệt dấu. Máy chủ (GET /search) thay thế khi có mạng. */
export function scoreTip(t: Tip, q: string): number {
  const words = fold(q).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return 0;
  const title = fold(t.title);
  const hay = `${title} ${fold(t.summary)} ${t.keywords} ${fold(t.steps.join(' '))}`;
  let s = 0;
  for (const w of words) {
    if (title.includes(w)) s += 3;
    else if (hay.includes(w)) s += 1;
  }
  return s / words.length;
}

export type SortKey = 'popular' | 'new' | 'rating' | 'easy';
export function searchTips(q: string, opts: { category?: CategoryId | 'all'; sort?: SortKey } = {}) {
  let list = TIPS.map((t) => ({ t, s: scoreTip(t, q) })).filter((x) => x.s > 0.3);
  if (opts.category && opts.category !== 'all') list = list.filter((x) => x.t.categoryId === opts.category);
  const sort = opts.sort ?? 'popular';
  list.sort((a, b) => (sort === 'rating' ? b.t.rating - a.t.rating : sort === 'easy' ? a.t.minutes - b.t.minutes : sort === 'new' ? b.t.id.localeCompare(a.t.id) : b.s - a.s || b.t.ratingCount - a.t.ratingCount));
  return list.map((x) => x.t);
}

export function suggestions(q: string): string[] {
  const f = fold(q);
  if (f.length < 2) return [];
  return TIPS.filter((t) => fold(t.title).includes(f) || t.keywords.includes(f)).slice(0, 5).map((t) => t.title);
}

export const TRENDING = ['nồm ẩm', 'dọn nhà Tết', 'kiến trong bếp', 'giặt gối', 'tiền điện'];

export function feedFor(interests: CategoryId[]): Tip[] {
  const rank = (t: Tip) => (interests.includes(t.categoryId) ? 0 : 1);
  return [...TIPS].sort((a, b) => rank(a) - rank(b) || b.ratingCount - a.ratingCount);
}

/** "Mẹo hôm nay" đổi theo ngày, ưu tiên danh mục quan tâm. */
export function dailyTip(interests: CategoryId[], d = new Date()): Tip {
  const pool = interests.length ? TIPS.filter((t) => interests.includes(t.categoryId)) : TIPS;
  const day = Math.floor(d.getTime() / 86400000);
  return pool[day % pool.length];
}

export function looksLikeQuestion(q: string): boolean {
  const f = fold(q);
  return /\?|sao|the nao|lam gi|co nen|bang cach nao|tai sao|cach nao/.test(f) || f.split(/\s+/).length >= 5;
}
