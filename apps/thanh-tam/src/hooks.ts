import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { RITUALS } from './data/rituals';
import type { Ritual } from './data/types';
import { nextGio, startOfDay, daysBetween, upcomingRituals } from './lib/schedule';
import { useTT } from './store';
import { lunarOf } from './calendar/lunar';
import { ageYear } from './age';

/** Ngày hôm nay, tự đổi khi qua nửa đêm hoặc mở lại app. */
export function useToday() {
  const [d, setD] = useState(() => startOfDay(new Date()));
  useEffect(() => {
    const check = () => {
      const n = startOfDay(new Date());
      setD((cur) => (cur.getTime() === n.getTime() ? cur : n));
    };
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    const t = setInterval(check, 60_000);
    return () => {
      sub.remove();
      clearInterval(t);
    };
  }, []);
  return d;
}

/** Lễ có liên quan tới nhà mình (Thần tài chỉ khi có ban Thần tài). */
export function useRitualFilter() {
  const altars = useTT((s) => s.household.altars);
  return useMemo(() => (r: Ritual) => (r.id.includes('than-tai') ? altars.includes('than-tai') : true), [altars]);
}

export function useUpcoming(days = 30) {
  const today = useToday();
  const filter = useRitualFilter();
  const anniversaries = useTT((s) => s.anniversaries);
  return useMemo(() => {
    const rituals = upcomingRituals(RITUALS, today, days, filter);
    const gios = anniversaries
      .map((a) => ({ a, o: nextGio(a, today) }))
      .filter((x): x is { a: typeof x.a; o: NonNullable<typeof x.o> } => !!x.o && daysBetween(today, x.o.date) <= days)
      .map(({ a, o }) => ({
        a,
        date: o.date,
        days: daysBetween(today, o.date),
        missing: o.missing,
        leapShifted: o.leapShifted,
      }))
      .sort((x, y) => x.days - y.days);
    return { today, rituals, gios };
  }, [today, filter, anniversaries, days]);
}

/** Năm âm đang xem mặc định: từ rằm tháng Chạp trở đi coi như đã sang năm mới. */
export function defaultAgeYear(d = new Date()) {
  const l = lunarOf(d);
  return l.month === 12 && l.day >= 15 && !l.leap ? l.year + 1 : l.year;
}

/** Có hiện thẻ "Năm … của nhà mình" ở Hôm nay không. */
export function useFamilyYearCard() {
  const today = useToday();
  const people = useTT((s) => s.people);
  return useMemo(() => {
    const l = lunarOf(today);
    const season = (l.month === 12 && l.day >= 15) || l.month === 1;
    const year = defaultAgeYear(today);
    const namTuoi = people.filter((p) => ageYear(p.birthLunarYear, p.sex, year).thaiTue === 'nam-tuoi');
    return { show: season || namTuoi.length > 0, year, namTuoi };
  }, [today, people]);
}
