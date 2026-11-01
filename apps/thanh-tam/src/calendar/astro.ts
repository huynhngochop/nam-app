/**
 * Thuật toán thiên văn âm lịch Việt Nam của Hồ Ngọc Đức, múi giờ UTC+7.
 * CHỈ dùng lúc build (scripts/gen-lunar-table.ts) và trong test — app chạy bằng bảng tính sẵn (lunarData.ts).
 *
 * Quy tắc bắt buộc: mọi INT() của thuật toán gốc là Math.floor. Không dùng Math.trunc, `| 0`, `~~`, parseInt:
 * làm tròn về 0 sai với số âm và làm sai mọi ngày trước năm 2000 (Tết 1979, 1985…).
 */
const PI = Math.PI;
const INT = Math.floor;

export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}

export function jdToDate(jd: number): { day: number; month: number; year: number } {
  let a: number, b: number, c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  return {
    day: e - INT((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * INT(m / 10),
    year: b * 100 + d - 4800 + INT(m / 10),
  };
}

function newMoon(k: number): number {
  const T = k / 1236.85,
    T2 = T * T,
    T3 = T2 * T,
    dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}

export const TZ = 7;
const newMoonDay = (k: number, tz = TZ) => INT(newMoon(k) + 0.5 + tz / 24);

/** Kinh độ mặt trời theo cung 30° (0…11) tại đầu ngày jdn. */
function sunLongitudeSector(jdn: number, tz = TZ): number {
  const T = (jdn - 2451545.5 - tz / 24) / 36525,
    T2 = T * T,
    dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - PI * 2 * INT(L / (PI * 2));
  return INT((L / PI) * 6);
}

function lunarMonth11(yy: number, tz = TZ): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = newMoonDay(k, tz);
  if (sunLongitudeSector(nm, tz) >= 9) nm = newMoonDay(k - 1, tz);
  return nm;
}

function leapMonthOffset(a11: number, tz = TZ): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let i = 1;
  let arc = sunLongitudeSector(newMoonDay(k + i, tz), tz);
  let last: number;
  do {
    last = arc;
    i++;
    arc = sunLongitudeSector(newMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

export type LunarDate = { day: number; month: number; year: number; leap: boolean };

export function solarToLunarAstro(dd: number, mm: number, yy: number, tz = TZ): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  let k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = newMoonDay(k, tz);
  // dò lại: ước lượng k có thể lệch một tháng ở vài ngày sát điểm sóc (8/5/2054, 9/4/2062…)
  while (monthStart > dayNumber) {
    k -= 1;
    monthStart = newMoonDay(k, tz);
  }
  while (newMoonDay(k + 1, tz) <= dayNumber && newMoonDay(k + 1, tz) > monthStart) {
    k += 1;
    monthStart = newMoonDay(k, tz);
  }
  let a11 = lunarMonth11(yy, tz);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = lunarMonth11(yy - 1, tz);
  } else {
    lunarYear = yy + 1;
    b11 = lunarMonth11(yy + 1, tz);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let leap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const lo = leapMonthOffset(a11, tz);
    if (diff >= lo) {
      lunarMonth = diff + 10;
      if (diff === lo) leap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}

/** Kinh độ mặt trời (độ, 0–360) tại thời điểm jd (số thực, giờ UT). Công thức rút gọn Meeus chương 25. */
export function sunLongitudeDeg(jd: number): number {
  const T = (jd - 2451545.0) / 36525,
    dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T * T;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T * T;
  const C =
    (1.9146 - 0.004817 * T - 0.000014 * T * T) * Math.sin(dr * M) +
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.00029 * Math.sin(dr * 3 * M);
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(dr * omega);
  return ((lambda % 360) + 360) % 360;
}

/** Ngày trong tháng (giờ Việt Nam) mà kinh độ mặt trời vượt `deg` độ; 0 nếu không có trong tháng. */
export function solarTermDay(year: number, month: number, deg: number, tz = TZ): number {
  for (let d = 1; d <= 31; d++) {
    // jdFromDate là JDN lúc 12:00 UT; cuối ngày d theo giờ Việt Nam = jd + 0.5 − tz/24
    const endOfDay = jdFromDate(d, month, year) + 0.5 - tz / 24;
    const diff = ((sunLongitudeDeg(endOfDay) - deg + 540) % 360) - 180;
    if (diff >= 0) return d;
  }
  return 0;
}
