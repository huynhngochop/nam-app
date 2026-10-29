import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Badge, BarChart, Card, Icon, ListItem, ProgressBar, Row, Screen, SectionHeader, Segmented, T, Thumb, useTheme } from '@nam/ui';
import { addDays, dateKey, decimalVi, minutesLabel, weekdayShort } from '@nam/core';
import { streakOf, useNhip } from '../../src/store';

type Range = 'day' | 'week' | 'month';

/** NH-12 · Thống kê. Tổng theo ngày tính sẵn trong store nên mở nhanh dù có nhiều phiên. */
export default function Stats() {
  const { c } = useTheme();
  const s = useNhip();
  const [range, setRange] = useState<Range>('week');
  const today = new Date();
  const streak = streakOf(s.daily, s.goalMin, s.restDays);

  const { data, total, prevTotal } = useMemo(() => {
    const days = range === 'day' ? 1 : range === 'week' ? 7 : 30;
    const pts = Array.from({ length: days }, (_, i) => {
      const d = addDays(today, i - days + 1);
      return { label: days === 7 ? weekdayShort(d) : String(d.getDate()), value: s.daily[dateKey(d)] ?? 0 };
    });
    const prev = Array.from({ length: days }, (_, i) => s.daily[dateKey(addDays(today, i - 2 * days + 1))] ?? 0).reduce((a, b) => a + b, 0);
    return { data: pts, total: pts.reduce((a, p) => a + p.value, 0), prevTotal: prev };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.daily, range]);
  const delta = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
  const todayKey = dateKey(today);
  const sessionsToday = s.logs.filter((l) => l.status === 'completed' && dateKey(new Date(l.at)) === todayKey).length;
  const byTask = useMemo(() => {
    const m = new Map<string, number>();
    s.logs.forEach((l) => { if (l.taskId) m.set(l.taskId, (m.get(l.taskId) ?? 0) + l.minutes); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [s.logs]);

  return (
    <Screen scroll>
      <Row between style={{ paddingTop: 8 }}>
        <T v="display" accessibilityRole="header">Thống kê</T>
        <Badge label={`${streak} ngày liền`} tone="accent" />
      </Row>
      <Segmented value={range} onChange={setRange} options={[{ key: 'day', label: 'Ngày' }, { key: 'week', label: 'Tuần' }, { key: 'month', label: 'Tháng' }]} />
      <View>
        <T v="numeral">{`${decimalVi(total / 60)} giờ`}</T>
        <T v="caption" muted>
          {'tập trung'}
          {delta != null ? <T v="caption" color={delta >= 0 ? c.positive : c.negative}>{` · ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% so kỳ trước`}</T> : null}
        </T>
      </View>
      {range !== 'day' ? <BarChart data={data} highlight={data.length - 1} format={(v) => minutesLabel(v)} /> : <ProgressBar value={total / s.goalMin} height={10} />}
      <SectionHeader title="Thói quen hôm nay" action="Xem tất cả" onAction={() => router.push('/habits')} />
      {s.habits.slice(0, 2).map((h) => {
        const val = h.auto === 'focus_sessions' ? sessionsToday : s.habitLogs[todayKey]?.[h.id] ?? 0;
        const full = val >= h.target;
        return (
          <ListItem key={h.id} left={full ? <Thumb icon="check" bg={c.a} color={c.onAccent} size={36} /> : <Thumb icon="circle" size={36} />} title={h.name}
            right={<T v="caption" muted>{`${val}/${h.target} ${h.unit}`}</T>} onPress={() => router.push('/habits')} />
        );
      })}
      <SectionHeader title="Theo việc" />
      {s.isPro ? byTask.map(([id, min]) => <ListItem key={id} title={s.tasks.find((t) => t.id === id)?.title ?? 'Việc đã xóa'} strong={false} right={<T v="caption">{minutesLabel(min)}</T>} />)
        : <Card onPress={() => router.push('/paywall')}><Row><Icon name="lock" color={c.inkMuted} size={16} /><T v="body" style={{ flex: 1 }}>Thống kê theo từng việc có trong Nhịp Pro</T><Badge label="Pro" tone="pro" /></Row></Card>}
      {!s.isPro ? (
        <View style={{ minHeight: 50, borderWidth: 1, borderStyle: 'dashed', borderColor: c.line, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <T v="caption" muted>Banner quảng cáo 320×50 — chỉ ở màn này</T>
        </View>
      ) : null}
    </Screen>
  );
}
