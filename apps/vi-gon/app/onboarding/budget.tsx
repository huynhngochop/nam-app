import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Button, Chip, Chips, Keypad, Row, Screen, StepDots, Stepper, T, TextField, useTheme } from '@nam/ui';
import { track, vnd } from '@nam/core';
import { useVi } from '../../src/store';

const QUICK = [8_000_000, 12_000_000, 15_000_000, 20_000_000];

/** VG-04 · Ngân sách tháng (3/3). Bàn phím số riêng để không bật bàn phím hệ thống trên tablet/máy gập. */
export default function Budget() {
  const { c } = useTheme();
  const s = useVi();
  const [amount, setAmount] = useState(s.monthlyBudget || 12_000_000);
  const [startDay, setStartDay] = useState(s.monthStartDay);
  const [name, setName] = useState(s.name);
  const onKey = (k: string) =>
    setAmount((a) => {
      if (k === '⌫') return Math.floor(a / 10);
      const next = Number(`${a || ''}${k}`);
      return next > 9_999_999_999 ? a : next;
    });
  const done = (skip = false) => {
    s.set({ monthlyBudget: skip ? 0 : amount, monthStartDay: startDay, name: name.trim(), onboarded: true });
    track('onboarding_completed', { budget: !skip });
    router.replace('/(tabs)/home');
    // Xin quyền thông báo ngay sau khi đặt ngân sách — lúc người dùng hiểu vì sao cần.
    if (!skip) Notifications.requestPermissionsAsync().catch(() => {});
  };
  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <View style={{ gap: 8 }}>
          <Button title="Xong" disabled={amount < 100_000} onPress={() => done()} />
          <Button title="Đặt sau" variant="text" onPress={() => done(true)} />
        </View>
      }
    >
      <Row style={{ minHeight: 48 }}>
        <StepDots count={3} index={2} />
      </Row>
      <T v="title" accessibilityRole="header">
        Mỗi tháng bạn muốn chi tối đa?
      </T>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <T v="display" color={c.a} accessibilityLiveRegion="polite">
          {vnd(amount)}
        </T>
        <T v="caption" muted>{`≈ ${vnd(Math.round(amount / 30 / 1000) * 1000)} mỗi ngày`}</T>
      </View>
      <Chips>
        {QUICK.map((q) => (
          <Chip key={q} label={`${q / 1_000_000} tr`} selected={amount === q} onPress={() => setAmount(q)} />
        ))}
      </Chips>
      <Row between>
        <T v="body" style={{ flex: 1 }}>
          Ngày bắt đầu tháng (ngày lương)
        </T>
        <Stepper value={startDay} min={1} max={28} onChange={setStartDay} format={(n) => `Ngày ${n}`} />
      </Row>
      <TextField
        label="Tên gọi (không bắt buộc)"
        value={name}
        onChangeText={setName}
        maxLength={30}
        placeholder="Để Ví Gọn chào bạn"
      />
      <Keypad onKey={onKey} />
    </Screen>
  );
}
