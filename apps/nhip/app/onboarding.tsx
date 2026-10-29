import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, Chips, EmptyState, Radio, Row, Screen, SectionHeader, StepDots, T } from '@nam/ui';
import { track } from '@nam/core';
import { useNhip } from '../src/store';
import { requestNotify } from '../src/notify';

const GOALS = [{ min: 60, label: '1 giờ', sub: '2 phiên · nhẹ nhàng' }, { min: 120, label: '2 giờ', sub: '4 phiên · phổ biến nhất' }, { min: 240, label: '4 giờ', sub: '8 phiên · cường độ cao' }];
const PURPOSES = ['Học', 'Làm việc', 'Viết', 'Đọc sách'];

/** NH-02 Mục tiêu hằng ngày + bước 2 xin quyền thông báo. */
export default function Onboarding() {
  const s = useNhip();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(120);
  const [purposes, setPurposes] = useState<string[]>([]);
  const finish = () => { s.set({ onboarded: true, goalMin: goal, purposes }); track('onboarding_goal_set', { minutes: goal }); router.replace('/(tabs)/timer'); };
  if (step === 1) {
    return (
      <Screen scroll footer={<><Button title="Bật thông báo" onPress={async () => { await requestNotify(); finish(); }} /><Button title="Để sau" variant="text" onPress={finish} /></>}>
        <Row style={{ minHeight: 48 }}><StepDots count={2} index={1} /></Row>
        <EmptyState icon="bell" title="Báo khi hết phiên" body="Nhịp báo đúng giờ nghỉ kể cả khi bạn đang ở app khác hoặc khóa máy." />
      </Screen>
    );
  }
  return (
    <Screen scroll footer={<Button title="Tiếp tục" onPress={() => setStep(1)} />}>
      <Row between style={{ minHeight: 48 }}>
        <StepDots count={2} index={0} />
        <Pressable hitSlop={10} onPress={finish}><T v="caption" muted weight="semibold">Bỏ qua</T></Pressable>
      </Row>
      <T v="display">Mỗi ngày bạn muốn tập trung bao lâu?</T>
      <T v="caption" muted>Nhịp dùng mục tiêu này để tính chuỗi ngày.</T>
      {GOALS.map((g) => (
        <Card key={g.min} variant={goal === g.min ? 'outlineAccent' : 'default'} onPress={() => setGoal(g.min)} accessibilityLabel={g.label}>
          <Row gap={12}><Radio on={goal === g.min} /><View style={{ flex: 1, gap: 2 }}><T v="headline">{g.label}</T><T v="caption" muted>{g.sub}</T></View></Row>
        </Card>
      ))}
      <SectionHeader title="Bạn dùng Nhịp để" />
      <Chips>{PURPOSES.map((p) => <Chip key={p} label={p} selected={purposes.includes(p)} onPress={() => setPurposes((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]))} />)}</Chips>
    </Screen>
  );
}
