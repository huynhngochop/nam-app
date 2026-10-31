/**
 * Tuổi & năm theo lịch dân gian — hàm thuần, có test vector (tests/thanh-tam.test.ts).
 * Nguồn và cách kiểm: Nội dung · Tuổi & năm, Review Thành Tâm (bộ thiết kế Năm App).
 */
import { CHI, canChiYear, chiOfYear, solarToLunar } from '../calendar/lunar';

export type Sex = 'nam' | 'nu';
export type Hanh = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';

/** Năm âm của ngày sinh dương (sinh trước Tết thuộc năm âm trước). */
export const birthLunarYear = (d: Date) => solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear()).year;
export const tuoiMu = (birthLunarYr: number, year: number) => year - birthLunarYr + 1;

const NAP_AM = [
  'Hải Trung Kim',
  'Lư Trung Hỏa',
  'Đại Lâm Mộc',
  'Lộ Bàng Thổ',
  'Kiếm Phong Kim',
  'Sơn Đầu Hỏa',
  'Giản Hạ Thủy',
  'Thành Đầu Thổ',
  'Bạch Lạp Kim',
  'Dương Liễu Mộc',
  'Tuyền Trung Thủy',
  'Ốc Thượng Thổ',
  'Tích Lịch Hỏa',
  'Tùng Bách Mộc',
  'Trường Lưu Thủy',
  'Sa Trung Kim',
  'Sơn Hạ Hỏa',
  'Bình Địa Mộc',
  'Bích Thượng Thổ',
  'Kim Bạch Kim',
  'Phú Đăng Hỏa',
  'Thiên Hà Thủy',
  'Đại Trạch Thổ',
  'Thoa Xuyến Kim',
  'Tang Đố Mộc',
  'Đại Khê Thủy',
  'Sa Trung Thổ',
  'Thiên Thượng Hỏa',
  'Thạch Lựu Mộc',
  'Đại Hải Thủy',
];
const mod = (a: number, n: number) => ((a % n) + n) % n;
export const napAm = (y: number) => NAP_AM[Math.floor(mod(y - 1984, 60) / 2)];
export const hanhOf = (y: number) => napAm(y).split(' ').pop() as Hanh;

export const SAO_NAM = [
  'La Hầu',
  'Thổ Tú',
  'Thủy Diệu',
  'Thái Bạch',
  'Thái Dương',
  'Vân Hớn',
  'Kế Đô',
  'Thái Âm',
  'Mộc Đức',
];
export const SAO_NU = [
  'Kế Đô',
  'Vân Hớn',
  'Mộc Đức',
  'Thái Âm',
  'Thổ Tú',
  'La Hầu',
  'Thái Dương',
  'Thái Bạch',
  'Thủy Diệu',
];
/** Sao chiếu mệnh theo tuổi mụ (từ 10 tuổi). */
export function saoChieuMenh(age: number, sex: Sex): string | null {
  if (age < 10) return null;
  return (sex === 'nam' ? SAO_NAM : SAO_NU)[(age - 10) % 9];
}

/** Bảng vận hạn theo tuổi mụ 11–98 — 3 nguồn độc lập khớp hoàn toàn (tuvisonlong.com, download.vn, ngaydep.com). */
const VAN_HAN_NAM: Record<string, number[]> = {
  'Huỳnh Tuyền': [18, 27, 36, 45, 54, 63, 72, 81, 89, 90, 98],
  'Tam Kheo': [11, 19, 20, 28, 37, 46, 55, 64, 73, 82, 91],
  'Ngũ Mộ': [12, 21, 29, 30, 38, 47, 56, 65, 74, 83, 92],
  'Thiên Tinh': [13, 22, 31, 39, 40, 48, 57, 66, 75, 84, 93],
  'Toán Tận': [14, 23, 32, 41, 49, 50, 58, 67, 76, 85, 94],
  'Thiên La': [15, 24, 33, 42, 51, 59, 60, 68, 77, 86, 95],
  'Địa Võng': [16, 25, 34, 43, 52, 61, 69, 70, 78, 87, 96],
  'Diêm Vương': [17, 26, 35, 44, 53, 62, 71, 79, 80, 88, 97],
};
const VAN_HAN_NU: Record<string, number[]> = {
  'Huỳnh Tuyền': [14, 23, 32, 41, 49, 50, 58, 67, 76, 85, 94],
  'Tam Kheo': [13, 22, 31, 39, 40, 48, 57, 66, 75, 84, 93],
  'Ngũ Mộ': [12, 21, 29, 30, 38, 47, 56, 65, 74, 83, 92],
  'Thiên Tinh': [11, 19, 20, 28, 37, 46, 55, 64, 73, 82, 91],
  'Toán Tận': [18, 27, 36, 45, 54, 63, 72, 81, 89, 90, 98],
  'Thiên La': [17, 26, 35, 44, 53, 62, 71, 79, 80, 88, 97],
  'Địa Võng': [16, 25, 34, 43, 52, 61, 69, 70, 78, 87, 96],
  'Diêm Vương': [15, 24, 33, 42, 51, 59, 60, 68, 77, 86, 95],
};
const invert = (t: Record<string, number[]>) => {
  const m = new Map<number, string>();
  for (const [h, ages] of Object.entries(t)) for (const a of ages) m.set(a, h);
  return m;
};
const VH_NAM = invert(VAN_HAN_NAM),
  VH_NU = invert(VAN_HAN_NU);
