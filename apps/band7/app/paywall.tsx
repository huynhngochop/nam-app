import React, { useState } from 'react';
import { router } from 'expo-router';
import { Paywall, useToast } from '@nam/ui';
import { buy, getPrice, PURCHASE_MESSAGES, restorePurchases, track } from '@nam/core';
import { useBand7 } from '../src/store';

/** Band7 Pro. Giá để trống PRICE_* (chưa chốt). Gói Pro trên máy chủ được bật khi xác nhận giao dịch. */
export default function Band7Paywall() {
  const set = useBand7((s) => s.set);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Paywall
      title="Band7 Pro"
      reason="Hết lượt nói miễn phí hôm nay? Pro cho bạn luyện bao nhiêu tuỳ thích."
      benefits={[
        'Nói với giám khảo AI không giới hạn',
        'Thi thử đủ 3 part mỗi ngày',
        'Chấm chi tiết từng tiêu chí',
        'Không quảng cáo',
      ]}
      plans={[
        {
          id: 'band7.pro.month',
          label: 'Theo tháng',
          priceKey: 'PRICE_PRO_MONTH',
          price: getPrice('PRICE_PRO_MONTH'),
          sub: 'Dùng thử 7 ngày',
          tag: 'Phổ biến',
        },
        {
          id: 'band7.pro.quarter',
          label: '3 tháng (một kỳ ôn)',
          priceKey: 'PRICE_PRO_QUARTER',
          price: getPrice('PRICE_PRO_QUARTER'),
        },
        { id: 'band7.pro.year', label: 'Theo năm', priceKey: 'PRICE_PRO_YEAR', price: getPrice('PRICE_PRO_YEAR') },
      ]}
      ctaFor={(p) => (p.id === 'band7.pro.month' ? 'Dùng thử 7 ngày' : 'Tiếp tục')}
      busy={busy}
      error={error}
      onClose={() => router.back()}
      onRestore={async () => {
        const ids = await restorePurchases();
        if (ids.some((i) => i.startsWith('band7.pro'))) {
          set({ isPro: true });
          toast('Đã khôi phục Pro', { tone: 'success' });
          router.back();
        } else toast('Không tìm thấy giao dịch cũ');
      }}
      onBuy={async (p) => {
        setBusy(true);
        setError(null);
        track('purchase_started', { productId: p.id });
        const result = await buy(p.id);
        setBusy(false);
        if (result.status === 'success') {
          set({ isPro: true });
          track('purchase_completed', { productId: p.id });
          toast(PURCHASE_MESSAGES.success, { tone: 'success' });
          router.back();
        } else if (result.status !== 'cancelled') {
          setError(`${PURCHASE_MESSAGES[result.status]}${result.code ? ` (Mã: ${result.code})` : ''}`);
          track('purchase_failed', { code: result.code });
        }
      }}
    />
  );
}
