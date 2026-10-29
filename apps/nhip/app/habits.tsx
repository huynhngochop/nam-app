import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Button, Card, Chip, Chips, IconButton, ProgressBar, Row, Screen, Sheet, Stepper, T, TextField, Thumb, useTheme, useToast } from '@nam/ui';
import { addDays, dateKey, track, weekdayShort } from '@nam/core';
import { useNhip } from '../src/store';

const FREE_HABITS = 3;
const SUGGEST = [{ name: 'Đi bộ', target: 15, unit: 'phút', icon: 'activity' }, { name: 'Không mạng xã hội trước 9h', target: 1, unit: 'lần', icon: 'smartphone' }];

/** NH-13 · Thói quen. */
export default function Habits() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useNhip();
  const [day, setDay] = useState(dateKey(new Date()));
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState('lần');

  const monday = addDays(new Date(), -((new Date().getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const sessionsOn = (k: string) => s.logs.filter((l) => l.status === 'completed' && dateKey(new Date(l.at)) === k).length;
  const valueOf = (hId: string, k: string) => { const h = s.habits.find((x) => x.id === hId)!; return h.auto ? sessionsOn(k) : s.habitLogs[k]?.[hId] ?? 0; };
  const ratioOf = (k: string) => { const r = s.habits.map((h) => Math.min(1, valueOf(h.id, k) / h.target)); return r.reduce((a, b) => a + b, 0) / Math.max(1, r.length); };
  const tryAdd = (h: { name: string; target: number; unit: string; icon: string }) => {
    if (s.habits.length >= FREE_HABITS + 1 && !s.isPro) { router.push('/paywall'); return; }
    s.addHabit(h); track('habit_created'); toast('Đã thêm thói quen');
  };

  return (
    <Screen scroll>
      <AppBar title="Thói quen" onBack={() => router.back()} right={<IconButton icon="plus" label="Thêm thói quen" color={c.a} bg={c.at} onPress={() => setAdd(true)} />} />
      <Row between>
        {week.map((d) => {
          const k = dateKey(d); const r = ratioOf(k); const isToday = k === dateKey(new Date()); const future = d > new Date();
          return (
            <Pressable key={k} onPress={() => !future && setDay(k)} accessibilityLabel={`${weekdayShort(d)} ${d.getDate()}`} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <T v="caption" muted>{weekdayShort(d)}</T>
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: r >= 1 ? c.a : r > 0 ? c.at : 'transparent', borderWidth: isToday || k === day ? 2 : 0, borderColor: c.a }}>
                <T v="caption" weight="semibold" color={r >= 1 ? c.onAccent : r > 0 ? c.a : c.ink}>{String(d.getDate())}</T>
              </View>
            </Pressable>
          );
        })}
      </Row>
      {s.habits.map((h) => {
        const v = valueOf(h.id, day); const full = v >= h.target;
        return (
          <Card key={h.id} onPress={h.auto || day !== dateKey(new Date()) ? undefined : () => { s.logHabit(h.id, 1); track('habit_checked', { habitId: h.id }); }}>
            <Row gap={12}>
              {full ? <Thumb icon="check" bg={c.a} color={c.onAccent} size={36} /> : <Thumb icon="target" size={36} />}
              <View style={{ flex: 1, gap: 6 }}>
                <Row between><T v="headline">{h.name}</T><T v="caption" muted>{`${v}/${h.target} ${h.unit}`}</T></Row>
                <ProgressBar value={v / h.target} />
              </View>
              {!h.auto && day === dateKey(new Date()) ? <IconButton icon="minus" label="Bớt" onPress={() => s.logHabit(h.id, -1)} /> : null}
            </Row>
            {h.auto ? <T v="caption" muted>Tự cập nhật từ phiên tập trung</T> : null}
          </Card>
        );
      })}
      <Card variant="tint">
        <T v="headline">Gợi ý thói quen</T>
        <Chips>{SUGGEST.filter((x) => !s.habits.some((h) => h.name === x.name)).map((x) => <Chip key={x.name} label={`+ ${x.name}`} onPress={() => tryAdd(x)} />)}</Chips>
      </Card>
      <Sheet visible={add} onClose={() => setAdd(false)} title="Thói quen mới" footer={<Button title="Thêm" disabled={!name.trim()} onPress={() => { tryAdd({ name: name.trim(), target, unit, icon: 'target' }); setName(''); setAdd(false); }} />}>
        <TextField label="Tên thói quen" value={name} onChangeText={setName} maxLength={40} autoFocus placeholder="Ví dụ: Uống nước" />
        <Row between><T v="body">Mục tiêu mỗi ngày</T><Stepper value={target} onChange={setTarget} min={1} max={100} /></Row>
        <Chips>{['lần', 'ly', 'trang', 'phút'].map((u) => <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />)}</Chips>
        {!s.isPro ? <T v="caption" muted>{`Miễn phí tối đa ${FREE_HABITS} thói quen tự thêm.`}</T> : null}
      </Sheet>
    </Screen>
  );
}
