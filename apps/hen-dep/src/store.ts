import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createOutbox, kvStorage, uid } from '@nam/core';
import type { ThemePref } from '@nam/ui';
import { DEFAULT_SHOP, SEED_CUSTOMERS, SEED_SERVICES, SEED_STAFF, seedBookings } from './seed';
import { Booking, BookingStatus, Campaign, Customer, Plan, Service, Shop, Staff } from './types';

/** Hàng chờ thay đổi gửi máy chủ (HD-C15). Mọi thao tác ghi đều ghi vào đây; dữ liệu đã nằm trên máy nên dùng được khi ngoại tuyến. */
export const useOutbox = createOutbox('hen-dep');

type State = {
  hydrated: boolean;
  auth: { phone: string; role: 'owner' | 'staff'; staffId?: string } | null;
  setupDone: boolean;
  theme: ThemePref;
  shop: Shop;
  services: Service[];
  staff: Staff[];
  customers: Customer[];
  bookings: Booking[];
  campaigns: Campaign[];
  plan: Plan;
  aiUsed: { month: string; count: number };
  set: (p: Partial<State>) => void;
  setShop: (p: Partial<Shop>) => void;
  upsertService: (s: Omit<Service, 'id' | 'order'> & { id?: string }) => void;
  addServices: (list: Omit<Service, 'id' | 'order'>[]) => void;
  removeService: (id: string) => void;
  removeStaff: (id: string) => void;
  removeCustomer: (id: string) => void;
  upsertStaff: (s: Omit<Staff, 'id'> & { id?: string }) => void;
  upsertCustomer: (c: Omit<Customer, 'id' | 'createdAt'> & { id?: string }) => string;
  createBooking: (b: Omit<Booking, 'id' | 'code' | 'synced' | 'status'> & { status?: BookingStatus }) => Booking;
  updateBooking: (id: string, p: Partial<Booking>) => void;
  addCampaign: (c: Omit<Campaign, 'id' | 'sentAt'>) => void;
  consumeAi: () => void;
  loadDemo: () => void;
  clearAll: () => void;
};

const enqueue = (kind: string, payload: unknown) => useOutbox.getState().enqueue(kind, payload);
let codeSeq = 3000;

export const useHen = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      auth: null,
      setupDone: false,
      theme: 'system',
      shop: DEFAULT_SHOP,
      services: [],
      staff: [],
      customers: [],
      bookings: [],
      campaigns: [],
      plan: { code: 'trial', trialEndsAt: Date.now() + 30 * 86400000 },
      aiUsed: { month: '', count: 0 },
      set: (p) => set(p),
      setShop: (p) => {
        set((s) => ({ shop: { ...s.shop, ...p, settings: { ...s.shop.settings, ...(p.settings ?? {}) } } }));
        enqueue('shop.update', p);
      },
      upsertService: (svc) => {
        const id = svc.id ?? uid();
        set((s) => {
          const exists = s.services.some((x) => x.id === id);
          return {
            services: exists
              ? s.services.map((x) => (x.id === id ? { ...x, ...svc, id } : x))
              : [...s.services, { ...svc, id, order: s.services.length }],
          };
        });
        enqueue('service.upsert', { ...svc, id });
      },
      addServices: (list) => {
        set((s) => ({
          services: [...s.services, ...list.map((x, i) => ({ ...x, id: uid(), order: s.services.length + i }))],
        }));
        enqueue('service.bulk', list);
      },
      removeService: (id) => {
        set((s) => ({ services: s.services.filter((x) => x.id !== id) }));
        enqueue('service.delete', { id });
      },
      removeStaff: (id) => {
        set((s) => ({ staff: s.staff.filter((x) => x.id !== id) }));
        enqueue('staff.delete', { id });
      },
      removeCustomer: (id) => {
        set((s) => ({ customers: s.customers.filter((x) => x.id !== id) }));
        enqueue('customer.delete', { id });
      },
      upsertStaff: (st) => {
        const id = st.id ?? uid();
        set((s) => ({
          staff: s.staff.some((x) => x.id === id)
            ? s.staff.map((x) => (x.id === id ? { ...x, ...st, id } : x))
            : [...s.staff, { ...st, id }],
        }));
        enqueue('staff.upsert', { ...st, id });
      },
      upsertCustomer: (c) => {
        const id = c.id ?? uid();
        set((s) => ({
          customers: s.customers.some((x) => x.id === id)
            ? s.customers.map((x) => (x.id === id ? { ...x, ...c, id } : x))
            : [...s.customers, { ...c, id, createdAt: Date.now() }],
        }));
        enqueue('customer.upsert', { ...c, id });
        return id;
      },
      createBooking: (bk) => {
        const b: Booking = {
          ...bk,
          status: bk.status ?? 'confirmed',
          id: uid(),
          code: `HD-${++codeSeq}`,
          synced: false,
        };
        set((s) => ({ bookings: [...s.bookings, b] }));
        enqueue('booking.create', b);
        return b;
      },
      updateBooking: (id, p) => {
        set((s) => ({ bookings: s.bookings.map((x) => (x.id === id ? { ...x, ...p, synced: false } : x)) }));
        enqueue('booking.update', { id, ...p });
      },
      addCampaign: (c) => {
        set((s) => ({ campaigns: [{ ...c, id: uid(), sentAt: Date.now() }, ...s.campaigns] }));
        enqueue('campaign.send', c);
      },
      consumeAi: () =>
        set((s) => {
          const m = new Date().toISOString().slice(0, 7);
          return { aiUsed: { month: m, count: s.aiUsed.month === m ? s.aiUsed.count + 1 : 1 } };
        }),
      loadDemo: () =>
        set({ staff: SEED_STAFF, services: SEED_SERVICES, customers: SEED_CUSTOMERS, bookings: seedBookings() }),
      clearAll: () => set({ services: [], staff: [], customers: [], bookings: [], campaigns: [] }),
    }),
    {
      name: 'hen-dep',
      storage: kvStorage,
      partialize: ({ hydrated, ...rest }) => rest as never,
      onRehydrateStorage: () => () => useHen.setState({ hydrated: true }),
    },
  ),
);

