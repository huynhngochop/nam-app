import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { jdFromDate, jdToDate, solarToLunarAstro } from '../apps/thanh-tam/src/calendar/astro';
import { buildLunarTable } from '../apps/thanh-tam/src/calendar/buildTable';
import * as DATA from '../apps/thanh-tam/src/calendar/lunarData';
import {
  canChiDay, canChiMonth, canChiYear, hoangDaoHours, leapOf, lunarDayWords, lunarMonthLength, lunarToSolar, solarToLunar, tetOf, thanhMinhOf,
} from '../apps/thanh-tam/src/calendar/lunar';
import {
  ageYear, birthLunarYear, cungPhi, hoangOc, kimLau, napAm, saoChieuMenh, tamTai, thaiTue, tuoiMu, vanHan, BAT_TRACH,
} from '../apps/thanh-tam/src/age';
import { gioInLunarYear, memorialMilestones, nextByRule, nextGio, planNotifications, MAX_SCHEDULED, type Anniversary } from '../apps/thanh-tam/src/lib/schedule';
import { buildPrayer, dateFields, fieldsUsed, skipEmpty, plainText } from '../apps/thanh-tam/src/lib/prayer';
import { search } from '../apps/thanh-tam/src/lib/search';
import { topTraits } from '../apps/thanh-tam/src/face/data';
import { RITUALS } from '../apps/thanh-tam/src/data/rituals';
import { PRAYERS, prayerById } from '../apps/thanh-tam/src/data/prayers';
import { SIGNS, TIPS } from '../apps/thanh-tam/src/data/signs';
import { AGE_TERMS, YEAR_NOTES } from '../apps/thanh-tam/src/data/ageContent';
import { FACE_PARTS } from '../apps/thanh-tam/src/face/data';

