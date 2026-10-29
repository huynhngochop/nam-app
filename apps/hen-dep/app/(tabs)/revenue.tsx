import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { BarChart, Card, EmptyState, Grid, ListItem, Row, Screen, SectionHeader, Segmented, T, useTheme } from '@nam/ui';
import { addDays, dayMonth, shortMoney, startOfDay, vnd, weekdayShort } from '@nam/core';
import { priceOf, svcOf, useHen } from '../../src/store';
import { SOURCE_LABEL } from '../../src/types';

type Range = 'today' | 'week' | 'month';

/** HD-C10 · Doanh thu. Chỉ tính lịch "Hoàn thành". Tablet: các thẻ xếp 2–3 cột. */
export default function Revenue() {
  const { c } = useTheme();
  const s = useHen();
  const [range, setRange] = useState<Range>('week');

  const data = useMemo(() => {
    const today = startOfDay(new Date());
    const days = range === 'today' ? 1 : range === 'week' ? 7 : 30;
    const from = addDays(today, -(days - 1)).getTime();
    const prevFrom = from - days * 86400000;
    const done = s.bookings.filter((b) => b.status === 'completed' && b.startAt >= from);
    const prev = s.bookings.filter((b) => b.status === 'completed' && b.startAt >= prevFrom && b.startAt < from);
    const all = s.bookings.filter((b) => b.startAt >= from && b.startAt < Date.now());
    const total = done.reduce((a, b) => a + priceOf(b, s.services), 0);
    const prevTotal = prev.reduce((a, b) => a + priceOf(b, s.services), 0);
    const noShow = all.filter((b) => b.status === 'no_show').length;

    const bars = range === 'month'
      ? Array.from({ length: 5 }, (_, i) => {
          const end = addDays(today, 1 - i * 7).getTime(); const st = end - 7 * 86400000;
          return { label: dayMonth(new Date(st)), value: done.filter((b) => b.startAt >= st && b.startAt < end).reduce((a, b) => a + priceOf(b, s.services), 0) };
        }).reverse()
      : Array.from({ length: range === 'today' ? 1 : 7 }, (_, i) => {
          const d = addDays(today, -i); const st = d.getTime(); const end = st + 86400000;
          return { label: range === 'today' ? 'Hôm nay' : weekdayShort(d), value: done.filter((b) => b.startAt >= st && b.startAt < end).reduce((a, b) => a + priceOf(b, s.services), 0) };
        }).reverse();

    const byStaff = s.staff.map((st) => {
      const mine = done.filter((b) => b.staffId === st.id);
      const rev = mine.reduce((a, b) => a + priceOf(b, s.services), 0);
      return { st, count: mine.length, rev, commission: Math.round((rev * st.commissionPct) / 100) };
    }).sort((a, b) => b.rev - a.rev);

    const svcCount = new Map<string, { name: string; n: number; rev: number }>();
    done.forEach((b) => svcOf(b.serviceIds, s.services).forEach((sv) => {
      const e = svcCount.get(sv.id) ?? { name: sv.name, n: 0, rev: 0 }; e.n++; e.rev += sv.price; svcCount.set(sv.id, e);
    }));
    const topSvc = [...svcCount.values()].sort((a, b) => b.rev - a.rev).slice(0, 5);

    const bySource = new Map<string, number>();
    all.forEach((b) => bySource.set(b.source, (bySource.get(b.source) ?? 0) + 1));
    const methods = { cash: 0, transfer: 0, card: 0 };
    done.forEach((b) => { if (b.payment) methods[b.payment.method] += b.payment.amount; });

    return { total, prevTotal, count: done.length, noShow, all: all.length, bars, byStaff, topSvc, bySource: [...bySource.entries()].sort((a, b) => b[1] - a[1]), methods };
  }, [s.bookings, s.services, s.staff, range]);

  const delta = data.prevTotal ? Math.round(((data.total - data.prevTotal) / data.prevTotal) * 100) : null;

  return (
    <Screen scroll>
      <T v="display" accessibilityRole="header">Doanh thu</T>
      <Segmented options={[{ key: 'today', label: 'Hôm nay' }, { key: 'week', label: '7 ngày' }, { key: 'month', label: '30 ngày' }]} value={range} onChange={setRange} />
      {!data.count && !data.all ? (
        <EmptyState icon="bar-chart-2" title="Chưa có số liệu" body="Doanh thu tính từ lịch hẹn đã hoàn thành và thanh toán." />
      ) : (
        <>
          <Card variant="tint">
            <T v="caption">Tổng doanh thu</T>
            <T v="display">{vnd(data.total)}</T>
            {delta != null ? <T v="caption" color={delta >= 0 ? c.positive : c.negative}>{`${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% so với kỳ trước`}</T> : null}
          </Card>
          <Grid min={3} gap={8}>
            <Card variant="fill"><T v="caption" muted>Lượt khách</T><T v="title">{String(data.count)}</T></Card>
            <Card variant="fill"><T v="caption" muted>Trung bình/lượt</T><T v="title">{data.count ? shortMoney(data.total / data.count) : '—'}</T></Card>
            <Card variant="fill"><T v="caption" muted>Tỉ lệ bỏ hẹn</T><T v="title" color={data.noShow ? c.negative : undefined}>{data.all ? `${Math.round((data.noShow / data.all) * 100)}%` : '—'}</T></Card>
          </Grid>
          {range !== 'today' ? <Card><BarChart data={data.bars} format={vnd} highlight={data.bars.length - 1} /></Card> : null}
          <Grid min={1} gap={12}>
            <View>
              <SectionHeader title="Theo thợ (hoa hồng tạm tính)" />
              {data.byStaff.map(({ st, count, rev, commission }) => (
                <ListItem key={st.id} title={st.name} subtitle={`${count} lượt · hoa hồng ${st.commissionPct}%: ${vnd(commission)}`} right={<T v="headline">{shortMoney(rev)}</T>} />
              ))}
            </View>
            <View>
              <SectionHeader title="Dịch vụ bán chạy" />
              {data.topSvc.length ? data.topSvc.map((x) => <ListItem key={x.name} title={x.name} subtitle={`${x.n} lượt`} right={<T v="headline">{shortMoney(x.rev)}</T>} />) : <T v="caption" muted>Chưa có.</T>}
            </View>
            <View>
              <SectionHeader title="Khách đặt từ đâu" />
              {data.bySource.map(([k, n]) => <ListItem key={k} title={SOURCE_LABEL[k as keyof typeof SOURCE_LABEL]} right={<T v="headline">{`${n} lịch`}</T>} />)}
            </View>
            <View>
              <SectionHeader title="Hình thức thanh toán" />
              <Row between><T v="body">Tiền mặt</T><T v="headline">{vnd(data.methods.cash)}</T></Row>
              <Row between><T v="body">Chuyển khoản</T><T v="headline">{vnd(data.methods.transfer)}</T></Row>
              <Row between><T v="body">Thẻ</T><T v="headline">{vnd(data.methods.card)}</T></Row>
            </View>
          </Grid>
          <T v="caption" muted>Số liệu tính trên máy, cập nhật ngay khi bạn đánh dấu thanh toán.</T>
        </>
      )}
    </Screen>
  );
}
