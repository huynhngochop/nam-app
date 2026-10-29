import React, { useEffect, useState } from 'react';
import { Share } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Banner, Button, Card, Chip, Chips, EmptyState, IconButton, ListItem, Row, Screen, T, Thumb, useTheme, useToast } from '@nam/ui';
import { shortMoney, track, useOnline } from '@nam/core';
import { byCategory, useQuery, useTxVersion } from '../src/db';
import { periodOf, useVi } from '../src/store';
import { aiRewrite, buildSummary, MonthSummary } from '../src/summary';

/** VG-23 · Tổng kết kỳ. Mẫu trên máy; AI (nếu bật trong Cài đặt) chỉ nhận số tổng theo danh mục. */
export default function Summary() {
  const { c } = useTheme();
  const toast = useToast();
  const online = useOnline();
  const s = useVi();
  const [offset, setOffset] = useState(-1);
  const v = useTxVersion((x) => x.v);
  const base = useQuery(() => buildSummary(offset, { cats: s.categories, startDay: s.monthStartDay, budgets: s.budgets }), [offset, s.categories, s.budgets], null as MonthSummary | null);
  const [sum, setSum] = useState<MonthSummary | null>(base);

  useEffect(() => {
    setSum(base);
    if (!base || !s.aiSummary || !online || !base.count) return;
    let alive = true;
    const p = periodOf(s.monthStartDay, offset);
    aiRewrite(base, s.categories, byCategory(p.from, p.to)).then((r) => { if (alive) setSum(r); });
    return () => { alive = false; };
  }, [base, v, s.aiSummary, online]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!sum) return null;
  const share = () => {
    const text = `Ví Gọn · ${sum.label}\n${sum.saved >= 0 ? 'Tiết kiệm' : 'Chi vượt thu'} ${shortMoney(Math.abs(sum.saved))}\n${sum.insights.map((i) => `• ${i.text}`).join('\n')}`;
    Share.share({ message: text }).catch(() => {});
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title={`Tổng kết ${sum.label.toLowerCase()}`} onBack={() => router.back()} right={<IconButton icon="share-2" label="Chia sẻ" onPress={share} />} />
      <Chips>
        <Chip label="Kỳ trước" selected={offset === -1} onPress={() => setOffset(-1)} />
        <Chip label="Kỳ này (tạm tính)" selected={offset === 0} onPress={() => setOffset(0)} />
        <Chip label="2 kỳ trước" selected={offset === -2} onPress={() => setOffset(-2)} />
      </Chips>
      {!sum.count ? <EmptyState icon="file-text" title="Chưa đủ dữ liệu" body="Kỳ này chưa có giao dịch đã xác nhận." /> : (
        <>
          <Card variant="fill">
            <T v="caption">{`${sum.label} của bạn`}</T>
            <T v="title">{sum.saved >= 0 ? `Tiết kiệm ${shortMoney(sum.saved)}` : `Chi vượt thu ${shortMoney(-sum.saved)}`}</T>
            {sum.avgSaved ? <T v="caption">{`${sum.saved >= sum.avgSaved ? 'Cao' : 'Thấp'} hơn trung bình 6 kỳ ${shortMoney(Math.abs(sum.saved - sum.avgSaved))}`}</T> : null}
          </Card>
          {sum.insights.map((i, k) => <ListItem key={k} left={<Thumb icon={i.icon} color={i.icon === 'alert-triangle' ? c.negative : c.a} bg={c.at} />} title={i.text} strong={false} />)}
          {sum.suggestion ? (
            <Card variant="tint">
              <Row><Thumb icon="zap" color={c.a} bg={c.surface} size={32} /><T v="headline">Gợi ý kỳ tới</T></Row>
              <T v="body">{sum.suggestion.text}</T>
              <Button title="Đặt hạn mức" size="sm" onPress={() => { s.set({ budgets: { ...s.budgets, [sum.suggestion!.categoryId]: sum.suggestion!.limit } }); track('summary_budget_applied'); toast('Đã đặt hạn mức', { tone: 'success' }); }} />
            </Card>
          ) : null}
          <Banner tone="ok" icon="shield" text={sum.viaAi ? 'AI viết từ số tổng theo danh mục — không có nơi chi hay tài khoản.' : 'Viết trên máy từ số liệu của bạn.'} />
        </>
      )}
    </Screen>
  );
}
