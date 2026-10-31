import { Booking, Customer, Service, Shop, Staff } from './types';

/** Dữ liệu mẫu để thử app ngay sau khi thiết lập (có thể xóa trong Cài đặt). */
const at = (h: number, m = 0, dayOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

export const DEFAULT_SHOP: Shop = {
  name: 'Salon Mây',
  type: 'Salon tóc',
  address: '12 Lê Lợi, Q.1, TP.HCM',
  phone: '0901234567',
  slug: 'salon-may',
  hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: day !== 0, from: '08:00', to: '20:00' })),
  settings: {
    selfBooking: true,
    minLeadMin: 60,
    cancelBeforeH: 2,
    bufferMin: 10,
    slotStepMin: 15,
    remind24h: true,
    remind2h: true,
    askReview: true,
    depositForNoShow: false,
    vipVisits: 5,
    vipSpend: 1500000,
  },
};

export const SEED_STAFF: Staff[] = [
  {
    id: 's1',
    name: 'Chị Hà',
    role: 'stylist',
    shiftFrom: '08:00',
    shiftTo: '17:00',
    onlineToday: true,
    commissionPct: 15,
  },
  {
    id: 's2',
    name: 'Anh Tuấn',
    role: 'stylist',
    shiftFrom: '12:00',
    shiftTo: '20:00',
    onlineToday: true,
    commissionPct: 15,
  },
  {
    id: 's3',
    name: 'Ngọc',
    role: 'stylist',
    shiftFrom: '08:00',
    shiftTo: '17:00',
    onlineToday: true,
    commissionPct: 12,
  },
];

export const SEED_SERVICES: Service[] = [
  {
    id: 'v1',
    group: 'Tóc',
    name: 'Cắt + gội + sấy',
    durationMin: 45,
    price: 180000,
    staffIds: ['s1', 's2'],
    visible: true,
    order: 0,
  },
  {
    id: 'v2',
    group: 'Tóc',
    name: 'Cắt nam',
    durationMin: 30,
    price: 120000,
    staffIds: ['s1', 's2'],
    visible: true,
    order: 1,
  },
  {
    id: 'v3',
    group: 'Tóc',
    name: 'Nhuộm thời trang',
    durationMin: 120,
    price: 650000,
    staffIds: ['s1'],
    visible: true,
    order: 2,
  },
  {
    id: 'v4',
    group: 'Tóc',
    name: 'Uốn lạnh',
    durationMin: 150,
    price: 800000,
    staffIds: ['s2'],
    visible: true,
    order: 3,
  },
  {
    id: 'v5',
    group: 'Gội dưỡng',
    name: 'Gội dưỡng sinh',
    durationMin: 60,
    price: 150000,
    staffIds: ['s1', 's2', 's3'],
    visible: true,
    order: 4,
  },
  {
    id: 'v6',
    group: 'Nail',
    name: 'Sơn gel',
    durationMin: 60,
    price: 200000,
    staffIds: ['s3'],
    visible: true,
    order: 5,
  },
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Nguyễn Minh Anh',
    phone: '0903123456',
    birthday: '14/03',
    note: 'Thích chị Hà. Da đầu nhạy cảm — dùng dầu gội dịu nhẹ.',
    createdAt: at(10, 0, -200),
    marketingConsent: true,
  },
  { id: 'c2', name: 'Trần Thu Lan', phone: '0912888777', createdAt: at(10, 0, -60), marketingConsent: true },
  { id: 'c3', name: 'Phạm Hằng', phone: '0938555444', createdAt: at(10, 0, -300), marketingConsent: true },
  { id: 'c4', name: 'Khoa Võ', phone: '0977111222', createdAt: at(10, 0, -1), marketingConsent: false },
  { id: 'c5', name: 'Lê Vy', phone: '0909000111', createdAt: at(10, 0, -90), marketingConsent: true },
];

let n = 2400;
const b = (
  customerId: string,
  staffId: string,
  serviceIds: string[],
  start: number,
  dur: number,
  status: Booking['status'],
  source: Booking['source'],
  paid?: number,
): Booking => ({
  id: `b${++n}`,
  code: `HD-${n}`,
  customerId,
  staffId,
  serviceIds,
  startAt: start,
  endAt: start + dur * 60000,
  status,
  source,
  synced: true,
  payment: paid ? { amount: paid, method: 'cash', paidAt: start + dur * 60000 } : undefined,
});

export function seedBookings(): Booking[] {
  return [
    b('c1', 's1', ['v1'], at(9, 0), 45, 'completed', 'zalo', 180000),
    b('c2', 's1', ['v3'], at(10, 0), 120, 'in_service', 'facebook'),
    b('c5', 's2', ['v5'], at(12, 30), 60, 'confirmed', 'maps'),
    b('c3', 's3', ['v6'], at(9, 30), 60, 'completed', 'qr', 200000),
    b('c4', 's2', ['v2'], at(15, 0), 30, 'confirmed', 'web'),
    b('c3', 's1', ['v1'], at(14, 30), 45, 'confirmed', 'manual'),
    b('c1', 's1', ['v3'], at(10, 0, -55), 120, 'completed', 'zalo', 650000),
    b('c3', 's3', ['v6'], at(11, 0, -62), 60, 'completed', 'qr', 200000),
    b('c5', 's2', ['v1'], at(16, 0, -7), 45, 'completed', 'maps', 180000),
    b('c2', 's1', ['v1'], at(9, 0, -1), 45, 'completed', 'facebook', 180000),
    b('c5', 's2', ['v4'], at(13, 0, -1), 150, 'completed', 'maps', 800000),
    b('c4', 's2', ['v2'], at(17, 0, -1), 30, 'no_show', 'web'),
  ];
}
