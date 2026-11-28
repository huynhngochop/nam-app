import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { addDays, dateKey } from '@nam/core';
import { AppBar, Button, Card, Chip, Chips, Icon, Row, Screen, StepBar, T, useTheme } from '@nam/ui';
import { saveProfile, serverEnabled } from '../src/api';
import {
  bandLabel,
  buildPlan,
  CRITERION_VI,
  daysBetween,
  defaultTarget,
  overallOf,
  targetChoices,
  weakest,
} from '../src/plan';
import { useBand7 } from '../src/store';

const MINUTES = [15, 30, 45, 60, 90, 120];
const DAYS = [3, 4, 5, 6, 7];
const WEEKS = [4, 8, 12, 16, 24, 36, 52];
const PURPOSES = [
  { key: 'study', label: 'Du học' },
  { key: 'migrate', label: 'Định cư' },
  { key: 'work', label: 'Việc làm' },
  { key: 'graduate', label: 'Tốt nghiệp' },
] as const;

/** 1 · Mục tiêu: band muốn đạt, ngày thi, thời gian mỗi ngày → xem trước độ khả thi trước khi tạo lộ trình. */
export default function Goals() {
  const { c } = useTheme();
  const bands = useBand7((s) => s.bands);
  const prev = useBand7((s) => s.goal);
  const setGoal = useBand7((s) => s.setGoal);
  const auth = useBand7((s) => s.auth);
  const today = dateKey(new Date());
  const start = overallOf(bands);
  const choices = targetChoices(start);
  const [target, setTarget] = useState(() =>
    prev && choices.includes(prev.target) ? prev.target : defaultTarget(start),
  );
  const [weeks, setWeeks] = useState(prev ? Math.max(1, Math.round(daysBetween(today, prev.examDate) / 7)) : 16);
  const [minutes, setMinutes] = useState(prev?.minutesPerDay ?? 45);
  const [days, setDays] = useState(prev?.daysPerWeek ?? 6);
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]['key']>('study');

  const examDate = dateKey(addDays(new Date(), weeks * 7));
  const goal = { current: bands, target, examDate, minutesPerDay: minutes, daysPerWeek: days };
  const preview = useMemo(() => buildPlan(goal, today), [bands, target, examDate, minutes, days, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const weak = weakest(bands);
  const tone = preview.feasibility === 'ok' ? c.positive : preview.feasibility === 'tight' ? c.warning : c.negative;

  const create = () => {
    setGoal(goal);
    if (serverEnabled() && auth)
      void saveProfile({
        id: auth.userId,
        target_band: target,
        exam_date: examDate,
        minutes_per_day: minutes,
        days_per_week: days,
        purpose,
      }).catch(() => {});
    router.replace('/(tabs)/roadmap');
  };

  return (
    <Screen scroll footer={<Button title="Tạo lộ trình của tôi" icon="arrow-right" onPress={create} />}>
      <AppBar onBack={() => (router.canGoBack() ? router.back() : router.replace('/placement'))} />
      <StepBar count={3} index={2} />
      <T v="display">Mục tiêu của bạn</T>

      <Card>
        <Row between>
          <View style={{ gap: 2 }}>
            <T v="micro" muted>
              Hiện tại
            </T>
            <T v="title">{start.toFixed(1)}</T>
          </View>
          <T v="caption" muted style={{ flex: 1, textAlign: 'right' }}>
            FC {bands.FC} · LR {bands.LR} · GRA {bands.GRA} · P {bands.P}
          </T>
        </Row>
      </Card>

      <T v="headline">Band mục tiêu</T>
      <Chips scroll>
        {choices.map((t) => (
          <Chip key={t} label={t.toFixed(1)} selected={target === t} onPress={() => setTarget(t)} />
        ))}
      </Chips>
      <T v="caption" muted>
        Band {target.toFixed(1)}: {bandLabel(target)}
      </T>

      <T v="headline">Thi sau bao lâu</T>
      <Chips scroll>
        {(WEEKS.includes(weeks) ? WEEKS : [...WEEKS, weeks].sort((a, b) => a - b)).map((w) => (
          <Chip key={w} label={`${w} tuần`} selected={weeks === w} onPress={() => setWeeks(w)} />
        ))}
      </Chips>

      <T v="headline">Mỗi ngày học</T>
      <Chips>
        {MINUTES.map((m) => (
          <Chip key={m} label={`${m} phút`} selected={minutes === m} onPress={() => setMinutes(m)} />
        ))}
      </Chips>

      <T v="headline">Số ngày mỗi tuần</T>
      <Chips>
        {DAYS.map((d) => (
          <Chip key={d} label={`${d} ngày`} selected={days === d} onPress={() => setDays(d)} />
        ))}
      </Chips>

      <T v="headline">Bạn thi IELTS để</T>
      <Chips>
        {PURPOSES.map((p) => (
          <Chip key={p.key} label={p.label} selected={purpose === p.key} onPress={() => setPurpose(p.key)} />
        ))}
      </Chips>

      <Card variant="fill">
        <Row gap={8}>
          <Icon name={preview.feasibility === 'ok' ? 'check-circle' : 'alert-circle'} color={tone} />
          <T v="headline" color={tone} style={{ flex: 1 }}>
            {preview.feasibility === 'ok' ? 'Khả thi' : preview.feasibility === 'tight' ? 'Hơi gấp' : 'Khó đạt kịp'}
          </T>
        </Row>
        <T v="body">
          Cần tăng {preview.gap.toFixed(1)} band trong {preview.weeks} tuần. Bạn có khoảng {preview.availableHours} giờ,
          ước tính cần {preview.neededHours} giờ. Ưu tiên {CRITERION_VI[weak]} vì đang thấp nhất.
        </T>
        {preview.suggestions.map((s) => (
          <T key={s} v="caption" muted>
            • {s}
          </T>
        ))}
      </Card>
    </Screen>
  );
}
