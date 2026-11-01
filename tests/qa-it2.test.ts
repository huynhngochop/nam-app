// Test cho các lỗi tìm thấy ở vòng IT 2 (dữ liệu lớn). Mỗi test ghi mã lỗi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { customerIndex } from '../apps/hen-dep/src/customerIndex';
import type { Booking, BookingStatus, Service } from '../apps/hen-dep/src/types';
import { createDebouncedStorage } from '../packages/core/src/debouncedStorage';

/* ---------------- IT2 · Hẹn Đẹp: số liệu khách tính một lần ---------------- */
const services = [
  { id: 's1', price: 100_000 },
  { id: 's2', price: 50_000 },
] as Service[];
const STATUSES: BookingStatus[] = ['completed', 'completed', 'no_show', 'cancelled', 'confirmed'];
const bookings = Array.from({ length: 600 }, (_, i) => ({
  id: `b${i}`,
  customerId: `c${i % 37}`,
  serviceIds: i % 3 ? ['s1'] : ['s1', 's2', 'gone'],
  startAt: 1_700_000_000_000 + ((i * 7919) % 600) * 3_600_000,
  status: STATUSES[i % STATUSES.length],
  payment: i % 11 === 0 ? { amount: 77_000 } : undefined,
})) as unknown as Booking[];

/** Cách tính cũ (customerStats) cho từng khách — làm chuẩn để so. */
function reference(cId: string) {
  const mine = bookings.filter((b) => b.customerId === cId);
  const done = mine.filter((b) => b.status === 'completed');
  const price = (b: Booking) =>
    b.payment?.amount ?? b.serviceIds.reduce((a, id) => a + (services.find((s) => s.id === id)?.price ?? 0), 0);
  return {
    visits: done.length,
    spend: done.reduce((a, b) => a + price(b), 0),
    noShows: mine.filter((b) => b.status === 'no_show').length,
    lastAt: done.length ? Math.max(...done.map((b) => b.startAt)) : undefined,
  };
}

test('IT2: customerIndex cho cùng kết quả với cách tính từng khách', () => {
  const idx = customerIndex(bookings, services);
  for (let i = 0; i < 37; i++) {
    const got = idx.get(`c${i}`);
    assert.deepEqual({ ...got, lastAt: got.lastAt }, reference(`c${i}`), `c${i}`);
  }
  assert.deepEqual(idx.get('khong-co'), { visits: 0, spend: 0, noShows: 0 });
});

test('IT2: 2.500 khách × 10 nghìn lịch hẹn tính dưới 100 ms', () => {
  const big = Array.from({ length: 10_000 }, (_, i) => ({
    ...bookings[i % 600],
    id: `x${i}`,
    customerId: `c${i % 2500}`,
  }));
  const t = performance.now();
  const idx = customerIndex(big, services);
  for (let i = 0; i < 2500; i++) idx.get(`c${i}`);
  assert.ok(performance.now() - t < 100, `mất ${Math.round(performance.now() - t)} ms`);
});

/* ---------------- IT3 · Lưu store lớn: gom các lần ghi ---------------- */
test('IT3: nhiều lần setItem liền nhau chỉ ghi một lần, giá trị mới nhất; flush ghi ngay', async () => {
  const writes: [string, string][] = [];
  const mem = new Map<string, string>();
  const backing = () => ({
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      writes.push([k, v]);
      mem.set(k, v);
    },
    removeItem: (k: string) => mem.delete(k),
  });
  const s = createDebouncedStorage<{ n: number }>(backing, 30);
  for (let n = 1; n <= 50; n++) s.setItem('hen', { state: { n }, version: 0 });
  assert.equal(writes.length, 0, 'chưa ghi khi còn đang thay đổi');
  assert.deepEqual(await s.getItem('hen'), { state: { n: 50 }, version: 0 }, 'đọc ngay vẫn thấy giá trị mới');
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(writes[0][1]), { state: { n: 50 }, version: 0 });

  s.setItem('hen', { state: { n: 51 } });
  s.flush();
  assert.equal(writes.length, 2, 'flush (app chuyển nền) ghi ngay');
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(writes.length, 2, 'không ghi lại lần nữa sau flush');

  s.setItem('hen', { state: { n: 52 } });
  await s.removeItem('hen');
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(mem.has('hen'), false, 'xóa thì bỏ cả lần ghi đang chờ');
});

/* ---------------- Vòng 3 (UAT) · Hẹn Đẹp ---------------- */
test('UAT H2: thêm lại cùng dịch vụ (quay lại bước thiết lập) không nhân đôi bảng giá', async () => {
  const { useHen } = await import('../apps/hen-dep/src/store');
  useHen.setState({ services: [] });
  const svc = [
    { name: 'Sơn gel', price: 200_000, durationMin: 60, group: 'Nail', staffIds: [], visible: true },
    { name: 'Vẽ móng', price: 100_000, durationMin: 30, group: 'Nail', staffIds: [], visible: true },
  ] as Parameters<ReturnType<typeof useHen.getState>['addServices']>[0];
  useHen.getState().addServices(svc);
  useHen.getState().addServices(svc);
  useHen.getState().addServices([
    { ...svc[0], name: ' sơn GEL ' },
    { ...svc[1], price: 120_000 },
  ]);
  const names = useHen.getState().services.map((x) => `${x.name}|${x.price}`);
  assert.deepEqual(names, ['Sơn gel|200000', 'Vẽ móng|100000', 'Vẽ móng|120000']);
});

test('UAT H3: ngày tiệm nghỉ không gợi ý lấp chỗ trống; không gợi ý quá giờ đóng cửa', async () => {
  const { findGap } = await import('../apps/hen-dep/src/store');
  const sunday = new Date(2026, 10, 1, 14, 40).getTime(); // CN 1/11/2026
  const monday = new Date(2026, 10, 2, 17, 40).getTime();
  const staff = [{ id: 's1', name: 'Tôi', shiftFrom: '08:00', shiftTo: '20:00', onlineToday: true }] as never[];
  const hours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: day !== 0, from: '08:00', to: '19:00' }));
  assert.equal(findGap(staff, [], sunday, hours), null, 'CN nghỉ');
  const g = findGap(staff, [], monday, hours);
  assert.ok(g, 'T2 có chỗ trống');
  assert.equal(new Date(g!.to).getHours(), 19, 'kết thúc ở giờ đóng cửa 19:00, không phải hết ca 20:00');
  // Không truyền giờ mở cửa: giữ cách cũ (theo ca thợ).
  assert.equal(new Date(findGap(staff, [], monday)!.to).getHours(), 20);
});
