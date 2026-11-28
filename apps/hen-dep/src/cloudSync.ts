import * as Notifications from 'expo-notifications';
import { CloudError, deviceId, hasCloud, hhmm, rpc, shortDate } from '@nam/core';
import { overlaps, useHen, useOutbox } from './store';
import { Booking, Customer, Service, Shop, Staff } from './types';

/**
 * Đồng bộ nhiều máy cho Hẹn Đẹp qua nam-cloud (nhóm "shop"): chủ tiệm bật, thợ vào bằng mã mời.
 *  - Đẩy: mỗi thay đổi trong outbox → bản ghi đầy đủ hiện tại (shop/service/staff/customer/booking/campaign),
 *    gom một lần gọi. Máy chủ giữ bản sửa sau cùng (last-write-wins theo thời điểm sửa).
 *  - Kéo: thay đổi của máy khác + lịch khách tự đặt trên trang web ('web_booking').
 *  - Lịch đặt online: mọi máy tạo cùng một lịch (id = id yêu cầu) nên không bị nhân đôi.
 */
export type CloudLink = { groupId: string; role: 'owner' | 'admin' | 'member'; slug?: string | null; cursor: number };

export const cloudOn = () => hasCloud() && !!useHen.getState().cloud;
const APP = 'hendep';
const COLLECTION: Record<string, 'shop' | 'service' | 'staff' | 'customer' | 'booking' | 'campaign'> = {
  shop: 'shop',
  service: 'service',
  staff: 'staff',
  customer: 'customer',
  booking: 'booking',
  campaign: 'campaign',
};

type Rec = { collection: string; id: string; data: unknown; deleted?: boolean; updated_at: string };

/** Bản ghi đầy đủ hiện tại của một thực thể (null = đã xóa). */
function current(collection: string, id: string): unknown | null {
  const s = useHen.getState();
  switch (collection) {
    case 'shop':
      return s.shop;
    case 'service':
      return s.services.find((x) => x.id === id) ?? null;
    case 'staff':
      return s.staff.find((x) => x.id === id) ?? null;
    case 'customer':
      return s.customers.find((x) => x.id === id) ?? null;
    case 'booking': {
      const b = s.bookings.find((x) => x.id === id);
      return b ? { ...b, synced: undefined } : null;
    }
    case 'campaign':
      return s.campaigns.find((x) => x.id === id) ?? null;
  }
  return null;
}

/** Toàn bộ dữ liệu tiệm thành bản ghi (dùng khi vừa bật đồng bộ). */
function snapshot(groupId: string): Rec[] {
  const s = useHen.getState();
  const at = new Date().toISOString();
  const r = (collection: string, x: { id: string }) => ({
    collection,
    id: x.id,
    data: current(collection, x.id),
    updated_at: at,
  });
  return [
    { collection: 'shop', id: groupId, data: s.shop, updated_at: at },
    ...s.services.map((x) => r('service', x)),
    ...s.staff.map((x) => r('staff', x)),
    ...s.customers.map((x) => r('customer', x)),
    ...s.bookings.map((x) => r('booking', x)),
    ...s.campaigns.map((x) => r('campaign', x)),
  ];
}

async function pushRecords(link: CloudLink, records: Rec[]) {
  const device = await deviceId();
  for (let i = 0; i < records.length; i += 400) {
    const out = await rpc<{ conflicts: { collection: string; id: string; data: unknown; deleted: boolean }[] }>(
      'nc_sync_push',
      { p_group: link.groupId, p_device: device, p_records: records.slice(i, i + 400), p_events: [] },
      { auth: true, timeoutMs: 20000 },
    );
    // Bản trên máy chủ mới hơn → lấy bản đó.
    if (out.conflicts?.length)
      applyRecords(out.conflicts.map((c) => ({ ...c, kind: 'r' as const, device: 'server', seq: 0, updated_at: '' })));
  }
}

/** Gửi các thay đổi đang chờ. Không bật đồng bộ thì bỏ hàng chờ (dữ liệu đã nằm trên máy). */
export async function pushPending(): Promise<void> {
  const ob = useOutbox.getState();
  const items = [...ob.items];
  if (!items.length) return;
  const link = useHen.getState().cloud;
  if (!hasCloud() || !link) {
    useOutbox.setState({ items: [] });
    return;
  }
  const byKey = new Map<string, Rec>();
  for (const it of items) {
    const [entity, op] = it.kind.split('.');
    const collection = COLLECTION[entity];
    if (!collection) continue;
    const at = new Date(it.createdAt).toISOString();
    const ids =
      collection === 'shop'
        ? [link.groupId]
        : op === 'bulk'
          ? useHen.getState().services.map((x) => x.id)
          : [String((it.payload as { id?: string })?.id ?? '')].filter(Boolean);
    for (const id of ids) {
      const data = current(collection, collection === 'shop' ? '' : id);
      byKey.set(`${collection}:${id}`, { collection, id, data, deleted: data === null, updated_at: at });
    }
  }
  await pushRecords(link, [...byKey.values()]);
  const sent = new Set(items.map((x) => x.id));
  useOutbox.setState((s) => ({ items: s.items.filter((x) => !sent.has(x.id)) }));
  useHen.setState((s) =>
    s.bookings.some((b) => !b.synced)
      ? { bookings: s.bookings.map((b) => (b.synced ? b : { ...b, synced: true })) }
      : s,
  );
}

