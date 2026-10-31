// Seed QA (chỉ chép vào bản build trong CI thành app/qa-seed.tsx): một tiệm đông khách chạy 12 tháng.
import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { useHen } from '../src/store';
import { DEFAULT_SHOP } from '../src/seed';
import { Booking, BookingStatus, Customer, Service, Staff } from '../src/types';

let seed = 31102026;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

const HO = [
  'Nguyễn',
  'Trần',
  'Lê',
  'Phạm',
  'Hoàng',
  'Huỳnh',
  'Phan',
  'Vũ',
  'Võ',
  'Đặng',
  'Bùi',
  'Đỗ',
  'Hồ',
  'Ngô',
  'Dương',
  'Lý',
];
const DEM = ['Thị', 'Văn', 'Ngọc', 'Minh', 'Thu', 'Thanh', 'Hoài', 'Bảo', 'Khánh', 'Gia', 'Mỹ', 'Quỳnh'];
const TEN = [
  'Anh',
  'Lan',
  'Hằng',
  'Trang',
  'Linh',
  'Hương',
  'Mai',
  'Thảo',
  'Vy',
  'Ngân',
  'Hà',
  'Tú',
  'Nam',
  'Huy',
  'Phúc',
  'Yến',
  'Nhi',
  'Châu',
  'Duyên',
  'Trâm',
];
const GROUPS: [string, string[], number, number, number][] = [
  [
    'Tóc',
    [
      'Cắt nữ',
      'Cắt nam',
      'Cắt + gội + sấy',
      'Nhuộm thời trang',
      'Nhuộm phủ bạc',
      'Uốn lạnh',
      'Uốn nóng',
      'Duỗi',
      'Phục hồi keratin',
      'Tẩy tóc',
      'Highlight',
      'Balayage',
    ],
    30,
    180,
    100,
  ],
  ['Gội dưỡng', ['Gội dưỡng sinh', 'Gội thảo dược', 'Gội + massage cổ vai', 'Gội đầu bấm huyệt'], 30, 75, 80],
  ['Nail', ['Sơn gel', 'Sơn thường', 'Đắp bột', 'Úp móng', 'Vẽ móng', 'Cắt da', 'Tháo gel', 'Nối móng'], 20, 120, 60],
  [
    'Spa',
    [
      'Chăm sóc da cơ bản',
      'Lấy nhân mụn',
      'Massage body',
      'Massage mặt',
      'Tắm trắng',
      'Triệt lông nách',
      'Đắp mặt nạ vàng',
      'Xông hơi',
    ],
    30,
    120,
    150,
  ],
  [
    'Trang điểm',
    [
      'Trang điểm dự tiệc',
      'Trang điểm cô dâu',
      'Làm tóc cô dâu',
      'Trang điểm kỷ yếu',
      'Trang điểm sự kiện',
      'Uốn mi',
      'Nối mi',
      'Phun mày',
    ],
    45,
    180,
    300,
  ],
];

