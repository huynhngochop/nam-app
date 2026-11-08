import { fold } from '@nam/core';
import { CategoryId, Tip, TIPS } from '../data/tips';
import { useMeo } from '../store';

/** Mẹo còn hiện với người này (bỏ mẹo đã báo). */
const pool = () => {
  const h = useMeo.getState().hiddenTips;
  return h.length ? TIPS.filter((t) => !h.includes(t.id)) : TIPS;
};

type Indexed = { title: string; hay: string; rawTitle: string; rawHay: string };
/** Chữ thường (có dấu và bỏ dấu) của từng mẹo, tính một lần rồi giữ lại (vài trăm mẹo × mỗi lần gõ phím). */
const cache = new WeakMap<Tip, Indexed>();
function index(t: Tip): Indexed {
  let f = cache.get(t);
  if (!f) {
    const rawTitle = t.title.toLowerCase();
    const rawHay = `${rawTitle} ${t.sub ?? ''} ${t.summary} ${t.steps.join(' ')}`.toLowerCase();
    const title = fold(t.title);
    f = { title, hay: `${fold(rawHay)} ${t.keywords}`, rawTitle, rawHay };
    cache.set(t, f);
  }
  return f;
}

/** Dựng sẵn chỉ mục khi app rảnh để lần tìm đầu tiên không bị khựng. */
export function warmSearchIndex() {
  for (const t of TIPS) index(t);
}

type Word = { f: string; raw: string | null };
/** Từ khóa bỏ dấu; giữ thêm bản có dấu (nếu người dùng gõ dấu) để "máu" xếp trên "màu". */
function queryWords(q: string): Word[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((raw) => ({ f: fold(raw), raw: fold(raw) === raw ? null : raw }))
    .filter((w) => w.f.length > 1);
}

/** Tìm kiếm trên máy, không phân biệt dấu. Máy chủ (GET /search) thay thế khi có mạng. */
export function scoreTip(t: Tip, q: string): number {
  return scoreWords(t, queryWords(q));
}
function scoreWords(t: Tip, words: Word[]): number {
  if (!words.length) return 0;
  const x = index(t);
  let s = 0;
  for (const w of words) {
    if (x.title.includes(w.f)) s += w.raw && x.rawTitle.includes(w.raw) ? 3.5 : 3;
    else if (x.hay.includes(w.f)) s += w.raw && x.rawHay.includes(w.raw) ? 1.25 : 1;
  }
  return s / words.length;
}

export type SortKey = 'popular' | 'new' | 'easy';
export function searchTips(q: string, opts: { category?: CategoryId | 'all'; sort?: SortKey } = {}) {
  const words = queryWords(q);
  let list = pool()
    .map((t) => ({ t, s: scoreWords(t, words) }))
    .filter((x) => x.s > 0.3);
  if (opts.category && opts.category !== 'all') list = list.filter((x) => x.t.categoryId === opts.category);
  const sort = opts.sort ?? 'popular';
  list.sort((a, b) =>
    sort === 'easy'
      ? a.t.minutes - b.t.minutes || b.s - a.s
      : sort === 'new'
        ? b.t.order - a.t.order
        : b.s - a.s || a.t.order - b.t.order,
  );
  return list.map((x) => x.t);
}

export function suggestions(q: string): string[] {
  const f = fold(q);
  if (f.length < 2) return [];
  const out: string[] = [];
  for (const t of pool()) {
    if (index(t).title.includes(f) || t.keywords.includes(f)) out.push(t.title);
    if (out.length === 5) break;
  }
  return out;
}

export const TRENDING = ['nồm ẩm', 'dọn nhà Tết', 'kiến trong bếp', 'giặt gối', 'tiền điện'];

/** Bảng tin: xen kẽ các danh mục (danh mục quan tâm trước), trong mỗi danh mục mẹo cơ bản trước. */
export function feedFor(interests: CategoryId[]): Tip[] {
  const groups = new Map<CategoryId, Tip[]>();
  for (const t of pool()) {
    const g = groups.get(t.categoryId);
    if (g) g.push(t);
    else groups.set(t.categoryId, [t]);
  }
  const interleave = (keys: CategoryId[]) => {
    const lists = keys.map((k) => groups.get(k)!);
    const max = Math.max(0, ...lists.map((l) => l.length));
    const out: Tip[] = [];
    for (let i = 0; i < max; i++) for (const l of lists) if (i < l.length) out.push(l[i]);
    return out;
  };
  const keys = [...groups.keys()];
  return [
    ...interleave(keys.filter((k) => interests.includes(k))),
    ...interleave(keys.filter((k) => !interests.includes(k))),
  ];
}

/** "Mẹo hôm nay" đổi theo ngày, ưu tiên danh mục quan tâm. */
export function dailyTip(interests: CategoryId[], d = new Date()): Tip {
  const all = pool();
  const mine = interests.length ? all.filter((t) => interests.includes(t.categoryId)) : all;
  const list = mine.length ? mine : all;
  const day = Math.floor(d.getTime() / 86400000);
  return list[day % list.length];
}

export function looksLikeQuestion(q: string): boolean {
  const f = fold(q);
  return /\?|sao|the nao|lam gi|co nen|bang cach nao|tai sao|cach nao/.test(f) || f.split(/\s+/).length >= 5;
}
