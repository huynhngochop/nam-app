import { jdFromDate, jdToDate, solarTermDay, solarToLunarAstro } from './astro';

export type LunarTable = {
  firstMonthJd: number;
  firstYear: number;
  monthBits: string;
  monthCount: number;
  leapMonths: string;
  thanhMinh: string;
};

/** Ngày Thanh minh (tháng 4 dương) của từng năm, 2 chữ số mỗi năm. */
export function buildThanhMinh(fromYear = 1900, toYear = 2100): string {
  let s = '';
  for (let y = fromYear; y <= toYear; y++) s += String(solarTermDay(y, 4, 15)).padStart(2, '0');
  return s;
}

/** Dựng bảng: duyệt từng ngày từ Tết 1900 tới hết 2100, ghi độ dài từng tháng âm và tháng nhuận từng năm. */
export function buildLunarTable(fromYear = 1900, toYear = 2100): LunarTable {
  // mùng 1 tháng Giêng năm fromYear
  let jd = jdFromDate(1, 1, fromYear);
  for (;;) {
    const { day, month, year } = jdToDate(jd);
    const l = solarToLunarAstro(day, month, year);
    if (l.day === 1 && l.month === 1 && !l.leap && l.year === fromYear) break;
    jd++;
  }
  const firstMonthJd = jd;
  const lengths: number[] = [];
  const leap: Record<number, number> = {};
  const endJd = jdFromDate(31, 12, toYear);
  let start = jd;
  let cur = solarToLunarAstro(...ymd(jd));
  jd++;
  for (; ; jd++) {
    const l = solarToLunarAstro(...ymd(jd));
    if (l.day === 1) {
      lengths.push(jd - start);
      if (cur.leap) leap[cur.year] = cur.month;
      if (start > endJd) break;
      start = jd;
      cur = l;
    }
  }
  let monthBits = '';
  for (let i = 0; i < lengths.length; i += 4) {
    let v = 0;
    for (let j = 0; j < 4; j++) if (lengths[i + j] === 30) v |= 1 << (3 - j);
    monthBits += v.toString(16);
  }
  let leapMonths = '';
  for (let y = fromYear; y <= toYear + 1; y++) leapMonths += (leap[y] ?? 0).toString(16);
  return {
    firstMonthJd,
    firstYear: fromYear,
    monthBits,
    monthCount: lengths.length,
    leapMonths,
    thanhMinh: buildThanhMinh(fromYear, toYear),
  };
}

function ymd(jd: number): [number, number, number] {
  const d = jdToDate(jd);
  return [d.day, d.month, d.year];
}
