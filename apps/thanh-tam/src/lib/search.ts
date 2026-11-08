/** Tìm kiếm trên máy: bỏ dấu + đồng nghĩa. Với gói nội dung lớn (đợt 3) chuyển sang SQLite FTS5 cùng cách chuẩn hóa. */
import { fold } from '@nam/core';
import { RITUALS } from '../data/rituals';
import { PRAYERS } from '../data/prayers';
import { SIGNS, TIPS } from '../data/signs';
import { GUIDES } from '../data/guides';

const SYNONYMS: [string, string][] = [
  ['ong tao', 'ong cong ong tao 23 thang chap tao quan'],
  ['nhang', 'huong'],
  ['ve nha moi', 'nhap trach'],
  ['chuyen nha', 'nhap trach'],
  ['gio dau', 'gio tieu tuong'],
  ['than tai', 'than tai tho dia'],
  ['ram', 'ram mung 1'],
  ['mung 1', 'mung 1 ram'],
  ['tao mo', 'thanh minh'],
  ['30 tet', 'tat nien giao thua'],
  ['ruoc ong ba', 'tat nien'],
  ['tien ong ba', 'hoa vang'],
  ['co hon', 'cung chung sinh vu lan'],
  ['49 ngay', 'tuan 49 100'],
  ['100 ngay', 'tuan 49 100'],
  ['may lay', 'cach lay so lay'],
  ['lay may lay', 'cach lay so lay'],
  ['rot ruou', 'ba tuan ruou cham tra'],
  ['mam co', 'mam co mam com cung'],
  ['bay ban tho', 'bay ban tho dong binh tay qua'],
  ['di chua', 'le chua'],
  ['dot vang', 'hoa vang'],
];
export type SearchResult = {
  type: 'Lễ' | 'Văn khấn' | 'Dấu hiệu' | 'Mẹo' | 'Hướng dẫn';
  id: string;
  title: string;
  sub: string;
  href: string;
  score: number;
};

type Doc = Omit<SearchResult, 'score'> & { t: string; body: string };
let INDEX: Doc[] | null = null;
function index(): Doc[] {
  if (INDEX) return INDEX;
  const docs: Doc[] = [];
  for (const r of RITUALS)
    docs.push({
      type: 'Lễ',
      id: r.id,
      title: r.title,
      sub: r.when.text,
      href: `/ritual/${r.id}`,
      t: fold(r.title),
      body: fold(`${r.keywords} ${r.summary}`),
    });
  for (const p of PRAYERS) {
    const r = RITUALS.find((x) => x.prayers.includes(p.id));
    if (r)
      docs.push({
        type: 'Văn khấn',
        id: p.id,
        title: p.title,
        sub: `Khoảng ${p.minutes} phút`,
        href: `/ritual/${r.id}/prayer?prayerId=${p.id}`,
        t: fold(p.title),
        body: fold(p.deity),
      });
  }
  for (const s of SIGNS)
    docs.push({
      type: 'Dấu hiệu',
      id: s.id,
      title: s.title,
      sub: s.sub,
      href: `/sign/${s.id}`,
      t: fold(s.title),
      body: fold(s.keywords),
    });
  for (const t of TIPS)
    docs.push({
      type: 'Mẹo',
      id: t.id,
      title: t.title,
      sub: t.summary,
      href: `/tip/${t.id}`,
      t: fold(t.title),
      body: fold(t.keywords),
    });
  for (const g of GUIDES)
    docs.push({
      type: 'Hướng dẫn',
      id: g.id,
      title: g.title,
      sub: g.summary,
      href: `/guide/${g.id}`,
      t: fold(g.title),
      body: fold(g.keywords),
    });
  INDEX = docs;
  return docs;
}

export function expand(q: string): string[] {
  const f = fold(q);
  const extra = SYNONYMS.filter(([k]) => f.includes(k)).map(([, v]) => v);
  return [f, ...extra];
}

export function search(q: string, limit = 30): SearchResult[] {
  const f = fold(q);
  if (f.length < 2) return [];
  const qs = expand(q);
  const words = f.split(/\s+/).filter(Boolean);
  const out: SearchResult[] = [];
  for (const d of index()) {
    let score = 0;
    if (d.t.includes(f)) score += 10;
    if (qs.slice(1).some((s) => d.t.includes(s) || d.body.includes(s))) score += 6;
    const hay = `${d.t} ${d.body}`;
    const hit = words.filter((w) => hay.includes(w)).length;
    if (hit === words.length) score += 4 + hit;
    else score += hit;
    if (score >= 4) out.push({ type: d.type, id: d.id, title: d.title, sub: d.sub, href: d.href, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