async function run(log: (s: string) => void) {
  const t0 = Date.now();
  const now = Date.now();
  const staff: Staff[] = Array.from({ length: 8 }, (_, i) => ({
    id: `st${i}`,
    name: ['Chị Hà', 'Anh Tuấn', 'Ngọc', 'Bảo', 'Thảo', 'Linh', 'Phương', 'Khoa'][i],
    phone: `09090000${i}${i}`,
    role: i === 0 ? 'manager' : i === 7 ? 'assistant' : 'stylist',
    shiftFrom: i % 2 ? '12:00' : '08:00',
    shiftTo: i % 2 ? '21:00' : '17:00',
    onlineToday: i !== 5,
    commissionPct: [15, 15, 12, 12, 10, 10, 10, 5][i],
  }));
  const services: Service[] = [];
  GROUPS.forEach(([g, names, dmin, dmax, base]) =>
    names.forEach((n) =>
      services.push({
        id: `sv${services.length}`,
        group: g,
        name: n,
        durationMin: Math.round(int(dmin, dmax) / 15) * 15,
        price: Math.round(base + int(0, 8) * base * 0.25) * 1000,
        staffIds: staff.filter(() => rnd() < 0.6).map((s) => s.id),
        visible: rnd() < 0.92,
        order: services.length,
      }),
    ),
  );
  services.forEach((s) => {
    if (!s.staffIds.length) s.staffIds = [staff[1].id];
  });
  const customers: Customer[] = Array.from({ length: 2500 }, (_, i) => ({
    id: `cu${i}`,
    name: `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`,
    phone: `09${String(10000000 + i * 3917).slice(-8)}`,
    birthday: rnd() < 0.6 ? `${int(1, 28)}/${int(1, 12)}` : undefined,
    note:
      rnd() < 0.15
        ? pick([
            'Da nhạy cảm',
            'Thích thợ Hà',
            'Hay đến trễ 10 phút',
            'Dị ứng thuốc nhuộm cũ',
            'Khách VIP, ưu tiên phòng riêng',
          ])
        : undefined,
    createdAt: now - int(1, 400) * 86400000,
    marketingConsent: rnd() < 0.7,
  }));
  log(`${staff.length} thợ, ${services.length} dịch vụ, ${customers.length} khách`);

  const bookings: Booking[] = [];
  let code = 3000;
  const regulars = customers.slice(0, 600);
  for (let d = -365; d <= 14; d++) {
    const day = new Date(now + d * 86400000);
    if (day.getDay() === 0 && rnd() < 0.7) continue;
    for (const st of staff) {
      if (st.role === 'assistant') continue;
      const [fh] = st.shiftFrom.split(':').map(Number);
      const [th] = st.shiftTo.split(':').map(Number);
      let t = new Date(day);
      t.setHours(fh, 0, 0, 0);
      const end = new Date(day);
      end.setHours(th, 0, 0, 0);
      const busy = d < 0 ? 0.62 : d === 0 ? 0.7 : Math.max(0.15, 0.6 - d * 0.04);
      while (t.getTime() < end.getTime()) {
        const svc = services.filter((s) => s.staffIds.includes(st.id));
        const sv = pick(svc.length ? svc : services);
        const dur = sv.durationMin;
        if (rnd() < busy && t.getTime() + dur * 60000 <= end.getTime()) {
          const start = t.getTime();
          const past = start + dur * 60000 < now;
          let status: BookingStatus = 'confirmed';
          if (past) {
            const r = rnd();
            status = r < 0.86 ? 'completed' : r < 0.92 ? 'no_show' : 'cancelled';
          } else if (start < now) status = 'in_service';
          else if (d === 0 && start - now < 1800000) status = rnd() < 0.5 ? 'checked_in' : 'confirmed';
          const extra = rnd() < 0.2 ? [pick(services).id] : [];
          const cu = rnd() < 0.7 ? pick(regulars) : pick(customers);
          const price = [sv, ...services.filter((s) => extra.includes(s.id))].reduce((a, s) => a + s.price, 0);
          bookings.push({
            id: `bk${bookings.length}`,
            code: `HD-${++code}`,
            customerId: cu.id,
            staffId: st.id,
            serviceIds: [sv.id, ...extra],
            startAt: start,
            endAt: start + dur * 60000,
            status,
            source: pick(['zalo', 'zalo', 'facebook', 'maps', 'qr', 'web', 'manual']),
            customerNote: rnd() < 0.05 ? 'Cho em chỗ gần cửa sổ' : undefined,
            payment:
              status === 'completed'
                ? { amount: price, method: pick(['cash', 'transfer', 'transfer', 'card']), paidAt: start + dur * 60000 }
                : undefined,
            synced: true,
          });
          t = new Date(start + (dur + 15) * 60000);
        } else t = new Date(t.getTime() + 30 * 60000);
      }
    }
  }
  log(`${bookings.length} lịch hẹn`);
  useHen.setState({
    auth: { phone: '0909123456', role: 'owner' },
    setupDone: true,
    shop: { ...DEFAULT_SHOP, name: 'Salon Mây Quận 1', phone: '0909123456' },
    staff,
    services,
    customers,
    bookings,
    lastBookingCode: code,
    plan: { code: 'standard', cycle: 'month', trialEndsAt: now - 86400000 },
    campaigns: Array.from({ length: 30 }, (_, i) => ({
      id: `cp${i}`,
      audience: pick(['lapsed', 'vip', 'custom']),
      count: int(20, 400),
      message: `Salon Mây giảm ${pick([10, 15, 20])}% cho chị tuần này, đặt lịch tại hendep.app/salon-may`,
      sentAt: now - i * 9 * 86400000,
    })),
  });
  await new Promise((r) => setTimeout(r, 4000));
  const kv = (await Storage.getItem('hen-dep')) ?? '';
  return {
    app: 'hen-dep',
    customers: customers.length,
    bookings: bookings.length,
    services: services.length,
    totalMs: Date.now() - t0,
    kvBytes: kv.length,
  };
}

export default function QaSeed() {
  const [lines, setLines] = useState<string[]>(['Đang tạo dữ liệu…']);
  useEffect(() => {
    run((s) => setLines((l) => [...l, s]))
      .then((r) => setLines((l) => [...l, `QA_SEED_DONE ${JSON.stringify(r)}`]))
      .catch((e) => setLines((l) => [...l, `QA_SEED_FAIL ${String(e?.stack || e)}`]));
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      {lines.map((l, i) => (
        <Text key={i}>{l}</Text>
      ))}
    </ScrollView>
  );
}
