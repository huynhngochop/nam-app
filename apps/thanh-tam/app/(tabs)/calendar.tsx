import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, IconButton, Row, Screen, SectionHeader, Sheet, T, useLayout, useTheme } from '@nam/ui';
import { CalendarGrid, DayMark, NavRow, dmy, monthCells, solarWithWeekday } from '../../src/components';
import { CAL_FIRST, CAL_LAST } from '../../src/lib/dates';
import {
  canChiDay,
  canChiMonth,
  canChiYear,
  hoangDaoHours,
  lunarDayWords,
  lunarOf,
  monthName,
} from '../../src/calendar/lunar';
import { RITUALS } from '../../src/data/rituals';
import { gioInLunarYear, nextByRule } from '../../src/lib/schedule';
import { useTT } from '../../src/store';
import { useRitualFilter, useToday } from '../../src/hooks';

type DayInfo = {
  rituals: { id: string; title: string; icon: any }[];
  gios: { id: string; title: string; missing: boolean }[];
};

/** TT-13 · Lịch âm + TT-14 · Chi tiết ngày (sheet trên điện thoại; cột bên phải trên màn rộng). */
export default function CalendarTab() {
  const { c } = useTheme();
  const L = useLayout();
  const today = useToday();
  const relevant = useRitualFilter();
  const anniversaries = useTT((s) => s.anniversaries);
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [sel, setSel] = useState<Date>(today);
  const [sheet, setSheet] = useState(false);

  const { marks, info } = useMemo(() => {
    const cells = monthCells(ym.y, ym.m);
    const inRange = cells.filter((x) => x.lunar);
    const first = inRange[0].date,
      last = inRange[inRange.length - 1].date;
    const marks = new Map<string, DayMark[]>();
    const info = new Map<string, DayInfo>();
    const add = (d: Date, k: DayMark) => {
      const key = d.toDateString();
      marks.set(key, [...(marks.get(key) ?? []), k]);
    };
    const inf = (d: Date) => {
      const key = d.toDateString();
      if (!info.has(key)) info.set(key, { rituals: [], gios: [] });
      return info.get(key)!;
    };
    for (const cell of cells)
      if (cell.lunar && (cell.lunar.day === 1 || cell.lunar.day === 15))
        add(cell.date, cell.lunar.day === 1 ? 'mung1' : 'ram');
    for (const r of RITUALS) {
      if (!r.when.rule || !relevant(r)) continue;
      if (r.when.rule.kind === 'monthly') {
        for (const cell of cells) {
          if (!cell.lunar || !(r.when.rule.days as number[]).includes(cell.lunar.day)) continue;
          inf(cell.date).rituals.push({ id: r.id, title: r.title, icon: r.icon });
          if (cell.lunar.day !== 1 && cell.lunar.day !== 15) add(cell.date, 'le');
        }
        continue;
      }
      const d = nextByRule(r.when.rule, first, 43);
      if (d && d <= last) {
        add(d, 'le');
        inf(d).rituals.push({ id: r.id, title: r.title, icon: r.icon });
      }
    }
    const years = new Set(cells.filter((x) => x.lunar).map((x) => x.lunar!.year));
    for (const a of anniversaries)
      for (const y of years) {
        const o = gioInLunarYear(a, y);
        if (o && o.date >= first && o.date <= last) {
          add(o.date, 'gio');
          inf(o.date).gios.push({ id: a.id, title: `Giỗ ${a.relation.toLowerCase()} ${a.name}`, missing: o.missing });
        }
      }
    return { marks, info };
  }, [ym, anniversaries, relevant]);

  const idx = (v: { y: number; m: number }) => v.y * 12 + v.m;
  const canPrev = idx(ym) > idx(CAL_FIRST);
  const canNext = idx(ym) < idx(CAL_LAST);
  const shift = (k: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m + k, 1);
      const n = { y: d.getFullYear(), m: d.getMonth() };
      return idx(n) < idx(CAL_FIRST) || idx(n) > idx(CAL_LAST) ? { y, m } : n;
    });
  const pick = (d: Date) => {
    setSel(d);
    if (d.getMonth() !== ym.m) setYm({ y: d.getFullYear(), m: d.getMonth() });
    if (!L.twoPane) setSheet(true);
  };
  const firstL = lunarOf(new Date(ym.y, ym.m, ym.y === 1900 && ym.m === 0 ? 31 : 1));
  const lastL = lunarOf(new Date(ym.y, ym.m + 1, 0));

  const detail = <DayDetail date={sel} info={info.get(sel.toDateString())} />;
  const cal = (
    <View style={{ gap: 12 }}>
      <Row between>
        {canPrev ? (
          <IconButton icon="chevron-left" label="Tháng trước" onPress={() => shift(-1)} />
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={{ alignItems: 'center', flex: 1 }}>
          <T v="title">
            Tháng {ym.m + 1}/{ym.y}
          </T>
          <T v="caption" muted numberOfLines={1}>
            Âm lịch: tháng {monthName(firstL.month, firstL.leap)}
            {firstL.month !== lastL.month || firstL.leap !== lastL.leap
              ? ` – ${monthName(lastL.month, lastL.leap)}`
              : ''}{' '}
            năm {canChiYear(lastL.year)}
          </T>
        </View>
        {canNext ? (
          <IconButton icon="chevron-right" label="Tháng sau" onPress={() => shift(1)} />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </Row>
      <CalendarGrid year={ym.y} month={ym.m} selected={sel} marks={marks} onSelect={pick} />
      <Row gap={16} wrap>
        <Row gap={6}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.a }} />
          <T v="caption" muted>
            Lễ
          </T>
        </Row>
        <Row gap={6}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.a2 }} />
          <T v="caption" muted>
            Ngày giỗ
          </T>
        </Row>
        <T v="caption" muted>
          Số nhỏ: ngày âm
        </T>
      </Row>
      <Row gap={8}>
        <Button
          title="Hôm nay"
          variant="secondary"
          size="md"
          onPress={() => {
            setYm({ y: today.getFullYear(), m: today.getMonth() });
            setSel(today);
          }}
        />
        <Button
          title="Sổ giỗ"
          variant="secondary"
          size="md"
          icon="book"
          onPress={() => router.push('/anniversaries')}
        />
      </Row>
    </View>
  );

  if (L.twoPane) {
    return (
      <Screen readable={false} padded={false}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <ScrollView style={{ flex: 1.3 }} contentContainerStyle={{ padding: L.gutter }}>
            {cal}
          </ScrollView>
          <ScrollView
            style={{ flex: 1, borderLeftWidth: 1, borderColor: c.line }}
            contentContainerStyle={{ padding: L.gutter }}
          >
            {detail}
          </ScrollView>
        </View>
      </Screen>
    );
  }
  return (
    <Screen scroll>
      <T v="display" accessibilityRole="header" style={{ marginTop: 8 }}>
        Lịch âm
      </T>
      {cal}
      <Sheet visible={sheet} onClose={() => setSheet(false)}>
        {detail}
      </Sheet>
    </Screen>
  );
}

