import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { dateKey } from '@nam/core';
import { AppBar, Badge, Button, Card, EmptyState, IconButton, ProgressBar, Row, Screen, T, useTheme } from '@nam/ui';
import { CRITERIA, CRITERION_VI, phaseOf, weekIndexOf } from '../../src/plan';
import { useEmma } from '../../src/store';

/** 2 · Lộ trình cá nhân hoá: band dự kiến theo tuần, phân bổ thời gian, 4 giai đoạn. */
export default function Roadmap() {
  const { c } = useTheme();
  const plan = useEmma((s) => s.plan);
  const goal = useEmma((s) => s.goal);
  if (!plan || !goal)
    return (
      <Screen>
        <EmptyState icon="map" title="Chưa có lộ trình" action="Đặt mục tiêu" onAction={() => router.push('/goals')} />
      </Screen>
    );
  const wi = weekIndexOf(plan, dateKey(new Date()));
  const current = phaseOf(plan, wi);
  const maxBand = Math.max(plan.target, ...plan.weekly);
  const minBand = Math.min(plan.start, ...plan.weekly) - 0.5;
  // gom các tuần thành tối đa 12 cột cho dễ nhìn
  const step = Math.ceil(plan.weekly.length / 12);
  const cols = plan.weekly.filter((_, k) => k % step === step - 1 || k === plan.weekly.length - 1);
  const colors = [c.a, '#7e95f0', c.a2, c.positive];

  return (
    <Screen scroll>
      <AppBar
        large
        title={`${plan.weeks} tuần · ${plan.start.toFixed(1)} → ${plan.target.toFixed(1)}`}
        right={<IconButton icon="sliders" label="Chỉnh mục tiêu" onPress={() => router.push('/goals')} />}
      />
      {plan.feasibility !== 'ok' ? (
        <Card variant="danger">
          <T v="headline" color={c.negative}>
            {plan.feasibility === 'tight' ? 'Lộ trình hơi gấp' : 'Khó đạt kịp ngày thi'}
          </T>
          {plan.suggestions.map((s) => (
            <T key={s} v="body">
              • {s}
            </T>
          ))}
        </Card>
      ) : null}

      <Card style={{ backgroundColor: '#121826', borderColor: '#121826' }}>
        <Row between>
          <T v="caption" color="#c9d0e3">
            Band dự kiến theo tuần
          </T>
          <T v="caption" color="#9aa4bd">
            Thi {goal.examDate.split('-').reverse().join('/')}
          </T>
        </Row>
        <Row gap={6} style={{ alignItems: 'flex-end', height: 100 }}>
          {cols.map((b, k) => (
            <View key={k} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <T v="caption" color="#c9d0e3">
                {b.toFixed(1)}
              </T>
              <View
                style={{
                  width: '100%',
                  height: 12 + ((b - minBand) / Math.max(0.5, maxBand - minBand)) * 64,
                  borderRadius: 6,
                  backgroundColor: b >= plan.target ? '#f5a524' : '#7e95f0',
                }}
              />
            </View>
          ))}
        </Row>
      </Card>

      <T v="headline">Phân bổ thời gian theo điểm yếu</T>
      <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' }}>
        {CRITERIA.map((k, n) => (
          <View key={k} style={{ flex: plan.allocation[k], backgroundColor: colors[n] }} />
        ))}
      </View>
      <Row wrap gap={12}>
        {CRITERIA.map((k, n) => (
          <Row key={k} gap={6}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors[n] }} />
            <T v="caption">
              {CRITERION_VI[k]} · {Math.round(plan.allocation[k] * 100)}%
            </T>
          </Row>
        ))}
      </Row>

      {plan.phases.map((ph, n) => {
        const isNow = ph.key === current.key;
        const progress = isNow
          ? (wi + 1 - ph.fromWeek + 0.5) / (ph.toWeek - ph.fromWeek + 1)
          : wi + 1 > ph.toWeek
            ? 1
            : 0;
        return (
          <Card key={ph.key} variant={isNow ? 'outlineAccent' : 'default'}>
            <Row between>
              <T v="headline">
                {n + 1} · {ph.name}
              </T>
              <Badge
                label={isNow ? `Đang học · T${ph.fromWeek}–${ph.toWeek}` : `T${ph.fromWeek}–${ph.toWeek}`}
                tone={isNow ? 'accent' : 'neutral'}
              />
            </Row>
            <T v="caption" muted>
              {ph.focus} · mục tiêu {ph.targetBand.toFixed(1)}
            </T>
            {isNow || progress === 1 ? <ProgressBar value={Math.min(1, progress)} /> : null}
          </Card>
        );
      })}
      <Button title="Bắt đầu bài hôm nay" onPress={() => router.navigate('/(tabs)/today')} />
    </Screen>
  );
}
