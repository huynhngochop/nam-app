import React, { useState } from 'react';
import { router } from 'expo-router';
import { AppBar, Chip, Chips, Dialog, ListItem, Screen, SectionHeader, Segmented, Sheet, T, Thumb, Toggle, useTheme, useToast } from '@nam/ui';
import { restorePurchases, track } from '@nam/core';
import Constants from 'expo-constants';
import { useTT } from '../src/store';
import { requestNotify } from '../src/notify';
import { TAM_AN_READY } from '../src/config';

const TIMES = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00'];
const REGION = { bac: 'Miền Bắc', trung: 'Miền Trung', nam: 'Miền Nam' } as const;
const SIZES = [{ v: 1, l: 'Vừa' }, { v: 1.15, l: 'Lớn' }, { v: 1.3, l: 'Rất lớn' }, { v: 1.5, l: 'Lớn nhất' }];

/** TT-22 · Cài đặt. */
export default function Settings() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useTT();
  const [pick, setPick] = useState(false);
  const [del, setDel] = useState(false);
  const [delFace, setDelFace] = useState(false);
  const icon = (name: 'bell' | 'moon' | 'gift' | 'dollar-sign' | 'home' | 'type' | 'trash-2' | 'refresh-cw' | 'smile', danger = false) =>
    <Thumb icon={name} bg={c.surface2} color={danger ? c.negative : c.ink} size={32} />;
  const remindToggle = (key: 'mung1Ram' | 'eveBefore' | 'mung10' | 'festivals') => async (v: boolean) => {
    if (v && !(await requestNotify())) { toast('Thông báo đang tắt trong cài đặt của máy', { tone: 'error' }); return; }
    s.setRemind({ [key]: v });
    track('setting_changed', { key, value: v });
  };
  return (
    <Screen scroll>
      <AppBar title="Cài đặt" onBack={() => router.back()} />
      <SectionHeader title="Nếp nhà mình" />
      <ListItem left={icon('home')} title="Miền, lễ vật, ban thờ" subtitle={`${REGION[s.household.region]} · ${s.household.diet === 'chay' ? 'cúng chay' : 'có đồ mặn'}`} chevron onPress={() => router.push('/onboarding/tradition?edit=1')} />
      <SectionHeader title="Nhắc lịch" />
      <ListItem left={icon('moon')} title="Mùng 1 và rằm" subtitle={`Sáng lúc ${s.remind.time}`} onPress={() => setPick(true)} right={<Toggle label="Nhắc mùng 1 và rằm" value={s.remind.mung1Ram} onChange={remindToggle('mung1Ram')} />} />
      {s.remind.mung1Ram ? <ListItem left={icon('bell')} title="Nhắc cả tối hôm trước" subtitle="Lúc 19:00" right={<Toggle label="Nhắc tối hôm trước" value={s.remind.eveBefore} onChange={remindToggle('eveBefore')} />} /> : null}
      <ListItem left={icon('dollar-sign')} title="Mùng 10 Thần tài" right={<Toggle label="Nhắc mùng 10" value={s.remind.mung10} onChange={remindToggle('mung10')} />} />
      <ListItem left={icon('gift')} title="Lễ lớn trong năm" subtitle="Trước 3 ngày" divider={false} right={<Toggle label="Nhắc lễ lớn" value={s.remind.festivals} onChange={remindToggle('festivals')} />} />
      <SectionHeader title="Đọc văn khấn" />
      <T v="caption" muted>Cỡ chữ văn khấn</T>
      <Chips>{SIZES.map((x) => <Chip key={x.v} label={x.l} selected={s.fontScale === x.v} onPress={() => s.set({ fontScale: x.v })} />)}</Chips>
      <T v="caption" muted>Cỡ chữ chế độ khấn: {s.prayFont}</T>
      <Chips>{[22, 24, 26, 28, 30].map((n) => <Chip key={n} label={String(n)} selected={s.prayFont === n} onPress={() => s.set({ prayFont: n })} />)}</Chips>
      <SectionHeader title="Giao diện" />
      <Segmented value={s.theme} onChange={(v) => s.set({ theme: v })} options={[{ key: 'system', label: 'Theo máy' }, { key: 'light', label: 'Sáng' }, { key: 'dark', label: 'Tối' }]} />
      <SectionHeader title="Dữ liệu trên máy" />
      {TAM_AN_READY ? <ListItem left={icon('refresh-cw')} title="Khôi phục giao dịch" chevron onPress={async () => { const ids = await restorePurchases(); const ok = ids.some((i) => i.startsWith('thanhtam.taman')); if (ok) s.set({ tamAn: true }); toast(ok ? 'Đã khôi phục' : 'Không tìm thấy giao dịch cũ'); }} /> : null}
      {s.face ? <ListItem left={icon('smile', true)} title="Xóa kết quả nhân tướng" titleColor={c.negative} chevron onPress={() => setDelFace(true)} /> : null}
      <ListItem left={icon('trash-2', true)} title="Xóa toàn bộ dữ liệu" titleColor={c.negative} chevron divider={false} onPress={() => setDel(true)} />
      <T v="caption" muted>Tên, địa chỉ, sổ giỗ, ngày sinh chỉ lưu trên máy này và được sao lưu cùng máy.</T>
      <T v="caption" muted center style={{ marginTop: 12 }}>{`Phiên bản ${Constants.expoConfig?.version ?? ''}`}</T>

      <Sheet visible={pick} onClose={() => setPick(false)} title="Giờ nhắc buổi sáng">
        <Chips>{TIMES.map((t) => <Chip key={t} label={t} selected={t === s.remind.time} onPress={() => { s.setRemind({ time: t }); setPick(false); }} />)}</Chips>
      </Sheet>
      <Dialog visible={delFace} destructive title="Xóa kết quả nhân tướng?" confirm="Xóa" cancel="Hủy" onCancel={() => setDelFace(false)}
        onConfirm={() => { s.set({ face: undefined }); setDelFace(false); toast('Đã xóa'); }} />
      <Dialog visible={del} destructive title="Xóa toàn bộ dữ liệu?" body="Tên gia chủ, sổ giỗ, người trong nhà, mục đã lưu và cài đặt trên máy này sẽ bị xóa. Không thể hoàn tác." confirm="Xóa" cancel="Hủy"
        onCancel={() => setDel(false)} onConfirm={() => { s.wipe(); s.set({ onboarded: false }); setDel(false); track('data_wiped'); router.replace('/'); }} />
    </Screen>
  );
}
