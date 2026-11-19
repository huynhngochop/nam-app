import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, EmptyState, Grid, IconButton, ProgressBar, Row, Screen, T, Thumb, useTheme } from '@nam/ui';
import { AdBanner } from '@nam/ads';
import { shortDate, shortMoney, vnd } from '@nam/core';
import { useVi } from '../../src/store';
import { usePro } from '../../src/features';
import { FREE_FUNDS, monthlyNeed } from '../../src/funds';

/** Quỹ mục tiêu. Tablet: lưới 2–3 cột. */
export default function Funds() {
  const { c } = useTheme();
  const state = useVi();
  const pro = usePro();
  const total = state.funds.reduce((a, f) => a + f.saved, 0);
  const canAdd = pro || state.funds.length < FREE_FUNDS;
  return (
    <Screen scroll>
      <Row between>
        <T v="display" accessibilityRole="header">
          Quỹ
        </T>
        <IconButton icon="plus" label="Tạo quỹ" onPress={() => router.push(canAdd ? '/fund/new' : '/paywall')} />
      </Row>
      {state.funds.length ? (
        <Card variant="fill">
          <T v="caption">Tổng trong các quỹ</T>
          <T v="title">{state.hideAmounts ? '••••••' : vnd(total)}</T>
        </Card>
      ) : null}
      {!state.funds.length ? (
        <EmptyState
          icon="target"
          title="Chưa có quỹ nào"
          body="Đặt mục tiêu — Ví Gọn tính số cần để dành mỗi tháng."
          action="Tạo quỹ"
          onAction={() => router.push('/fund/new')}
        />
      ) : (
        <Grid min={1}>
          {state.funds.map((f) => {
            const pct = f.goal ? Math.min(1, f.saved / f.goal) : 0;
            const need = monthlyNeed(f);
            return (
              <Card key={f.id} onPress={() => router.push(`/fund/${f.id}`)} accessibilityLabel={f.name}>
                <Row>
                  <Thumb icon={f.icon} color={c.a} bg={c.at} />
                  <View style={{ flex: 1 }}>
                    <T v="headline">{f.name}</T>
                    <T v="caption" muted>
                      {pct >= 1
                        ? 'Đã đủ mục tiêu'
                        : f.deadline
                          ? `Hạn ${shortDate(new Date(f.deadline))}${need ? ` · ${shortMoney(need)}/tháng` : ''}`
                          : 'Không đặt hạn'}
                    </T>
                  </View>
                  <T v="headline">{`${Math.round(pct * 100)}%`}</T>
                </Row>
                <ProgressBar value={pct} color={pct >= 1 ? c.positive : c.a} />
                <T v="caption" muted>
                  {state.hideAmounts ? '•••' : `${shortMoney(f.saved)} / ${shortMoney(f.goal)}`}
                </T>
              </Card>
            );
          })}
        </Grid>
      )}
      {!pro ? (
        <Card variant="fill">
          <T v="caption" center>{`Gói miễn phí: ${FREE_FUNDS} quỹ · Pro: không giới hạn`}</T>
        </Card>
      ) : null}
      <AdBanner />
    </Screen>
  );
}
