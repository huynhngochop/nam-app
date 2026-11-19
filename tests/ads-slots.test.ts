/* Chỗ đặt quảng cáo xen trong danh sách (@nam/ads). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAdSlot, withAds } from '../packages/ads/src/slots';

const items = Array.from({ length: 30 }, (_, i) => ({ id: `t${i}` }));

test('không đặt quảng cáo ở đầu danh sách, cách đều, không đặt ở cuối', () => {
  const rows = withAds(items, { first: 3, every: 8 });
  const adAt = rows.map((r, i) => (isAdSlot(r) ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(adAt, [3, 12, 21, 30]);
  assert.ok(!isAdSlot(rows[0]));
  assert.ok(!isAdSlot(rows[rows.length - 1]));
  assert.equal(rows.filter((r) => !isAdSlot(r)).length, items.length, 'không mất mục nào');
  assert.equal(new Set(rows.filter(isAdSlot).map((r) => r.key)).size, adAt.length, 'khóa không trùng');
});

test('danh sách ngắn hoặc tắt quảng cáo: giữ nguyên', () => {
  assert.equal(withAds(items.slice(0, 2)).length, 2);
  assert.equal(withAds(items, { enabled: false }).length, items.length);
  assert.equal(withAds([]).length, 0);
});

test('khoảng cách tối thiểu 4 mục để không dày quảng cáo', () => {
  const rows = withAds(items, { first: 1, every: 1 });
  const adAt = rows.map((r, i) => (isAdSlot(r) ? i : -1)).filter((i) => i >= 0);
  for (let k = 1; k < adAt.length; k++) assert.ok(adAt[k] - adAt[k - 1] >= 5);
});
