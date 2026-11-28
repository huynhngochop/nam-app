/**
 * Bộ máy lộ trình: từ trình độ hiện tại, band mục tiêu, ngày thi và quỹ thời gian → lộ trình + giáo án mỗi ngày.
 * Thuần TypeScript (không phụ thuộc React Native) để test được và chạy được khi không có mạng.
 *
 * Số giờ cần cho mỗi nửa band là ƯỚC LƯỢNG ban đầu. Khi có dữ liệu thật (band thi thử theo tuần, điểm thi thật
 * người dùng nhập), hiệu chỉnh HOURS_FOR_HALF_BAND cho sát.
 */

export type Criterion = 'FC' | 'LR' | 'GRA' | 'P';
export const CRITERIA: Criterion[] = ['FC', 'LR', 'GRA', 'P'];
export const CRITERION_VI: Record<Criterion, string> = {
  FC: 'Trôi chảy',
  LR: 'Từ vựng',
  GRA: 'Ngữ pháp',
  P: 'Phát âm',
};
export type Bands = Record<Criterion, number>;

/** Làm tròn theo IELTS: .25 lên .5, .75 lên số tròn kế tiếp. */
export function ieltsRound(x: number): number {
  return Math.floor(x * 2 + 0.5) / 2;
}
export function overallOf(b: Bands): number {
  return ieltsRound((b.FC + b.LR + b.GRA + b.P) / 4);
}

/** Thang band mục tiêu cho người học chọn: từ 5.0 tới 9.0 (mức cao nhất của IELTS). */
export const MIN_TARGET = 5;
export const MAX_BAND = 9;
export const TARGET_BANDS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

/** Mỗi band nói được như thế nào, viết dễ hiểu để người học chọn mục tiêu. */
export const BAND_VI: Record<string, string> = {
  '5.0': 'Nói được chủ đề quen, còn ngắt quãng và sai khá nhiều',
  '5.5': 'Trả lời được đa số câu hỏi, còn lặp từ và sai thì',
  '6.0': 'Nói dài được, ý rõ ràng, còn lỗi nhưng không gây hiểu lầm',
  '6.5': 'Khá trôi chảy, có câu phức và vài cụm từ hay',
  '7.0': 'Trôi chảy, dùng cụm từ tự nhiên, lỗi ít',
  '7.5': 'Linh hoạt ở cả chủ đề lạ, hiếm khi ngập ngừng',
  '8.0': 'Rất trôi chảy, từ chính xác, chỉ thỉnh thoảng sai nhỏ',
  '8.5': 'Gần như người bản xứ, sắc thái tinh tế',
  '9.0': 'Như người bản xứ có học thức, không còn lỗi đáng kể',
};
export function bandLabel(b: number): string {
  return BAND_VI[b.toFixed(1)] ?? '';
}

/** Các mục tiêu hợp lý để chọn: cao hơn trình độ hiện tại, tối đa 9.0. */
export function targetChoices(start: number): number[] {
  const out = TARGET_BANDS.filter((t) => t > start);
  return out.length ? out : [MAX_BAND];
}
/** Mục tiêu mặc định: cao hơn hiện tại 1 band (không quá 9.0, không dưới 5.0). */
export function defaultTarget(start: number): number {
  return Math.min(MAX_BAND, Math.max(MIN_TARGET, ieltsRound(start + 1)));
}

/** Cấp nội dung theo band đang hướng tới: câu mẫu, bài mini và cách chấm khác nhau. */
export type Tier = 'core' | 'adv' | 'expert';
export function tierOf(band: number): Tier {
  return band >= 8.5 ? 'expert' : band >= 7.5 ? 'adv' : 'core';
}
/** Band của câu mẫu để nói nhại: cao hơn hiện tại khoảng 1 band, không vượt mục tiêu. */
export function modelBand(current: number, target: number): number {
  const up = Math.min(Math.max(target, current + 0.5), current + 1);
  return Math.min(MAX_BAND, ieltsRound(up));
}

/**
 * Giờ luyện ước lượng để đi từ band `from` lên `from + 0.5`: càng lên cao càng tốn.
 * Từ 7.0 trở lên tăng nhanh hơn: band 8–9 cần độ chính xác và sắc thái, khó lên hơn nhiều.
 */
export function hoursForHalfBand(from: number): number {
  return 20 + 10 * Math.max(0, (from - 5.5) / 0.5) + 15 * Math.max(0, (from - 7) / 0.5);
}
export function hoursNeeded(from: number, to: number): number {
  let h = 0;
  for (let b = from; b < to - 1e-9; b += 0.5) h += hoursForHalfBand(b);
  return h;
}

