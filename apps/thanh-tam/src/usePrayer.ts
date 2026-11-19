import { useMemo } from 'react';
import { prayerById } from './data/prayers';
import { ritualById } from './data/rituals';
import { buildPrayer, dateFields, fieldsUsed, type FieldValues } from './lib/prayer';
import { useSession } from './session';
import { useTT } from './store';
import { useToday } from './hooks';

/** Bài khấn đã điền sẵn tên, địa chỉ, ngày âm của ngày cúng. */
export function usePrayer(ritualId: string, prayerId?: string) {
  const ritual = ritualById(ritualId);
  const chosenPrayerId = prayerId && ritual?.prayers.includes(prayerId) ? prayerId : ritual?.prayers[0];
  const prayer = chosenPrayerId ? prayerById(chosenPrayerId) : undefined;
  const household = useTT((s) => s.household);
  const extra = useSession((s) => s.extra);
  const prayDateMs = useSession((s) => s.prayDate);
  const today = useToday();
  const prayDate = prayDateMs ? new Date(prayDateMs) : today;
  return useMemo(() => {
    if (!ritual || !prayer) return null;
    const values: FieldValues = {
      tinChu: household.tinChu,
      diaChi: household.diaChi,
      hoGiaTien: household.hoGiaTien,
      ...dateFields(prayDate),
      ...extra,
    };
    const paras = buildPrayer(prayer.body, values);
    const fields = fieldsUsed(prayer.body);
    const missing = fields.filter((f) => !values[f]?.trim());
    return { ritual, prayer, paras, fields, missing, values, prayDate };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ritual, prayer, household, extra, prayDate.getTime()]);
}
