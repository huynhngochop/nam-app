// Thành Tâm: ca biên theo spec (Kiểm thử bắt buộc) và dữ liệu lớn. Chạy cả TZ=Asia/Ho_Chi_Minh và TZ=America/New_York.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  leapOf,
  lunarMonthLength,
  lunarOf,
  lunarToSolar,
  solarToLunar,
  OutOfRangeError,
} from '../apps/thanh-tam/src/calendar/lunar';
import { resolveDate, monthCells } from '../apps/thanh-tam/src/lib/dates';
import {
  gioInLunarYear,
  memorialMilestones,
  nextByRule,
  nextGio,
  planNotifications,
  MAX_SCHEDULED,
  type Anniversary,
} from '../apps/thanh-tam/src/lib/schedule';
import { ageYear } from '../apps/thanh-tam/src/age';
import { search } from '../apps/thanh-tam/src/lib/search';
import { RITUALS } from '../apps/thanh-tam/src/data/rituals';

const ymd = (d: Date | null | undefined) => (d ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` : String(d));
const gio = (day: number, month: number, leap = false, id = 'x'): Anniversary => ({
  id,
  name: 'Nguyễn Văn A',
  relation: 'Ông nội',
  lunar: { day, month, leap },
  missingDayRule: 'ngay-cuoi-thang',
  remindDays: [7, 3, 1],
});
const REMIND = { mung1Ram: true, eveBefore: true, mung10: true, festivals: true, time: '06:30' };
const timed = <T>(fn: () => T): [T, number] => {
  const t = performance.now();
  const r = fn();
  return [r, performance.now() - t];
};

/* ======================= UT: ca biên ======================= */
test('Ca biên: sinh 10/2/1975 (trước Tết Ất Mão 11/2/1975) thuộc năm âm 1974 Giáp Dần', () => {
  const a = resolveDate({ calendar: 'duong', day: '10', month: '2', year: '1975' });
  assert.ok(a && 'lunar' in a);
  assert.equal(a.lunar.year, 1974);
  assert.equal(a.lunar.month, 12);
  const b = resolveDate({ calendar: 'duong', day: '11', month: '2', year: '1975' });
  assert.ok(b && 'lunar' in b);
  assert.deepEqual([b.lunar.day, b.lunar.month, b.lunar.year], [1, 1, 1975]);
  const age = ageYear(1974, 'nam', 2026);
  assert.equal(age.canChi, 'Giáp Dần');
  assert.equal(age.napAm, 'Đại Khê Thủy');
  assert.equal(age.tuoiMu, 53);
  assert.equal(age.sao, 'Thái Âm');
  assert.equal(age.kimLau, 'luc-suc');
});

test('Ca biên: giỗ 30 tháng Chạp năm Bính Ngọ (tháng thiếu) → 29 Chạp = 5/2/2027', () => {
  assert.equal(lunarMonthLength(2026, 12), 29);
  const o = gioInLunarYear(gio(30, 12), 2026)!;
  assert.equal(ymd(o.date), '2027-2-5');
  assert.equal(o.missing, true);
  const n = nextGio(gio(30, 12), new Date(2026, 10, 1))!;
  assert.equal(ymd(n.date), '2027-2-5');
});

test('Ca biên: mất tháng 6 nhuận 2025 → năm không nhuận giỗ tháng 6 thường; mốc 49/100 ngày, giỗ đầu', () => {
  assert.equal(leapOf(2025), 6);
  const died = lunarToSolar(10, 6, 2025, true)!;
  assert.ok(died);
  const l = lunarOf(died);
  assert.deepEqual([l.day, l.month, l.leap], [10, 6, true]);
  const g = gio(10, 6, true);
  const y2025 = gioInLunarYear(g, 2025)!;
  assert.equal(ymd(y2025.date), ymd(died));
  assert.equal(y2025.leapShifted, false);
  const y2026 = gioInLunarYear(g, 2026)!;
  assert.equal(y2026.leapShifted, true);
  assert.equal(ymd(y2026.date), ymd(lunarToSolar(10, 6, 2026, false)));
  const ms = memorialMilestones(died);
  const by = Object.fromEntries(ms.map((m) => [m.id, m.date]));
  assert.equal(Math.round((by['49'].getTime() - died.getTime()) / 86400000), 48);
  assert.equal(Math.round((by['100'].getTime() - died.getTime()) / 86400000), 99);
  assert.equal(ymd(by['gio-dau']), ymd(lunarToSolar(10, 6, 2026, false)));
  assert.equal(ymd(by['gio-het']), ymd(lunarToSolar(10, 6, 2027, false)));
});

test('Ca biên: mùng 1 và rằm tháng nhuận vẫn được nhắc, có chữ "nhuận"', () => {
  const leap1 = lunarToSolar(1, 6, 2025, true)!;
  const from = new Date(leap1.getFullYear(), leap1.getMonth(), leap1.getDate() - 2);
  const next = nextByRule({ kind: 'monthly', days: [1, 15] }, from)!;
  assert.equal(ymd(next), ymd(leap1));
  const plan = planNotifications(new Date(from.getTime() - 3600000), REMIND, RITUALS, []);
  assert.ok(plan.some((p) => /nhuận/.test(p.title)), 'có thông báo ghi "nhuận"');
  // Lễ cố định theo tháng (rằm tháng Bảy) không tính ở tháng nhuận
  const vuLan = nextByRule({ kind: 'yearly', day: 15, month: 7 }, from)!;
  assert.equal(lunarOf(vuLan).leap, false);
});

test('Ca biên: 51 ngày giỗ → không quá 50 thông báo, giữ cái sớm nhất, thứ tự tăng dần', () => {
  const now = new Date(2026, 10, 1, 9, 0);
  const gios = Array.from({ length: 51 }, (_, i) => gio(1 + (i % 28), 1 + ((i * 5) % 12), false, `g${i}`));
  const plan = planNotifications(now, REMIND, RITUALS, gios);
  assert.ok(plan.length <= MAX_SCHEDULED);
  for (let i = 1; i < plan.length; i++) assert.ok(plan[i].at >= plan[i - 1].at);
  assert.ok(plan.every((p) => p.at > now));
  const all = planNotifications(now, REMIND, RITUALS, gios, 400);
  assert.ok(ymd(plan[0].at) === ymd(all[0].at), 'thông báo sớm nhất không bị bỏ');
  assert.equal(new Set(plan.map((p) => p.id)).size, plan.length, 'không trùng id');
});

test('Ô nhập ngày: báo lỗi bằng lời thường, không văng lỗi', () => {
  const err = (v: Parameters<typeof resolveDate>[0]) => {
    const r = resolveDate(v);
    assert.ok(r && 'error' in r, JSON.stringify(v));
    return r.error;
  };
  assert.match(err({ calendar: 'duong', day: '31', month: '2', year: '2026' }), /không có ngày 31/);
  assert.match(err({ calendar: 'am', day: '30', month: '12', year: '2026' }), /chỉ có 29 ngày/);
  assert.match(err({ calendar: 'am', day: '1', month: '5', year: '2026', leap: true }), /không có tháng 5 nhuận/);
  assert.match(err({ calendar: 'duong', day: '1', month: '1', year: '1899' }), /1900–2099/);
  assert.match(err({ calendar: 'duong', day: '15', month: '1', year: '1900' }), /quá sớm/);
  assert.match(err({ calendar: 'duong', day: '1', month: '13', year: '2000' }), /Tháng từ 1 đến 12/);
  assert.match(err({ calendar: 'duong', day: '0', month: '5', year: '2000' }), /không có ngày 0/);
  assert.equal(resolveDate({ calendar: 'duong', day: '', month: '', year: '1975' }), null);
  assert.equal(resolveDate({ calendar: 'duong', day: '1', month: '1', year: '19' }), null);
  const leap = resolveDate({ calendar: 'am', day: '15', month: '6', year: '2025', leap: true });
  assert.ok(leap && 'solar' in leap && leap.lunar.leap);
  assert.throws(() => solarToLunar(1, 1, 1900), OutOfRangeError);
});

test('Lưới lịch: 42 ô, bắt đầu thứ Hai, đúng số ngày trong tháng (cả tháng 2 nhuận, đổi giờ mùa hè)', () => {
  for (const [y, m, days] of [
    [2026, 1, 28],
    [2024, 1, 29],
    [2026, 2, 31],
    [2026, 10, 30],
    [2100, 11, 31],
  ] as const) {
    const cells = monthCells(y, m);
    assert.equal(cells.length, 42);
    assert.equal(cells[0].date.getDay(), 1, 'ô đầu là thứ Hai');
    assert.equal(cells.filter((c) => c.inMonth).length, days);
    for (let i = 1; i < 42; i++) assert.equal(Math.round((cells[i].date.getTime() - cells[i - 1].date.getTime()) / 86400000), 1);
  }
});

/* ======================= Big data ======================= */
test('Dữ liệu lớn: mọi ngày 31/1/1900–31/12/2100 đổi âm rồi đổi lại đúng ngày dương (≈73.400 ngày, < 3 s)', () => {
  let n = 0;
  const [, ms] = timed(() => {
    for (let d = new Date(1900, 0, 31); d.getFullYear() <= 2100; d.setDate(d.getDate() + 1)) {
      const l = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
      const back = lunarToSolar(l.day, l.month, l.year, l.leap)!;
      if (ymd(back) !== ymd(d)) assert.fail(`${ymd(d)} → ${JSON.stringify(l)} → ${ymd(back)}`);
      n++;
    }
  });
  assert.ok(n > 73000);
  assert.ok(ms < 3000, `mất ${ms.toFixed(0)} ms`);
  console.log(`  ${n} ngày trong ${ms.toFixed(0)} ms`);
});

test('Dữ liệu lớn: 1.000 ngày giỗ → lên lịch thông báo < 300 ms, giỗ tới < 100 ms', () => {
  const gios = Array.from({ length: 1000 }, (_, i) =>
    gio(1 + ((i * 7) % 30), 1 + ((i * 11) % 12), i % 97 === 0, `g${i}`),
  );
  const now = new Date(2026, 10, 1, 9);
  const [plan, ms] = timed(() => planNotifications(now, REMIND, RITUALS, gios));
  assert.ok(plan.length <= MAX_SCHEDULED);
  assert.ok(ms < 300, `planNotifications ${ms.toFixed(0)} ms`);
  const [nexts, ms2] = timed(() => gios.map((g) => nextGio(g, now)));
  assert.ok(nexts.every((o) => o && o.date >= new Date(2026, 10, 1)));
  assert.ok(ms2 < 100, `nextGio ×1000 ${ms2.toFixed(0)} ms`);
  console.log(`  lên lịch ${ms.toFixed(1)} ms, giỗ tới ${ms2.toFixed(1)} ms`);
});

test('Dữ liệu lớn: 200 người × 100 năm Tuổi & năm < 500 ms; 1.000 lượt tìm < 1 s', () => {
  const [, ms] = timed(() => {
    for (let p = 0; p < 200; p++)
      for (let y = 2000; y < 2100; y++) ageYear(1920 + (p % 100), p % 2 ? 'nam' : 'nu', y);
  });
  assert.ok(ms < 500, `ageYear ×20.000 ${ms.toFixed(0)} ms`);
  const qs = ['ong tao', 'giỗ đầu', 'huong chay', 'Thần tài', 'vu lan', 'nhập trạch', 'hoa vang', 'xyz không có', 'r', 'mâm ngũ quả'];
  const [, ms2] = timed(() => {
    for (let i = 0; i < 1000; i++) search(qs[i % qs.length]);
  });
  assert.ok(ms2 < 1000, `search ×1000 ${ms2.toFixed(0)} ms`);
  console.log(`  Tuổi & năm 20.000 lượt ${ms.toFixed(0)} ms; tìm 1.000 lượt ${ms2.toFixed(0)} ms`);
});

test('Dữ liệu lớn: lưới lịch 2.412 tháng (1900–2100) < 3 s; dữ liệu lưu với 1.000 giỗ + 500 lần khấn < 512 KB', () => {
  const [, ms] = timed(() => {
    for (let y = 1900; y <= 2100; y++) for (let m = 0; m < 12; m++) monthCells(y, m);
  });
  assert.ok(ms < 3000, `monthCells ${ms.toFixed(0)} ms`);
  const state = {
    anniversaries: Array.from({ length: 1000 }, (_, i) => ({ ...gio(1, 1, false, `g${i}`), dishes: 'Xôi gấc, gà luộc, canh măng' })),
    prayLogs: Array.from({ length: 500 }, (_, i) => ({ id: `l${i}-xxxxxxxx-xxxx`, ritualId: 'mung-1-ram', at: Date.now() })),
    people: Array.from({ length: 60 }, (_, i) => ({ id: `p${i}`, name: 'Nguyễn Văn An', birthLunarYear: 1970 })),
  };
  const bytes = Buffer.byteLength(JSON.stringify(state));
  assert.ok(bytes < 512 * 1024, `${bytes} byte`);
  console.log(`  lịch ${ms.toFixed(0)} ms; dữ liệu lưu ${(bytes / 1024).toFixed(0)} KB`);
});

test('Biên bảng âm lịch: lưới tháng 1–2/1900 và 12/2100 không văng lỗi, ô ngoài phạm vi để trống', () => {
  const feb1900 = monthCells(1900, 1);
  assert.ok(feb1900.some((c) => c.lunar === null));
  assert.ok(feb1900.filter((c) => c.inMonth).every((c) => c.lunar));
  const dec2100 = monthCells(2100, 11);
  assert.equal(dec2100.length, 42);
  assert.ok(dec2100.filter((c) => c.inMonth).every((c) => c.lunar));
  assert.equal(nextByRule({ kind: 'yearly', day: 15, month: 1 }, new Date(2101, 11, 20)), null);
});