export type Goal = {
  current: Bands;
  target: number;
  examDate: string; // 'YYYY-MM-DD' theo giờ máy
  minutesPerDay: number;
  daysPerWeek: number;
};

export type Phase = {
  key: 'base' | 'expand' | 'boost' | 'mock';
  name: string;
  fromWeek: number; // 1-based, gồm cả 2 đầu
  toWeek: number;
  part: 1 | 2 | 3 | 'mock';
  focus: string;
  targetBand: number;
};

export type Feasibility = 'ok' | 'tight' | 'hard';

export type Plan = {
  createdAt: string;
  weeks: number;
  availableHours: number;
  neededHours: number;
  gap: number;
  start: number;
  target: number;
  feasibility: Feasibility;
  /** Gợi ý khi chưa đủ thời gian (đã viết sẵn bằng tiếng Việt). */
  suggestions: string[];
  /** Tỉ lệ thời gian cho từng tiêu chí, tổng = 1. */
  allocation: Record<Criterion, number>;
  phases: Phase[];
  /** Band dự kiến cuối mỗi tuần (index 0 = tuần 1). */
  weekly: number[];
};

const DAY = 86_400_000;
function parseDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((parseDay(toKey).getTime() - parseDay(fromKey).getTime()) / DAY);
}

/** Tiêu chí yếu hơn mục tiêu nhiều → được nhiều thời gian hơn. Không tiêu chí nào dưới 10%. */
export function allocate(current: Bands, target: number): Record<Criterion, number> {
  const raw = CRITERIA.map((k) => 1 + Math.max(0, target - current[k]) * 2);
  const sum = raw.reduce((a, b) => a + b, 0);
  const shares = raw.map((r) => Math.max(0.1, r / sum));
  const s2 = shares.reduce((a, b) => a + b, 0);
  const out = {} as Record<Criterion, number>;
  CRITERIA.forEach((k, i) => (out[k] = Math.round((shares[i] / s2) * 100) / 100));
  return out;
}

export function weakest(b: Bands): Criterion {
  return CRITERIA.reduce((w, k) => (b[k] < b[w] ? k : w), 'GRA' as Criterion);
}

/** Band cao nhất đạt được trong số giờ có. */
export function reachableBand(from: number, hours: number): number {
  let b = from;
  let left = hours;
  while (b < 9 && left >= hoursForHalfBand(b)) {
    left -= hoursForHalfBand(b);
    b += 0.5;
  }
  return b;
}

export function buildPlan(goal: Goal, todayKey: string): Plan {
  const start = overallOf(goal.current);
  const target = Math.min(MAX_BAND, Math.max(goal.target, start));
  const days = Math.max(7, daysBetween(todayKey, goal.examDate));
  const weeks = Math.max(1, Math.floor(days / 7));
  const availableHours = Math.round((weeks * goal.daysPerWeek * goal.minutesPerDay) / 60);
  const neededHours = Math.round(hoursNeeded(start, target));
  const ratio = neededHours === 0 ? Infinity : availableHours / neededHours;
  const feasibility: Feasibility = ratio >= 1 ? 'ok' : ratio >= 0.75 ? 'tight' : 'hard';

  const suggestions: string[] = [];
  if (feasibility !== 'ok') {
    const perDay = Math.ceil((neededHours * 60) / (weeks * goal.daysPerWeek) / 5) * 5;
    if (perDay <= 120) suggestions.push(`Tăng lên ${perDay} phút mỗi ngày.`);
    const weeksNeeded = Math.ceil((neededHours * 60) / (goal.daysPerWeek * goal.minutesPerDay));
    suggestions.push(`Hoặc lùi ngày thi thêm khoảng ${Math.max(1, weeksNeeded - weeks)} tuần.`);
    const reach = reachableBand(start, availableHours);
    if (reach < target) suggestions.push(`Hoặc đặt mục tiêu ${reach.toFixed(1)} cho kỳ thi này.`);
  }

  const phases = splitPhases(weeks, start, target);
  const weekly = Array.from({ length: weeks }, (_, i) => {
    const t = (i + 1) / weeks;
    // tăng chậm ở đầu (xây nền), nhanh hơn ở giữa
    const eased = t * t * (3 - 2 * t);
    return Math.min(target, Math.floor((start + (target - start) * eased) * 2) / 2);
  });
  if (weekly.length) weekly[weekly.length - 1] = target;

  return {
    createdAt: todayKey,
    weeks,
    availableHours,
    neededHours,
    gap: target - start,
    start,
    target,
    feasibility,
    suggestions,
    allocation: allocate(goal.current, target),
    phases,
    weekly,
  };
}

