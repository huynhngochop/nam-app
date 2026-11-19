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
    const timer = setInterval(check, 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
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
  const lunar = lunarOf(d);
  return lunar.month === 12 && lunar.day >= 15 && !lunar.leap ? lunar.year + 1 : lunar.year;
}

/** Có hiện thẻ "Năm … của nhà mình" ở Hôm nay không. */
export function useFamilyYearCard() {
  const today = useToday();
  const people = useTT((s) => s.people);
  return useMemo(() => {
    const lunar = lunarOf(today);
    const season = (lunar.month === 12 && lunar.day >= 15) || lunar.month === 1;
    const year = defaultAgeYear(today);
    const namTuoi = people.filter((p) => ageYear(p.birthLunarYear, p.sex, year).thaiTue === 'nam-tuoi');
    return { show: season || namTuoi.length > 0, year, namTuoi };
  }, [today, people]);
}
