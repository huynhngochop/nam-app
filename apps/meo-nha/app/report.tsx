import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Button, Chip, Chips, Screen, T, TextField, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { tipById } from '../src/data/tips';

const REASONS = ['Mẹo không hiệu quả', 'Sai thông tin', 'Có thể nguy hiểm', 'Khác'];

/** Báo mẹo sai (MN-20). ≥ 3 báo "nguy hiểm" → máy chủ tự ẩn mẹo chờ duyệt. */
export default function Report() {
  const { tipId } = useLocalSearchParams<{ tipId: string }>();
  const tip = tipById(String(tipId));
  const toast = useToast();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  return (
    <Screen scroll footer={<Button title="Gửi" disabled={!reason} onPress={() => { track('tip_reported', { tipId: String(tipId), reason }); toast('Đã gửi. Đội Mẹo Nhà sẽ kiểm tra.', { tone: 'success' }); router.back(); }} />}>
      <AppBar title="Báo mẹo" onBack={() => router.back()} backIcon="x" />
      <T v="headline">{tip?.title}</T>
      <Chips>{REASONS.map((r) => <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />)}</Chips>
      <TextField label="Mô tả (không bắt buộc)" value={note} onChangeText={setNote} multiline maxLength={500} placeholder="Bạn gặp vấn đề gì?" />
    </Screen>
  );
}
