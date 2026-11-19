import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Check, EmptyState, Grid, Row, Screen, T, TextField, useTheme } from '@nam/ui';
import { track } from '@nam/core';
import { useNhip } from '../src/store';
import { schedulePhaseEnd } from '../src/notify';

const RATINGS: { v: 1 | 2 | 3; label: string }[] = [
  { v: 1, label: 'Kém' },
  { v: 2, label: 'Ổn' },
  { v: 3, label: 'Rất tốt' },
];

/** Hoàn thành phiên. Nếu bật "Tự vào giờ nghỉ", tự chuyển sang nghỉ sau 15 giây. */
export default function Done() {
  const { c } = useTheme();
  const { cycle } = useLocalSearchParams<{ cycle?: string }>();
  const state = useNhip();
  const num = Number(cycle ?? 1);
  const last = state.logs[0];
  const task = state.tasks.find((t) => t.id === last?.taskId);
  const isLong = num % state.settings.longEvery === 0;
  const breakMin = isLong ? state.settings.longMin : state.settings.shortMin;
  const [rating, setRating] = useState<1 | 2 | 3 | null>(null);
  const [note, setNote] = useState('');
  const [markDone, setMarkDone] = useState(false);
  const [auto, setAuto] = useState(state.settings.autoBreak ? 15 : -1);

  const save = () => {
    if (rating) {
      state.rateLast(rating, note || undefined);
      track('session_rated', { rating });
    }
    if (markDone && task) {
      state.updateTask(task.id, { finished: true });
      track('task_completed');
    }
  };
  const toBreak = () => {
    save();
    const sess = state.startPhase(isLong ? 'long' : 'short', { cycleIndex: isLong ? 0 : num });
    schedulePhaseEnd(sess.endAt, 'Hết giờ nghỉ', 'Vào phiên tiếp nào.');
    router.replace('/session');
  };
  const home = () => {
    save();
    state.set({ session: null });
    router.replace('/(tabs)/timer');
  };

  useEffect(() => {
    if (auto < 0) return;
    if (auto === 0) {
      toBreak();
      return;
    }
    const timer = setTimeout(() => setAuto((x) => x - 1), 1000);
    return () => clearTimeout(timer);
    // Đồng hồ đếm ngược chỉ phụ thuộc số giây còn lại; `toBreak` đổi mỗi lần render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <Row>
          <Button title="Về trang chính" variant="secondary" onPress={home} />
          <Button title={auto > 0 ? `Nghỉ ${breakMin} phút (${auto})` : `Nghỉ ${breakMin} phút`} onPress={toBreak} />
        </Row>
      }
    >
      <EmptyState
        icon="check"
        title={`Xong phiên ${num}!`}
        body={`${last?.minutes ?? state.settings.focusMin} phút${task ? ` · ${task.title}` : ''}`}
      />
      <T v="headline">Bạn tập trung thế nào?</T>
      <Grid min={3} gap={8}>
        {RATINGS.map((r) => (
          <Pressable
            key={r.v}
            accessibilityRole="radio"
            accessibilityState={{ selected: rating === r.v }}
            onPress={() => {
              setRating(r.v);
              setAuto(-1);
            }}
            style={{
              minHeight: 56,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: rating === r.v ? c.at : c.surface,
              borderWidth: rating === r.v ? 2 : 1,
              borderColor: rating === r.v ? c.a : c.line,
            }}
          >
            <T v="headline" color={rating === r.v ? c.a : c.ink}>
              {r.label}
            </T>
          </Pressable>
        ))}
      </Grid>
      <TextField
        label="Ghi chú (không bắt buộc)"
        value={note}
        onChangeText={(t) => {
          setNote(t);
          setAuto(-1);
        }}
        maxLength={200}
        placeholder="Đã xong phần doanh thu…"
      />
      {task ? (
        <Pressable
          onPress={() => {
            setMarkDone((x) => !x);
            setAuto(-1);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: markDone }}
        >
          <Row>
            <Check on={markDone} />
            <T v="body">Đánh dấu việc này đã xong</T>
          </Row>
        </Pressable>
      ) : null}
      <View style={{ height: 8 }} />
    </Screen>
  );
}
