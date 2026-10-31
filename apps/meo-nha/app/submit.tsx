import React, { useState } from 'react';
import { router } from 'expo-router';
import { AppBar, Button, Chip, Chips, Screen, T, TextField, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { CATEGORIES, CategoryId } from '../src/data/tips';

/** Gửi mẹo của bạn (từ MN-14). Bản nháp giữ trong state; gửi lên POST /tips/submissions khi có máy chủ. */
export default function Submit() {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [steps, setSteps] = useState('');
  const ok = title.trim().length >= 5 && cat && steps.trim().length >= 10;
  return (
    <Screen
      scroll
      footer={
        <Button
          title="Gửi"
          disabled={!ok}
          onPress={() => {
            track('tip_submitted', { category: cat });
            toast('Cảm ơn! Đội Mẹo Nhà sẽ duyệt trong 3 ngày.', { tone: 'success' });
            router.back();
          }}
        />
      }
    >
      <AppBar title="Gửi mẹo của bạn" onBack={() => router.back()} backIcon="x" />
      <TextField
        label="Tiêu đề"
        value={title}
        onChangeText={setTitle}
        maxLength={80}
        placeholder="Ví dụ: Khử mùi lò vi sóng bằng chanh"
      />
      <T v="caption" muted weight="semibold">
        Danh mục
      </T>
      <Chips>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.name} selected={cat === c.id} onPress={() => setCat(c.id)} />
        ))}
      </Chips>
      <TextField
        label="Các bước"
        value={steps}
        onChangeText={setSteps}
        multiline
        maxLength={1000}
        placeholder="Mỗi bước một dòng"
      />
      <T v="caption" muted>
        Mẹo được biên tập và kiểm chứng trước khi xuất bản.
      </T>
    </Screen>
  );
}
