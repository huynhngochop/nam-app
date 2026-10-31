import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIntent, periodRange } from '../apps/vi-gon/src/ask';
import { monthlyNeed } from '../apps/vi-gon/src/funds';
import { DEFAULT_CATEGORIES } from '../apps/vi-gon/src/types';
import { parseLocally, parsePrice } from '../apps/hen-dep/src/priceBoard';
import { templateVariants } from '../apps/hen-dep/src/promo';
import { preCheck } from '../apps/meo-nha/src/lib/ask';
import { searchTips } from '../apps/meo-nha/src/lib/search';
import { windowClassOf } from '../packages/ui/src/layout';

const funds = [
  {
    id: 'f1',
    name: 'Du lịch Đà Nẵng',
    icon: 'map-pin' as const,
    goal: 10_000_000,
    saved: 2_000_000,
    deadline: null,
    remindPayday: true,
    createdAt: 0,
  },
];

/* ---------------- Ví Gọn: hiểu câu hỏi trên máy ---------------- */
test('Ví Gọn: "Tháng này ăn uống hết bao nhiêu?"', () => {
  const i = parseIntent('Tháng này ăn uống hết bao nhiêu?', DEFAULT_CATEGORIES, funds)!;
  assert.equal(i.metric, 'sum');
  assert.equal(i.categoryId, 'food');
  assert.equal(i.period, 'this_month');
  assert.equal(i.kind, 'expense');
});
test('Ví Gọn: so sánh / tăng nhiều nhất', () => {
  const i = parseIntent('Khoản nào tăng nhiều nhất so với tháng trước?', DEFAULT_CATEGORIES, funds)!;
  assert.equal(i.metric, 'change');
  assert.equal(i.period, 'last_month');
});
test('Ví Gọn: còn được chi bao nhiêu', () => {
  assert.equal(parseIntent('Tháng này còn được chi bao nhiêu?', DEFAULT_CATEGORIES, funds)!.metric, 'left');
});
test('Ví Gọn: tuần này đi lại / tháng 9 / thu nhập', () => {
  const a = parseIntent('Tuần này đi lại hết bao nhiêu', DEFAULT_CATEGORIES, funds)!;
  assert.equal(a.categoryId, 'move');
  assert.equal(a.period, 'this_week');
  assert.equal(parseIntent('tháng 9 tiền điện bao nhiêu', DEFAULT_CATEGORIES, funds)!.period, 'month_9');
  const inc = parseIntent('Tháng này lương được bao nhiêu', DEFAULT_CATEGORIES, funds)!;
  assert.equal(inc.kind, 'income');
  assert.equal(inc.categoryId, 'salary');
});
test('Ví Gọn: hỏi quỹ', () => {
  const i = parseIntent('Còn bao lâu đủ quỹ Đà Nẵng?', DEFAULT_CATEGORIES, funds)!;
  assert.equal(i.metric, 'fund_eta');
  assert.equal(i.fundId, 'f1');
});
test('Ví Gọn: câu không liên quan → null (để nhờ AI hiểu)', () => {
  assert.equal(parseIntent('Thời tiết mai thế nào', DEFAULT_CATEGORIES, funds), null);
});
test('Ví Gọn: kỳ theo ngày lương', () => {
  const now = new Date(2026, 9, 5); // 5/10, lương ngày 10 → kỳ 10/9–10/10
  const r = periodRange('this_month', 10, now);
  assert.equal(new Date(r.from).getDate(), 10);
  assert.equal(new Date(r.from).getMonth(), 8);
  assert.equal(new Date(r.to).getMonth(), 9);
  const w = periodRange('this_week', 1, new Date(2026, 9, 29)); // thứ Năm
  assert.equal(new Date(w.from).getDay(), 1);
});
test('Ví Gọn: số cần góp mỗi tháng', () => {
  const now = new Date(2026, 9, 1).getTime();
  assert.equal(monthlyNeed({ goal: 12_000_000, saved: 0, deadline: now + 6 * 30.4 * 86400000 }, now), 2_000_000);
  assert.equal(monthlyNeed({ goal: 1, saved: 0, deadline: null }), null);
  assert.equal(monthlyNeed({ goal: 100, saved: 200, deadline: now + 86400000 }, now), 0);
});

/* ---------------- Hẹn Đẹp: đọc bảng giá ---------------- */
test('Hẹn Đẹp: parsePrice các dạng', () => {
  assert.equal(parsePrice('180K'), 180000);
  assert.equal(parsePrice('120.000'), 120000);
  assert.equal(parsePrice('1tr2'), 1200000);
  assert.equal(parsePrice('650,000đ'), 650000);
  assert.equal(parsePrice('abc'), null);
});
test('Hẹn Đẹp: parseLocally bảng giá dán', () => {
  const r = parseLocally(
    'BẢNG GIÁ\nCắt + gội + sấy ........ 180K\nNhuộm thời trang 650k\nUốn lạnh 800K 150 phút\nGội dưỡng sinh',
  );
  assert.equal(r.length, 4);
  assert.equal(r[0].price, 180000);
  assert.equal(r[1].group, 'Tóc');
  assert.equal(r[1].durationMin, 120);
  assert.ok(r[1].durationGuessed);
  assert.equal(r[2].durationMin, 150);
  assert.equal(r[2].durationGuessed, false);
  assert.equal(r[3].price, null);
});
test('Hẹn Đẹp: mẫu tin ưu đãi luôn có link và % và ≤160 ký tự', () => {
  for (const goal of ['lunch', 'lapsed', 'birthday', 'new_service'] as const)
    for (const tone of ['friendly', 'polite', 'fun'] as const) {
      for (const v of templateVariants({
        shopName: 'Salon Mây',
        link: 'hendep.app/salon-may',
        goal,
        tone,
        offerPct: 20,
      })) {
        assert.ok(v.includes('hendep.app/salon-may'), v);
        assert.ok(v.includes('20%'), v);
        assert.ok(v.length <= 160);
      }
    }
});

/* ---------------- Mẹo Nhà ---------------- */
test('Mẹo Nhà: chặn câu nguy hiểm, không chặn nhầm', () => {
  assert.equal(preCheck('trộn javel với giấm để tẩy mạnh hơn được không')?.kind, 'danger');
  assert.equal(preCheck('cách khử mùi tanh của cá'), null);
  assert.equal(preCheck('làm sốt cà chua cho gà'), null);
});
test('Mẹo Nhà: tìm không dấu vẫn ra kết quả', () => {
  assert.ok(searchTips('khu mui tu lanh').length > 0);
});

/* ---------------- Bố cục đa màn hình ---------------- */
test('Cỡ cửa sổ: điện thoại / máy gập / tablet', () => {
  assert.equal(windowClassOf(390), 'compact'); // điện thoại
  assert.equal(windowClassOf(673), 'medium'); // máy gập mở dọc
  assert.equal(windowClassOf(884), 'expanded'); // máy gập mở ngang
  assert.equal(windowClassOf(1194), 'expanded'); // iPad ngang
});
