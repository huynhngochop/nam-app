import React, { useState } from 'react';
import { router } from 'expo-router';
import { Paywall, useToast } from '@nam/ui';
import { buy, getLimit, getPrice, PURCHASE_MESSAGES, restorePurchases, track } from '@nam/core';
import { useHen } from '../src/store';
import { Plan } from '../src/types';

/** HD-C14 · Gói dịch vụ cho tiệm (B2B). Giá chốt sau — hiện ô PRICE_B2B_*. */
export default function Billing() {
  const toast = useToast();
  const s = useHen();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trialDays = Math.max(0, Math.ceil((s.plan.trialEndsAt - Date.now()) / 86400000));
  const codeOf = (id: string): Plan['code'] =>
    id.includes('chain') ? 'chain' : id.includes('standard') ? 'standard' : 'basic';

  return (
    <Paywall
      title="Gói cho tiệm"
      reason={
        s.plan.code === 'trial' ? `Bạn đang dùng thử, còn ${trialDays} ngày. Hết hạn vẫn xem được lịch cũ.` : undefined
      }
      benefits={[
        'Không giới hạn lịch hẹn và khách',
        'Nhắc lịch tự động qua Zalo',
        `Gói Tiêu chuẩn: ${getLimit('AI_QUOTA_STANDARD', 60)} lượt AI/tháng (đọc bảng giá, soạn ưu đãi)`,
        'Gói Chuỗi: nhiều chi nhánh, báo cáo gộp',
      ]}
      plans={[
        {
          id: 'hendep.standard.month',
          label: 'Tiêu chuẩn',
          priceKey: 'PRICE_B2B_STANDARD_MONTH',
          price: getPrice('PRICE_B2B_STANDARD_MONTH'),
          sub: 'Tới 5 thợ',
          tag: 'Phổ biến',
        },
        {
          id: 'hendep.basic.month',
          label: 'Cơ bản',
          priceKey: 'PRICE_B2B_BASIC_MONTH',
          price: getPrice('PRICE_B2B_BASIC_MONTH'),
          sub: '1–2 thợ',
        },
        {
          id: 'hendep.chain.month',
          label: 'Chuỗi',
          priceKey: 'PRICE_B2B_CHAIN_MONTH',
          price: getPrice('PRICE_B2B_CHAIN_MONTH'),
          sub: 'Nhiều chi nhánh',
        },
      ]}
      ctaFor={() => 'Đăng ký'}
      busy={busy}
      error={error}
      onClose={() => router.back()}
      onRestore={async () => {
        const ids = await restorePurchases();
        const id = ids.find((i) => i.startsWith('hendep.'));
        if (id) {
          s.set({ plan: { ...s.plan, code: codeOf(id), cycle: 'month' } });
          toast('Đã khôi phục gói', { tone: 'success' });
          router.back();
        } else toast('Không tìm thấy giao dịch cũ');
      }}
      onBuy={async (p) => {
        setBusy(true);
        setError(null);
        track('b2b_purchase_started', { productId: p.id });
        const r = await buy(p.id);
        setBusy(false);
        if (r.status === 'success') {
          s.set({ plan: { ...s.plan, code: codeOf(p.id), cycle: 'month' } });
          toast(PURCHASE_MESSAGES.success, { tone: 'success' });
          router.back();
        } else if (r.status !== 'cancelled')
          setError(`${PURCHASE_MESSAGES[r.status]}${r.code ? ` (Mã: ${r.code})` : ''}`);
      }}
    />
  );
}
