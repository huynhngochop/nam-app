/** Tính ngày lễ, ngày giỗ, lịch thông báo — hàm thuần, có test. */
import { lunarMonthLength, lunarOf, lunarToSolar, leapOf, thanhMinhOf } from '../calendar/lunar';
import type { LunarRule, Ritual } from '../data/types';

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);

/** Ngày dương (≥ from) gần nhất khớp luật âm lịch, tìm trong `horizon` ngày. */
export function nextByRule(rule: LunarRule, from: Date, horizon = 400): Date | null {
  const start = startOfDay(from);
  if (rule.kind === 'solar-term') {
    for (const y of [start.getFullYear(), start.getFullYear() + 1]) {
      const d = thanhMinhOf(y);
      if (d && d >= start) return d;
    }
    return null;
  }
  for (let i = 0; i < horizon; i++) {
    const d = addDays(start, i);
    const l = lunarOf(d);
    if (rule.kind === 'monthly') {
      // nhắc cả mùng 1, rằm của tháng nhuận (nhiều nhà vẫn cúng)
      if (rule.days.includes(l.day)) return d;
    } else if (rule.kind === 'yearly') {
      // lễ cố định theo tháng chỉ tính ở tháng thường
      if (!l.leap && l.month === rule.month && l.day === rule.day) return d;
    } else if (rule.kind === 'last-day') {
      if (!l.leap && l.month === rule.month && l.day === lunarMonthLength(l.year, l.month, false)) return d;
    }
  }
  return null;
}

export type Upcoming = { kind: 'ritual' | 'gio'; id: string; title: string; date: Date; days: number };

