import React, { useState } from 'react';
import { router } from 'expo-router';
import { AppBar, Button, Chip, Chips, Screen, T, TextField, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { CATEGORIES, CategoryId } from '../src/data/tips';
import { useMeo } from '../src/store';

/** Gửi mẹo của bạn (từ MN-14). Lưu trên máy thành "Mẹo của tôi"; gửi đội Mẹo Nhà duyệt khi có máy chủ. */
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
            const id = useMeo.getState().addMyTip({
              title,
              categoryId: cat!,
              steps: steps
                .split('\n')
                .map((x) => x.trim())
                .filter(Boolean),
            });
            track('tip_submitted', { category: cat });
            toast('Đã lưu vào Đã lưu · Mẹo của tôi', { tone: 'success' });
            router.replace(`/tip/${id}`);
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
        Mẹo lưu trên máy bạn. Khi Mẹo Nhà có máy chủ, mẹo được gửi để biên tập và kiểm chứng trước khi chia sẻ cho mọi
        người.
      </T>
    </Screen>
  );
}
