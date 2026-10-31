import React, { useState } from 'react';
import { router } from 'expo-router';
import { Paywall, useToast } from '@nam/ui';
import { buy, getPrice, PURCHASE_MESSAGES, restorePurchases, track } from '@nam/core';
import { useNhip } from '../src/store';

/** NH-16 Nhịp Pro · NH-20 Mua chưa hoàn tất (nói rõ đã/chưa trừ tiền). */
export default function NhipPaywall() {
  const set = useNhip((s) => s.set);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Paywall
      title="Nhịp Pro"
      benefits={[
        'Mở mọi gói âm thanh, kể cả gói mới',
        'Không quảng cáo',
        'Thống kê theo từng việc, xuất CSV',
        'Thói quen không giới hạn',
      ]}
      plans={[
        {
          id: 'nhip.pro.year',
          label: 'Theo năm',
          priceKey: 'PRICE_PRO_YEAR',
          price: getPrice('PRICE_PRO_YEAR'),
          sub: 'Dùng thử 7 ngày',
          tag: 'Tiết kiệm nhất',
        },
        { id: 'nhip.pro.month', label: 'Theo tháng', priceKey: 'PRICE_PRO_MONTH', price: getPrice('PRICE_PRO_MONTH') },
        {
          id: 'nhip.pro.lifetime',
          label: 'Trọn đời',
          priceKey: 'PRICE_PRO_LIFETIME',
          price: getPrice('PRICE_PRO_LIFETIME'),
        },
      ]}
      ctaFor={(p) => (p.id === 'nhip.pro.year' ? 'Dùng thử 7 ngày' : 'Tiếp tục')}
      busy={busy}
      error={error}
      onClose={() => router.back()}
      onRestore={async () => {
        const ids = await restorePurchases();
        if (ids.some((i) => i.startsWith('nhip.pro'))) {
          set({ isPro: true });
          toast('Đã khôi phục Pro', { tone: 'success' });
          router.back();
        } else toast('Không tìm thấy giao dịch cũ');
      }}
      onBuy={async (p) => {
        setBusy(true);
        setError(null);
        track('purchase_started', { productId: p.id });
        const r = await buy(p.id);
        setBusy(false);
        if (r.status === 'success') {
          set({ isPro: true });
          track('purchase_completed', { productId: p.id });
          toast(PURCHASE_MESSAGES.success, { tone: 'success' });
          router.back();
        } else if (r.status !== 'cancelled') {
          setError(`${PURCHASE_MESSAGES[r.status]}${r.code ? ` (Mã: ${r.code})` : ''}`);
          track('purchase_failed', { code: r.code });
        }
      }}
    />
  );
}
