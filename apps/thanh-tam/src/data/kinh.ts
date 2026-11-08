import type { KinhPara } from './types';
import { KINH_TEXT } from './kinhText';

export type KinhId =
  | 'tan-lu-huong'
  | 'khai-kinh'
  | 'bat-nha'
  | 'dai-bi'
  | 'a-di-da'
  | 'pho-mon'
  | 'vu-lan'
  | 'tan-phat'
  | 'tam-quy-y'
  | 'hoi-huong'
  | 'vang-sanh'
  | 'niem-a-di-da'
  | 'niem-quan-am';

export type Kinh = {
  id: KinhId;
  title: string;
  kind: 'kinh' | 'chu' | 'ke' | 'niem';
  /** Một dòng nói bài này là gì, tụng khi nào. */
  about: string;
  paras: KinhPara[];
};

const ABOUT: Record<KinhId, string> = {
  'tan-lu-huong': 'Bài dâng hương mở đầu buổi tụng.',
  'khai-kinh': 'Kệ mở kinh, đọc trước khi vào bài kinh chính.',
  'bat-nha': 'Bài kinh ngắn nhất, tụng trong hầu hết các buổi lễ.',
  'dai-bi': 'Thần chú của Bồ Tát Quán Thế Âm, tụng để cầu an, giữ tâm an.',
  'a-di-da': 'Kinh tả cõi Cực Lạc, thường tụng cầu siêu cho người đã mất.',
  'pho-mon': 'Phẩm kinh về hạnh cứu khổ của Bồ Tát Quán Thế Âm, tụng cầu an.',
  'vu-lan': 'Kinh kể chuyện Mục Kiền Liên cứu mẹ, tụng dịp Rằm tháng Bảy.',
  'tan-phat': 'Kệ khen ngợi Đức Phật A Di Đà, kèm các danh hiệu Phật, Bồ Tát.',
  'tam-quy-y': 'Ba lời quy y Phật, Pháp, Tăng, đọc cuối buổi tụng.',
  'hoi-huong': 'Hồi hướng công đức buổi tụng cho mọi người, mọi loài.',
  'vang-sanh': 'Thần chú giúp người đã mất được siêu sinh, thường đọc 3 lần.',
  'niem-a-di-da': 'Niệm danh hiệu Phật A Di Đà, dùng trong lễ cầu siêu.',
  'niem-quan-am': 'Niệm danh hiệu Bồ Tát Quán Thế Âm, dùng trong lễ cầu an.',
};

/** Bài không có trong kho nguồn: Vãng sanh (đối chiếu niemphat.vn) và các câu niệm danh hiệu. */
const EXTRA: Record<
  'vang-sanh' | 'niem-a-di-da' | 'niem-quan-am',
  { title: string; kind: Kinh['kind']; paras: KinhPara[] }
> = {
  'vang-sanh': {
    title: 'Chú Vãng Sanh',
    kind: 'chu',
    paras: [
      {
        l: [
          'Nam mô a di đa bà dạ. Đa tha dà đa dạ. Đa địa dạ tha.',
          'A di rị đô bà tỳ. A di rị đa tất đam bà tỳ.',
          'A di rị đa tỳ ca lan đế. A di rị đa tỳ ca lan đa.',
          'Dà di nị dà dà na. Chỉ đa ca lệ ta bà ha.',
        ],
        m: 1,
      },
    ],
  },
  'niem-a-di-da': { title: 'Niệm Phật A Di Đà', kind: 'niem', paras: [{ l: ['Nam mô A Di Đà Phật'] }] },
  'niem-quan-am': {
    title: 'Niệm Quán Thế Âm',
    kind: 'niem',
    paras: [{ l: ['Nam mô Đại Từ Đại Bi Quán Thế Âm Bồ Tát'] }],
  },
};

