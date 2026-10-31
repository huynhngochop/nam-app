import React, { useState } from 'react';
import { router } from 'expo-router';
import { Paywall, useToast } from '@nam/ui';
import { buy, getPrice, PURCHASE_MESSAGES, restorePurchases, track } from '@nam/core';
import { useVi } from '../src/store';

/** VG-16 · Ví Gọn Pro. Giá chốt sau (PRICE_*). Mua chưa xong → nói rõ đã/chưa trừ tiền. */
export default function ViPaywall() {
  const set = useVi((s) => s.set);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Paywall
      title="Ví Gọn Pro"
      benefits={[
        'Dự báo cuối tháng, cảnh báo sớm',
        'Quỹ và ngân sách không giới hạn',
        'Xuất Excel / CSV, báo cáo năm',
        'Hỏi Ví Gọn nhiều hơn mỗi ngày',
      ]}
      plans={[
        {
          id: 'vigon.pro.year',
          label: 'Theo năm',
          priceKey: 'PRICE_PRO_YEAR',
          price: getPrice('PRICE_PRO_YEAR'),
          sub: 'Dùng thử 7 ngày',
          tag: 'Tiết kiệm nhất',
        },
        { id: 'vigon.pro.month', label: 'Theo tháng', priceKey: 'PRICE_PRO_MONTH', price: getPrice('PRICE_PRO_MONTH') },
      ]}
      ctaFor={(p) => (p.id === 'vigon.pro.year' ? 'Dùng thử 7 ngày' : 'Tiếp tục')}
      busy={busy}
      error={error}
      onClose={() => router.back()}
      onRestore={async () => {
        const ids = await restorePurchases();
        if (ids.some((i) => i.startsWith('vigon.pro'))) {
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
          toast(PURCHASE_MESSAGES.success, { tone: 'success' });
          router.back();
        } else if (r.status !== 'cancelled')
          setError(`${PURCHASE_MESSAGES[r.status]}${r.code ? ` (Mã: ${r.code})` : ''}`);
      }}
    />
  );
}
