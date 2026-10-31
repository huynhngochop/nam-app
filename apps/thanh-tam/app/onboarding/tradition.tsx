import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Check, Grid, Row, Screen, SectionHeader, Segmented, StepDots, T, Thumb, useTheme } from '@nam/ui';
import { track } from '@nam/core';
import { useTT, type Altar } from '../../src/store';
import type { Diet, Region } from '../../src/data/types';

const ALTARS: { id: Altar; name: string; sub: string; icon: 'users' | 'dollar-sign' | 'sun' | 'home' }[] = [
  { id: 'gia-tien', name: 'Bàn thờ gia tiên', sub: 'Ông bà, tổ tiên', icon: 'users' },
  { id: 'than-tai', name: 'Ban Thần tài', sub: 'Thần tài, Thổ địa', icon: 'dollar-sign' },
  { id: 'phat', name: 'Bàn thờ Phật', sub: 'Phật, Bồ tát', icon: 'sun' },
  { id: 'ong-tao', name: 'Bàn thờ Táo quân', sub: 'Thường ở bếp', icon: 'home' },
];

/** TT-02 · Nếp nhà mình (cũng dùng để sửa từ Cài đặt với ?edit=1). */
export default function Tradition() {
  const { c } = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const h = useTT((s) => s.household);
  const setHousehold = useTT((s) => s.setHousehold);
  const [region, setRegion] = useState<Region>(h.region);
  const [diet, setDiet] = useState<Diet>(h.diet);
  const [altars, setAltars] = useState<Altar[]>(h.altars);
  const toggle = (a: Altar) => setAltars((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));
  const next = () => {
    setHousehold({ region, diet, altars });
    track('onboarding_tradition', { region, diet, altars: altars.length });
    if (edit) router.back(); else router.push('/onboarding/household');
  };
  return (
    <Screen scroll footer={<Button title={edit ? 'Lưu' : 'Tiếp tục'} onPress={next} />}>
      <Row between style={{ minHeight: 48 }}>{edit ? <View /> : <StepDots count={2} index={0} />}</Row>
      <T v="display">Nếp nhà mình</T>
      <T v="body" muted>Mỗi miền, mỗi nhà một nếp. Chọn để Thành Tâm gợi ý lễ vật cho đúng. Có thể đổi bất cứ lúc nào.</T>
      <SectionHeader title="Nhà mình theo nếp miền nào" />
      <Segmented options={[{ key: 'bac', label: 'Miền Bắc' }, { key: 'trung', label: 'Miền Trung' }, { key: 'nam', label: 'Miền Nam' }]} value={region} onChange={(k) => setRegion(k as Region)} />
      <SectionHeader title="Lễ vật" />
      <Segmented options={[{ key: 'man', label: 'Có đồ mặn' }, { key: 'chay', label: 'Cúng chay' }]} value={diet} onChange={(k) => setDiet(k as Diet)} />
      <SectionHeader title="Nhà có những ban thờ nào" />
      <Grid min={2} gap={10}>
        {ALTARS.map((a) => {
          const on = altars.includes(a.id);
          return (
            <Pressable key={a.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={a.name} onPress={() => toggle(a.id)}
              style={{ minHeight: 104, borderRadius: 14, padding: 14, gap: 8, backgroundColor: on ? c.at : c.surface, borderWidth: on ? 2 : 1, borderColor: on ? c.a : c.line }}>
              <Row between><Thumb icon={a.icon} size={32} /><Check on={on} /></Row>
              <T v="headline">{a.name}</T>
              <T v="caption" muted>{a.sub}</T>
            </Pressable>
          );
        })}
      </Grid>
      <T v="caption" muted>Chưa có ban thờ nào cũng không sao. Thành Tâm có hướng dẫn lập bàn thờ lần đầu.</T>
    </Screen>
  );
}
