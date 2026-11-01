import { useMemo } from 'react';
import { prayerById } from './data/prayers';
import { ritualById } from './data/rituals';
import { buildPrayer, dateFields, fieldsUsed, type FieldValues } from './lib/prayer';
import { useSession } from './session';
import { useTT } from './store';
import { useToday } from './hooks';

/** Bài khấn đã điền sẵn tên, địa chỉ, ngày âm của ngày cúng. */
export function usePrayer(ritualId: string, prayerId?: string) {
  const r = ritualById(ritualId);
  const pid = prayerId && r?.prayers.includes(prayerId) ? prayerId : r?.prayers[0];
  const p = pid ? prayerById(pid) : undefined;
  const hh = useTT((s) => s.household);
  const extra = useSession((s) => s.extra);
  const prayDateMs = useSession((s) => s.prayDate);
  const today = useToday();
  const prayDate = prayDateMs ? new Date(prayDateMs) : today;
  return useMemo(() => {
    if (!r || !p) return null;
    const values: FieldValues = {
      tinChu: hh.tinChu,
      diaChi: hh.diaChi,
      hoGiaTien: hh.hoGiaTien,
      ...dateFields(prayDate),
      ...extra,
    };
    const paras = buildPrayer(p.body, values);
    const fields = fieldsUsed(p.body);
    const missing = fields.filter((f) => !values[f]?.trim());
    return { r, p, paras, fields, missing, values, prayDate };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, p, hh, extra, prayDate.getTime()]);
}