function DayDetail({ date, info }: { date: Date; info?: DayInfo }) {
  const l = lunarOf(date);
  const hours = hoangDaoHours(date);
  return (
    <View style={{ gap: 12 }}>
      <T v="caption" muted>
        {solarWithWeekday(date)} (dương lịch)
      </T>
      <T v="title">
        Ngày {lunarDayWords(l.day)} tháng {monthName(l.month, l.leap)} (âm lịch)
      </T>
      <Card variant="tint">
        <T v="body">
          Ngày {canChiDay(date)} · tháng {canChiMonth(l.month, l.year)} · năm {canChiYear(l.year)}
        </T>
        <T v="caption" muted>
          Giờ hoàng đạo (theo lịch dân gian): {hours.map((h) => h.label).join(' · ')}
        </T>
      </Card>
      {info?.rituals.length ? (
        <View>
          <SectionHeader title="Lễ trong ngày" />
          {info.rituals.map((r) => (
            <NavRow key={r.id} icon={r.icon} title={r.title} href={`/ritual/${r.id}`} />
          ))}
        </View>
      ) : null}
      {info?.gios.length ? (
        <View>
          <SectionHeader title="Ngày giỗ" />
          {info.gios.map((g) => (
            <NavRow
              key={g.id}
              icon="users"
              title={g.title}
              subtitle={g.missing ? 'Tháng này thiếu ngày 30 nên giỗ vào ngày cuối tháng' : undefined}
              href="/anniversaries"
            />
          ))}
        </View>
      ) : null}
      <Button
        title="Thêm ngày giỗ vào ngày này"
        variant="secondary"
        icon="plus"
        onPress={() => router.push(`/anniversaries/edit?day=${l.day}&month=${l.month}&leap=${l.leap ? 1 : 0}`)}
      />
      <T v="caption" muted>
        Ngày dương {dmy(date)}. Âm lịch tính theo giờ Việt Nam.
      </T>
    </View>
  );
}
