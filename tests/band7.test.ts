import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  adjust,
  allocate,
  buildPlan,
  dailyLesson,
  hoursNeeded,
  ieltsRound,
  overallOf,
  reachableBand,
  type Bands,
} from '../apps/band7/src/plan';
import { drillByTitle, drillTitles, shadowDrill, warmupFor } from '../apps/band7/src/drills';
import { topics, validateTopics } from '../apps/band7/src/topics';
import { maskSentence, milestones, statusLabel } from '../apps/band7/src/loop';

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
