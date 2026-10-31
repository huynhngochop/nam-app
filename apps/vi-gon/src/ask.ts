import { AiUnavailableError, callAi, fold } from '@nam/core';
import { Category, Fund } from './types';

/**
 * Hỏi Ví Gọn (VG-21/22). Hiểu câu hỏi bằng quy tắc trên máy; chỉ khi không hiểu mới gửi CÂU HỎI (không kèm số liệu) lên cổng AI
 * để nhận lại "cách hiểu" dạng JSON. Mọi con số luôn tính trên máy.
 */
export type Metric = 'sum' | 'count' | 'top' | 'change' | 'average' | 'fund_eta' | 'left';
export type PeriodKey =
  'this_month' | 'last_month' | 'this_week' | 'today' | 'yesterday' | 'this_year' | `month_${number}`;
export type Intent = {
  metric: Metric;
  kind: 'expense' | 'income';
  categoryId: string | null;
  period: PeriodKey;
  fundId: string | null;
  merchant: string | null;
};

export const PERIOD_LABEL = (p: PeriodKey) =>
  p === 'this_month'
    ? 'tháng này'
    : p === 'last_month'
      ? 'tháng trước'
      : p === 'this_week'
        ? 'tuần này'
        : p === 'today'
          ? 'hôm nay'
          : p === 'yesterday'
            ? 'hôm qua'
            : p === 'this_year'
              ? 'năm nay'
              : `tháng ${p.split('_')[1]}`;

const CAT_WORDS: Record<string, string[]> = {
  food: ['an uong', 'an', 'uong', 'cafe', 'ca phe', 'com', 'tra sua', 'nha hang'],
  home: ['nha', 'hoa don', 'tien dien', 'dien', 'nuoc', 'internet', 'tien nha'],
  shop: ['mua sam', 'shopee', 'quan ao', 'mua'],
  move: ['di lai', 'xang', 'grab', 'taxi', 'gui xe'],
  health: ['suc khoe', 'thuoc', 'kham'],
  study: ['hoc', 'hoc phi', 'sach'],
  family: ['gia dinh', 'con', 'bo me'],
  fun: ['giai tri', 'phim', 'netflix', 'game'],
  phone: ['dien thoai', 'mang', 'nap tien'],
  gift: ['qua', 'hieu hi', 'dam cuoi', 'mung'],
  salary: ['luong'],
};

export function parseIntent(q: string, cats: Category[], funds: Fund[], now = new Date()): Intent | null {
  const f = ` ${fold(q).replace(/[?!.,]/g, ' ')} `.replace(/\s+/g, ' ');
  let period: PeriodKey = 'this_month';
  if (/ thang truoc | thang roi /.test(f)) period = 'last_month';
  else if (/ tuan nay | 7 ngay /.test(f)) period = 'this_week';
  else if (/ hom nay /.test(f)) period = 'today';
  else if (/ hom qua /.test(f)) period = 'yesterday';
  else if (/ nam nay | ca nam /.test(f)) period = 'this_year';
  else {
    const m = f.match(/ thang (\d{1,2}) /);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) period = `month_${Number(m[1])}`;
  }

  const fund = funds.find(
    (x) =>
      f.includes(` ${fold(x.name)} `) ||
      fold(x.name)
        .split(' ')
        .some((w) => w.length > 3 && f.includes(` ${w} `)),
  );
  if (fund && / quy | bao lau | khi nao | bao gio | du /.test(f))
    return { metric: 'fund_eta', kind: 'expense', categoryId: null, period, fundId: fund.id, merchant: null };

  // Danh mục: tên người dùng đặt trước, rồi từ khóa (cụm dài trước)
  let categoryId: string | null = null;
  const own = cats.find((c) => f.includes(` ${fold(c.name)} `));
  if (own) categoryId = own.id;
  else {
    let best = 0;
    for (const [id, words] of Object.entries(CAT_WORDS))
      for (const w of words)
        if (f.includes(` ${w} `) && w.length > best) {
          best = w.length;
          categoryId = id;
        }
  }
  const kind: Intent['kind'] =
    / thu | thu nhap | kiem duoc | nhan duoc | luong /.test(f) && !/ chi /.test(f) ? 'income' : 'expense';
  if (categoryId === 'salary') categoryId = kind === 'income' ? 'salary' : null;

  let metric: Metric | null = null;
  if (/ con (lai )?bao nhieu | con duoc | duoc chi them /.test(f)) metric = 'left';
  else if (/ tang | giam | so voi /.test(f)) metric = 'change';
  else if (/ nhieu nhat | lon nhat | top | ton nhat /.test(f)) metric = 'top';
  else if (/ trung binh | moi ngay /.test(f)) metric = 'average';
  else if (/ bao nhieu lan | may lan | so lan /.test(f)) metric = 'count';
  else if (/ bao nhieu | tong | het | chi | tieu | ton /.test(f) || categoryId) metric = 'sum';
  if (!metric) return null;
  return { metric, kind, categoryId, period, fundId: null, merchant: null };
}

