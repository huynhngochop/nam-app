import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Button, Card, Chip, Chips, Row, Screen, SectionHeader, T, TextField, Toggle, ListItem, useTheme, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { useTT } from '../../src/store';
import { DateInput, DateValue, resolveDate } from '../../src/DateInput';
import { leapOf, lunarMonthLength, lunarOf, monthName } from '../../src/calendar/lunar';
import { memorialMilestones, nextGio, daysBetween, startOfDay } from '../../src/lib/schedule';
import { dmy, inDays, solarWithWeekday } from '../../src/components';
import { requestNotify } from '../../src/notify';

const RELATIONS = ['Ông nội', 'Bà nội', 'Ông ngoại', 'Bà ngoại', 'Bố', 'Mẹ', 'Cụ', 'Anh', 'Chị', 'Em'];
const REMIND = [7, 3, 1];

/** TT-16 · Thêm/sửa ngày giỗ (modal) + TT-26 (ngày 30 ở tháng thiếu, tháng nhuận) + mốc 49 ngày, 100 ngày. */
export default function EditAnniversary() {
  const { c } = useTheme();
  const toast = useToast();
  const p = useLocalSearchParams<{ id?: string; day?: string; month?: string; leap?: string }>();
  const existing = useTT((s) => s.anniversaries.find((a) => a.id === p.id));
  const upsert = useTT((s) => s.upsertAnniversary);
  const [name, setName] = useState(existing?.name ?? '');
  const [relation, setRelation] = useState(existing?.relation ?? '');
  const [date, setDate] = useState<DateValue>(() => existing
    ? { calendar: 'am', day: String(existing.lunar.day), month: String(existing.lunar.month), year: '', leap: existing.lunar.leap }
    : { calendar: 'am', day: p.day ?? '', month: p.month ?? '', year: '', leap: p.leap === '1' });
  const [recent, setRecent] = useState(!!existing?.deathSolar);
  const [deathDate, setDeathDate] = useState<DateValue>(() => {
    if (!existing?.deathSolar) return { calendar: 'duong', day: '', month: '', year: '' };
    const d = new Date(existing.deathSolar);
    return { calendar: 'duong', day: String(d.getDate()), month: String(d.getMonth() + 1), year: String(d.getFullYear()) };
  });
  const [remind, setRemind] = useState<number[]>(existing?.remindDays ?? REMIND);
  const [dishes, setDishes] = useState(existing?.dishes ?? '');

  // Ngày giỗ chỉ cần ngày + tháng âm (năm không bắt buộc); nếu có ngày mất gần đây thì lấy ngày âm từ đó.
  const deathResolved = recent ? resolveDate(deathDate) : null;
  const lunar = useMemo(() => {
    if (deathResolved && 'solar' in deathResolved) return { day: deathResolved.lunar.day, month: deathResolved.lunar.month, leap: deathResolved.lunar.leap };
    const d = Number(date.day), m = Number(date.month);
    if (!(d >= 1 && d <= 30 && m >= 1 && m <= 12)) return null;
    return { day: d, month: m, leap: !!date.leap };
  }, [date, deathResolved]);

  const preview = useMemo(() => lunar ? nextGio({ id: 'x', name, relation, lunar, missingDayRule: 'ngay-cuoi-thang', remindDays: [] }, new Date()) : null, [lunar, name, relation]);
  const milestones = deathResolved && 'solar' in deathResolved ? memorialMilestones(deathResolved.solar).filter((m) => m.date >= startOfDay(new Date())) : [];
  const curYear = lunarOf(new Date()).year;
  const leapThisYear = leapOf(curYear);
  const valid = name.trim() && relation.trim() && lunar;

  const save = async () => {
    if (!valid || !lunar) return;
    const id = upsert({
      id: existing?.id, name: name.trim(), relation: relation.trim(), lunar, missingDayRule: 'ngay-cuoi-thang', remindDays: remind,
      dishes: dishes.trim() || undefined, deathSolar: deathResolved && 'solar' in deathResolved ? deathResolved.solar.toISOString() : undefined,
    });
    track('anniversary_saved', { edit: !!existing, recent });
    if (remind.length) await requestNotify();
    toast(existing ? 'Đã lưu' : 'Đã thêm ngày giỗ', { tone: 'success' });
    router.back();
    return id;
  };

  return (
    <Screen scroll edges={['top', 'bottom']} footer={<Button title={existing ? 'Lưu' : 'Thêm ngày giỗ'} disabled={!valid} onPress={save} />}>
      <AppBar onBack={() => router.back()} backIcon="x" title={existing ? 'Sửa ngày giỗ' : 'Thêm ngày giỗ'} />
      <TextField label="Tên người đã khuất" value={name} onChangeText={setName} placeholder="Ví dụ: Nguyễn Văn An" autoCapitalize="words" />
      <TextField label="Là gì của mình" value={relation} onChangeText={setRelation} placeholder="Ví dụ: Ông nội" autoCapitalize="sentences" />
      <Chips scroll>{RELATIONS.map((r) => <Chip key={r} label={r} selected={relation === r} onPress={() => setRelation(r)} />)}</Chips>

      <ListItem title="Mất chưa đến 3 năm" subtitle="Nhập ngày mất để tính 49 ngày, 100 ngày, giỗ đầu, giỗ hết" right={<Toggle label="Mất chưa đến 3 năm" value={recent} onChange={setRecent} />} />
      {recent ? (
        <DateInput label="Ngày mất" value={deathDate} onChange={setDeathDate} />
      ) : (
        <>
          <T v="caption" muted weight="semibold">Ngày giỗ (lịch âm)</T>
          <Row gap={8}>
            <View style={{ flex: 1 }}><TextField label="Ngày" keyboardType="number-pad" value={date.day} onChangeText={(s) => setDate({ ...date, day: s.replace(/\D/g, '').slice(0, 2) })} accessibilityLabel="Ngày giỗ (lịch âm)" /></View>
            <View style={{ flex: 1 }}><TextField label="Tháng" keyboardType="number-pad" value={date.month} onChangeText={(s) => setDate({ ...date, month: s.replace(/\D/g, '').slice(0, 2), leap: false })} accessibilityLabel="Tháng giỗ (lịch âm)" /></View>
          </Row>
          {Number(date.month) >= 1 && Number(date.month) <= 12 ? (
            <Chips>
              <Chip label={`Tháng ${date.month} thường`} selected={!date.leap} onPress={() => setDate({ ...date, leap: false })} />
              <Chip label={`Tháng ${date.month} nhuận`} selected={!!date.leap} onPress={() => setDate({ ...date, leap: true })} />
            </Chips>
          ) : null}
        </>
      )}

      {lunar && preview ? (
        <Card variant="tint">
          <T v="body">Giỗ ngày {lunar.day} tháng {monthName(lunar.month, lunar.leap)} âm lịch.</T>
          <T v="headline">Lần tới: {solarWithWeekday(preview.date)} · {inDays(daysBetween(new Date(), preview.date))}</T>
          {preview.missing ? <T v="caption" color={c.warning}>Tháng {monthName(lunar.month)} năm đó chỉ có {lunarMonthLength(preview.lunarYear, lunar.month)} ngày, nên giỗ vào ngày cuối tháng. Nhiều nhà làm vậy; theo nếp nhà mình nếu khác.</T> : null}
          {lunar.leap ? <T v="caption" muted>Năm không có tháng {lunar.month} nhuận thì giỗ vào tháng {lunar.month} thường{leapThisYear ? ` (năm nay nhuận tháng ${leapThisYear})` : ''}.</T> : null}
        </Card>
      ) : null}

      {milestones.length ? (
        <>
          <SectionHeader title="Các mốc sắp tới" />
          <Card>
            {milestones.map((m) => (
              <Row key={m.id} between><T v="body">{m.title}</T><T v="caption" muted>{dmy(m.date)} (dương lịch)</T></Row>
            ))}
            <T v="caption" muted>49 ngày, 100 ngày tính cả ngày mất là ngày thứ nhất. Có nơi tính khác; theo nếp nhà mình.</T>
          </Card>
        </>
      ) : null}

      <SectionHeader title="Nhắc trước" />
      <Chips>
        {REMIND.map((d) => <Chip key={d} label={`${d} ngày`} selected={remind.includes(d)} onPress={() => setRemind((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d].sort((a, b) => b - a)))} />)}
      </Chips>
      <TextField label="Món ông bà thích (không bắt buộc)" value={dishes} onChangeText={setDishes} placeholder="Ví dụ: xôi gấc, canh măng" multiline />
    </Screen>
  );
}
