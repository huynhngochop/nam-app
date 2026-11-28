import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { dateKey } from '@nam/core';
import { AdBanner, AppBar, Button, Card, IconButton, ListItem, Row, Screen, SectionHeader, T, useTheme } from '@nam/ui';
import { adjust, CRITERIA, weekIndexOf } from '../../src/plan';
import { errorStats, useLenBand } from '../../src/store';

/** 6 · Tiến độ: chỉ số chính = số lỗi đã sửa dứt; band thực tế so với kế hoạch; đề xuất điều chỉnh giáo án. */
export default function Progress() {
  const { c } = useTheme();
  const plan = useLenBand((s) => s.plan);
  const bands = useLenBand((s) => s.bands);
  const errors = useLenBand((s) => s.errors);
  const sessions = useLenBand((s) => s.sessions);
  const goal = useLenBand((s) => s.goal);
  const isPro = useLenBand((s) => s.isPro);
  const applyAllocation = useLenBand((s) => s.applyAllocation);
  const set = useLenBand((s) => s.set);
  const today = dateKey(new Date());
  const st = errorStats(errors);
  const wi = plan ? weekIndexOf(plan, today) : 0;
  const dismissed = useLenBand((s) => s.adjustDismissedWeek === wi);
  const adj = useMemo(() => (plan && !dismissed ? adjust(plan, bands, today) : null), [plan, bands, today, dismissed]);
  const expected = plan?.weekly[wi] ?? 0;
  const examIn = goal
    ? Math.max(0, Math.round((new Date(goal.examDate + 'T00:00').getTime() - Date.now()) / 86_400_000))
    : null;
  const pct = (n: number) => (st.total ? n / st.total : 0);

  return (
    <Screen scroll>
      <AppBar
        large
        title="Tiến độ"
        right={<IconButton icon="settings" label="Cài đặt" onPress={() => router.push('/settings')} />}
      />
      {plan ? (
        <T v="caption" muted>
          Tuần {wi + 1}/{plan.weeks}
          {examIn !== null ? ` · còn ${examIn} ngày đến kỳ thi` : ''}
        </T>
      ) : null}

      <Card
        style={{ backgroundColor: '#13261f', borderColor: '#13261f' }}
        onPress={() => router.navigate('/(tabs)/notebook')}
      >
        <Row gap={8} style={{ alignItems: 'baseline' }}>
          <T v="numeral" color="#8fe0b0">
            {st.closed}
          </T>
          <T v="headline" color="#d7f2e1">
            lỗi đã sửa dứt điểm
          </T>
        </Row>
        <View
          style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#2c3a4a' }}
        >
          <View style={{ flex: pct(st.closed), backgroundColor: '#2f9e8f' }} />
          <View style={{ flex: pct(st.recalling), backgroundColor: '#f5a524' }} />
          <View style={{ flex: pct(st.repairing), backgroundColor: '#e5674f' }} />
        </View>
        <Row gap={12} wrap>
          <T v="caption" color="#a8d8ba">
            ■ đã sửa dứt {st.closed}
          </T>
          <T v="caption" color="#f5c56b">
            ■ đang gài lại {st.recalling}
          </T>
          <T v="caption" color="#f2a596">
            ■ mới {st.repairing}
          </T>
        </Row>
      </Card>

      {adj ? (
        <Card variant="tint">
          <T v="headline">Đề xuất điều chỉnh giáo án</T>
          <T v="body">{adj.message}</T>
          <Row gap={8}>
            <Button title="Giữ như cũ" variant="secondary" size="md" onPress={() => set({ adjustDismissedWeek: wi })} />
            <Button title="Áp dụng" size="md" onPress={() => applyAllocation(adj.allocation)} />
          </Row>
        </Card>
      ) : null}

      {plan ? (
        <Card>
          <Row between>
            <T v="headline">Thực tế so với kế hoạch</T>
            <T v="caption" muted>
              cần {expected.toFixed(1)} tuần này
            </T>
          </Row>
          {CRITERIA.map((k) => {
            const d = bands[k] - expected;
            return (
              <Row key={k} gap={10}>
                <T v="caption" weight="semibold" style={{ width: 36 }}>
                  {k}
                </T>
                <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: c.surface2 }}>
                  <View
                    style={{
                      width: `${Math.min(100, ((bands[k] - 3) / 6) * 100)}%`,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: c.a,
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      left: `${((expected - 3) / 6) * 100}%`,
                      top: -3,
                      width: 2,
                      height: 16,
                      backgroundColor: c.ink,
                    }}
                  />
                </View>
                <T
                  v="caption"
                  weight="semibold"
                  color={d >= 0 ? c.positive : d <= -0.5 ? c.negative : c.ink}
                  style={{ width: 52, textAlign: 'right' }}
                >
                  {bands[k].toFixed(1)} {d > 0 ? '▲' : d <= -0.5 ? '▼' : '='}
                </T>
              </Row>
            );
          })}
        </Card>
      ) : null}

      <Button
        title="Thi thử ngay"
        icon="clock"
        variant="secondary"
        onPress={() => router.push({ pathname: '/session', params: { kind: 'mock', mode: 'exam' } })}
      />

      {sessions.length ? <SectionHeader title="Buổi gần đây" /> : null}
      {sessions.slice(0, 8).map((s) => (
        <ListItem
          key={s.id}
          title={
            s.kind === 'mock' ? 'Thi thử' : s.kind === 'placement' ? 'Nói thử đầu vào' : `Part ${s.kind.slice(-1)}`
          }
          subtitle={new Date(s.at).toLocaleDateString('vi-VN')}
          right={<T v="headline">{s.overall?.toFixed(1) ?? '–'}</T>}
        />
      ))}
      <AdBanner hidden={isPro} />
    </Screen>
  );
}