export function periodRange(
  p: PeriodKey,
  startDay: number,
  now = new Date(),
): { from: number; to: number; prevFrom: number; prevTo: number } {
  const d0 = new Date(now);
  d0.setHours(0, 0, 0, 0);
  const day = 86400000;
  const month = (offset: number) => {
    const y = now.getFullYear();
    let m = now.getMonth();
    if (now.getDate() < startDay) m -= 1;
    m += offset;
    return { from: new Date(y, m, startDay).getTime(), to: new Date(y, m + 1, startDay).getTime() };
  };
  if (p === 'today')
    return { from: d0.getTime(), to: d0.getTime() + day, prevFrom: d0.getTime() - day, prevTo: d0.getTime() };
  if (p === 'yesterday')
    return { from: d0.getTime() - day, to: d0.getTime(), prevFrom: d0.getTime() - 2 * day, prevTo: d0.getTime() - day };
  if (p === 'this_week') {
    const s = d0.getTime() - ((d0.getDay() + 6) % 7) * day;
    return { from: s, to: s + 7 * day, prevFrom: s - 7 * day, prevTo: s };
  }
  if (p === 'this_year') {
    const s = new Date(now.getFullYear(), 0, 1).getTime();
    return {
      from: s,
      to: new Date(now.getFullYear() + 1, 0, 1).getTime(),
      prevFrom: new Date(now.getFullYear() - 1, 0, 1).getTime(),
      prevTo: s,
    };
  }
  if (p === 'last_month') {
    const a = month(-1);
    const b = month(-2);
    return { ...a, prevFrom: b.from, prevTo: b.to };
  }
  if (p.startsWith('month_')) {
    const m = Number(p.split('_')[1]) - 1;
    const y = m > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
    return {
      from: new Date(y, m, startDay).getTime(),
      to: new Date(y, m + 1, startDay).getTime(),
      prevFrom: new Date(y, m - 1, startDay).getTime(),
      prevTo: new Date(y, m, startDay).getTime(),
    };
  }
  const a = month(0);
  const b = month(-1);
  return { ...a, prevFrom: b.from, prevTo: b.to };
}

/** Không hiểu bằng quy tắc → nhờ AI hiểu câu hỏi. Chỉ gửi câu hỏi + danh sách TÊN danh mục/quỹ, không gửi số liệu. */
export async function intentViaAi(q: string, cats: Category[], funds: Fund[]): Promise<Intent | null> {
  try {
    const r = await callAi<Partial<Intent>>(
      'finance-intent',
      {
        question: q.slice(0, 200),
        categories: cats.map((c) => ({ id: c.id, name: c.name })),
        funds: funds.map((x) => ({ id: x.id, name: x.name })),
      },
      { timeoutMs: 8000 },
    );
    const metrics: Metric[] = ['sum', 'count', 'top', 'change', 'average', 'fund_eta', 'left'];
    if (!r.metric || !metrics.includes(r.metric)) return null;
    return {
      metric: r.metric,
      kind: r.kind === 'income' ? 'income' : 'expense',
      categoryId: cats.some((c) => c.id === r.categoryId) ? r.categoryId! : null,
      period: (typeof r.period === 'string' &&
      /^(this_month|last_month|this_week|today|yesterday|this_year|month_\d{1,2})$/.test(r.period)
        ? r.period
        : 'this_month') as PeriodKey,
      fundId: funds.some((x) => x.id === r.fundId) ? r.fundId! : null,
      merchant: null,
    };
  } catch (e) {
    if (e instanceof AiUnavailableError) return null;
    return null;
  }
}

export const SUGGESTED = [
  'Tháng này ăn uống hết bao nhiêu?',
  'Khoản nào tăng nhiều nhất so với tháng trước?',
  'Tháng này còn được chi bao nhiêu?',
  'Tuần này đi lại hết bao nhiêu?',
];
