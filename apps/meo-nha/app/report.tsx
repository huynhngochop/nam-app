import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Button, Chip, Chips, Screen, T, TextField, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { tipById } from '../src/data/tips';
import { useMeo } from '../src/store';

const REASONS = ['Mẹo không hiệu quả', 'Sai thông tin', 'Có thể nguy hiểm', 'Khác'];

/**
 * Báo mẹo sai (MN-20). Trên máy: ẩn mẹo khỏi danh sách của người báo. Lý do gửi qua analytics (track) để đội
 * nội dung xem; khi có máy chủ, ≥ 3 báo "nguy hiểm" sẽ tự ẩn mẹo với mọi người.
 */
export default function Report() {
  const { tipId } = useLocalSearchParams<{ tipId: string }>();
  const tip = tipById(String(tipId));
  const toast = useToast();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  return (
    <Screen
      scroll
      footer={
        <Button
          title="Gửi"
          disabled={!reason}
          onPress={() => {
            track('tip_reported', { tipId: String(tipId), reason, note: note.trim().slice(0, 200) });
            useMeo.getState().hideTip(String(tipId));
            toast('Đã ghi nhận. Mẹo này sẽ không hiện trong danh sách của bạn nữa.', { tone: 'success' });
            router.dismissAll?.();
            router.replace('/(tabs)/explore');
          }}
        />
      }
    >
      <AppBar title="Báo mẹo" onBack={() => router.back()} backIcon="x" />
      <T v="headline">{tip?.title}</T>
      <Chips>
        {REASONS.map((r) => (
          <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
        ))}
      </Chips>
      <TextField
        label="Mô tả (không bắt buộc)"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={500}
        placeholder="Bạn gặp vấn đề gì?"
      />
    </Screen>
  );
}