type Change =
  | {
      kind: 'r';
      seq: number;
      device: string;
      collection: string;
      id: string;
      data: unknown;
      deleted: boolean;
      updated_at: string;
    }
  | {
      kind: 'e';
      seq: number;
      device: string;
      collection: string;
      id: string;
      payload: WebBooking;
      occurred_at?: string;
    };
type WebBooking = {
  name: string;
  phone: string;
  serviceIds: string[];
  staffId: string | null;
  startAt: number;
  endAt: number;
  note?: string;
};

function upsertList<T extends { id: string }>(list: T[], id: string, data: unknown, deleted: boolean): T[] {
  const at = list.findIndex((x) => x.id === id);
  if (deleted) return at >= 0 ? list.filter((x) => x.id !== id) : list;
  if (!data) return list;
  const next = list.slice();
  if (at >= 0) next[at] = data as T;
  else next.push(data as T);
  return next;
}

function applyRecords(changes: Extract<Change, { kind: 'r' }>[]) {
  if (!changes.length) return;
  const conflicts: Booking[] = [];
  useHen.setState((s) => {
    let { shop, services, staff, customers, bookings, campaigns } = s;
    for (const c of changes) {
      if (c.collection === 'shop' && c.data && !c.deleted) shop = { ...shop, ...(c.data as Shop) };
      else if (c.collection === 'service') services = upsertList<Service>(services, c.id, c.data, c.deleted);
      else if (c.collection === 'staff') staff = upsertList<Staff>(staff, c.id, c.data, c.deleted);
      else if (c.collection === 'customer') customers = upsertList<Customer>(customers, c.id, c.data, c.deleted);
      else if (c.collection === 'campaign') campaigns = upsertList(campaigns, c.id, c.data, c.deleted);
      else if (c.collection === 'booking') {
        const remote = c.data as Booking | null;
        // Lịch trên máy (chưa gửi) trùng giờ với lịch máy khác vừa tạo → hỏi chủ tiệm xử lý.
        if (remote && !c.deleted) {
          const clash = bookings.find(
            (b) =>
              !b.synced &&
              b.id !== remote.id &&
              b.staffId === remote.staffId &&
              b.startAt < remote.endAt &&
              remote.startAt < b.endAt,
          );
          if (clash) conflicts.push(clash);
        }
        bookings = upsertList<Booking>(bookings, c.id, remote ? { ...remote, synced: true } : null, c.deleted);
      }
    }
    return { shop, services, staff, customers, bookings, campaigns };
  });
  if (conflicts.length)
    useOutbox.setState((o) => ({
      conflicts: [
        ...o.conflicts,
        ...conflicts.map((b) => ({
          id: `cf-${b.id}`,
          kind: 'booking.conflict',
          payload: b,
          createdAt: Date.now(),
          tries: 0,
        })),
      ],
    }));
}

/** Khách đặt trên trang web → lịch hẹn (id lấy theo yêu cầu, nên máy nào xử lý cũng ra cùng một lịch). */
function applyWebBookings(events: Extract<Change, { kind: 'e' }>[]) {
  const fresh = events.filter(
    (e) => e.collection === 'web_booking' && !useHen.getState().bookings.some((b) => b.id === e.id),
  );
  if (!fresh.length) return;
  const created: Booking[] = [];
  for (const e of fresh) {
    const p = e.payload;
    const s = useHen.getState();
    let cust = s.customers.find(
      (c) => c.phone && c.phone.replace(/\D/g, '').endsWith(p.phone.replace(/\D/g, '').slice(-9)),
    );
    if (!cust) {
      cust = { id: e.id, name: p.name, phone: p.phone, createdAt: Date.now(), marketingConsent: false };
      useHen.setState({ customers: [...s.customers, cust] });
      useOutbox.getState().enqueue('customer.upsert', { id: cust.id });
    }
    const can = (st: Staff) =>
      p.serviceIds.every((id) => {
        const sv = s.services.find((x) => x.id === id);
        return !sv?.staffIds.length || sv.staffIds.includes(st.id);
      });
    const staffId =
      (p.staffId && s.staff.some((x) => x.id === p.staffId) && p.staffId) ||
      s.staff.find((st) => can(st) && !overlaps(s.bookings, st.id, p.startAt, p.endAt))?.id ||
      s.staff[0]?.id ||
      '';
    const code = `HD-${s.lastBookingCode + 1}`;
    const b: Booking = {
      id: e.id,
      code,
      customerId: cust.id,
      staffId,
      serviceIds: p.serviceIds,
      startAt: p.startAt,
      endAt: p.endAt,
      status: 'confirmed',
      source: 'web',
      customerNote: p.note || undefined,
      synced: false,
    };
    useHen.setState((x) => ({ bookings: [...x.bookings, b], lastBookingCode: x.lastBookingCode + 1 }));
    useOutbox.getState().enqueue('booking.create', { id: b.id });
    created.push(b);
  }
  for (const b of created) {
    const cust = useHen.getState().customers.find((c) => c.id === b.customerId);
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Khách vừa đặt lịch online',
        body: `${cust?.name ?? 'Khách'} · ${hhmm(new Date(b.startAt))} ${shortDate(new Date(b.startAt))}`,
        data: { bookingId: b.id },
      },
      trigger: null,
    }).catch(() => {});
  }
}

