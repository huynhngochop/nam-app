import type { Booking, Service } from './types';

export type CustomerSummary = { visits: number; spend: number; noShows: number; lastAt?: number };
const EMPTY_SUMMARY: CustomerSummary = { visits: 0, spend: 0, noShows: 0 };

/**
 * Số liệu của mọi khách trong một lần duyệt lịch hẹn (IT2). Gọi `customerStats` cho từng khách là
 * O(khách × lịch hẹn): 2.500 khách × 10 nghìn lịch hẹn làm màn Khách đơ gần 1 giây mỗi lần vẽ.
 */
export function customerIndex(bookings: Booking[], services: Service[]) {
  const priceById = new Map(services.map((s) => [s.id, s.price]));
  const m = new Map<string, CustomerSummary>();
  for (const b of bookings) {
    let st = m.get(b.customerId);
    if (!st) m.set(b.customerId, (st = { visits: 0, spend: 0, noShows: 0 }));
    if (b.status === 'completed') {
      st.visits++;
      st.spend += b.payment?.amount ?? b.serviceIds.reduce((a, id) => a + (priceById.get(id) ?? 0), 0);
      if (st.lastAt === undefined || b.startAt > st.lastAt) st.lastAt = b.startAt;
    } else if (b.status === 'no_show') st.noShows++;
  }
  return { get: (id: string) => m.get(id) ?? EMPTY_SUMMARY };
}
