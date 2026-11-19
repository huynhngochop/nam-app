/**
 * Kho mẹo có sẵn trên máy (chạy không cần mạng). Nội dung viết ở `./tipdata/<danh mục>.ts` dạng văn bản gọn,
 * đọc một lần khi mở app — thêm mẹo chỉ cần thêm vài dòng, không sửa code. Cú pháp: xem `parseTips`.
 * Mẹo có hóa chất tẩy rửa, điện, gas, độ cao phải có dòng an toàn `+` (kiểm tra ở `validateTips`).
 */
import { fold } from '@nam/core';
import kitchen from './tipdata/kitchen';
import home from './tipdata/home';
import laundry from './tipdata/laundry';
import plants from './tipdata/plants';
import saving from './tipdata/saving';
import repair from './tipdata/repair';
import devices from './tipdata/devices';
import safety from './tipdata/safety';
import pets from './tipdata/pets';

export type CategoryId =
  'kitchen' | 'home' | 'laundry' | 'plants' | 'saving' | 'repair' | 'devices' | 'safety' | 'pets';
export type Tip = {
  id: string;
  title: string;
  summary: string;
  categoryId: CategoryId;
  sub?: string;
  minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Thứ tự biên tập (nhỏ = cơ bản, hay dùng); mẹo người dùng viết lấy theo thời gian tạo. */
  order: number;
  /** Đánh giá thật từ máy chủ — chưa có thì không hiện sao. */
  rating?: number;
  ratingCount?: number;
  steps: string[];
  caution?: string;
  safety?: string[];
  /** Từ khóa thêm, đã bỏ dấu. */
  keywords: string;
  childSafe?: boolean;
};

export const CATEGORIES: {
  id: CategoryId;
  name: string;
  icon: 'coffee' | 'home' | 'feather' | 'wind' | 'dollar-sign' | 'tool' | 'smartphone' | 'shield' | 'heart';
  subs: string[];
}[] = [
  { id: 'kitchen', name: 'Bếp', icon: 'coffee', subs: ['Dầu mỡ', 'Khử mùi', 'Bảo quản', 'Nấu nướng', 'Dụng cụ'] },
  {
    id: 'home',
    name: 'Nhà cửa',
    icon: 'home',
    subs: ['Lau dọn', 'Nồm ẩm', 'Nhà tắm', 'Côn trùng', 'Mùi hôi', 'Sắp xếp'],
  },
  {
    id: 'laundry',
    name: 'Giặt ủi',
    icon: 'wind',
    subs: ['Vết bẩn', 'Đồ trắng', 'Phơi', 'Ủi & cất', 'Giày dép', 'Chăn gối'],
  },
  { id: 'plants', name: 'Cây xanh', icon: 'feather', subs: ['Trong nhà', 'Ban công', 'Sâu bệnh', 'Rau tại nhà'] },
  { id: 'saving', name: 'Tiết kiệm', icon: 'dollar-sign', subs: ['Điện', 'Nước', 'Gas', 'Đi chợ', 'Chi tiêu'] },
  { id: 'repair', name: 'Sửa chữa nhỏ', icon: 'tool', subs: ['Cửa', 'Ống nước', 'Điện', 'Tường & sàn', 'Đồ gỗ'] },
  {
    id: 'devices',
    name: 'Đồ dùng & xe',
    icon: 'smartphone',
    subs: ['Điện thoại & máy tính', 'Đồ điện gia dụng', 'Xe máy & xe đạp'],
  },
  { id: 'safety', name: 'An toàn', icon: 'shield', subs: ['Trẻ nhỏ', 'Cháy nổ & gas', 'Mưa bão', 'Người già'] },
  { id: 'pets', name: 'Thú cưng', icon: 'heart', subs: ['Chó mèo', 'Vệ sinh', 'Cá & chim'] },
];

export const DIFF_LABEL = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' } as const;

/** Dòng phụ dưới tên mẹo: thời gian · độ khó (· sao khi đã có đánh giá thật). */
export function tipMeta(t: Tip): string {
  const base = `${t.minutes} phút · ${DIFF_LABEL[t.difficulty]}`;
  return t.ratingCount && t.rating ? `${base} · ${t.rating.toFixed(1).replace('.', ',')} ★` : base;
}