let pulling = false;
/** Kéo thay đổi từ máy chủ (theo con trỏ). Gọi khi mở app, khi app quay lại và mỗi phút khi đang mở. */
export async function pull(): Promise<number> {
  const link = useHen.getState().cloud;
  if (!hasCloud() || !link || pulling) return 0;
  pulling = true;
  let n = 0;
  try {
    let cursor = link.cursor;
    for (;;) {
      const page = await rpc<{ changes: Change[]; cursor: number; has_more: boolean }>(
        'nc_sync_pull',
        { p_group: link.groupId, p_cursor: cursor, p_limit: 500 },
        { auth: true, timeoutMs: 20000 },
      );
      applyRecords(page.changes.filter((c): c is Extract<Change, { kind: 'r' }> => c.kind === 'r'));
      applyWebBookings(page.changes.filter((c): c is Extract<Change, { kind: 'e' }> => c.kind === 'e'));
      n += page.changes.length;
      cursor = page.cursor;
      useHen.setState((s) => (s.cloud ? { cloud: { ...s.cloud, cursor } } : s));
      if (!page.has_more) break;
    }
  } catch (e) {
    // Bị xóa khỏi tiệm → tắt đồng bộ trên máy này, dữ liệu vẫn giữ.
    if (e instanceof CloudError && e.code === '42501') useHen.setState({ cloud: null });
    else throw e;
  } finally {
    pulling = false;
  }
  return n;
}

/** Chủ tiệm bật đồng bộ: tạo nhóm tiệm và đẩy toàn bộ dữ liệu hiện có. */
export async function enableCloud(): Promise<CloudLink> {
  const s = useHen.getState();
  const g = await rpc<{ id: string }>(
    'nc_create_group',
    { p_app: APP, p_kind: 'shop', p_name: s.shop.name || 'Tiệm' },
    { auth: true },
  );
  const link: CloudLink = { groupId: g.id, role: 'owner', slug: null, cursor: 0 };
  useHen.setState({ cloud: link });
  useOutbox.setState({ items: [] });
  await pushRecords(link, snapshot(g.id));
  await pull();
  return link;
}

/** Thợ / máy thứ hai vào tiệm bằng mã mời: dữ liệu trên máy được thay bằng dữ liệu của tiệm. */
export async function joinShop(code: string): Promise<void> {
  const g = await rpc<{ id: string; role: CloudLink['role'] }>('nc_join_group', { p_code: code }, { auth: true });
  useOutbox.setState({ items: [], conflicts: [] });
  useHen.setState({
    cloud: { groupId: g.id, role: g.role, slug: null, cursor: 0 },
    services: [],
    staff: [],
    customers: [],
    bookings: [],
    campaigns: [],
    setupDone: true,
  });
  await pull();
}

export const createInvite = () =>
  rpc<{ code: string; expires_at: string }>(
    'nc_create_invite',
    { p_group: useHen.getState().cloud!.groupId },
    { auth: true },
  );

/** Bật / tắt trang đặt lịch online với tên link (slug) của tiệm. */
export async function setBookingPage(slug: string, enabled: boolean) {
  const link = useHen.getState().cloud;
  if (!link) throw new Error('Chưa bật đồng bộ');
  const r = await rpc<{ slug: string }>(
    'nc_booking_claim',
    { p_group: link.groupId, p_slug: slug, p_enabled: enabled },
    { auth: true },
  );
  useHen.setState((s) => ({
    cloud: s.cloud ? { ...s.cloud, slug: enabled ? r.slug : null } : s.cloud,
    shop: { ...s.shop, slug: r.slug },
  }));
  useOutbox.getState().enqueue('shop.update', {});
  await pushPending();
}

/** Trang đặt lịch (GitHub Pages của repo, gọi thẳng máy chủ nam-cloud). */
export const BOOKING_BASE = 'https://huynhngochop.github.io/nam-app/dat-lich/';
export const bookingPageOn = () => cloudOn() && !!useHen.getState().cloud?.slug;
export const bookingUrl = (slug: string) => `${BOOKING_BASE}?s=${encodeURIComponent(slug)}`;
