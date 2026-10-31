/**
 * Âm lịch lúc chạy: tra bảng tính sẵn (lunarData.ts), không dùng số thực → kết quả giống nhau trên mọi máy.
 * Phạm vi: Tết 1900 (31/1/1900) → hết năm 2100.
 */
import { FIRST_LUNAR_YEAR, FIRST_MONTH_JD, LEAP_MONTHS, MONTH_BITS, MONTH_COUNT, THANH_MINH } from './lunarData';
import { jdFromDate, jdToDate } from './astro';

export { jdFromDate, jdToDate };
export type LunarDate = { day: number; month: number; year: number; leap: boolean };
type MonthRow = { start: number; len: 29 | 30; month: number; year: number; leap: boolean };

let ROWS: MonthRow[] | null = null;
function rows(): MonthRow[] {
  if (ROWS) return ROWS;
  const out: MonthRow[] = [];
  let start = FIRST_MONTH_JD, year = FIRST_LUNAR_YEAR, month = 1, leap = false;
  for (let i = 0; i < MONTH_COUNT; i++) {
    const nib = parseInt(MONTH_BITS[i >> 2], 16);
    const len = (nib >> (3 - (i & 3))) & 1 ? 30 : 29;
    out.push({ start, len, month, year, leap });
    start += len;
    // tháng kế tiếp
    if (!leap && leapOf(year) === month) { leap = true; }
    else {
      leap = false;
      month += 1;
      if (month > 12) { month = 1; year += 1; }
    }
  }
  ROWS = out;
  return out;
}

/** Tháng nhuận của năm âm (0 nếu không có). */
export function leapOf(lunarYear: number): number {
  const i = lunarYear - FIRST_LUNAR_YEAR;
  if (i < 0 || i >= LEAP_MONTHS.length) return 0;
  return parseInt(LEAP_MONTHS[i], 16);
}

export const RANGE = { from: { day: 31, month: 1, year: 1900 }, to: { day: 31, month: 12, year: 2100 } };
export class OutOfRangeError extends Error { constructor() { super('Ngày ngoài phạm vi 1900–2100'); } }

function rowIndexForJd(jd: number): number {
  const r = rows();
  let lo = 0, hi = r.length - 1;
  if (jd < r[0].start || jd >= r[hi].start + r[hi].len) throw new OutOfRangeError();
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (r[mid].start <= jd) lo = mid; else hi = mid - 1;
  }
  return lo;
}

export function solarToLunar(day: number, month: number, year: number): LunarDate {
  const jd = jdFromDate(day, month, year);
  const r = rows()[rowIndexForJd(jd)];
  return { day: jd - r.start + 1, month: r.month, year: r.year, leap: r.leap };
}
export function lunarOf(d: Date): LunarDate { return solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear()); }

function findRow(year: number, month: number, leap: boolean): MonthRow | undefined {
  const r = rows();
  // ước lượng vị trí rồi dò quanh đó
  const guess = Math.max(0, Math.min(r.length - 1, Math.floor((year - FIRST_LUNAR_YEAR) * 12.3685 + month - 1)));
  for (let d = 0; d < 40; d++) {
    for (const i of [guess - d, guess + d]) {
      const x = r[i];
      if (x && x.year === year && x.month === month && x.leap === leap) return x;
    }
  }
  return undefined;
}

/** Số ngày của tháng âm (29/30), hoặc 0 nếu tháng (nhuận) không tồn tại. */
export function lunarMonthLength(year: number, month: number, leap = false): number {
  return findRow(year, month, leap)?.len ?? 0;
}

/** Ngày dương của một ngày âm; null nếu ngày không tồn tại (30 ở tháng thiếu, tháng nhuận không có). */
export function lunarToSolar(day: number, month: number, year: number, leap = false): Date | null {
  const r = findRow(year, month, leap);
  if (!r || day < 1 || day > r.len) return null;
  const d = jdToDate(r.start + day - 1);
  return new Date(d.year, d.month - 1, d.day);
}

/** Ngày dương của mùng 1 Tết năm âm. */
export function tetOf(lunarYear: number): Date { return lunarToSolar(1, 1, lunarYear)!; }

