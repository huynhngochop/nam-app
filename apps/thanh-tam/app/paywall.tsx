import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Button, Card, Icon, Row, Screen, T, useTheme, useToast } from '@nam/ui';
import { buy, groupDigits, PURCHASE_MESSAGES, restorePurchases, storePrice, track } from '@nam/core';
import { useTT } from '../src/store';
import { TAM_AN_YEAR, TAM_AN_YEAR_VND } from '../src/config';

const BENEFITS = [
  'Giọng đọc mẫu cho các bài khấn hay dùng',
  'Sổ giỗ chung cho cả nhà, ai thêm cũng thấy',
  'Không quảng cáo ở mọi màn hình',
  'Hỏi Thành Tâm nhiều câu hơn mỗi ngày',
];

/** TT-23 · Gói Tâm An: một gói theo năm (gói trọn đời ẩn tới khi có giá). Văn khấn, lịch, sổ giỗ, Tuổi & năm luôn miễn phí. */
export default function TamAnPaywall() {
  const { c } = useTheme();
  const toast = useToast();
  const set = useTT((s) => s.set);
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { storePrice(TAM_AN_YEAR).then(setPrice).catch(() => {}); }, []);
  const shown = price ?? `${groupDigits(TAM_AN_YEAR_VND)}đ`;
  const perMonth = price ? null : `${groupDigits(Math.ceil(TAM_AN_YEAR_VND / 12 / 100) * 100)}đ`;

  const onBuy = async () => {
    setBusy(true); setError(null); track('purchase_started', { productId: TAM_AN_YEAR });
    const r = await buy(TAM_AN_YEAR);
    setBusy(false);
    if (r.status === 'success') { set({ tamAn: true }); track('purchase_completed', { productId: TAM_AN_YEAR }); toast(PURCHASE_MESSAGES.success, { tone: 'success' }); router.back(); }
    else if (r.status !== 'cancelled') { setError(PURCHASE_MESSAGES[r.status]); track('purchase_failed', { code: r.code }); }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} footer={<View style={{ gap: 8 }}>
      <Button title={`Mua gói năm · ${shown}`} loading={busy} onPress={onBuy} />
      <Button title="Khôi phục giao dịch" variant="text" size="sm" style={{ alignSelf: 'center' }} onPress={async () => {
        const ids = await restorePurchases();
        if (ids.some((i) => i.startsWith('thanhtam.taman'))) { set({ tamAn: true }); toast('Đã khôi phục', { tone: 'success' }); router.back(); } else toast('Không tìm thấy giao dịch cũ');
      }} />
    </View>}>
      <AppBar onBack={() => router.back()} backIcon="x" />
      <T v="display">Gói Tâm An</T>
      <T v="body" muted>Văn khấn, lịch âm, sổ giỗ, nhắc lịch và Tuổi & năm luôn miễn phí. Tâm An thêm những điều sau:</T>
      {error ? <Card variant="danger"><Row><Icon name="alert-circle" color={c.negative} /><T v="body" style={{ flex: 1 }}>{error}</T></Row></Card> : null}
      <View>
        {BENEFITS.map((b) => <Row key={b} gap={10} style={{ paddingVertical: 8 }}><Icon name="check" color={c.positive} /><T v="body" style={{ flex: 1 }}>{b}</T></Row>)}
      </View>
      <Card variant="outlineAccent">
        <Row between><T v="headline">Theo năm</T><T v="headline">{shown}</T></Row>
        {perMonth ? <T v="caption" muted>Khoảng {perMonth} mỗi tháng · tự gia hạn, hủy bất cứ lúc nào trong cài đặt cửa hàng</T> : <T v="caption" muted>Tự gia hạn, hủy bất cứ lúc nào trong cài đặt cửa hàng</T>}
      </Card>
    </Screen>
  );
}
