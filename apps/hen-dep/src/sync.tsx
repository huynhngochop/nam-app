import React, { useEffect, useRef, useState } from 'react';
import { Banner, Dialog, Radio, Row, T, useToast } from '@nam/ui';
import { getConfig, hhmm, OutboxItem, useOnline } from '@nam/core';
import { overlaps, useHen, useOutbox } from './store';
import { hasServer, openSms } from './messages';
import { Booking } from './types';

const CHOICES = ['Chuyển sang thợ khác đang rảnh', 'Dời sang giờ trống gần nhất', 'Nhắn khách đổi giờ'] as const;

/**
 * Xử lý lịch bị trùng khi đồng bộ (lịch tạo lúc ngoại tuyến trùng lịch khách đặt online).
 * Trả về thông báo kết quả, hoặc null nếu không làm được.
 */
async function resolve(b: Booking, choice: number): Promise<string | null> {
  const s = useHen.getState();
  const dur = b.endAt - b.startAt;
  const others = s.bookings.filter((x) => x.id !== b.id);
  if (choice === 0) {
    const free = s.staff.find(
      (st) =>
        st.id !== b.staffId &&
        b.serviceIds.every((id) => {
          const sv = s.services.find((x) => x.id === id);
          return !sv?.staffIds.length || sv.staffIds.includes(st.id);
        }) &&
        !overlaps(others, st.id, b.startAt, b.endAt),
    );
    if (!free) return null;
    s.updateBooking(b.id, { staffId: free.id });
    return `Đã chuyển sang ${free.name}`;
  }
  if (choice === 1) {
    const step = (s.shop.settings.slotStepMin || 15) * 60000;
    for (let t = b.startAt + step; t < b.startAt + 12 * 3600000; t += step) {
      const d = new Date(t);
      const h = s.shop.hours.find((x) => x.day === d.getDay());
      const [ch, cm] = (h?.to ?? '21:00').split(':').map(Number);
      const close = new Date(d).setHours(ch, cm, 0, 0);
      if (h && !h.open) continue;
      if (t + dur > close) continue;
      if (!overlaps(others, b.staffId, t, t + dur)) {
        s.updateBooking(b.id, { startAt: t, endAt: t + dur });
        return `Đã dời sang ${hhmm(d)}`;
      }
    }
    return null;
  }
  const cust = s.customers.find((x) => x.id === b.customerId);
  if (!cust?.phone) return null;
  await openSms(
    cust.phone,
    `${s.shop.name} xin lỗi ${cust.name}: khung ${hhmm(new Date(b.startAt))} vừa kín lịch. Bạn chọn giờ khác giúp tiệm nhé!`,
  );
  return 'Đã mở Tin nhắn';
}

/** Gửi một thay đổi lên máy chủ. Chưa cấu hình máy chủ → chế độ chỉ trên máy (coi như đã đồng bộ). */
async function send(item: OutboxItem): Promise<'ok' | 'conflict'> {
  const base = getConfig().apiBaseUrl;
  if (!base) return 'ok';
  const res = await fetch(`${base}/sync`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': item.id },
    body: JSON.stringify(item),
  });
  if (res.status === 409) return 'conflict';
  if (!res.ok) throw new Error(String(res.status));
  return 'ok';
}

/** HD-C15 banner ngoại tuyến + số thay đổi chờ; HD-C16 xử lý trùng khi máy chủ báo xung đột. */
export function SyncBar() {
  const online = useOnline();
  const items = useOutbox((s) => s.items);
  const conflicts = useOutbox((s) => s.conflicts);
  const flush = useOutbox((s) => s.flush);
  const [justSynced, setJustSynced] = useState(false);
  const wasOffline = useRef(false);
  const [choice, setChoice] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (!items.length) return;
    flush(send).then(() => {
      // Chỉ tạo mảng mới khi thật sự có lịch hẹn vừa đồng bộ (mảng mới = ghi lại cả store + vẽ lại mọi màn).
      useHen.setState((s) =>
        s.bookings.some((b) => !b.synced)
          ? { bookings: s.bookings.map((b) => (b.synced ? b : { ...b, synced: true })) }
          : s,
      );
      if (wasOffline.current) {
        setJustSynced(true);
        wasOffline.current = false;
        setTimeout(() => setJustSynced(false), 3000);
      }
    });
  }, [online, items.length, flush]);

  const c0 = conflicts[0];
  return (
    <>
      {!online && hasServer() ? (
        <Banner text={`Ngoại tuyến · ${items.length} thay đổi chờ đồng bộ`} />
      ) : justSynced ? (
        <Banner tone="ok" text="Đã có mạng · đã đồng bộ" />
      ) : null}
      {c0 ? (
        <Dialog
          visible
          dismissable={false}
          title={`Lịch bị trùng khi đồng bộ${conflicts.length > 1 ? ` (1/${conflicts.length})` : ''}`}
          body="Một thay đổi bạn làm khi ngoại tuyến trùng với lịch khách vừa đặt online. Lịch của khách được giữ nguyên."
          confirm="Áp dụng"
          onConfirm={async () => {
            const b = c0.payload as Booking;
            const cur = useHen.getState().bookings.find((x) => x.id === b?.id);
            const msg = cur ? await resolve(cur, choice).catch(() => null) : null;
            if (!msg) {
              toast(choice === 2 ? 'Khách không có số điện thoại' : 'Không tìm được chỗ trống — chọn cách khác');
              return;
            }
            toast(msg, { tone: 'success' });
            useOutbox.getState().resolveConflict(c0.id);
            setChoice(0);
          }}
        >
          {CHOICES.map((t, i) => (
            <Row key={t} style={{ paddingVertical: 6 }} gap={10}>
              <Radio on={choice === i} />
              <T v="body" onPress={() => setChoice(i)} style={{ flex: 1 }}>
                {t}
              </T>
            </Row>
          ))}
        </Dialog>
      ) : null}
    </>
  );
}