/** Trọng tâm giai đoạn khi đang hướng tới band cao (7.5 trở lên). */
const FOCUS_HIGH: Record<Exclude<Tier, 'core'>, Record<Phase['key'], string>> = {
  adv: {
    base: 'Câu đa dạng không lỗi, paraphrase câu hỏi, âm yếu',
    expand: 'Part 2 có điểm nhấn, cụm động từ tự nhiên, nhịp câu',
    boost: 'Part 3 lập luận hai chiều, nói giảm nói tránh, sắc thái',
    mock: 'Đề đủ 3 part, dọn lỗi nhỏ còn sót, giữ mạch khi nói dài',
  },
  expert: {
    base: 'Chính xác tuyệt đối, đảo ngữ, từ ít phổ biến đúng chỗ',
    expand: 'Kể chuyện như người bản xứ, hài hước và ví dụ cụ thể',
    boost: 'Bàn chủ đề trừu tượng, nhượng bộ rồi phản biện, ngữ điệu thái độ',
    mock: 'Thi thử như thật, không còn lỗi lặp, phát âm dễ nghe như bản xứ',
  },
};

function splitPhases(weeks: number, start: number, target: number): Phase[] {
  const mid = (f: number) => Math.min(target, Math.floor((start + (target - start) * f) * 2) / 2);
  const defs: Omit<Phase, 'fromWeek' | 'toWeek' | 'targetBand'>[] = [
    { key: 'base', name: 'Nền tảng', part: 1, focus: 'Thì và câu phức cơ bản, trả lời 2–3 câu có lý do' },
    { key: 'expand', name: 'Mở rộng', part: 2, focus: 'Part 2 nói đủ 2 phút, collocation, nối ý' },
    { key: 'boost', name: 'Tăng tốc', part: 3, focus: 'Part 3 lập luận, so sánh, cụm từ tự nhiên' },
    { key: 'mock', name: 'Thi thử', part: 'mock', focus: 'Đề đủ 3 part, sửa dứt lỗi còn lặp' },
  ];
  const targets = [mid(0.35), mid(0.65), target, target];
  const withFocus = (d: (typeof defs)[number], band: number) => {
    const t = tierOf(band);
    return t === 'core' ? d : { ...d, focus: FOCUS_HIGH[t][d.key] };
  };
  if (weeks < 4) {
    // ít thời gian: bỏ giai đoạn nền tảng và mở rộng
    const boostEnd = Math.max(1, weeks - 1);
    const out: Phase[] = [{ ...withFocus(defs[2], target), fromWeek: 1, toWeek: boostEnd, targetBand: target }];
    if (weeks > 1) out.push({ ...withFocus(defs[3], target), fromWeek: weeks, toWeek: weeks, targetBand: target });
    return out;
  }
  const shares = [0.3, 0.3, 0.25, 0.15];
  const lens = shares.map((s) => Math.max(1, Math.round(weeks * s)));
  // chỉnh để tổng đúng bằng số tuần (bù vào giai đoạn dài nhất)
  let diff = weeks - lens.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    const i = diff > 0 ? lens.indexOf(Math.max(...lens)) : lens.findIndex((l) => l === Math.max(...lens) && l > 1);
    lens[i] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  let w = 1;
  return defs.map((d, i) => {
    const p: Phase = { ...withFocus(d, targets[i]), fromWeek: w, toWeek: w + lens[i] - 1, targetBand: targets[i] };
    w += lens[i];
    return p;
  });
}

export function weekIndexOf(plan: Plan, todayKey: string): number {
  return Math.min(plan.weeks - 1, Math.max(0, Math.floor(daysBetween(plan.createdAt, todayKey) / 7)));
}
export function phaseOf(plan: Plan, weekIndex: number): Phase {
  const wk = weekIndex + 1;
  return plan.phases.find((p) => wk >= p.fromWeek && wk <= p.toWeek) ?? plan.phases[plan.phases.length - 1];
}

/* ───────────────────────────── Giáo án mỗi ngày ───────────────────────────── */

export type LessonKind = 'warmup' | 'repair' | 'grammar' | 'speak' | 'shadow' | 'mock';
export type LessonItem = {
  id: string;
  kind: LessonKind;
  title: string;
  sub: string;
  minutes: number;
  criterion?: Criterion;
  part?: 1 | 2 | 3;
};

