export type Role = 'owner' | 'manager' | 'stylist' | 'assistant';
export type Hours = { day: number; open: boolean; from: string; to: string }[];
export type ShopSettings = {
  selfBooking: boolean;
  minLeadMin: number;
  cancelBeforeH: number;
  bufferMin: number;
  slotStepMin: number;
  remind24h: boolean;
  remind2h: boolean;
  askReview: boolean;
  depositForNoShow: boolean;
  vipVisits: number;
  vipSpend: number;
};
export type Shop = {
  name: string;
  type: string;
  address: string;
  phone: string;
  slug: string;
  hours: Hours;
  settings: ShopSettings;
};
export type Service = {
  id: string;
  group: string;
  name: string;
  durationMin: number;
  price: number;
  staffIds: string[];
  visible: boolean;
  order: number;
};
export type Staff = {
  id: string;
  name: string;
  phone?: string;
  role: Role;
  shiftFrom: string;
  shiftTo: string;
  onlineToday: boolean;
  commissionPct: number;
};
export type Customer = {
  id: string;
  name: string;
  phone?: string;
  birthday?: string;
  note?: string;
  createdAt: number;
  marketingConsent: boolean;
};
export type BookingStatus = 'confirmed' | 'checked_in' | 'in_service' | 'completed' | 'cancelled' | 'no_show';
export type Booking = {
  id: string;
  code: string;
  customerId: string;
  staffId: string;
  serviceIds: string[];
  startAt: number;
  endAt: number;
  status: BookingStatus;
  source: 'zalo' | 'facebook' | 'maps' | 'qr' | 'web' | 'manual';
  customerNote?: string;
  payment?: { amount: number; method: 'cash' | 'transfer' | 'card'; paidAt: number };
  synced: boolean;
};
export type Campaign = {
  id: string;
  audience: 'lapsed' | 'vip' | 'custom';
  count: number;
  message: string;
  sentAt: number;
};
export type Plan = { code: 'trial' | 'basic' | 'standard' | 'chain'; cycle?: 'month' | 'year'; trialEndsAt: number };

export const SOURCE_LABEL: Record<Booking['source'], string> = {
  zalo: 'Link Zalo',
  facebook: 'Facebook',
  maps: 'Google Maps',
  qr: 'Mã QR',
  web: 'Trang đặt lịch',
  manual: 'Tạo tay',
};
export const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã đến',
  in_service: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
};
export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Chủ tiệm',
  manager: 'Quản lý',
  stylist: 'Thợ',
  assistant: 'Phụ việc',
};
