import { fold } from '@nam/core';
import { CategoryId, Tip, TIPS } from '../data/tips';
import { useMeo } from '../store';

/** Mẹo còn hiện với người này (bỏ mẹo đã báo). */
const pool = () => {
  const hidden = useMeo.getState().hiddenTips;
  return hidden.length ? TIPS.filter((t) => !hidden.includes(t.id)) : TIPS;
};

type Indexed = { title: string; hay: string; rawTitle: string; rawHay: string };
/** Chữ thường (có dấu và bỏ dấu) của từng mẹo, tính một lần rồi giữ lại (vài trăm mẹo × mỗi lần gõ phím). */
const cache = new WeakMap<Tip, Indexed>();
function index(t: Tip): Indexed {
  let entry = cache.get(t);
  if (!entry) {
    const rawTitle = t.title.toLowerCase();
    const rawHay = `${rawTitle} ${t.sub ?? ''} ${t.summary} ${t.steps.join(' ')}`.toLowerCase();
    const title = fold(t.title);
    entry = { title, hay: `${fold(rawHay)} ${t.keywords}`, rawTitle, rawHay };
    cache.set(t, entry);
  }
  return entry;
}

/** Dựng sẵn chỉ mục khi app rảnh để lần tìm đầu tiên không bị khựng. */
export function warmSearchIndex() {
  for (const tip of TIPS) index(tip);
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
  let score = 0;
  for (const word of words) {
    if (x.title.includes(word.f)) score += word.raw && x.rawTitle.includes(word.raw) ? 3.5 : 3;
    else if (x.hay.includes(word.f)) score += word.raw && x.rawHay.includes(word.raw) ? 1.25 : 1;
  }
  return score / words.length;
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
  const folded = fold(q);
  if (folded.length < 2) return [];
  const out: string[] = [];
  for (const tip of pool()) {
    if (index(tip).title.includes(folded) || tip.keywords.includes(folded)) out.push(tip.title);
    if (out.length === 5) break;
  }
  return out;
}

export const TRENDING = ['nồm ẩm', 'dọn nhà Tết', 'kiến trong bếp', 'giặt gối', 'tiền điện'];

/** Bảng tin: xen kẽ các danh mục (danh mục quan tâm trước), trong mỗi danh mục mẹo cơ bản trước. */
export function feedFor(interests: CategoryId[]): Tip[] {
  const groups = new Map<CategoryId, Tip[]>();
  for (const tip of pool()) {
    const group = groups.get(tip.categoryId);
    if (group) group.push(tip);
    else groups.set(tip.categoryId, [tip]);
  }
  const interleave = (keys: CategoryId[]) => {
    const lists = keys.map((k) => groups.get(k)!);
    const max = Math.max(0, ...lists.map((l) => l.length));
    const out: Tip[] = [];
    for (let i = 0; i < max; i++) for (const list of lists) if (i < list.length) out.push(list[i]);
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
  const folded = fold(q);
  return /\?|sao|the nao|lam gi|co nen|bang cach nao|tai sao|cach nao/.test(folded) || folded.split(/\s+/).length >= 5;
}
