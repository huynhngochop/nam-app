import React, { memo, ReactNode, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Card, Icon, IconName, Row, T, useLayout, useTheme, radius } from '@nam/ui';
import { weekdayLong } from '@nam/core';
import {
  canChiDay, canChiMonth, canChiYear, hoangDaoHours, lunarDayShort, lunarOf, monthName, type LunarDate,
} from './calendar/lunar';
import { SOURCE_KIND_LABEL } from './data/sources';
import type { SourceRef } from './data/types';
import type { Paragraph } from './lib/prayer';
import { SWATCH } from './age';

/* ------------------------------------------------------------ chữ 3 dòng + Xem thêm */
/** Mô tả ngắn tối đa 3 dòng, có chữ "Xem thêm" mở trang đầy đủ. */
export function Brief({ text, href, lines = 3 }: { text: string; href?: string; lines?: number }) {
  return (
    <View style={{ gap: 4 }}>
      <T v="body" muted numberOfLines={lines}>{text}</T>
      {href ? <MoreLink href={href} /> : null}
    </View>
  );
}
export function MoreLink({ href, label = 'Xem thêm' }: { href: string; label?: string }) {
  return (
    <Pressable onPress={() => router.push(href as never)} hitSlop={8} accessibilityRole="link" style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
      <Row gap={4}><T v="caption" accent weight="semibold">{label}</T><Icon name="chevron-right" size={14} /></Row>
    </Pressable>
  );
}

/* ------------------------------------------------------------ khối thông tin (Tuổi & năm) */
export const FactBlock = memo(function FactBlock({ label, value, brief, href, tone, right }: {
  label: string; value: string; brief?: string; href?: string; tone?: 'careful' | 'good'; right?: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <Card>
      <Row between wrap style={{ rowGap: 4 }}>
        <T v="micro" muted>{label}</T>
        {tone === 'careful' ? <Badge label="Cần thận trọng" tone="warning" /> : tone === 'good' ? <Badge label="Được coi là tốt" tone="positive" /> : right ?? null}
      </Row>
      <T v="title" color={c.ink}>{value}</T>
      {brief ? <Brief text={brief} href={href} /> : href ? <MoreLink href={href} label="Hiểu thế nào" /> : null}
    </Card>
  );
});

/* ------------------------------------------------------------ ba lớp: dân gian / thực tế / nên làm */
export function Layers({ folk, practical, advice, safetyFirst }: { folk: string; practical: string; advice: string[]; safetyFirst?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {safetyFirst ? <SafetyCard text={safetyFirst} /> : null}
      <Card>
        <Row gap={8}><Icon name="book" size={18} color={c.a} /><T v="headline">Dân gian quan niệm</T></Row>
        <T v="body">{folk}</T>
      </Card>
      <Card>
        <Row gap={8}><Icon name="eye" size={18} color={c.a} /><T v="headline">Nhìn thực tế</T></Row>
        <T v="body">{practical}</T>
      </Card>
      <Card variant="tint">
        <Row gap={8}><Icon name="check-circle" size={18} color={c.a} /><T v="headline">Nên làm</T></Row>
        {advice.map((a) => (
          <Row key={a} gap={8} style={{ alignItems: 'flex-start' }}><T v="body" accent>•</T><T v="body" style={{ flex: 1 }}>{a}</T></Row>
        ))}
      </Card>
    </View>
  );
}

/* ------------------------------------------------------------ an toàn lửa (TT-27) */
export function SafetyCard({ text, title = 'An toàn lửa' }: { text?: string; title?: string }) {
  const { c } = useTheme();
  return (
    <Card style={{ borderColor: c.warning, borderWidth: 1.5 }}>
      <Row gap={8}><Icon name="alert-triangle" size={18} color={c.warning} /><T v="headline">{title}</T></Row>
      <T v="body">{text ?? 'Đặt hương, nến xa rèm, giấy và tầm tay trẻ nhỏ. Không để lửa cháy khi không có người ở nhà. Hóa vàng trong thùng kim loại, có sẵn chậu nước.'}</T>
    </Card>
  );
}

