import type { Booking, Service } from './types';

export type CustomerSummary = { visits: number; spend: number; noShows: number; lastAt?: number };
const EMPTY_SUMMARY: CustomerSummary = { visits: 0, spend: 0, noShows: 0 };

/**
 * Số liệu của mọi khách trong một lần duyệt lịch hẹn (IT2). Gọi `customerStats` cho từng khách là
 * O(khách × lịch hẹn): 2.500 khách × 10 nghìn lịch hẹn làm màn Khách đơ gần 1 giây mỗi lần vẽ.
 */
export function customerIndex(bookings: Booking[], services: Service[]) {
  const priceById = new Map(services.map((s) => [s.id, s.price]));
  const byId = new Map<string, CustomerSummary>();
  for (const booking of bookings) {
    let st = byId.get(booking.customerId);
    if (!st) byId.set(booking.customerId, (st = { visits: 0, spend: 0, noShows: 0 }));
    if (booking.status === 'completed') {
      st.visits++;
      st.spend += booking.payment?.amount ?? booking.serviceIds.reduce((a, id) => a + (priceById.get(id) ?? 0), 0);
      if (st.lastAt === undefined || booking.startAt > st.lastAt) st.lastAt = booking.startAt;
    } else if (booking.status === 'no_show') st.noShows++;
  }
  return { get: (id: string) => byId.get(id) ?? EMPTY_SUMMARY };
}
