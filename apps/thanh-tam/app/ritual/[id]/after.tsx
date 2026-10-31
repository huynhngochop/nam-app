import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Button, Card, Chip, Chips, Icon, Row, Screen, SectionHeader, T, useTheme, useToast } from '@nam/ui';
import { ritualById } from '../../../src/data/rituals';
import { remindTakedown } from '../../../src/notify';
import { SafetyCard } from '../../../src/components';

/** TT-12 · Sau khi cúng (+ TT-27 khi có lửa). */
export default function After() {
  const { c } = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = ritualById(id);
  const [mins, setMins] = useState<number | null>(null);
  if (!r) return null;
  const fire = r.afterSteps.some((s) => s.fire) || r.steps.some((s) => s.fire);
  const remind = async (m: number) => {
    const ok = await remindTakedown(m);
    if (ok) { setMins(m); toast(`Sẽ nhắc sau ${m} phút`, { tone: 'success' }); }
    else toast('Chưa bật thông báo. Bật trong cài đặt của máy.');
  };
  return (
    <Screen scroll footer={<Button title="Về trang chính" onPress={() => router.replace('/(tabs)/today')} />}>
      <AppBar onBack={() => router.back()} />
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.at, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={32} color={c.a} /></View>
        <T v="display" center>Đã khấn xong</T>
        <T v="body" muted center>{r.title}. Tâm thành là đủ.</T>
      </View>
      {r.afterSteps.length ? (
        <>
          <SectionHeader title="Sau khi khấn" />
          <Card>
            {r.afterSteps.map((s, i) => (
              <Row key={s.title} gap={12} style={{ alignItems: 'flex-start', paddingVertical: 4 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.at, alignItems: 'center', justifyContent: 'center' }}><T v="caption" accent weight="bold">{i + 1}</T></View>
                <View style={{ flex: 1, gap: 2 }}><T v="headline">{s.title}</T><T v="body" muted>{s.text}</T></View>
              </Row>
            ))}
          </Card>
        </>
      ) : null}
      <SectionHeader title="Nhắc hạ lễ" />
      <Card>
        <T v="body">Hương thường cháy hết sau 30–45 phút.</T>
        <Chips>
          {[20, 30, 45].map((m) => <Chip key={m} label={`Sau ${m} phút`} selected={mins === m} onPress={() => remind(m)} />)}
        </Chips>
      </Card>
      {fire ? <SafetyCard text="Không để hương, nến cháy khi cả nhà đi vắng. Hóa vàng (nếu có) trong thùng kim loại, ở nơi thoáng, có sẵn chậu nước; chờ tàn hẳn mới đi. Chung cư chỉ hóa ở nơi ban quản lý quy định." /> : null}
      <Card variant="tint">
        <T v="caption">Giáo hội Phật giáo Việt Nam khuyên không đốt vàng mã, thay bằng việc thiện (Thông bạch 204/TB-HĐTS, 2024).</T>
      </Card>
    </Screen>
  );
}