/* ------------------------------------------------------------ nguồn */
export function Sources({ sources }: { sources: SourceRef[] }) {
  if (!sources.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <T v="micro" muted>Nguồn tham khảo</T>
      {sources.map((s) => (
        <Row key={s.title} gap={8} style={{ alignItems: 'flex-start' }}>
          <Badge label={SOURCE_KIND_LABEL[s.kind]} />
          <T v="caption" muted style={{ flex: 1 }}>{s.title}</T>
        </Row>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------ thẻ âm lịch hôm nay */
export function LunarCard({ date, onPress }: { date: Date; onPress?: () => void }) {
  const { c } = useTheme();
  const l = lunarOf(date);
  const hours = hoangDaoHours(date).slice(0, 6).map((h) => h.label).join(' · ');
  const vnTz = -date.getTimezoneOffset() === 420;
  return (
    <Card variant="tint" onPress={onPress} accessibilityLabel={`Âm lịch: ngày ${l.day} tháng ${monthName(l.month, l.leap)}`}>
      <Row between style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="caption" muted>{weekdayLong(date)}, {date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()} (dương lịch)</T>
          <T v="display" color={c.a}>{lunarDayShort(l.day)} tháng {monthName(l.month, l.leap)}</T>
          <T v="caption" muted>Âm lịch · năm {canChiYear(l.year)} · tháng {canChiMonth(l.month, l.year)} · ngày {canChiDay(date)}</T>
        </View>
        <View style={{ alignItems: 'center', minWidth: 56 }}>
          <T v="numeral" color={c.a}>{l.day}</T>
          <T v="micro" muted>âm</T>
        </View>
      </Row>
      <T v="caption" muted numberOfLines={2}>Giờ hoàng đạo: {hours}</T>
      {!vnTz ? <T v="caption" muted>Theo lịch Việt Nam</T> : null}
    </Card>
  );
}

/* ------------------------------------------------------------ lưới lịch tháng (TT-13) */
export type DayMark = 'ram' | 'mung1' | 'gio' | 'le';
export { monthCells } from './lib/dates';
import { monthCells } from './lib/dates';

const WD_HEAD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const CalendarGrid = memo(function CalendarGrid({ year, month, selected, marks, onSelect }: {
  year: number; month: number; selected: Date; marks: Map<string, DayMark[]>; onSelect: (d: Date) => void;
}) {
  const { c } = useTheme();
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const today = new Date().toDateString();
  const L = useLayout();
  // Ô cao theo cỡ chữ (chữ trong ô phóng tối đa 1,3 lần) để chữ 200 % không chồng hàng.
  const h = Math.round((L.isCompact ? 52 : 64) * Math.min(1.3, Math.max(1, L.fontScale)));
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {WD_HEAD.map((w) => <T key={w} v="micro" muted center style={{ flex: 1, paddingVertical: 6 }}>{w}</T>)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell) => {
          const key = cell.date.toDateString();
          const sel = key === selected.toDateString();
          const isToday = key === today;
          const m = marks.get(key) ?? [];
          const ld = cell.lunar;
          const lunarTxt = !ld ? '' : ld.day === 1 ? `${ld.day}/${ld.month}${ld.leap ? 'N' : ''}` : String(ld.day);
          const special = !!ld && (ld.day === 1 || ld.day === 15);
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(cell.date)}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${cell.date.getDate()} tháng ${cell.date.getMonth() + 1}${ld ? `, âm lịch ${ld.day} tháng ${monthName(ld.month, ld.leap)}` : ''}`}
              disabled={!ld}
              style={{ width: `${100 / 7}%`, height: h, padding: 2 }}
            >
              <View style={{
                flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
                backgroundColor: sel ? c.a : isToday ? c.at : 'transparent', opacity: cell.inMonth ? 1 : 0.4,
              }}>
                <T v="headline" maxFontSizeMultiplier={1.3} color={sel ? c.onAccent : c.ink}>{cell.date.getDate()}</T>
                <T v="caption" maxFontSizeMultiplier={1.3} style={{ fontSize: 11, lineHeight: 13 }} color={sel ? c.onAccent : special ? c.a : c.inkMuted} weight={special ? 'semibold' : 'medium'}>{lunarTxt}</T>
                {m.length ? (
                  <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                    {m.slice(0, 3).map((k, i) => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: sel ? c.onAccent : k === 'gio' ? c.a2 : c.a }} />)}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

/* ------------------------------------------------------------ văn khấn */
export const PrayerText = memo(function PrayerText({ paras, size, color, fieldColor, emptyColor, activeIndex, onField }: {
  paras: Paragraph[]; size: number; color?: string; fieldColor?: string; emptyColor?: string; activeIndex?: number; onField?: () => void;
}) {
  const { c } = useTheme();
  const lh = Math.round(size * 1.6);
  return (
    <View style={{ gap: size * 0.8 }}>
      {paras.map((p, i) => (
        <View key={i} style={{ borderRadius: radius.sm, paddingHorizontal: activeIndex === undefined ? 0 : 8, paddingVertical: activeIndex === undefined ? 0 : 4, backgroundColor: activeIndex === i ? 'rgba(217,171,90,0.16)' : 'transparent' }}>
          <T v="body" style={{ fontSize: size, lineHeight: lh }} color={color}>
            {p.segments.map((s, j) => s.field ? (
              <T key={j} v="body" onPress={onField} suppressHighlighting
                style={{ fontSize: size, lineHeight: lh, textDecorationLine: s.empty ? 'underline' : 'none', textDecorationStyle: 'dotted' }}
                weight="semibold" color={s.empty ? (emptyColor ?? c.inkMuted) : (fieldColor ?? c.a)}>{s.text}</T>
            ) : s.text)}
          </T>
          {p.repeat ? <T v="caption" muted style={{ marginTop: 4 }} color={emptyColor}>(đọc {p.repeat} lần)</T> : null}
        </View>
      ))}
    </View>
  );
});

/* ------------------------------------------------------------ ô màu */
export function Swatches({ names }: { names: string[] }) {
  const { c } = useTheme();
  return (
    <Row wrap gap={8}>
      {names.map((n) => (
        <Row key={n} gap={6} style={{ paddingHorizontal: 10, minHeight: 32, borderRadius: radius.pill, backgroundColor: c.surface2 }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: SWATCH[n] ?? c.line, borderWidth: 1, borderColor: c.line }} />
          <T v="caption">{n}</T>
        </Row>
      ))}
    </Row>
  );
}

/* ------------------------------------------------------------ dòng mục có biểu tượng */
export function NavRow({ icon, title, subtitle, href, onPress, right }: { icon: IconName; title: string; subtitle?: string; href?: string; onPress?: () => void; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress ?? (() => href && router.push(href as never))}
      accessibilityRole="button"
      style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: c.at, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color={c.a} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="headline">{title}</T>
        {subtitle ? <T v="caption" muted numberOfLines={2}>{subtitle}</T> : null}
      </View>
      {right}
      <Icon name="chevron-right" size={18} color={c.inkMuted} />
    </Pressable>
  );
}

/** Chữ "còn n ngày". */
export const inDays = (n: number) => (n === 0 ? 'Hôm nay' : n === 1 ? 'Ngày mai' : `Còn ${n} ngày`);
export const dmy = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
export const solarWithWeekday = (d: Date) => `${weekdayLong(d)}, ${dmy(d)}`;