/**
 * Cú pháp kho mẹo (mỗi mẹo cách nhau bằng dòng trống):
 *   # Nhóm con                       → các mẹo bên dưới thuộc nhóm này (phải có trong CATEGORIES.subs)
 *   Tên mẹo | Tóm tắt | 5 e [child] [id=t1]   → phút, độ khó e/m/h, child = an toàn khi có trẻ nhỏ
 *   - Bước làm                       (2–6 bước)
 *   ! Lưu ý (một dòng)
 *   + Cảnh báo an toàn (mỗi dòng một ý)
 *   ~ từ khóa thêm để tìm (tên gọi khác, vùng miền)
 * Id mặc định lấy từ tên mẹo bỏ dấu — đừng đổi tên mẹo đã phát hành nếu không giữ lại id cũ bằng id=…
 */
export function parseTips(categoryId: CategoryId, src: string, start = 0): Tip[] {
  const out: Tip[] = [];
  let sub: string | undefined;
  let cur: Tip | null = null;
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line) {
      cur = null;
      continue;
    }
    const mark = line[0];
    const rest = line.slice(1).trim();
    if (mark === '#') sub = rest;
    else if (cur && mark === '-') cur.steps.push(rest);
    else if (cur && mark === '!') cur.caution = rest;
    else if (cur && mark === '+') (cur.safety ??= []).push(rest);
    else if (cur && mark === '~') cur.keywords = `${cur.keywords} ${fold(rest)}`.trim();
    else {
      const [title, summary, meta = ''] = line.split('|').map((s) => s.trim());
      const tokens = meta.split(/\s+/);
      const difficultyCode = tokens[1];
      const id = tokens.find((x) => x.startsWith('id='))?.slice(3);
      cur = {
        id: id ?? slug(title),
        title,
        summary: summary ?? '',
        categoryId,
        sub,
        minutes: Number(tokens[0]) || 5,
        difficulty: difficultyCode === 'h' ? 'hard' : difficultyCode === 'm' ? 'medium' : 'easy',
        order: start + out.length,
        steps: [],
        keywords: '',
        childSafe: tokens.includes('child') || undefined,
      };
      out.push(cur);
    }
  }
  return out;
}

function slug(s: string): string {
  return fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

const SOURCES: [CategoryId, string][] = [
  ['kitchen', kitchen],
  ['home', home],
  ['laundry', laundry],
  ['plants', plants],
  ['saving', saving],
  ['repair', repair],
  ['devices', devices],
  ['safety', safety],
  ['pets', pets],
];

export const TIPS: Tip[] = SOURCES.flatMap(([id, src], i) => parseTips(id, src, i * 10000));

/** Phát hiện mẹo đụng tới hóa chất, gas, điện, độ cao mà thiếu cảnh báo — dùng trong kiểm thử. */
const RISKY =
  /\b(javel|thuoc tay|clo|axit|acid|xut|amoniac|thong cong|thuoc diet|thuoc tru sau|ro gas|binh gas|van gas|leo thang|cai thang|cau dao|o cam|day dien|phich dien|bong den)\b/;
export function validateTips(list: Tip[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const tip of list) {
    const where = `${tip.categoryId}/${tip.id}`;
    if (ids.has(tip.id)) errs.push(`${where}: trùng id`);
    ids.add(tip.id);
    const cat = CATEGORIES.find((c) => c.id === tip.categoryId);
    if (!tip.sub || !cat?.subs.includes(tip.sub)) errs.push(`${where}: nhóm con "${tip.sub}" không có trong danh mục`);
    if (!tip.summary) errs.push(`${where}: thiếu tóm tắt`);
    if (tip.steps.length < 2 || tip.steps.length > 6) errs.push(`${where}: cần 2–6 bước (đang ${tip.steps.length})`);
    if (tip.title.length > 60) errs.push(`${where}: tên dài quá 60 ký tự`);
    const text = fold(`${tip.title} ${tip.summary} ${tip.steps.join(' ')}`);
    if (RISKY.test(text) && !tip.safety?.length)
      errs.push(`${where}: đụng hóa chất/gas/điện/độ cao mà thiếu dòng an toàn +`);
  }
  return errs;
}

/** Mẹo người dùng tự viết (Gửi mẹo của bạn) — store đăng ký khi mở app / khi thêm. */
let userTips: Tip[] = [];
export function registerUserTips(list: Tip[]) {
  // Mẹo lưu từ bản cũ chưa có `order`: xếp sau cùng như mẹo mới viết.
  userTips = list.map((t) => (typeof t.order === 'number' ? t : { ...t, order: Date.now() }));
}
const byId = new Map(TIPS.map((t) => [t.id, t]));
export function tipById(id: string) {
  return byId.get(id) ?? userTips.find((t) => t.id === id);
}
export function categoryOf(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
