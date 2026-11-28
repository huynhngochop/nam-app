import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  adjust,
  allocate,
  bandLabel,
  buildPlan,
  dailyLesson,
  defaultTarget,
  hoursNeeded,
  modelBand,
  TARGET_BANDS,
  targetChoices,
  tierOf,
  ieltsRound,
  overallOf,
  reachableBand,
  type Bands,
} from '../apps/len-band/src/plan';
import { drillByTitle, drillTitles, shadowDrill, warmupFor } from '../apps/len-band/src/drills';
import { topics, validateTopics } from '../apps/len-band/src/topics';
import { maskSentence, milestones, statusLabel } from '../apps/len-band/src/loop';

const B = (FC: number, LR: number, GRA: number, P: number): Bands => ({ FC, LR, GRA, P });
const TODAY = '2026-11-27';

test('ieltsRound làm tròn đúng quy tắc IELTS', () => {
  assert.equal(ieltsRound(6.125), 6);
  assert.equal(ieltsRound(6.25), 6.5);
  assert.equal(ieltsRound(6.75), 7);
  assert.equal(overallOf(B(6, 5.5, 5, 5.5)), 5.5);
});

test('giờ cần tăng dần theo band', () => {
  assert.equal(hoursNeeded(5.5, 7), 20 + 30 + 40);
  assert.equal(hoursNeeded(7, 7), 0);
  assert.equal(reachableBand(5.5, 50), 6.5);
});

test('lộ trình 16 tuần, 45 phút × 6 ngày từ 5.5 lên 7.0', () => {
  const p = buildPlan(
    { current: B(6, 5.5, 5, 5.5), target: 7, examDate: '2027-03-20', minutesPerDay: 45, daysPerWeek: 6 },
    TODAY,
  );
  assert.equal(p.weeks, 16);
  assert.equal(p.start, 5.5);
  assert.equal(p.availableHours, 72);
  assert.equal(p.feasibility, 'tight'); // 72 / 90 giờ
  assert.ok(p.suggestions.length >= 2);
  assert.equal(p.phases.length, 4);
  assert.equal(p.phases[0].fromWeek, 1);
  assert.equal(p.phases[3].toWeek, 16);
  for (let i = 1; i < p.phases.length; i++) assert.equal(p.phases[i].fromWeek, p.phases[i - 1].toWeek + 1);
  assert.equal(p.weekly.length, 16);
  assert.equal(p.weekly[15], 7);
  for (let i = 1; i < p.weekly.length; i++) assert.ok(p.weekly[i] >= p.weekly[i - 1], 'band dự kiến không giảm');
});

test('ít thời gian (2 tuần) chỉ còn Tăng tốc + Thi thử', () => {
  const p = buildPlan(
    { current: B(6, 6, 6, 6), target: 6.5, examDate: '2026-12-11', minutesPerDay: 60, daysPerWeek: 7 },
    TODAY,
  );
  assert.deepEqual(
    p.phases.map((x) => x.key),
    ['boost', 'mock'],
  );
});

test('đủ thời gian → khả thi, không gợi ý', () => {
  const p = buildPlan(
    { current: B(6, 6, 6, 6), target: 6.5, examDate: '2027-06-01', minutesPerDay: 60, daysPerWeek: 6 },
    TODAY,
  );
  assert.equal(p.feasibility, 'ok');
  assert.equal(p.suggestions.length, 0);
});

test('phân bổ ưu tiên tiêu chí yếu nhất, tổng ≈ 1', () => {
  const a = allocate(B(6, 5.5, 5, 5.5), 7);
  const sum = a.FC + a.LR + a.GRA + a.P;
  assert.ok(Math.abs(sum - 1) < 0.02);
  assert.ok(a.GRA > a.LR && a.LR > a.FC);
});