const golden = JSON.parse(readFileSync(join(__dirname, 'fixtures/thanh-tam-lunar-golden.json'), 'utf8')) as {
  tet: Record<string, string>; leap: Record<string, number>; samples: [string, number, number, number, number][];
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const D = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

/* ---------------- Âm lịch ---------------- */
test('Âm lịch: bảng tính sẵn đúng bằng bảng sinh lại từ thuật toán (không ai sửa tay)', () => {
  const t = buildLunarTable();
  assert.equal(DATA.FIRST_MONTH_JD, t.firstMonthJd);
  assert.equal(DATA.MONTH_BITS, t.monthBits);
  assert.equal(DATA.LEAP_MONTHS, t.leapMonths);
  assert.equal(DATA.THANH_MINH, t.thanhMinh);
});
test('Âm lịch: 201 ngày Tết và 74 tháng nhuận khớp bảng vàng từ bản Python độc lập', () => {
  for (const [y, d] of Object.entries(golden.tet)) assert.equal(iso(tetOf(Number(y))), d, `Tết ${y}`);
  for (let y = 1900; y <= 2100; y++) assert.equal(leapOf(y), golden.leap[String(y)] ?? 0, `nhuận ${y}`);
});
test('Âm lịch: 757 ngày mẫu 1900–2100 khớp bảng vàng (cả bảng và thuật toán)', () => {
  for (const [s, day, month, year, leap] of golden.samples) {
    const [y, m, d] = s.split('-').map(Number);
    assert.deepEqual(solarToLunar(d, m, y), { day, month, year, leap: !!leap }, s);
    assert.deepEqual(solarToLunarAstro(d, m, y), { day, month, year, leap: !!leap }, s);
  }
});
test('Âm lịch: Tết Việt Nam đã biết, kể cả các năm khác Trung Quốc', () => {
  const known: [number, string][] = [[1968, '1968-01-29'], [1979, '1979-01-28'], [1985, '1985-01-21'], [2007, '2007-02-17'], [2025, '2025-01-29'],
    [2026, '2026-02-17'], [2027, '2027-02-06'], [2030, '2030-02-02']];
  for (const [y, d] of known) assert.equal(iso(tetOf(y)), d, `Tết ${y}`);
  for (const [y, m] of [[2020, 4], [2023, 2], [2025, 6], [2028, 5], [2033, 11]]) assert.equal(leapOf(y), m);
});
test('Âm lịch: ngày âm ↔ dương hai chiều, tháng thiếu, ngày không tồn tại', () => {
  assert.deepEqual(solarToLunar(31, 10, 2026), { day: 22, month: 9, year: 2026, leap: false });
  assert.deepEqual(solarToLunar(15, 1, 2012), { day: 22, month: 12, year: 2011, leap: false });
  assert.equal(lunarMonthLength(2026, 12), 29); // Chạp Bính Ngọ không có 30
  assert.equal(lunarToSolar(30, 12, 2026), null);
  assert.equal(iso(lunarToSolar(29, 12, 2026)!), '2027-02-05');
  assert.equal(iso(lunarToSolar(1, 6, 2025, true)!), '2025-07-25');
  assert.equal(lunarToSolar(1, 7, 2025, true), null); // 2025 không có tháng 7 nhuận
  for (let jd = jdFromDate(1, 1, 1950); jd < jdFromDate(1, 1, 1952); jd += 3) {
    const g = jdToDate(jd), l = solarToLunar(g.day, g.month, g.year);
    assert.equal(iso(lunarToSolar(l.day, l.month, l.year, l.leap)!), iso(new Date(g.year, g.month - 1, g.day)));
  }
});
test('Âm lịch: can chi ngày, tháng, năm và giờ hoàng đạo khớp nguồn báo', () => {
  assert.equal(canChiDay(new Date(2026, 1, 17)), 'Nhâm Tuất');
  assert.equal(canChiDay(new Date(2030, 1, 2)), 'Mậu Thìn');
  assert.equal(canChiYear(2026), 'Bính Ngọ');
  assert.equal(canChiMonth(1, 2030), 'Mậu Dần');
  assert.equal(canChiMonth(10, 2026), 'Kỷ Hợi');
  assert.deepEqual(hoangDaoHours(new Date(2026, 1, 17)).map((h) => h.label), ['Dần 3–5', 'Thìn 7–9', 'Tỵ 9–11', 'Thân 15–17', 'Dậu 17–19', 'Hợi 21–23']);
  assert.deepEqual(hoangDaoHours(new Date(2026, 10, 9)).map((h) => h.chi), ['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi']);
});
test('Âm lịch: ngày âm bằng chữ cho văn khấn', () => {
  assert.equal(lunarDayWords(1), 'mùng Một');
  assert.equal(lunarDayWords(10), 'mùng Mười');
  assert.equal(lunarDayWords(15), 'Rằm');
  assert.equal(lunarDayWords(14), 'mười bốn');
  assert.equal(lunarDayWords(21), 'hai mươi mốt');
  assert.equal(lunarDayWords(24), 'hai mươi tư');
  assert.equal(lunarDayWords(25), 'hai mươi lăm');
  assert.equal(lunarDayWords(30), 'ba mươi');
});
test('Âm lịch: Thanh minh nằm trong 4–6/4 và ngoài phạm vi thì báo lỗi', () => {
  assert.equal(thanhMinhOf(2024)!.getDate(), 4);
  assert.equal(thanhMinhOf(2025)!.getDate(), 4);
  for (let y = 1900; y <= 2100; y++) assert.ok([4, 5, 6].includes(thanhMinhOf(y)!.getDate()), String(y));
  assert.throws(() => solarToLunar(1, 1, 1900));
});

/* ---------------- Tuổi & năm ---------------- */
test('Tuổi & năm: sinh trước Tết thuộc năm âm trước', () => {
  assert.equal(birthLunarYear(new Date(1975, 1, 10)), 1974);
  assert.equal(birthLunarYear(new Date(1975, 1, 12)), 1975);
  assert.equal(birthLunarYear(new Date(2012, 0, 15)), 2011);
});
test('Tuổi & năm: sao chiếu mệnh, cung phi, nạp âm khớp ví dụ của nguồn', () => {
  assert.equal(saoChieuMenh(48, 'nam'), 'Thủy Diệu');
  assert.equal(saoChieuMenh(48, 'nu'), 'Mộc Đức');
  assert.equal(saoChieuMenh(tuoiMu(2001, 2028), 'nam'), 'La Hầu');
  assert.equal(saoChieuMenh(tuoiMu(2010, 2028), 'nu'), 'Kế Đô');
  assert.equal(cungPhi(1969, 'nam'), 'Tốn'); assert.equal(cungPhi(1970, 'nu'), 'Chấn');
  assert.equal(cungPhi(2005, 'nam'), 'Tốn'); assert.equal(cungPhi(2005, 'nu'), 'Khôn');
  for (const [y, v] of [[1984, 'Hải Trung Kim'], [1990, 'Lộ Bàng Thổ'], [2000, 'Bạch Lạp Kim'], [1975, 'Đại Khê Thủy'], [2026, 'Thiên Hà Thủy'], [2023, 'Kim Bạch Kim']] as const) assert.equal(napAm(y), v);
});
test('Tuổi & năm: vận hạn 11–98, mỗi tuổi đúng một hạn, khớp bảng theo năm sinh của nguồn thứ hai', () => {
  for (let a = 11; a <= 98; a++) { assert.ok(vanHan(a, 'nam')); assert.ok(vanHan(a, 'nu')); }
  assert.equal(vanHan(10, 'nam'), null); assert.equal(vanHan(99, 'nu'), null);
  const B: [number, string, string][] = [[1950, 'Toán Tận', 'Huỳnh Tuyền'], [1975, 'Thiên La', 'Diêm Vương'], [1999, 'Huỳnh Tuyền', 'Toán Tận'], [2015, 'Tam Kheo', 'Thiên Tinh'], [1987, 'Thiên Tinh', 'Tam Kheo']];
  for (const [y, nam, nu] of B) { assert.equal(vanHan(2026 - y, 'nam'), nam, `nam ${y}`); assert.equal(vanHan(2026 - y, 'nu'), nu, `nữ ${y}`); }
  assert.equal(vanHan(28, 'nam'), 'Tam Kheo'); assert.equal(vanHan(19, 'nu'), 'Thiên Tinh');
});
test('Tuổi & năm: hoang ốc khớp 33 tuổi phạm của bảng công bố; kim lâu; tam tai; Thái Tuế', () => {
  const xau: Record<string, number[]> = {
    'Tam Địa Sát': [12, 18, 21, 27, 30, 36, 45, 54, 63, 69, 72], 'Ngũ Thọ Tử': [14, 23, 29, 32, 38, 41, 47, 50, 56, 65, 74],
    'Lục Hoang Ốc': [15, 24, 33, 39, 42, 48, 51, 57, 60, 66, 75],
  };
  for (const [c, ages] of Object.entries(xau)) for (const a of ages) assert.equal(hoangOc(a), c, String(a));
  assert.equal(hoangOc(26), 'Nhì Nghi'); assert.equal(hoangOc(28), 'Tứ Tấn Tài');
  assert.equal(kimLau(53), 'luc-suc'); assert.equal(kimLau(49), null); assert.equal(kimLau(19), 'than');
  assert.equal(tamTai(1975, 2026), 2); assert.equal(tamTai(1975, 2027), 3); assert.equal(tamTai(1978, 2026), 0);
  assert.equal(thaiTue(1978, 2026), 'nam-tuoi'); assert.equal(thaiTue(1984, 2026), 'xung'); assert.equal(thaiTue(1975, 2026), null);
});
test('Tuổi & năm: Bát trạch đủ 8 cung, 8 hướng không trùng', () => {
  for (const [cung, v] of Object.entries(BAT_TRACH)) assert.equal(new Set([...v.good, ...v.avoid]).size, 8, cung);
  assert.deepEqual(BAT_TRACH.Khảm.good, ['Đông Nam', 'Đông', 'Nam', 'Bắc']);
});
test('Tuổi & năm: ví dụ đầy đủ (mock TT-29)', () => {
  const y = ageYear(1999, 'nam', 2026);
  assert.equal(y.canChi, 'Kỷ Mão'); assert.equal(y.tuoiMu, 28); assert.equal(y.sao, 'La Hầu'); assert.equal(y.vanHan, 'Tam Kheo');
  assert.equal(y.tamTai, 2); assert.equal(y.cung, 'Khảm'); assert.equal(y.napAm, 'Thành Đầu Thổ');
});

/* ---------------- Lịch lễ, sổ giỗ, thông báo ---------------- */
test('Lịch lễ: mùng 1, ông Táo, giao thừa tháng thiếu, Thanh minh', () => {
  assert.equal(iso(nextByRule({ kind: 'monthly', days: [1, 15] }, new Date(2026, 10, 8))!), '2026-11-09');
  assert.equal(iso(nextByRule({ kind: 'yearly', day: 23, month: 12 }, new Date(2026, 10, 8))!), '2027-01-30');
  assert.equal(iso(nextByRule({ kind: 'last-day', month: 12 }, new Date(2026, 10, 8))!), '2027-02-05');
  assert.equal(nextByRule({ kind: 'solar-term', term: 'thanh-minh' }, new Date(2026, 0, 1))!.getMonth(), 3);
});
const gio = (day: number, month: number, leap = false): Anniversary => ({ id: 'a', name: 'Trần Thị Hoa', relation: 'Bà nội', lunar: { day, month, leap }, missingDayRule: 'ngay-cuoi-thang', remindDays: [7, 3, 1] });
test('Sổ giỗ: ngày 30 tháng thiếu → 29; mất tháng nhuận → tháng thường', () => {
  const o = gioInLunarYear(gio(30, 12), 2026)!;
  assert.equal(iso(o.date), '2027-02-05'); assert.equal(o.missing, true);
  const n = gioInLunarYear(gio(10, 6, true), 2026)!;
  assert.equal(n.leapShifted, true); assert.equal(n.missing, false);
  assert.equal(iso(nextGio(gio(12, 10), new Date(2026, 10, 8))!.date), '2026-11-20');
});
test('Sổ giỗ: 49 ngày, 100 ngày tính ngày mất là ngày thứ nhất', () => {
  const m = memorialMilestones(new Date(2026, 10, 1));
  assert.equal(iso(m[0].date), '2026-12-19'); assert.equal(iso(m[1].date), '2027-02-08');
  assert.equal(m.length, 4);
});
test('Thông báo: không quá 50 dù có nhiều ngày giỗ (iOS chỉ giữ 64)', () => {
  const many = Array.from({ length: 51 }, (_, i): Anniversary => ({ ...gio((i % 28) + 1, (i % 12) + 1), id: `g${i}` }));
  const plan = planNotifications(new Date(2026, 10, 8, 9), { mung1Ram: true, eveBefore: true, mung10: true, festivals: true, time: '06:30' }, RITUALS, many, 60);
  assert.ok(plan.length <= MAX_SCHEDULED);
  assert.ok(plan.every((p, i) => i === 0 || plan[i - 1].at <= p.at));
  assert.ok(plan.every((p) => p.at > new Date(2026, 10, 8, 9)));
});

/* ---------------- Văn khấn, tìm kiếm, nội dung ---------------- */
test('Văn khấn: điền ngày âm bằng chữ, ô trống, số lần lặp', () => {
  const p = prayerById('gia-tien-thuong')!;
  const paras = buildPrayer(p.body, { tinChu: 'Nguyễn Thị Lan', hoGiaTien: 'Nguyễn', ...dateFields(new Date(2026, 10, 9)) });
  assert.equal(paras[0].repeat, 3);
  const all = paras.map(plainText).join('\n');
  assert.ok(all.includes('ngày mùng Một tháng Mười năm Bính Ngọ'));
  assert.ok(all.includes('(địa chỉ)'));
  const skipped = skipEmpty(paras).map(plainText).join('\n');
  assert.ok(!skipped.includes('(địa chỉ)') && !skipped.includes('ngụ tại'));
  assert.deepEqual(fieldsUsed(p.body).slice(0, 3), ['hoGiaTien', 'tinChu', 'diaChi']);
});
test('Tìm kiếm: gõ không dấu, đồng nghĩa', () => {
  assert.equal(search('ong tao')[0].id, 'ong-cong-ong-tao');
  assert.ok(search('về nhà mới').some((r) => r.id === 'nhap-trach'));
  assert.ok(search('nhang').some((r) => r.type === 'Mẹo'));
  assert.deepEqual(search('a'), []);
});
test('Nội dung: mọi lễ có văn khấn tồn tại; có lửa thì có bước an toàn; không có từ cấm', () => {
  for (const r of RITUALS) for (const id of r.prayers) assert.ok(prayerById(id), `${r.id} → ${id}`);
  const BANNED = ['đại hung', 'tai họa', 'phá sản', 'khắc chồng', 'khắc vợ', 'sát phu', 'vượng phu', 'tướng nghèo', 'phải giải hạn', 'phải cúng sao', 'số may mắn', 'json', 'price_', 'ngoại tuyến', 'đồng bộ'];
  const text = JSON.stringify([RITUALS, PRAYERS, SIGNS, TIPS, AGE_TERMS, YEAR_NOTES, FACE_PARTS]).toLowerCase();
  for (const w of BANNED) assert.ok(!text.includes(w), w);
  for (const s of SIGNS.filter((x) => x.fire)) assert.ok(s.safetyFirst, s.id);
  for (const y of [2026, 2027]) assert.equal(Object.keys(YEAR_NOTES[y]).length, 12);
});
test('Nhân tướng: 3 nét nổi bật, bỏ qua bước "Không chắc"', () => {
  assert.deepEqual(topTraits({ 'dang-mat': 'trai-xoan', tran: 'cao', mui: 'tron', 'tam-dinh': 'can-doi' }), ['điềm đạm', 'tinh tế', 'cân bằng']);
  assert.deepEqual(topTraits({}), []);
  assert.equal(FACE_PARTS.length, 8);
});

test('Màn hình: không lộ chữ kỹ thuật cho người dùng; tuyến nào cũng có tệp', () => {
  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const root = join(__dirname, '../apps/thanh-tam');
  const files = [...walk(join(root, 'app')), join(root, 'src/components.tsx'), join(root, 'src/DateInput.tsx'), ...walk(join(root, 'src/screens'))].filter((f) => f.endsWith('.tsx'));
  // Chỉ xét chữ trong JSX và chuỗi có dấu tiếng Việt (bỏ qua mã, tên biến, đường dẫn import).
  const TECH = [/ngoại tuyến/i, /đồng bộ/i, /\bPRICE_/, /\bJSON\b/, /\bserver\b/i, /\bcache\b/i, /\bAPI\b/, /\.json\b/, /TT-\d+/];
  for (const f of files) {
    const visible = readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*|import )/.test(l))
      .flatMap((l) => [...l.matchAll(/>([^<>{}]+)</g), ...l.matchAll(/'([^']*[À-ỹ][^']*)'/g), ...l.matchAll(/`([^`]*[À-ỹ][^`]*)`/g)].map((m) => m[1]));
    for (const s of visible) for (const re of TECH) assert.ok(!re.test(s), `${f}: "${s.trim()}" có chữ kỹ thuật`);
  }
  const routes = ['(tabs)/today', '(tabs)/rituals', '(tabs)/calendar', '(tabs)/explore', 'ritual/[id]/index', 'ritual/[id]/offerings', 'ritual/[id]/prayer', 'ritual/[id]/pray', 'ritual/[id]/after',
    'anniversaries/index', 'anniversaries/edit', 'sign/[id]', 'tip/[id]', 'age/index', 'age/plan', 'age/term/[id]', 'people/edit', 'face/index', 'face/step/[n]', 'face/result', 'face/part/[partId]/[optionId]',
    'me', 'settings', 'paywall', 'about/sources', 'search', 'onboarding/tradition', 'onboarding/household'];
  for (const r of routes) assert.ok(files.includes(join(root, 'app', `${r}.tsx`)), `thiếu màn ${r}`);
});
