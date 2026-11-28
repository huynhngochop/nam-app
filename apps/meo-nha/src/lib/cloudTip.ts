import { fold, type CloudItem } from '@nam/core';
import { CATEGORIES, type CategoryId, type Tip } from '../data/tips';

/**
 * Đổi một mục nội dung từ máy chủ (mẹo AI viết theo chủ đề, hoặc câu trả lời cho câu hỏi người dùng gửi)
 * sang `Tip` của app. Hàm thuần, có kiểm thử. Mục không đủ dữ liệu → null (bỏ qua, không làm hỏng app).
 */
const TOPIC: Record<string, [CategoryId, string]> = {
  'Bếp & nấu ăn': ['kitchen', 'Nấu nướng'],
  'Bảo quản thực phẩm': ['kitchen', 'Bảo quản'],
  'Giặt giũ & quần áo': ['laundry', 'Vết bẩn'],
  'Vệ sinh nhà cửa': ['home', 'Lau dọn'],
  'Đuổi côn trùng & khử mùi': ['home', 'Côn trùng'],
  'Tiết kiệm điện nước': ['saving', 'Điện'],
  'Sửa chữa nhỏ trong nhà': ['repair', 'Cửa'],
  'Cây cảnh & ban công': ['plants', 'Ban công'],
};
const CAT_IDS = new Set(CATEGORIES.map((c) => c.id));

const strs = (v: unknown, n: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, n) : [];

export function cloudItemToTip(it: CloudItem, order = 0): Tip | null {
  const b = it.body ?? {};
  const steps = strs(b.steps, 6);
  const summary = typeof b.summary === 'string' ? b.summary : '';
  if (!it.id || !it.title || steps.length < 2 || !summary) return null;

  const byTopic = TOPIC[it.topic];
  const cat = (
    typeof b.category === 'string' && CAT_IDS.has(b.category as CategoryId) ? b.category : (byTopic?.[0] ?? 'home')
  ) as CategoryId;
  const subs = CATEGORIES.find((c) => c.id === cat)!.subs;
  const sub = byTopic && byTopic[0] === cat ? byTopic[1] : subs[0];

  const question = typeof b.question === 'string' ? b.question : '';
  const alt = strs(b.alt, 8);
  const warnings = strs(b.warnings, 4);
  return {
    id: `c-${it.id}`,
    title: it.title.slice(0, 80),
    summary,
    categoryId: cat,
    sub,
    minutes: Math.min(30, 3 + steps.length * 2),
    difficulty: 'easy',
    order: 90000 + order,
    steps,
    safety: warnings.length ? warnings : undefined,
    keywords: fold([question, ...alt, ...it.tags, ...strs(b.materials, 10)].join(' ')),
  };
}

export function cloudTips(items: CloudItem[]): Tip[] {
  const out: Tip[] = [];
  items.forEach((it, i) => {
    const t = cloudItemToTip(it, i);
    if (t) out.push(t);
  });
  return out;
}