/* ------------------------------------------------------------------ Tính toán */
export const svcOf = (ids: string[], services: Service[]) =>
  ids.map((id) => services.find((s) => s.id === id)).filter(Boolean) as Service[];
export const priceOf = (b: Booking, services: Service[]) =>
  b.payment?.amount ?? svcOf(b.serviceIds, services).reduce((a, s) => a + s.price, 0);
export const durationOf = (ids: string[], services: Service[]) =>
  svcOf(ids, services).reduce((a, s) => a + s.durationMin, 0);
export const isActive = (b: Booking) => b.status !== 'cancelled' && b.status !== 'no_show';

export function customerStats(cId: string, bookings: Booking[], services: Service[]) {
  const mine = bookings.filter((b) => b.customerId === cId);
  const done = mine.filter((b) => b.status === 'completed');
  const last = done.sort((a, b) => b.startAt - a.startAt)[0];
  return {
    visits: done.length,
    spend: done.reduce((a, b) => a + priceOf(b, services), 0),
    noShows: mine.filter((b) => b.status === 'no_show').length,
    lastAt: last?.startAt,
    history: mine.sort((a, b) => b.startAt - a.startAt),
  };
}

/** Khung trống ≥ 60 phút trong 4 giờ tới của từng thợ (gợi ý gửi ưu đãi ở HD-C05). */
export function findGap(
  staff: Staff[],
  bookings: Booking[],
  now = Date.now(),
): { staffId: string; from: number; to: number } | null {
  const horizon = now + 4 * 3600000;
  for (const st of staff.filter((s) => s.onlineToday)) {
    const [eh, em] = st.shiftTo.split(':').map(Number);
    const end = new Date(now);
    end.setHours(eh, em, 0, 0);
    const busy = bookings
      .filter((b) => b.staffId === st.id && isActive(b) && b.endAt > now && b.startAt < horizon)
      .sort((a, b) => a.startAt - b.startAt);
    let cursor = Math.ceil(now / 900000) * 900000;
    for (const b of [...busy, { startAt: Math.min(horizon, end.getTime()), endAt: Infinity } as Booking]) {
      if (b.startAt - cursor >= 3600000) return { staffId: st.id, from: cursor, to: b.startAt };
      cursor = Math.max(cursor, b.endAt);
    }
  }
  return null;
}

/** Kiểm tra trùng lịch của một thợ. */
export function overlaps(bookings: Booking[], staffId: string, start: number, end: number, ignoreId?: string) {
  return bookings.find(
    (b) => b.id !== ignoreId && b.staffId === staffId && isActive(b) && b.startAt < end && b.endAt > start,
  );
}
