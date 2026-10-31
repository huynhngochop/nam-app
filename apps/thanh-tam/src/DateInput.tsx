import React from 'react';
import { View } from 'react-native';
import { Card, Chip, Chips, Row, Segmented, T, TextField, useTheme } from '@nam/ui';
import { canChiYear, leapOf, monthName } from './calendar/lunar';
import { resolveDate, type DateValue } from './lib/dates';
export { resolveDate, type DateValue };
import { dmy } from './components';

/** Ô nhập ngày ghi rõ lịch dương/âm, quy đổi ngay bên dưới. */
export function DateInput({ label, value, onChange, allowYearOnly }: { label: string; value: DateValue; onChange: (v: DateValue) => void; allowYearOnly?: boolean }) {
  const { c } = useTheme();
  const r = resolveDate(value);
  const cal = value.calendar === 'duong' ? 'lịch dương' : 'lịch âm';
  const leapMonth = value.calendar === 'am' && value.year.length === 4 ? leapOf(Number(value.year)) : 0;
  const num = (s: string, max: number) => s.replace(/\D/g, '').slice(0, max);
  return (
    <View style={{ gap: 8 }}>
      <T v="caption" muted weight="semibold">{label} ({cal})</T>
      <Segmented
        options={[{ key: 'duong', label: 'Lịch dương' }, { key: 'am', label: 'Lịch âm' }]}
        value={value.calendar}
        onChange={(k) => onChange({ ...value, calendar: k as DateValue['calendar'], leap: false })}
      />
      <Row gap={8}>
        <View style={{ flex: 1 }}><TextField label="Ngày" keyboardType="number-pad" value={value.day} onChangeText={(s) => onChange({ ...value, day: num(s, 2) })} placeholder="dd" accessibilityLabel={`Ngày (${cal})`} /></View>
        <View style={{ flex: 1 }}><TextField label="Tháng" keyboardType="number-pad" value={value.month} onChangeText={(s) => onChange({ ...value, month: num(s, 2), leap: false })} placeholder="mm" accessibilityLabel={`Tháng (${cal})`} /></View>
        <View style={{ flex: 1.4 }}><TextField label="Năm" keyboardType="number-pad" value={value.year} onChangeText={(s) => onChange({ ...value, year: num(s, 4) })} placeholder="yyyy" accessibilityLabel={`Năm (${cal})`} /></View>
      </Row>
      {leapMonth && Number(value.month) === leapMonth ? (
        <Chips>
          <Chip label={`Tháng ${leapMonth} thường`} selected={!value.leap} onPress={() => onChange({ ...value, leap: false })} />
          <Chip label={`Tháng ${leapMonth} nhuận`} selected={!!value.leap} onPress={() => onChange({ ...value, leap: true })} />
        </Chips>
      ) : null}
      {r && 'error' in r ? <T v="caption" color={c.negative}>{r.error}</T> : null}
      {r && 'solar' in r ? (
        <Card variant="tint" style={{ paddingVertical: 10 }}>
          {value.calendar === 'duong'
            ? <T v="caption">Âm lịch: ngày {r.lunar.day} tháng {monthName(r.lunar.month, r.lunar.leap)} năm {canChiYear(r.lunar.year)}</T>
            : <T v="caption">Dương lịch: {dmy(r.solar)}</T>}
        </Card>
      ) : allowYearOnly && value.year.length === 4 && !value.day ? (
        <T v="caption" muted>Chỉ biết năm cũng được. Sinh tháng 1, 2 dương lịch thì hỏi thêm sinh trước hay sau Tết.</T>
      ) : null}
    </View>
  );
}
