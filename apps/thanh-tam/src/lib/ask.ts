/**
 * Hỏi Thành Tâm: trả lời ngay trên máy, không gửi câu hỏi đi đâu.
 * 1) Câu hỏi về lịch (hôm nay âm lịch, rằm, mùng 1 tới) và về ngày giỗ trong sổ: tính ngay.
 * 2) Câu hỏi thường gặp (data/faq.ts): khớp theo từ khóa đã bỏ dấu, có trọng số theo độ hiếm của từ.
 * 3) Luôn kèm các mục liên quan trong app (lễ, văn khấn, dấu hiệu, mẹo, kinh).
 * Hàm thuần, có kiểm thử.
 */
import { fold } from '@nam/core';
import { FAQ, type Faq } from '../data/faq';
import { KINH, NGHI_THUC } from '../data/kinh';
import { canChiYear, lunarOf, monthName } from '../calendar/lunar';
import { addDays, daysBetween, nextGio, type Anniversary } from './schedule';
import { expand, search, type SearchResult } from './search';

export type AskLink = { title: string; href: string; sub?: string };
export type Answer = {
  kind: 'lich' | 'gio' | 'faq' | 'chua-co';
  title: string;
  text: string[];
  links: AskLink[];
  faq?: Faq;
  related: AskLink[];
};

const STOP = new Set(
  'la gi co khong the nao sao bao nhieu thi phai can nen duoc lam vay a nhe oi minh toi em anh chi con cua cho voi va hay hoac nhung cac mot nhu ai dau roi chua de ma vao ra len xuong'
    .split(' ')
    .filter((w) => !['bao', 'nhieu'].includes(w)),
);
const words = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));

const WEEKDAY = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const dmy = (d: Date) => `${WEEKDAY[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
const inDays = (n: number) => (n === 0 ? 'hôm nay' : n === 1 ? 'ngày mai' : `còn ${n} ngày`);

/** Từ hiếm (ít câu hỏi có) nặng hơn từ phổ biến. */
let IDF: Map<string, number> | null = null;
let DOCS: { f: Faq; toks: Set<string>; phrases: string[] }[] | null = null;
function faqIndex() {
  if (DOCS && IDF) return { docs: DOCS, idf: IDF };
  DOCS = FAQ.map((f) => {
    const phrases = [f.q, ...f.alt].map((x) => fold(x).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim());
    const toks = new Set([...words(`${f.q} ${f.alt.join(' ')}`), ...f.kw.split(/\s+/)]);
    return { f, toks, phrases };
  });
  const df = new Map<string, number>();
  for (const d of DOCS) for (const t of d.toks) df.set(t, (df.get(t) ?? 0) + 1);
  IDF = new Map([...df].map(([t, n]) => [t, Math.log(1 + FAQ.length / n)]));
  return { docs: DOCS, idf: IDF };
}

/** Điểm khớp từng câu hỏi thường gặp, cao nhất trước. */
export function matchFaq(q: string): { f: Faq; score: number }[] {
  const { docs, idf } = faqIndex();
  const qs = expand(q).join(' ');
  const qw = [...new Set(words(qs))];
  if (!qw.length) return [];
  const fq = fold(q).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // Từ không có trong bộ câu hỏi (ví dụ "giá", "phở") tính nặng: câu có nhiều từ lạ thì không ép vào câu trả lời sẵn có.
  const unknown = Math.log(1 + FAQ.length);
  const max = qw.reduce((a, w) => a + (idf.get(w) ?? unknown), 0) || 1;
  return docs
    .map((d) => {
      let s = 0;
      for (const w of qw) if (d.toks.has(w)) s += idf.get(w) ?? 0;
      // cụm 2 từ liền nhau trùng với cách hỏi: cộng thêm
      for (let i = 0; i + 1 < qw.length; i++) if (d.phrases.some((p) => p.includes(`${qw[i]} ${qw[i + 1]}`))) s += 0.6;
      if (d.phrases.some((p) => p === fq || (fq.length > 8 && p.includes(fq)))) s += 3;
      return { f: d.f, score: s / max };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

function nextLunarDay(today: Date, day: number): Date {
  for (let i = 0; i < 31; i++) {
    const d = addDays(today, i);
    if (lunarOf(d).day === day) return d;
  }
  return today;
}

function lichAnswer(q: string, today: Date): Answer | null {
  const f = fold(q);
  const l = lunarOf(today);
  const ask = /(khi nao|bao gio|ngay nao|ngay may|hom nao|toi|sap|thang nay|thang sau|ke tiep)/.test(f);
  if (/hom nay/.test(f) && /(am|ngay|mung|ram|bao nhieu|may)/.test(f)) {
    return {
      kind: 'lich',
      title: `Hôm nay là ngày ${l.day} tháng ${monthName(l.month, l.leap)} năm ${canChiYear(l.year)}`,
      text: [`${dmy(today)}. ${l.day === 1 ? 'Hôm nay là mùng 1.' : l.day === 15 ? 'Hôm nay là ngày rằm.' : ''}`.trim()],
      links: [{ title: 'Xem lịch', href: '/calendar' }],
      related: [],
    };
  }
  if (ask && /\bram\b/.test(f) && !/thang (gieng|bay|muoi|7|10|1)\b/.test(f)) {
    const d = nextLunarDay(today, 15);
    const n = daysBetween(today, d);
    const ld = lunarOf(d);
    return {
      kind: 'lich',
      title: `Rằm tới: ${dmy(d)}`,
      text: [`Ngày 15 tháng ${monthName(ld.month, ld.leap)} âm lịch, ${inDays(n)}. Nhiều nhà cúng từ chiều hôm trước.`],
      links: [{ title: 'Lễ rằm, mùng 1', href: '/ritual/mung-1-ram' }],
      related: [],
    };
  }
  if (ask && /(mung 1|mung mot|mong 1|mong mot|dau thang)/.test(f)) {
    const d = nextLunarDay(today, 1);
    const n = daysBetween(today, d);
    const ld = lunarOf(d);
    return {
      kind: 'lich',
      title: `Mùng 1 tới: ${dmy(d)}`,
      text: [`Mùng 1 tháng ${monthName(ld.month, ld.leap)} âm lịch, ${inDays(n)}.`],
      links: [{ title: 'Lễ rằm, mùng 1', href: '/ritual/mung-1-ram' }],
      related: [],
    };
  }
  return null;
}

/** Hỏi về ngày giỗ có trong sổ: khớp tên hoặc quan hệ (ông nội, bà ngoại...). */
function gioAnswer(q: string, today: Date, list: Anniversary[]): Answer | null {
  const f = fold(q);
  if (!/\bgio\b/.test(f) || !list.length) return null;
  // Tên so có dấu ("Ba" khác "bà"); quan hệ so bỏ dấu ("ong noi" = "ông nội").
  const low = ` ${q.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ')} `;
  const hits = list.filter((a) => {
    const name = a.name.toLowerCase().normalize('NFC').trim();
    const last = name.split(/\s+/).pop() ?? '';
    const rel = fold(a.relation);
    return (
      (rel.length > 1 && f.includes(rel)) ||
      (name.length > 1 && low.includes(` ${name} `)) ||
      (last.length > 1 && low.includes(` ${last} `))
    );
  });
  if (!hits.length) return null;
  const rows = hits.slice(0, 5).map((a) => {
    const o = nextGio(a, today);
    const who = `${a.relation ? `${a.relation} ` : ''}${a.name}`;
    if (!o) return `${who}: ngày ${a.lunar.day} tháng ${monthName(a.lunar.month, a.lunar.leap)} âm lịch.`;
    return `${who}: ${dmy(o.date)} (ngày ${a.lunar.day} tháng ${monthName(a.lunar.month, a.lunar.leap)} âm), ${inDays(daysBetween(today, o.date))}.${o.missing ? ' Năm nay tháng thiếu, cúng ngày cuối tháng.' : ''}`;
  });
  return {
    kind: 'gio',
    title: hits.length === 1 ? 'Ngày giỗ trong sổ của bạn' : `${hits.length} ngày giỗ khớp câu hỏi`,
    text: rows,
    links: [{ title: 'Mở Sổ giỗ', href: '/anniversaries' }],
    related: [],
  };
}