/** Vận hạn theo tuổi mụ; null ngoài 11–98 (màn ẩn khối Vận hạn). */
export const vanHan = (age: number, sex: Sex): string | null => (sex === 'nam' ? VH_NAM : VH_NU).get(age) ?? null;

const TAM_TAI: [string[], string[]][] = [
  [
    ['Thân', 'Tý', 'Thìn'],
    ['Dần', 'Mão', 'Thìn'],
  ],
  [
    ['Dần', 'Ngọ', 'Tuất'],
    ['Thân', 'Dậu', 'Tuất'],
  ],
  [
    ['Hợi', 'Mão', 'Mùi'],
    ['Tỵ', 'Ngọ', 'Mùi'],
  ],
  [
    ['Tỵ', 'Dậu', 'Sửu'],
    ['Hợi', 'Tý', 'Sửu'],
  ],
];
/** 0 = không; 1–3 = năm thứ mấy của tam tai. */
export function tamTai(birthYr: number, year: number): 0 | 1 | 2 | 3 {
  const a = chiOfYear(birthYr),
    b = chiOfYear(year);
  for (const [g, ys] of TAM_TAI) if (g.includes(a)) return (ys.indexOf(b) + 1) as 0 | 1 | 2 | 3;
  return 0;
}
/** Tam tai là 3 năm nào (chi). */
export const tamTaiYears = (birthYr: number) => TAM_TAI.find(([g]) => g.includes(chiOfYear(birthYr)))![1];

const LUC_XUNG = [
  ['Tý', 'Ngọ'],
  ['Sửu', 'Mùi'],
  ['Dần', 'Thân'],
  ['Mão', 'Dậu'],
  ['Thìn', 'Tuất'],
  ['Tỵ', 'Hợi'],
];
const TAM_HOP = [
  ['Thân', 'Tý', 'Thìn'],
  ['Dần', 'Ngọ', 'Tuất'],
  ['Hợi', 'Mão', 'Mùi'],
  ['Tỵ', 'Dậu', 'Sửu'],
];
const LUC_HOP = [
  ['Tý', 'Sửu'],
  ['Dần', 'Hợi'],
  ['Mão', 'Tuất'],
  ['Thìn', 'Dậu'],
  ['Tỵ', 'Thân'],
  ['Ngọ', 'Mùi'],
];
const pairIn = (list: string[][], a: string, b: string) => list.some((p) => p.includes(a) && p.includes(b) && a !== b);
export type ThaiTue = 'nam-tuoi' | 'xung' | null;
export function thaiTue(birthYr: number, year: number): ThaiTue {
  const a = chiOfYear(birthYr),
    b = chiOfYear(year);
  if (a === b) return 'nam-tuoi';
  return pairIn(LUC_XUNG, a, b) ? 'xung' : null;
}
export const tamHop = (birthYr: number, year: number) => pairIn(TAM_HOP, chiOfYear(birthYr), chiOfYear(year));
export const lucHop = (birthYr: number, year: number) => pairIn(LUC_HOP, chiOfYear(birthYr), chiOfYear(year));

export type KimLau = 'than' | 'the' | 'tu' | 'luc-suc';
const KIM_LAU: Record<number, KimLau> = { 1: 'than', 3: 'the', 6: 'tu', 8: 'luc-suc' };
export const KIM_LAU_LABEL: Record<KimLau, string> = {
  than: 'Kim lâu thân',
  the: 'Kim lâu thê',
  tu: 'Kim lâu tử',
  'luc-suc': 'Kim lâu lục súc',
};
export const kimLau = (age: number): KimLau | null => KIM_LAU[age % 9] ?? null;

export const HOANG_OC = ['Nhất Cát', 'Nhì Nghi', 'Tam Địa Sát', 'Tứ Tấn Tài', 'Ngũ Thọ Tử', 'Lục Hoang Ốc'];
export const HOANG_OC_CAN_THAN = new Set(['Tam Địa Sát', 'Ngũ Thọ Tử', 'Lục Hoang Ốc']);
export const hoangOc = (age: number) => HOANG_OC[mod(Math.floor(age / 10) - 1 + (age % 10), 6)];