/* ---------------------------------------------------------------- can chi */
export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
export const canChiYear = (y: number) => `${CAN[(y + 6) % 10]} ${CHI[(y + 8) % 12]}`;
export const chiOfYear = (y: number) => CHI[(y + 8) % 12];
export const chiIndexOfYear = (y: number) => (y + 8) % 12;
export function canChiDay(d: Date): string {
  const jd = jdFromDate(d.getDate(), d.getMonth() + 1, d.getFullYear());
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
}
export const chiIndexOfDay = (d: Date) => (jdFromDate(d.getDate(), d.getMonth() + 1, d.getFullYear()) + 1) % 12;
/** Can chi tháng âm (tháng nhuận dùng can chi của tháng thường cùng số). */
export const canChiMonth = (month: number, year: number) => `${CAN[(year * 12 + month + 3) % 10]} ${CHI[(month + 1) % 12]}`;

/* ---------------------------------------------------------------- giờ hoàng đạo */
const HOANG_DAO: number[][] = [
  [0, 1, 3, 6, 8, 9], [2, 3, 5, 8, 10, 11], [0, 1, 4, 5, 7, 10], [0, 2, 3, 6, 7, 9], [2, 4, 5, 8, 9, 11], [1, 4, 6, 7, 10, 11],
];
/** 6 giờ hoàng đạo của ngày, dạng "Sửu 1–3". Giờ Tý = 23–1. */
export function hoangDaoHours(d: Date): { chi: string; from: number; to: number; label: string }[] {
  return HOANG_DAO[chiIndexOfDay(d) % 6].map((i) => {
    const from = (i * 2 + 23) % 24, to = (from + 2) % 24;
    return { chi: CHI[i], from, to, label: `${CHI[i]} ${from}–${to}` };
  });
}

/* ---------------------------------------------------------------- chữ */
export const MONTH_NAMES = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười một', 'Chạp'];
export const monthName = (m: number, leap = false) => `${MONTH_NAMES[m - 1]}${leap ? ' nhuận' : ''}`;
const DIGIT = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const DAY_1_10 = ['Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];
/** Ngày âm bằng chữ theo khuôn văn khấn: "mùng Một", "Rằm", "hai mươi mốt", "ba mươi". */
export function lunarDayWords(d: number): string {
  if (d >= 1 && d <= 10) return `mùng ${DAY_1_10[d - 1]}`;
  if (d === 15) return 'Rằm';
  if (d < 20) return `mười ${d === 15 ? 'lăm' : DIGIT[d - 10]}`;
  const tens = Math.floor(d / 10), unit = d % 10;
  const head = `${DIGIT[tens]} mươi`;
  if (unit === 0) return head;
  const tail = unit === 1 ? 'mốt' : unit === 4 ? 'tư' : unit === 5 ? 'lăm' : DIGIT[unit];
  return `${head} ${tail}`;
}
/** Nhãn ngắn trên màn: "Mùng 1", "Rằm", "12". */
export function lunarDayShort(d: number): string {
  if (d === 15) return 'Rằm';
  if (d <= 10) return `Mùng ${d}`;
  return String(d);
}
/** "12 tháng Mười âm lịch" / "Rằm tháng Giêng" / "mùng 3 tháng 8" */
export function lunarLabel(l: LunarDate, opts: { suffix?: boolean } = {}): string {
  const day = l.day === 15 ? 'Rằm' : l.day <= 10 ? `Mùng ${l.day}` : String(l.day);
  return `${day} tháng ${monthName(l.month, l.leap)}${opts.suffix ? ' âm lịch' : ''}`;
}
/** "12/10 âm" (tháng nhuận: "12/6N âm"). */
export const lunarShort = (l: LunarDate) => `${l.day}/${l.month}${l.leap ? 'N' : ''} âm`;

/* ---------------------------------------------------------------- tiết khí */
/** Ngày Thanh minh (kinh độ mặt trời 15°) của năm dương. */
export function thanhMinhOf(year: number): Date | null {
  const i = year - FIRST_LUNAR_YEAR;
  if (i < 0 || i * 2 >= THANH_MINH.length) return null;
  return new Date(year, 3, parseInt(THANH_MINH.slice(i * 2, i * 2 + 2), 10));
}