test('giáo án ngày thường: đủ phút, có phần nói và phần sửa lỗi mới', () => {
  const p = buildPlan(
    { current: B(6, 5.5, 5, 5.5), target: 7, examDate: '2027-03-20', minutesPerDay: 45, daysPerWeek: 6 },
    TODAY,
  );
  const items = dailyLesson(p, {
    todayKey: TODAY,
    minutes: 45,
    current: B(6, 5.5, 5, 5.5),
    newErrors: 2,
    dueRecalls: 3,
  });
  assert.equal(
    items.reduce((s, i) => s + i.minutes, 0),
    45,
  );
  assert.ok(items.some((i) => i.kind === 'speak' && i.sub.includes('gài lại 3')));
  assert.ok(items.some((i) => i.kind === 'repair'));
  const g = items.find((i) => i.kind === 'grammar');
  assert.ok(g && drillByTitle(g.title), `bài ${g?.title} phải có nội dung trong drills.ts`);
});

test('ngày thứ 7 của tuần là thi thử', () => {
  const p = buildPlan(
    { current: B(6, 6, 6, 6), target: 7, examDate: '2027-03-20', minutesPerDay: 30, daysPerWeek: 6 },
    TODAY,
  );
  const items = dailyLesson(p, {
    todayKey: '2026-12-03',
    minutes: 30,
    current: B(6, 6, 6, 6),
    newErrors: 0,
    dueRecalls: 0,
  });
  assert.equal(items[0].kind, 'mock');
});

test('mọi bài mini trong lộ trình đều có nội dung luyện', () => {
  const p = buildPlan(
    { current: B(6, 5.5, 5, 5.5), target: 8, examDate: '2027-09-01', minutesPerDay: 60, daysPerWeek: 7 },
    TODAY,
  );
  const titles = new Set<string>();
  for (let d = 0; d < p.weeks * 7; d++) {
    const day = new Date(2026, 10, 27 + d);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    for (const k of ['FC', 'LR', 'GRA', 'P'] as const) {
      const cur = { ...B(7, 7, 7, 7), [k]: 5 };
      for (const it of dailyLesson(p, { todayKey: key, minutes: 60, current: cur, newErrors: 0, dueRecalls: 0 }))
        if (it.kind === 'grammar') titles.add(it.title);
    }
  }
  const missing = [...titles].filter((t) => !drillByTitle(t));
  assert.deepEqual(missing, []);
  assert.ok(drillTitles().length >= 20);
  assert.ok(warmupFor(3).lines.length >= 3);
  assert.ok(shadowDrill().lines.length >= 3);
});

test('tự điều chỉnh: chậm ≥ 0.5 band thì dồn thời gian, đúng tiến độ thì không', () => {
  const p = buildPlan(
    { current: B(6, 6, 6, 6), target: 7, examDate: '2027-03-20', minutesPerDay: 45, daysPerWeek: 6 },
    TODAY,
  );
  assert.equal(adjust(p, B(6, 6, 6, 6), TODAY), null);
  const a = adjust(p, B(6.5, 6, 5, 6), TODAY);
  assert.ok(a);
  assert.deepEqual(a.behind, ['GRA']);
  assert.ok(a.allocation.GRA > p.allocation.GRA);
  assert.match(a.message, /Ngữ pháp/);
});

test('ngân hàng đề hợp lệ, đủ 3 part', () => {
  assert.deepEqual(validateTopics(), []);
  for (const part of [1, 2, 3]) assert.ok(topics().some((t) => t.part === part));
});

test('vòng sửa lỗi: nhãn, mốc và che câu', () => {
  assert.equal(statusLabel({ status: 'repairing', streak: 0 }).label, 'mới · sửa ngay');
  assert.equal(statusLabel({ status: 'recalling', streak: 2 }).label, 'đang gài lại · 2/3');
  const m = milestones({ status: 'recalling', repair_ok: 2, streak: 1 });
  assert.deepEqual(
    m.map((x) => x.state),
    ['done', 'done', 'done', 'next', 'todo', 'todo'],
  );
  assert.equal(maskSentence('It has changed dramatically'), 'It h__ c______ d______');
});

