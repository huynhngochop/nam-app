import React, { useState } from 'react';
import { router } from 'expo-router';
import { Paywall, useToast } from '@nam/ui';
import { buy, getPrice, PURCHASE_MESSAGES, restorePurchases, track } from '@nam/core';
import { useMeo } from '../src/store';

/** MN-16 · Bỏ quảng cáo. Giá chưa chốt: lấy từ cửa hàng theo productId khi đã nối mua trong app. */
export default function MeoPaywall() {
  const set = useMeo((s) => s.set);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Paywall
      title="Mẹo Nhà không quảng cáo"
      benefits={['Không quảng cáo ở mọi màn hình', 'Bộ sưu tập không giới hạn', 'Thêm lượt Hỏi Mẹo Nhà mỗi ngày', 'Ủng hộ đội viết mẹo']}
      plans={[
        { id: 'meonha.noads.lifetime', label: 'Mua một lần', priceKey: 'PRICE_NOADS_ONCE', price: getPrice('PRICE_NOADS_ONCE'), sub: 'Dùng mãi trên tài khoản này' },
        { id: 'meonha.noads.year', label: 'Theo năm', priceKey: 'PRICE_NOADS_YEAR', price: getPrice('PRICE_NOADS_YEAR') },
      ]}
      ctaFor={() => 'Mua ngay'}
      busy={busy}
      error={error}
      onClose={() => router.back()}
      onRestore={async () => { const ids = await restorePurchases(); if (ids.some((i) => i.startsWith('meonha.noads'))) { set({ noAds: true }); toast('Đã khôi phục', { tone: 'success' }); router.back(); } else toast('Không tìm thấy giao dịch cũ'); }}
      onBuy={async (p) => {
        setBusy(true); setError(null); track('purchase_started', { productId: p.id });
        const r = await buy(p.id);
        setBusy(false);
        if (r.status === 'success') { set({ noAds: true }); track('purchase_completed', { productId: p.id }); toast(PURCHASE_MESSAGES.success, { tone: 'success' }); router.back(); }
        else if (r.status !== 'cancelled') { setError(PURCHASE_MESSAGES[r.status]); track('purchase_failed', { code: r.code }); }
      }}
    />
  );
}
