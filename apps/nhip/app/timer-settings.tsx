import React, { useState } from 'react';
import { router } from 'expo-router';
import { AppBar, Dialog, ListItem, Screen, SectionHeader, Stepper, Toggle } from '@nam/ui';
import { track } from '@nam/core';
import { TimerSettings, useNhip } from '../src/store';

/** NH-14 · Cài đặt hẹn giờ. Lưu ngay khi đổi. */
export default function TimerSettingsScreen() {
  const s = useNhip();
  const st = s.settings;
  const [strictAsk, setStrictAsk] = useState(false);
  const set = (p: Partial<TimerSettings>) => { s.setSettings(p); const [k, v] = Object.entries(p)[0]; track('timer_setting_changed', { key: k, value: v as number | boolean }); };
  const minutes = (n: number) => `${n} phút`;
  return (
    <Screen scroll>
      <AppBar title="Cài đặt hẹn giờ" onBack={() => router.back()} />
      <SectionHeader title="Thời lượng" />
      <ListItem title="Tập trung" strong={false} right={<Stepper value={st.focusMin} onChange={(v) => set({ focusMin: v })} min={5} max={90} step={5} format={minutes} />} />
      <ListItem title="Nghỉ ngắn" strong={false} right={<Stepper value={st.shortMin} onChange={(v) => set({ shortMin: v })} min={1} max={30} format={minutes} />} />
      <ListItem title="Nghỉ dài" strong={false} right={<Stepper value={st.longMin} onChange={(v) => set({ longMin: v })} min={5} max={60} step={5} format={minutes} />} />
      <ListItem title="Nghỉ dài sau" strong={false} right={<Stepper value={st.longEvery} onChange={(v) => set({ longEvery: v })} min={2} max={8} format={(n) => `${n} phiên`} />} />
      <SectionHeader title="Tự động" />
      <ListItem title="Tự vào giờ nghỉ" strong={false} right={<Toggle label="Tự vào giờ nghỉ" value={st.autoBreak} onChange={(v) => set({ autoBreak: v })} />} />
      <ListItem title="Tự vào phiên tiếp" strong={false} right={<Toggle label="Tự vào phiên tiếp" value={st.autoNext} onChange={(v) => set({ autoNext: v })} />} />
      <ListItem title="Chế độ nghiêm" subtitle="Thoát app = bỏ phiên" strong={false} right={<Toggle label="Chế độ nghiêm" value={st.strict} onChange={(v) => (v ? setStrictAsk(true) : set({ strict: false }))} />} />
      <ListItem title="Rung khi hết giờ" strong={false} right={<Toggle label="Rung khi hết giờ" value={st.vibrate} onChange={(v) => set({ vibrate: v })} />} />
      <ListItem title="Giữ màn hình sáng khi tập trung" strong={false} divider={false} right={<Toggle label="Giữ màn hình sáng" value={st.keepAwake} onChange={(v) => set({ keepAwake: v })} />} />
      <Dialog visible={strictAsk} title="Bật chế độ nghiêm?" body="Trong phiên tập trung, rời Nhịp quá 10 giây sẽ bị tính là bỏ phiên và không thể tạm dừng." confirm="Bật" cancel="Để sau"
        onConfirm={() => { set({ strict: true }); setStrictAsk(false); }} onCancel={() => setStrictAsk(false)} />
    </Screen>
  );
}