/** Bài ngữ pháp/từ vựng ngắn theo giai đoạn và tiêu chí yếu. */
const MINI: Record<Phase['key'], Partial<Record<Criterion, string[]>>> = {
  base: {
    GRA: [
      'Hiện tại hoàn thành cho thay đổi tới nay',
      'Quá khứ đơn với động từ bất quy tắc',
      'Câu điều kiện loại 1 và 2',
    ],
    LR: ['Collocation về thói quen hằng ngày', 'Thay "very good" bằng tính từ mạnh'],
    P: ['Âm cuối /t/ /d/ /s/', 'Âm /θ/ và /ð/'],
    FC: ['Mở rộng câu trả lời: ý + lý do + ví dụ'],
  },
  expand: {
    GRA: ['Mệnh đề quan hệ để nói dài hơn', 'Kể chuyện bằng quá khứ tiếp diễn'],
    LR: ['Cụm từ kể trải nghiệm', 'Từ nối: on top of that, having said that'],
    P: ['Trọng âm từ nhiều âm tiết', 'Nối âm trong câu'],
    FC: ['Chia 2 phút Part 2 thành 4 ý'],
  },
  boost: {
    GRA: ['Câu bị động khi nói về xã hội', 'Câu so sánh nâng cao'],
    LR: ['Cụm từ đưa ý kiến và phản biện', 'Idiom tự nhiên, dùng đúng chỗ'],
    P: ['Ngữ điệu câu hỏi và câu nhấn mạnh'],
    FC: ['Cụm đệm thay cho "um, uh"'],
  },
  mock: {
    GRA: ['Rà lỗi ngữ pháp còn lặp'],
    LR: ['Ôn cụm từ đã học theo chủ đề'],
    P: ['Đọc to đoạn mẫu band 7'],
    FC: ['Luyện giữ nhịp khi bị hỏi bất ngờ'],
  },
};

/** Bài mini cho người đang hướng tới 7.5 trở lên. Band 8.5–9 dùng thêm EXPERT, ưu tiên trước. */
const MINI_ADV: Record<Phase['key'], Partial<Record<Criterion, string[]>>> = {
  base: {
    GRA: ['Thì hoàn thành tiếp diễn và câu giả định', 'Câu chẻ để nhấn mạnh'],
    LR: ['Paraphrase câu hỏi của giám khảo', 'Collocation ít gặp nhưng tự nhiên'],
    P: ['Âm yếu và dạng rút gọn'],
    FC: ['Trả lời có chiều sâu: ý + lý do + hệ quả'],
  },
  expand: {
    GRA: ['Mệnh đề rút gọn và cụm phân từ'],
    LR: ['Cụm động từ tự nhiên khi kể chuyện'],
    P: ['Nhịp câu: nhấn từ mang nghĩa'],
    FC: ['Part 2 có điểm nhấn và kết luận'],
  },
  boost: {
    GRA: ['Nói giảm nói tránh (hedging)'],
    LR: ['Từ chỉ sắc thái: arguably, to some extent'],
    P: ['Ngữ điệu thể hiện thái độ'],
    FC: ['Lập luận hai chiều rồi chốt quan điểm'],
  },
  mock: {
    GRA: ['Dọn lỗi nhỏ còn sót ở band cao'],
    LR: ['Từ ít phổ biến dùng đúng ngữ cảnh'],
    P: ['Đọc to đoạn mẫu band 8'],
    FC: ['Nói dài không mất mạch ý'],
  },
};
const MINI_EXPERT: Partial<Record<Criterion, string[]>> = {
  GRA: ['Đảo ngữ trong văn nói'],
  LR: ['Thành ngữ và cách nói hình ảnh đúng chỗ'],
  P: ['Đọc to đoạn mẫu band 9'],
  FC: ['Nhượng bộ rồi phản biện tự nhiên'],
};

function miniFor(phase: Phase, focus: Criterion): string[] {
  const t = tierOf(phase.targetBand);
  if (t === 'core') return MINI[phase.key][focus] ?? MINI[phase.key].GRA ?? [];
  const adv = MINI_ADV[phase.key][focus] ?? MINI_ADV[phase.key].GRA ?? [];
  return t === 'expert' ? [...(MINI_EXPERT[focus] ?? []), ...adv] : adv;
}

