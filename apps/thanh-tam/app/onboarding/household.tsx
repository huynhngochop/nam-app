import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, ListItem, Row, Screen, SectionHeader, StepDots, T, TextField, Toggle } from '@nam/ui';
import { track } from '@nam/core';
import { useTT } from '../../src/store';
import { requestNotify, rescheduleAll } from '../../src/notify';

/** TT-03 · Tên gia chủ & nhắc lịch. */
export default function Household() {
  const h = useTT((s) => s.household);
  const remind = useTT((s) => s.remind);
  const set = useTT((s) => s.set);
  const [tinChu, setTinChu] = useState(h.tinChu);
  const [diaChi, setDiaChi] = useState(h.diaChi);
  const [hoGiaTien, setHo] = useState(h.hoGiaTien);
  const [mung1Ram, setM] = useState(remind.mung1Ram);
  const [mung10, setT] = useState(h.altars.includes('than-tai'));
  const [festivals, setF] = useState(remind.festivals);
  const [busy, setBusy] = useState(false);

  const finish = async (skip = false) => {
    setBusy(true);
    set({
      household: { ...h, ...(skip ? {} : { tinChu: tinChu.trim(), diaChi: diaChi.trim(), hoGiaTien: hoGiaTien.trim() }) },
      remind: { ...remind, mung1Ram, mung10, festivals },
      onboarded: true,
    });
    if (mung1Ram || mung10 || festivals) {
      const ok = await requestNotify();
      track('notify_permission', { granted: ok });
      if (ok) rescheduleAll().catch(() => {});
    }
    track('onboarding_done', { filled: !!tinChu.trim() });
    setBusy(false);
    router.replace('/(tabs)/today');
  };

  return (
    <Screen scroll footer={<>
      <Button title="Bắt đầu" loading={busy} onPress={() => finish()} />
      <Button title="Để sau" variant="text" size="sm" onPress={() => finish(true)} style={{ alignSelf: 'center' }} />
    </>}>
      <Row style={{ minHeight: 48 }}><StepDots count={2} index={1} /></Row>
      <T v="display">Điền sẵn vào văn khấn</T>
      <T v="body" muted>Tên và địa chỉ được điền vào chỗ trống trong bài khấn. Chỉ lưu trên máy này, không gửi đi đâu.</T>
      <TextField label="Tên gia chủ (người đứng khấn)" value={tinChu} onChangeText={setTinChu} placeholder="Ví dụ: Nguyễn Thị Lan" autoCapitalize="words" />
      <TextField label="Địa chỉ" value={diaChi} onChangeText={setDiaChi} placeholder="Số nhà, phường, tỉnh" />
      <TextField label="Họ gia tiên" value={hoGiaTien} onChangeText={setHo} placeholder="Ví dụ: Nguyễn" autoCapitalize="words" />
      <SectionHeader title="Nhắc lịch" />
      <Card>
        <ListItem title="Mùng 1 và rằm" subtitle="Tối hôm trước và sáng hôm đó" right={<Toggle label="Nhắc mùng 1 và rằm" value={mung1Ram} onChange={setM} />} />
        <ListItem title="Mùng 10 Thần tài" subtitle="Sáng mùng 10 hằng tháng" right={<Toggle label="Nhắc mùng 10" value={mung10} onChange={setT} />} />
        <ListItem title="Lễ lớn trong năm" subtitle="Ông Công ông Táo, Thanh minh, Vu Lan…" divider={false} right={<Toggle label="Nhắc lễ lớn" value={festivals} onChange={setF} />} />
      </Card>
      <T v="caption" muted>Không quá 6 lần nhắc mỗi tháng, không có tin quảng cáo.</T>
    </Screen>
  );
}
