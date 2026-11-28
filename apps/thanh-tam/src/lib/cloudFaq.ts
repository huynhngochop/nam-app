import { fold, type CloudItem } from '@nam/core';
import type { Faq } from '../data/faq';

/**
 * Đổi mục nội dung từ máy chủ (câu trả lời cho câu hỏi người dùng gửi, bài hướng dẫn AI viết đã được duyệt)
 * sang câu hỏi thường gặp của "Hỏi Thành Tâm". Hàm thuần, có kiểm thử. Thiếu dữ liệu → null.
 */
const strs = (v: unknown, n: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, n) : [];

export function cloudItemToFaq(it: CloudItem): Faq | null {
  const b = it.body ?? {};
  const summary = typeof b.summary === 'string' ? b.summary.trim() : '';
  if (!it.id || !it.title || summary.length < 10) return null;
  const q = (typeof b.question === 'string' && b.question.trim()) || it.title;
  const alt = strs(b.alt, 8);
  const sections = Array.isArray(b.sections)
    ? (b.sections as { heading?: unknown; text?: unknown }[])
        .filter((s) => typeof s?.text === 'string' && s.text.trim())
        .slice(0, 4)
        .map((s) => (typeof s.heading === 'string' && s.heading ? `${s.heading}: ${s.text}` : String(s.text)))
    : [];
  return {
    id: `c-${it.id}`,
    q,
    alt: it.kind === 'faq' ? alt : [it.title, ...alt],
    kw: fold([q, ...alt, it.topic, ...it.tags].join(' ')).replace(/[^a-z0-9\s]/g, ' '),
    a: [summary, ...sections, ...strs(b.notes, 3)],
    links: [],
  };
}

export function cloudFaqs(items: CloudItem[]): Faq[] {
  const out: Faq[] = [];
  for (const it of items) {
    const f = cloudItemToFaq(it);
    if (f) out.push(f);
  }
  return out;
}