export function upcomingRituals(
  rituals: Ritual[],
  from: Date,
  withinDays: number,
  enabled: (r: Ritual) => boolean = () => true,
): Upcoming[] {
  const out: Upcoming[] = [];
  for (const r of rituals) {
    if (!r.when.rule || !enabled(r)) continue;
    const d = nextByRule(r.when.rule, from, withinDays + 1);
    if (d) out.push({ kind: 'ritual', id: r.id, title: r.title, date: d, days: daysBetween(from, d) });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/* ---------------------------------------------------------------- sổ giỗ */
export type Anniversary = {
  id: string;
  name: string;
  relation: string;
  lunar: { day: number; month: number; leap: boolean };
  missingDayRule: 'ngay-cuoi-thang' | 'hoi-moi-nam';
  remindDays: number[];
  dishes?: string;
  /** Ngày mất dương lịch nếu người dùng nhập (để tính 49 ngày, 100 ngày). */
  deathSolar?: string;
};
export type GioOccurrence = { date: Date; lunarYear: number; missing: boolean; leapShifted: boolean };

/** Ngày giỗ trong năm âm `lunarYear`: tháng nhuận → tháng thường nếu năm đó không nhuận; ngày 30 ở tháng thiếu → ngày 29. */
export function gioInLunarYear(a: Anniversary, lunarYear: number): GioOccurrence | null {
  let { day, month, leap } = a.lunar;
  let leapShifted = false;
  if (leap && leapOf(lunarYear) !== month) {
    leap = false;
    leapShifted = true;
  }
  const len = lunarMonthLength(lunarYear, month, leap);
  if (!len) return null;
  let missing = false;
  if (day > len) {
    missing = true;
    day = len;
  }
  const date = lunarToSolar(day, month, lunarYear, leap);
  return date ? { date, lunarYear, missing, leapShifted } : null;
}

/** Lần giỗ gần nhất từ hôm nay (kể cả hôm nay). */
export function nextGio(a: Anniversary, from: Date): GioOccurrence | null {
  const ly = lunarOf(from).year;
  for (const y of [ly - 1, ly, ly + 1]) {
    const o = gioInLunarYear(a, y);
    if (o && o.date >= startOfDay(from)) return o;
  }
  return null;
}

/** Mốc sau ngày mất: 49 ngày, 100 ngày (tính ngày mất là ngày thứ nhất), giỗ đầu, giỗ hết. */
export function memorialMilestones(deathSolar: Date, offsetDays = 0) {
  const d0 = startOfDay(deathSolar);
  const l = lunarOf(d0);
  const lunarYearDate = (k: number) => {
    const day = Math.min(l.day, lunarMonthLength(l.year + k, l.month, false) || 29);
    return lunarToSolar(day, l.month, l.year + k, false);
  };
  return [
    { id: '49', title: 'Cúng 49 ngày', date: addDays(d0, 48 + offsetDays) },
    { id: '100', title: 'Cúng 100 ngày', date: addDays(d0, 99 + offsetDays) },
    { id: 'gio-dau', title: 'Giỗ đầu (tiểu tường)', date: lunarYearDate(1) },
    { id: 'gio-het', title: 'Giỗ hết (đại tường)', date: lunarYearDate(2) },
  ].filter((m): m is { id: string; title: string; date: Date } => !!m.date);
}

/* ---------------------------------------------------------------- thông báo */
export type PlannedNotification = { id: string; at: Date; title: string; body: string; url: string };
export type RemindSettings = {
  mung1Ram: boolean;
  eveBefore: boolean;
  mung10: boolean;
  festivals: boolean;
  time: string;
};

/** iOS chỉ giữ 64 thông báo chờ; giữ tối đa 50 cái gần nhất, chừa chỗ cho nhắc hạ lễ. */
export const MAX_SCHEDULED = 50;

export function planNotifications(
  now: Date,
  s: RemindSettings,
  rituals: Ritual[],
  gios: Anniversary[],
  days = 60,
): PlannedNotification[] {
  const [h, m] = s.time.split(':').map(Number);
  const at = (d: Date, hh: number, mm: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm);
  const out: PlannedNotification[] = [];
  const start = startOfDay(now);
  for (let i = 0; i <= days; i++) {
    const d = addDays(start, i);
    const l = lunarOf(d);
    const label =
      l.day === 1
        ? `Mùng 1 tháng ${l.month}${l.leap ? ' nhuận' : ''}`
        : `Rằm tháng ${l.month}${l.leap ? ' nhuận' : ''}`;
    if (s.mung1Ram && (l.day === 1 || l.day === 15)) {
      out.push({
        id: `m-${d.toDateString()}`,
        at: at(d, h, m),
        title: `Hôm nay là ${label.toLowerCase()}`,
        body: 'Xem lễ vật và văn khấn.',
        url: '/ritual/mung-1-ram',
      });
      if (s.eveBefore)
        out.push({
          id: `e-${d.toDateString()}`,
          at: at(addDays(d, -1), 19, 0),
          title: `Mai là ${label.toLowerCase()}`,
          body: 'Chuẩn bị lễ vật từ tối nay.',
          url: '/ritual/mung-1-ram/offerings',
        });
    }
    if (s.mung10 && l.day === 10)
      out.push({
        id: `t-${d.toDateString()}`,
        at: at(d, h, m),
        title: 'Hôm nay mùng 10',
        body: 'Ngày nhiều nhà cúng Thần tài.',
        url: '/ritual/mung-10-than-tai',
      });
  }
  if (s.festivals) {
    for (const r of rituals) {
      if (r.group !== 'tet-le' || !r.when.rule) continue;
      const d = nextByRule(r.when.rule, start, days + 3);
      if (d)
        out.push({
          id: `f-${r.id}-${d.toDateString()}`,
          at: at(addDays(d, -3), 8, 0),
          title: `${r.title} còn 3 ngày`,
          body: r.when.text,
          url: `/ritual/${r.id}`,
        });
    }
  }
  for (const g of gios) {
    const o = nextGio(g, start);
    if (!o || daysBetween(start, o.date) > days) continue;
    for (const k of g.remindDays) {
      out.push({
        id: `g-${g.id}-${k}`,
        at: at(addDays(o.date, -k), 8, 0),
        title: `Giỗ ${g.relation.toLowerCase()} còn ${k} ngày`,
        body: `${g.name} · ${o.date.getDate()}/${o.date.getMonth() + 1}`,
        url: '/anniversaries',
      });
    }
  }
  return out
    .filter((n) => n.at > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}