export const KINH: Kinh[] = (Object.keys(ABOUT) as KinhId[]).map((id) => {
  const t = id in EXTRA ? EXTRA[id as keyof typeof EXTRA] : KINH_TEXT[id];
  return { id, title: t.title, kind: t.kind, about: ABOUT[id], paras: t.paras };
});
const BY_ID = new Map(KINH.map((k) => [k.id, k]));
export const kinhById = (id: string): Kinh | undefined => BY_ID.get(id as KinhId);

/** Một bước trong nghi thức: tụng bài `kinh`, lặp `times` lần (mặc định 1). */
export type ChantStep = { kinh: KinhId; times?: number };

export type NghiThucId = 'cau-an' | 'cau-sieu' | 'vu-lan-bao-hieu';
export type NghiThuc = {
  id: NghiThucId;
  title: string;
  about: string;
  short: ChantStep[];
  full: ChantStep[];
};

export const NGHI_THUC: NghiThuc[] = [
  {
    id: 'cau-an',
    title: 'Nghi thức cầu an',
    about: 'Tụng ngày rằm, mùng một, đầu năm, về nhà mới, khai trương, đầy tháng: cầu cho cả nhà bình an.',
    short: [
      { kinh: 'tan-lu-huong' },
      { kinh: 'khai-kinh' },
      { kinh: 'dai-bi' },
      { kinh: 'bat-nha' },
      { kinh: 'niem-quan-am', times: 10 },
      { kinh: 'hoi-huong' },
      { kinh: 'tam-quy-y' },
    ],
    full: [
      { kinh: 'tan-lu-huong' },
      { kinh: 'khai-kinh' },
      { kinh: 'dai-bi', times: 3 },
      { kinh: 'pho-mon' },
      { kinh: 'bat-nha' },
      { kinh: 'niem-quan-am', times: 108 },
      { kinh: 'hoi-huong' },
      { kinh: 'tam-quy-y' },
    ],
  },
  {
    id: 'cau-sieu',
    title: 'Nghi thức cầu siêu',
    about: 'Tụng ngày giỗ, Thanh minh: hồi hướng cho ông bà, cha mẹ, người thân đã khuất.',
    short: [
      { kinh: 'tan-lu-huong' },
      { kinh: 'khai-kinh' },
      { kinh: 'bat-nha' },
      { kinh: 'vang-sanh', times: 3 },
      { kinh: 'niem-a-di-da', times: 10 },
      { kinh: 'hoi-huong' },
      { kinh: 'tam-quy-y' },
    ],
    full: [
      { kinh: 'tan-lu-huong' },
      { kinh: 'khai-kinh' },
      { kinh: 'dai-bi' },
      { kinh: 'a-di-da' },
      { kinh: 'vang-sanh', times: 3 },
      { kinh: 'bat-nha' },
      { kinh: 'tan-phat' },
      { kinh: 'niem-a-di-da', times: 108 },
      { kinh: 'hoi-huong' },
      { kinh: 'tam-quy-y' },
    ],
  },
  {
    id: 'vu-lan-bao-hieu',
    title: 'Nghi thức Vu Lan',
    about: 'Tụng dịp Rằm tháng Bảy: báo hiếu cha mẹ hiện tiền và hồi hướng cho tổ tiên.',
    short: [
      { kinh: 'tan-lu-huong' },
      { kinh: 'khai-kinh' },
      { kinh: 'vu-lan' },
      { kinh: 'bat-nha' },
      { kinh: 'niem-a-di-da', times: 10 },
      { kinh: 'hoi-huong' },
    ],
    full: [
      { kinh: 'tan-lu-huong' },
      { kinh: 'khai-kinh' },
      { kinh: 'dai-bi' },
      { kinh: 'vu-lan' },
      { kinh: 'vang-sanh', times: 3 },
      { kinh: 'bat-nha' },
      { kinh: 'tan-phat' },
      { kinh: 'niem-a-di-da', times: 108 },
      { kinh: 'hoi-huong' },
      { kinh: 'tam-quy-y' },
    ],
  },
];
export const nghiThucById = (id: string) => NGHI_THUC.find((n) => n.id === id);