test('mục tiêu chọn được từ 5.0 tới 9.0, chỉ hiện mức cao hơn hiện tại', () => {
  assert.deepEqual(TARGET_BANDS, [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]);
  for (const t of TARGET_BANDS) assert.ok(bandLabel(t).length > 10, `thiếu mô tả band ${t}`);
  assert.deepEqual(targetChoices(4.5), TARGET_BANDS);
  assert.deepEqual(targetChoices(7.5), [8, 8.5, 9]);
  assert.deepEqual(targetChoices(9), [9]);
  assert.equal(defaultTarget(4), 5);
  assert.equal(defaultTarget(5.5), 6.5);
  assert.equal(defaultTarget(8.5), 9);
});

test('band cao tốn nhiều giờ hơn hẳn, và lên được tới 9.0', () => {
  assert.equal(hoursNeeded(5, 9), 20 + 20 + 30 + 40 + 50 + 75 + 100 + 125);
  assert.ok(hoursNeeded(8, 9) > hoursNeeded(5, 6.5));
  assert.equal(reachableBand(5, 10_000), 9);
  const p = buildPlan(
    { current: B(5, 5, 5, 5), target: 9, examDate: '2027-11-26', minutesPerDay: 90, daysPerWeek: 7 },
    TODAY,
  );
  assert.equal(p.target, 9);
  assert.equal(p.weekly[p.weekly.length - 1], 9);
  assert.equal(p.feasibility, 'ok');
  // mục tiêu vượt 9 bị chặn
  const q = buildPlan(
    { current: B(8, 8, 8, 8), target: 10, examDate: '2027-06-01', minutesPerDay: 60, daysPerWeek: 6 },
    TODAY,
  );
  assert.equal(q.target, 9);
});

test('giáo án đổi theo band đang hướng tới', () => {
  assert.equal(tierOf(6.5), 'core');
  assert.equal(tierOf(7.5), 'adv');
  assert.equal(tierOf(9), 'expert');
  assert.equal(modelBand(5, 9), 6);
  assert.equal(modelBand(8, 8.5), 8.5);
  const low = buildPlan(
    { current: B(5, 5, 5, 5), target: 6, examDate: '2027-03-20', minutesPerDay: 45, daysPerWeek: 6 },
    TODAY,
  );
  const high = buildPlan(
    { current: B(7.5, 7.5, 7.5, 7.5), target: 9, examDate: '2027-11-26', minutesPerDay: 60, daysPerWeek: 7 },
    TODAY,
  );
  assert.notEqual(low.phases[0].focus, high.phases[0].focus);
  const opts = { todayKey: TODAY, minutes: 45, newErrors: 0, dueRecalls: 0 };
  const lowMini = dailyLesson(low, { ...opts, current: B(5, 5, 5, 5) }).find((x) => x.kind === 'grammar');
  const highMini = dailyLesson(high, { ...opts, current: B(7.5, 7.5, 7.5, 7.5) }).find((x) => x.kind === 'grammar');
  assert.ok(lowMini && highMini);
  assert.notEqual(lowMini.title, highMini.title);
  assert.ok(drillByTitle(highMini.title), `thiếu bài luyện: ${highMini.title}`);
  // mọi bài mini ở mọi mức đều có nội dung
  for (const cur of [5, 6, 7, 7.5, 8, 8.5]) {
    const p = buildPlan(
      { current: B(cur, cur, cur, cur), target: 9, examDate: '2027-11-26', minutesPerDay: 60, daysPerWeek: 7 },
      TODAY,
    );
    for (let d = 0; d < 7 * p.weeks; d += 3) {
      const day = new Date(2026, 10, 27 + d);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      for (const k of ['FC', 'LR', 'GRA', 'P'] as const) {
        const cb = { ...B(cur, cur, cur, cur), [k]: cur - 0.5 };
        for (const it of dailyLesson(p, { ...opts, todayKey: key, current: cb }))
          if (it.kind === 'grammar') assert.ok(drillByTitle(it.title), `thiếu bài luyện: ${it.title}`);
      }
    }
  }
  for (const b of [5, 6, 7, 8, 8.5, 9]) assert.ok(shadowDrill(b).lines.length >= 3);
});
