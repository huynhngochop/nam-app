import React, { useEffect, useRef, useState } from 'react';
import { Banner, Dialog, Radio, Row, T } from '@nam/ui';
import { getConfig, OutboxItem, useOnline } from '@nam/core';
import { useHen, useOutbox } from './store';

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

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (!items.length) return;
    flush(send).then(() => {
      useHen.setState((s) => ({ bookings: s.bookings.map((b) => ({ ...b, synced: true })) }));
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
      {!online ? (
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
          onConfirm={() => {
            useOutbox.getState().resolveConflict(c0.id);
            setChoice(0);
          }}
        >
          {['Chuyển sang thợ khác đang rảnh', 'Dời sang giờ trống gần nhất', 'Nhắn khách online đổi giờ'].map(
            (t, i) => (
              <Row key={t} style={{ paddingVertical: 6 }} gap={10}>
                <Radio on={choice === i} />
                <T v="body" onPress={() => setChoice(i)} style={{ flex: 1 }}>
                  {t}
                </T>
              </Row>
            ),
          )}
        </Dialog>
      ) : null}
    </>
  );
}
