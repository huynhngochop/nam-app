/** Hàm thuần về ngày cho giao diện: quy đổi ô nhập ngày, dựng lưới lịch tháng. Có test. */
import { canChiYear, leapOf, lunarMonthLength, lunarOf, lunarToSolar, monthName, RANGE, type LunarDate } from '../calendar/lunar';

export type DateValue = { calendar: 'duong' | 'am'; day: string; month: string; year: string; leap?: boolean };
export type Resolved = { solar: Date; lunar: LunarDate } | { error: string } | null;

/** Quy đổi ngày người dùng nhập (lịch dương hoặc âm). null = chưa nhập đủ; error = lời thường giải thích vì sao sai. */
export function resolveDate(v: DateValue): Resolved {
  const d = Number(v.day);
  const m = Number(v.month);
  const y = Number(v.year);
  if (!v.day || !v.month || !v.year || v.year.length < 4) return null;
  if (!(y >= RANGE.from.year && y <= RANGE.to.year - 1)) return { error: 'Năm cần trong khoảng 1900–2099.' };
  if (!(m >= 1 && m <= 12)) return { error: 'Tháng từ 1 đến 12.' };
  if (v.calendar === 'duong') {
    const s = new Date(y, m - 1, d);
    if (d < 1 || s.getMonth() !== m - 1) return { error: `Tháng ${m} năm ${y} không có ngày ${d}.` };
    if (y === 1900 && m === 1 && d < 31) return { error: 'Ngày quá sớm, lịch chỉ tính từ 31/1/1900.' };
    return { solar: s, lunar: lunarOf(s) };
  }
  if (v.leap && leapOf(y) !== m) return { error: `Năm ${canChiYear(y)} không có tháng ${m} nhuận.` };
  const len = lunarMonthLength(y, m, !!v.leap);
  if (d < 1 || d > len) return { error: `Tháng ${monthName(m, !!v.leap)} năm ${canChiYear(y)} chỉ có ${len} ngày (âm lịch).` };
  const s = lunarToSolar(d, m, y, !!v.leap);
  return s ? { solar: s, lunar: lunarOf(s) } : { error: 'Ngày này không có trong lịch.' };
}

/** lunar = null khi ô nằm ngoài phạm vi bảng âm lịch (trước 31/1/1900, sau 31/12/2100). */
export type Cell = { date: Date; lunar: LunarDate | null; inMonth: boolean };
const safeLunar = (d: Date) => {
  try {
    return lunarOf(d);
  } catch {
    return null;
  }
};
/** Tháng dương đầu và cuối lịch cho xem (lưới 42 ô vẫn có ô ngoài phạm vi, hiện trống). */
export const CAL_FIRST = { y: 1900, m: 1 };
export const CAL_LAST = { y: 2100, m: 11 };
/** 42 ô (6 tuần) của tháng dương, tuần bắt đầu thứ Hai. */
export function monthCells(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const shift = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, month, 1 - shift + i);
    return { date: d, lunar: safeLunar(d), inMonth: d.getMonth() === month };
  });
}
