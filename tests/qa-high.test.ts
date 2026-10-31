// Test tái hiện các lỗi mức Cao trong "Báo cáo QA 4 app Năm App" (V1, V2, V4, H1, H2, H4). Mỗi test ghi mã lỗi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBankText } from '../apps/vi-gon/src/parse';
import { parseIntent } from '../apps/vi-gon/src/ask';
import { DEFAULT_CATEGORIES } from '../apps/vi-gon/src/types';
import { untransferKinds } from '../apps/vi-gon/src/transfer';
import { parseLocally, parsePrice } from '../apps/hen-dep/src/priceBoard';
import { nextBookingCode } from '../apps/hen-dep/src/codes';

const now = new Date(2026, 9, 29, 13, 0, 0);
const intent = (q: string) => parseIntent(q, DEFAULT_CATEGORIES, [], now);

/* ---------------- V1 · ngày dạng 29-10-2026 không bị đọc thành số tiền ---------------- */
test('V1: ngày có gạch nối đứng trước số tiền', () => {
  const p = parseBankText('VCB: 29-10-2026 08:12 TK 0011 -50,000VND. SD 2,345,000VND. ND: CA PHE', now)!;
  assert.equal(p.amount, 50000);
  assert.equal(p.kind, 'expense');
  assert.equal(new Date(p.at!).getDate(), 29);
  assert.equal(new Date(p.at!).getHours(), 8);
});
test('V1: các dạng ngày khác vẫn đọc đúng số tiền', () => {
  assert.equal(parseBankText('29-10-26 TK 1234 +2,000,000VND ND: LUONG', now)!.amount, 2000000);
  assert.equal(parseBankText('TK 1234 luc 30-10 07:45 -1.500.000đ ND: HOC PHI', now)!.amount, 1500000);
  assert.equal(parseBankText('TK 1234: PS -45,000VND 31/12 23:59 ND: PHO', now)!.amount, 45000);
});

/* ---------------- V2 · "hôm qua", "còn bao nhiêu", "thứ Hai" không bị hiểu thành danh mục / khoản thu ---------------- */
test('V2: "Chi tiêu hôm qua" = tổng chi hôm qua, không phải danh mục Quà', () => {
  const i = intent('Chi tiêu hôm qua')!;
  assert.equal(i.categoryId, null);
  assert.equal(i.period, 'yesterday');
  assert.equal(i.kind, 'expense');
});
test('V2: "Tháng này còn bao nhiêu" = ngân sách còn lại, không phải danh mục Gia đình', () => {
  const i = intent('Tháng này còn bao nhiêu')!;
  assert.equal(i.metric, 'left');
  assert.equal(i.categoryId, null);
});
test('V2: "thứ Hai" không làm câu hỏi thành khoản thu', () => {
  assert.equal(intent('Thứ hai tuần này ăn uống hết bao nhiêu')!.kind, 'expense');
});
test('V2: vẫn hiểu quà, gia đình khi người dùng hỏi thật', () => {
  assert.equal(intent('Tháng này tiền quà hết bao nhiêu')!.categoryId, 'gift');
  assert.equal(intent('Tiền cho con tháng này')!.categoryId, 'family');
  assert.equal(intent('Hôm qua ăn uống hết bao nhiêu')!.categoryId, 'food');
});

/* ---------------- V4 · bỏ đánh dấu chuyển nội bộ phải trả lại đúng chiều thu/chi ---------------- */
test('V4: chân tiền vào trả lại thành khoản thu, chân kia thành khoản chi', () => {
  const r = untransferKinds({ raw: 'TK 5678 +3,000,000VND ND: CHUYEN TIEN' }, { raw: 'TK 1234 -3,000,000VND ND: CHUYEN TIEN' });
  assert.deepEqual(r, { self: 'income', pair: 'expense' });
});
test('V4: không có tin gốc thì suy từ chân kia; không đoán được thì null (hỏi người dùng)', () => {
  assert.deepEqual(untransferKinds({ raw: null }, { raw: 'TK 1234 -500,000VND' }), { self: 'income', pair: 'expense' });
  assert.deepEqual(untransferKinds({ raw: null }, null), { self: null, pair: null });
});

/* ---------------- H1 · giá có số thập phân ---------------- */
test('H1: "1,5tr", "1.2tr", "2,5 triệu" đọc đúng', () => {
  assert.equal(parsePrice('1,5tr'), 1500000);
  assert.equal(parsePrice('1.2tr'), 1200000);
  assert.equal(parsePrice('2,5 triệu'), 2500000);
  assert.equal(parsePrice('1tr2'), 1200000);
  assert.equal(parsePrice('1tr'), 1000000);
});

/* ---------------- H2 · thời lượng đứng sau giá ---------------- */
test('H2: dòng có thời lượng sau giá vẫn đọc được giá và tên sạch', () => {
  const [a, b, c] = parseLocally('Uốn lạnh 800K 150 phút\nCombo cắt + gội 200k - 45p\nMassage mặt 30\'  250k');
  assert.deepEqual([a.name, a.price, a.durationMin, a.durationGuessed], ['Uốn lạnh', 800000, 150, false]);
  assert.deepEqual([b.name, b.price, b.durationMin], ['Combo cắt + gội', 200000, 45]);
  assert.deepEqual([c.name, c.price, c.durationMin], ['Massage mặt', 250000, 30]);
});
test('H2: đoạn mẫu của nút "Dùng ví dụ" đọc đủ giá từng dòng', () => {
  const SAMPLE = 'BẢNG GIÁ\nCắt + gội + sấy ........ 180K\nCắt nam 120.000\nNhuộm thời trang 650k\nUốn lạnh 800K 150 phút\nGội dưỡng sinh 150k';
  const rows = parseLocally(SAMPLE);
  assert.deepEqual(rows.map((r) => [r.name, r.price]), [
    ['Cắt + gội + sấy', 180000], ['Cắt nam', 120000], ['Nhuộm thời trang', 650000], ['Uốn lạnh', 800000], ['Gội dưỡng sinh', 150000],
  ]);
});
test('H3: "Gội đầu dưỡng sinh" không bị đoán là uốn tóc', () => {
  const [g] = parseLocally('Gội đầu dưỡng sinh 80.000');
  assert.equal(g.group, 'Gội dưỡng');
  assert.equal(g.durationMin, 45);
});

/* ---------------- H4 · mã lịch hẹn không trùng sau khi mở lại app ---------------- */
test('H4: mã mới lớn hơn mọi mã đã có', () => {
  assert.equal(nextBookingCode([]), 'HD-3001');
  assert.equal(nextBookingCode([{ code: 'HD-3001' }, { code: 'HD-3007' }, { code: 'HD-12' }]), 'HD-3008');
  assert.equal(nextBookingCode([{ code: 'HD-5' }]), 'HD-3001');
});
