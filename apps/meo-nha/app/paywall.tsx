import React, { useState } from 'react';
import { router } from 'expo-router';
import { Paywall, useToast } from '@nam/ui';
import { buy, getPrice, PURCHASE_MESSAGES, restorePurchases, track } from '@nam/core';
import { useMeo } from '../src/store';

/** Mẹo Nhà Plus. Giá lấy từ cửa hàng theo productId khi đã nối mua trong app. */
export default function MeoPaywall() {
  const set = useMeo((s) => s.set);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Paywall
      title="Mẹo Nhà Plus"
      benefits={[
        'Bộ sưu tập không giới hạn',
        'Thêm lượt Hỏi Mẹo Nhà mỗi ngày',
        'Ủng hộ đội viết mẹo',
      ]}
      plans={[
        {
          id: 'meonha.plus.lifetime',
          label: 'Mua một lần',
          priceKey: 'PRICE_PLUS_ONCE',
          price: getPrice('PRICE_PLUS_ONCE'),
          sub: 'Dùng mãi trên tài khoản này',
        },
        {
          id: 'meonha.plus.year',
          label: 'Theo năm',
          priceKey: 'PRICE_PLUS_YEAR',
          price: getPrice('PRICE_PLUS_YEAR'),
        },
      ]}
      ctaFor={() => 'Mua ngay'}
      busy={busy}
      error={error}
      onClose={() => router.back()}
      onRestore={async () => {
        const ids = await restorePurchases();
        if (ids.some((i) => i.startsWith('meonha.plus'))) {
          set({ plus: true });
          toast('Đã khôi phục', { tone: 'success' });
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
          set({ plus: true });
          track('purchase_completed', { productId: p.id });
          toast(PURCHASE_MESSAGES.success, { tone: 'success' });
          router.back();
        } else if (r.status !== 'cancelled') {
          setError(PURCHASE_MESSAGES[r.status]);
          track('purchase_failed', { code: r.code });
        }
      }}
    />
  );
}