function kinhLinks(q: string): AskLink[] {
  const f = fold(q);
  const out: AskLink[] = [];
  for (const n of NGHI_THUC) if (f.includes(fold(n.title).replace('nghi thuc ', ''))) out.push({ title: n.title, href: `/chant/${n.id}` });
  for (const k of KINH) {
    const t = fold(k.title).replace(/^(kinh|chu|niem|tan) /, '');
    if (t.length > 3 && f.includes(t)) out.push({ title: k.title, href: `/chant/${k.id}`, sub: k.about });
  }
  return out;
}

const toLink = (r: SearchResult): AskLink => ({ title: r.title, href: r.href, sub: `${r.type} · ${r.sub}` });

export const ASK_THRESHOLD = 0.5;

export function ask(q: string, ctx: { today: Date; anniversaries: Anniversary[] }): Answer {
  const related = [...kinhLinks(q), ...search(q, 6).map(toLink)];
  const dedupe = (links: AskLink[], used: AskLink[]) =>
    links.filter((x, i) => !used.some((u) => u.href === x.href) && links.findIndex((y) => y.href === x.href) === i).slice(0, 6);

  const direct = gioAnswer(q, ctx.today, ctx.anniversaries) ?? lichAnswer(q, ctx.today);
  if (direct) return { ...direct, related: dedupe(related, direct.links) };

  const best = matchFaq(q)[0];
  if (best && best.score >= ASK_THRESHOLD) {
    return {
      kind: 'faq',
      title: best.f.q,
      text: best.f.a,
      links: best.f.links,
      faq: best.f,
      related: dedupe(related, best.f.links),
    };
  }
  return {
    kind: 'chua-co',
    title: 'Thành Tâm chưa có câu trả lời chắc chắn',
    text: related.length
      ? ['Có thể bạn cần những mục dưới đây. Hỏi ngắn hơn, ví dụ "giỗ tháng nhuận", "thắp mấy nén hương".']
      : ['Thử hỏi ngắn hơn, ví dụ "cúng rằm giờ nào", "giỗ tháng thiếu", "tụng kinh gì ngày giỗ".'],
    links: [],
    related: dedupe(related, []),
  };
}