export function dailyLesson(
  plan: Plan,
  opts: { todayKey: string; minutes: number; current: Bands; newErrors: number; dueRecalls: number },
): LessonItem[] {
  const wi = weekIndexOf(plan, opts.todayKey);
  const phase = phaseOf(plan, wi);
  const dayOfWeek = daysBetween(plan.createdAt, opts.todayKey) % 7;
  const focus = weakest(opts.current);
  const minis = miniFor(phase, focus);
  const mini = minis[(wi + dayOfWeek) % Math.max(1, minis.length)] ?? 'Ôn lỗi hay gặp';
  const total = opts.minutes;

  // Ngày cuối mỗi tuần: thi thử để chấm lại band và sắp lại tuần sau
  if (dayOfWeek === 6) {
    const mockMin = Math.min(15, total);
    const items: LessonItem[] = [
      { id: 'mock', kind: 'mock', title: `Thi thử tuần ${wi + 1}`, sub: 'Đủ 3 part, như phòng thi', minutes: mockMin },
    ];
    if (opts.newErrors > 0 && total - mockMin >= 4)
      items.push(repairItem(Math.min(opts.newErrors, 3), Math.min(total - mockMin, 6)));
    return items;
  }

  const items: LessonItem[] = [];
  let left = total;
  const take = (m: number) => {
    const v = Math.max(0, Math.min(left, Math.round(m)));
    left -= v;
    return v;
  };

  const warm = take(Math.max(3, total * 0.1));
  if (warm)
    items.push({
      id: 'warm',
      kind: 'warmup',
      title: 'Khởi động phát âm',
      sub: `${warm} phút · P`,
      minutes: warm,
      criterion: 'P',
    });

  if (opts.newErrors > 0) {
    const m = take(Math.min(8, 2 * Math.min(opts.newErrors, 3)));
    if (m) items.push(repairItem(Math.min(opts.newErrors, 3), m));
  }

  const g = take(Math.max(4, total * plan.allocation[focus] * 0.4));
  if (g)
    items.push({ id: 'mini', kind: 'grammar', title: mini, sub: `${g} phút · ${focus}`, minutes: g, criterion: focus });

  const part = phase.part === 'mock' ? (((dayOfWeek % 3) + 1) as 1 | 2 | 3) : phase.part;
  const shadow = left >= 14 ? 5 : 0;
  const speak = take(left - shadow);
  if (speak)
    items.push({
      id: 'speak',
      kind: 'speak',
      title: `Nói 1:1 với giám khảo AI · Part ${part}`,
      sub: opts.dueRecalls > 0 ? `${speak} phút · gài lại ${opts.dueRecalls} lỗi đến hạn` : `${speak} phút`,
      minutes: speak,
      part,
    });
  const sh = take(shadow);
  if (sh)
    items.push({
      id: 'shadow',
      kind: 'shadow',
      title: `Nói nhại câu mẫu band ${modelBand(overallOf(opts.current), plan.target).toFixed(1)}`,
      sub: `${sh} phút · P, FC`,
      minutes: sh,
    });
  return items;
}

function repairItem(n: number, minutes: number): LessonItem {
  return {
    id: 'repair',
    kind: 'repair',
    title: `Sửa ngay ${n} lỗi mới`,
    sub: `${minutes} phút · nói lại câu đúng`,
    minutes,
  };
}

/* ───────────────────────────── Tự điều chỉnh ───────────────────────────── */

export type Adjustment = {
  behind: Criterion[];
  ahead: Criterion[];
  message: string;
  allocation: Record<Criterion, number>;
} | null;

/**
 * So band thực tế với kế hoạch của tuần hiện tại. Tiêu chí nào chậm ≥ 0.5 band → đề xuất dồn thêm thời gian.
 * Trả về null khi đúng tiến độ.
 */
export function adjust(plan: Plan, actual: Bands, todayKey: string): Adjustment {
  const wi = weekIndexOf(plan, todayKey);
  const expected = plan.weekly[wi] ?? plan.target;
  const behind = CRITERIA.filter((k) => expected - actual[k] >= 0.5);
  const ahead = CRITERIA.filter((k) => actual[k] - expected >= 0.5);
  if (behind.length === 0) return null;
  const alloc = { ...plan.allocation };
  const give = 0.08;
  const donors = ahead.length ? ahead : CRITERIA.filter((k) => !behind.includes(k));
  if (donors.length === 0) return null;
  behind.forEach((k) => (alloc[k] += give / behind.length));
  donors.forEach((k) => (alloc[k] = Math.max(0.1, alloc[k] - give / donors.length)));
  const sum = CRITERIA.reduce((a, k) => a + alloc[k], 0);
  CRITERIA.forEach((k) => (alloc[k] = Math.round((alloc[k] / sum) * 100) / 100));
  const names = behind.map((k) => CRITERION_VI[k]).join(', ');
  return {
    behind,
    ahead,
    allocation: alloc,
    message: `${names} đang chậm hơn kế hoạch tuần ${wi + 1} (cần ${expected.toFixed(1)}). Đề xuất dồn thêm thời gian cho phần này.`,
  };
}