export type Cung = 'Khảm' | 'Khôn' | 'Chấn' | 'Tốn' | 'Càn' | 'Đoài' | 'Cấn' | 'Ly';
const CUNG_BY_NUM: Record<number, Cung> = {
  1: 'Khảm',
  2: 'Khôn',
  3: 'Chấn',
  4: 'Tốn',
  6: 'Càn',
  7: 'Đoài',
  8: 'Cấn',
  9: 'Ly',
};
/** Cung phi Bát trạch theo năm âm sinh. */
export function cungPhi(birthYr: number, sex: Sex): Cung {
  const yy = birthYr % 100;
  let n = sex === 'nam' ? mod(birthYr < 2000 ? 100 - yy : 99 - yy, 9) : mod(birthYr < 2000 ? yy - 4 : yy + 6, 9);
  if (n === 0) n = 9;
  if (n === 5) n = sex === 'nam' ? 2 : 8;
  return CUNG_BY_NUM[n];
}
/** Hướng theo Bát trạch: 4 hướng thuận (Sinh khí, Thiên y, Diên niên, Phục vị) và 4 hướng nên tránh. */
export const BAT_TRACH: Record<
  Cung,
  { good: [string, string, string, string]; avoid: [string, string, string, string] }
> = {
  Khảm: { good: ['Đông Nam', 'Đông', 'Nam', 'Bắc'], avoid: ['Tây Nam', 'Đông Bắc', 'Tây Bắc', 'Tây'] },
  Ly: { good: ['Đông', 'Đông Nam', 'Bắc', 'Nam'], avoid: ['Tây Bắc', 'Tây', 'Tây Nam', 'Đông Bắc'] },
  Chấn: { good: ['Nam', 'Bắc', 'Đông Nam', 'Đông'], avoid: ['Tây', 'Tây Bắc', 'Đông Bắc', 'Tây Nam'] },
  Tốn: { good: ['Bắc', 'Nam', 'Đông', 'Đông Nam'], avoid: ['Đông Bắc', 'Tây Nam', 'Tây', 'Tây Bắc'] },
  Càn: { good: ['Tây', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'], avoid: ['Nam', 'Đông', 'Bắc', 'Đông Nam'] },
  Khôn: { good: ['Đông Bắc', 'Tây', 'Tây Bắc', 'Tây Nam'], avoid: ['Bắc', 'Đông Nam', 'Nam', 'Đông'] },
  Cấn: { good: ['Tây Nam', 'Tây Bắc', 'Tây', 'Đông Bắc'], avoid: ['Đông Nam', 'Bắc', 'Đông', 'Nam'] },
  Đoài: { good: ['Tây Bắc', 'Tây Nam', 'Đông Bắc', 'Tây'], avoid: ['Đông', 'Nam', 'Đông Nam', 'Bắc'] },
};
export const GOOD_DIRECTION_MEANING = [
  'Sinh khí · công việc',
  'Thiên y · sức khỏe',
  'Diên niên · gia đạo',
  'Phục vị · bình yên',
];

export const COLORS: Record<Hanh, { hop: string[]; ky: string[] }> = {
  Kim: { hop: ['trắng, xám, ghi', 'vàng, nâu đất'], ky: ['đỏ, hồng, tím'] },
  Mộc: { hop: ['xanh lá', 'đen, xanh dương'], ky: ['trắng, xám'] },
  Thủy: { hop: ['đen, xanh dương', 'trắng, xám'], ky: ['vàng, nâu đất'] },
  Hỏa: { hop: ['đỏ, hồng, tím', 'xanh lá'], ky: ['đen, xanh dương'] },
  Thổ: { hop: ['vàng, nâu đất', 'đỏ, hồng, tím'], ky: ['xanh lá'] },
};
export const SWATCH: Record<string, string> = {
  'trắng, xám, ghi': '#e9e6e1',
  'trắng, xám': '#e9e6e1',
  'vàng, nâu đất': '#b8862b',
  'đỏ, hồng, tím': '#b8423a',
  'xanh lá': '#3f7d3a',
  'đen, xanh dương': '#24344f',
};

export type AgeYear = {
  canChi: string;
  chi: string;
  napAm: string;
  hanh: Hanh;
  cung: Cung;
  tuoiMu: number;
  sao: string | null;
  vanHan: string | null;
  tamTai: 0 | 1 | 2 | 3;
  thaiTue: ThaiTue;
  tamHop: boolean;
  lucHop: boolean;
  kimLau: KimLau | null;
  hoangOc: string;
  colors: { hop: string[]; ky: string[] };
};
export function ageYear(birthLunarYr: number, sex: Sex, year: number): AgeYear {
  const a = tuoiMu(birthLunarYr, year);
  const h = hanhOf(birthLunarYr);
  return {
    canChi: canChiYear(birthLunarYr),
    chi: chiOfYear(birthLunarYr),
    napAm: napAm(birthLunarYr),
    hanh: h,
    cung: cungPhi(birthLunarYr, sex),
    tuoiMu: a,
    sao: saoChieuMenh(a, sex),
    vanHan: vanHan(a, sex),
    tamTai: tamTai(birthLunarYr, year),
    thaiTue: thaiTue(birthLunarYr, year),
    tamHop: tamHop(birthLunarYr, year),
    lucHop: lucHop(birthLunarYr, year),
    kimLau: kimLau(a),
    hoangOc: hoangOc(a),
    colors: COLORS[h],
  };
}
export { CHI };