/** Lễ nào tụng nghi thức nào. Lễ không có trong bảng (Thần Tài, ông Công ông Táo) thường chỉ khấn, không tụng. */
export const RITUAL_CHANT: Record<string, NghiThucId> = {
  'mung-1-ram': 'cau-an',
  'ram-thang-gieng': 'cau-an',
  'ram-thang-muoi': 'cau-an',
  'giao-thua': 'cau-an',
  'an-vi-bat-huong': 'cau-an',
  'nhap-trach': 'cau-an',
  'khai-truong': 'cau-an',
  'day-thang': 'cau-an',
  'gio-thuong': 'cau-sieu',
  'thanh-minh': 'cau-sieu',
  'vu-lan': 'vu-lan-bao-hieu',
};
export const NO_CHANT_NOTE =
  'Lễ này theo tín ngưỡng dân gian, thường chỉ thắp hương và đọc văn khấn, không cần tụng kinh. Nếu muốn, có thể tụng Bát Nhã Tâm Kinh trong Thư viện kinh.';

/** Một dòng tụng, kèm bước và lần lặp. Dùng cho màn tụng: đi tuần tự từng dòng theo nhịp mõ. */
export type ChantLine = {
  step: number;
  kinh: KinhId;
  /** Số lần tụng bài này. */
  times: number;
  para: number;
  text: string;
  syl: number;
  mantra: boolean;
};

export const syllables = (s: string) => s.split(/[\s\-–]+/).filter((w) => /\p{L}/u.test(w)).length;

/** Trải nghi thức ra thành dòng. Bài lặp nhiều lần chỉ trải dòng một lần, kèm `times` để màn tụng đếm. */
export function chantLines(steps: ChantStep[]): ChantLine[] {
  const out: ChantLine[] = [];
  steps.forEach((s, step) => {
    const k = kinhById(s.kinh);
    if (!k) return;
    k.paras.forEach((p, para) =>
      p.l.forEach((text) =>
        out.push({ step, kinh: k.id, times: s.times ?? 1, para, text, syl: syllables(text), mantra: !!p.m }),
      ),
    );
  });
  return out;
}

/** Số tiếng mõ (một tiếng một chữ) của cả nghi thức, đã tính lần lặp. */
export function totalBeats(steps: ChantStep[]): number {
  let n = 0;
  for (const s of steps) {
    const k = kinhById(s.kinh);
    if (!k) continue;
    const per = k.paras.reduce((a, p) => a + p.l.reduce((b, l) => b + syllables(l), 0), 0);
    n += per * (s.times ?? 1);
  }
  return n;
}

/** Ước lượng số phút ở nhịp `bpm` (tiếng mõ mỗi phút), cộng 6 giây chuông mỗi bước. */
export const chantMinutes = (steps: ChantStep[], bpm: number) =>
  Math.max(1, Math.round(totalBeats(steps) / bpm + (steps.length * 6) / 60));

/** Nghe chư Tăng tụng: mở tìm kiếm trên YouTube (kênh chùa, giáo hội), app không lưu bản ghi của ai. */
export const listenUrl = (title: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} chư Tăng tụng`)}`;

export const BPM_MIN = 60;
export const BPM_MAX = 200;
export const BPM_DEFAULT = 120;

/** Bài tụng của một mục: nghi thức (bản gọn hoặc đầy đủ) hoặc một bài kinh lẻ. */
export function chantPlan(id: string, full: boolean): { title: string; steps: ChantStep[]; single: boolean } | null {
  const n = nghiThucById(id);
  if (n) return { title: n.title, steps: full ? n.full : n.short, single: false };
  const k = kinhById(id);
  if (k)
    return {
      title: k.title,
      steps: [{ kinh: k.id, times: k.kind === 'niem' ? 108 : k.id === 'vang-sanh' ? 3 : 1 }],
      single: true,
    };
  return null;
}
