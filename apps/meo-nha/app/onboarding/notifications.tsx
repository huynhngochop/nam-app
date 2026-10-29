import React, { useState } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, EmptyState, ListItem, Row, Screen, Sheet, StepDots, Thumb, T } from '@nam/ui';
import { track } from '@nam/core';
import { useMeo } from '../../src/store';
import { requestNotify } from '../../src/lib/notify';

const TIMES = ['06:00', '06:30', '07:00', '07:30', '08:00', '12:00', '19:00', '21:00'];

/** MN-03 · Bật thông báo: giải thích trước, rồi mới gọi hộp thoại của hệ điều hành. */
export default function NotifyOnboarding() {
  const s = useMeo();
  const [pick, setPick] = useState(false);
  const [denied, setDenied] = useState(false);
  const done = () => { s.set({ onboarded: true }); track('onboarding_completed'); router.replace('/(tabs)/explore'); };
  const enable = async () => {
    if (denied) { Linking.openSettings(); return; }
    const ok = await requestNotify();
    track('notification_permission_result', { granted: ok });
    if (ok) { s.set({ dailyTipOn: true }); done(); } else setDenied(true);
  };
  return (
    <Screen scroll footer={<>
      <Button title={denied ? 'Mở Cài đặt' : 'Bật thông báo'} onPress={enable} />
      <Button title="Để sau" variant="text" onPress={done} />
    </>}>
      <Row style={{ minHeight: 48 }}><StepDots count={2} index={1} /></Row>
      <EmptyState icon="bell" title="Nhận 1 mẹo mỗi sáng" body="Một mẹo ngắn, đọc trong 1 phút. Không spam, tắt bất kỳ lúc nào." />
      {denied ? <T v="caption" muted center>Thông báo đang bị tắt trong Cài đặt của máy.</T> : null}
      <Card>
        <ListItem divider={false} left={<Thumb icon="clock" />} title="Giờ nhận mẹo" subtitle="Có thể đổi trong Cài đặt" right={<Chip label={s.notifyTime} selected onPress={() => setPick(true)} />} />
      </Card>
      <Sheet visible={pick} onClose={() => setPick(false)} title="Giờ nhận mẹo">
        <Row wrap>{TIMES.map((t) => <Chip key={t} label={t} selected={t === s.notifyTime} onPress={() => { s.set({ notifyTime: t }); setPick(false); }} />)}</Row>
      </Sheet>
    </Screen>
  );
}
