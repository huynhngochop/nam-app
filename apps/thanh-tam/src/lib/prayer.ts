/** Dựng văn khấn: tách đoạn, ô điền, số lần lặp. Hàm thuần, có test. */
import { canChiYear, lunarDayWords, lunarOf, monthName } from '../calendar/lunar';
import type { PrayerField } from '../data/types';

export type Segment = { text: string; field?: PrayerField; empty?: boolean };
export type Paragraph = { segments: Segment[]; repeat?: number };
export type FieldValues = Partial<Record<PrayerField, string>>;

export const FIELD_LABEL: Record<PrayerField, string> = {
  tinChu: 'Tín chủ', diaChi: 'Địa chỉ', hoGiaTien: 'Họ gia tiên', ngayAm: 'Ngày âm', thangAm: 'Tháng âm', namCanChi: 'Năm',
  tenNguoiMat: 'Tên người đã khuất', quanHe: 'Là gì của mình', tenCuaHang: 'Tên cửa hàng', tenEmBe: 'Tên bé',
};
export const FIELD_FALLBACK: Record<PrayerField, string> = {
  tinChu: '(tên gia chủ)', diaChi: '(địa chỉ)', hoGiaTien: '(họ)', ngayAm: '(ngày)', thangAm: '(tháng)', namCanChi: '(năm)',
  tenNguoiMat: '(tên người đã khuất)', quanHe: '(ông/bà…)', tenCuaHang: '(tên cửa hàng)', tenEmBe: '(tên bé)',
};

/** Ngày tháng năm âm bằng chữ theo ngày cúng. */
export function dateFields(prayDate: Date): FieldValues {
  const l = lunarOf(prayDate);
  return { ngayAm: lunarDayWords(l.day), thangAm: monthName(l.month, l.leap), namCanChi: canChiYear(l.year) };
}

export function buildPrayer(body: string, values: FieldValues): Paragraph[] {
  return body.split(/\n\s*\n/).map((raw) => {
    let line = raw.trim();
    let repeat: number | undefined;
    const m = line.match(/\s*\[x(\d+)\]\s*$/);
    if (m) { repeat = Number(m[1]); line = line.slice(0, m.index).trim(); }
    const segments: Segment[] = [];
    const re = /\{(\w+)\}/g;
    let last = 0, mm: RegExpExecArray | null;
    while ((mm = re.exec(line))) {
      if (mm.index > last) segments.push({ text: line.slice(last, mm.index) });
      const f = mm[1] as PrayerField;
      const v = values[f]?.trim();
      segments.push({ text: v || FIELD_FALLBACK[f], field: f, empty: !v });
      last = mm.index + mm[0].length;
    }
    if (last < line.length) segments.push({ text: line.slice(last) });
    return { segments, repeat };
  });
}

/** Các ô mà bài dùng, theo thứ tự xuất hiện. */
export function fieldsUsed(body: string): PrayerField[] {
  const seen: PrayerField[] = [];
  for (const m of body.matchAll(/\{(\w+)\}/g)) if (!seen.includes(m[1] as PrayerField)) seen.push(m[1] as PrayerField);
  return seen;
}

/** Bản đọc khi người dùng chọn "Khấn luôn": bỏ cụm có ô trống cho câu tự nhiên. */
export function skipEmpty(paras: Paragraph[]): Paragraph[] {
  return paras.map((p) => {
    const segs: Segment[] = [];
    for (let i = 0; i < p.segments.length; i++) {
      const s = p.segments[i];
      if (s.empty) {
        // bỏ luôn từ nối ngay trước (", ngụ tại", " là", " họ")
        const prev = segs[segs.length - 1];
        if (prev && !prev.field) prev.text = prev.text.replace(/(,?\s*(ngụ tại|là|họ|tại|cháu|của))\s*$/i, '');
        continue;
      }
      segs.push({ ...s });
    }
    return { ...p, segments: segs };
  });
}

export const plainText = (p: Paragraph) => p.segments.map((s) => s.text).join('') + (p.repeat ? ` (${p.repeat} lần)` : '');
