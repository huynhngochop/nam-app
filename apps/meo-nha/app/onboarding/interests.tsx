import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Check, Grid, Row, Screen, StepDots, T, Thumb, useTheme } from '@nam/ui';
import { track } from '@nam/core';
import { CATEGORIES, CategoryId } from '../../src/data/tips';
import { useMeo } from '../../src/store';

/** MN-02 · Chọn mối quan tâm (cũng dùng để sửa từ MN-14 với ?edit=1). */
export default function Interests() {
  const { c } = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const store = useMeo();
  const [sel, setSel] = useState<CategoryId[]>(store.interests);
  const toggle = (id: CategoryId) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const finish = (ids: CategoryId[]) => {
    store.set({ interests: ids });
    track('onboarding_interests_selected', { count: ids.length });
    if (edit) router.back();
    else router.push('/onboarding/notifications');
  };
  return (
    <Screen
      scroll
      footer={<Button title={`Tiếp tục (${sel.length})`} disabled={!sel.length} onPress={() => finish(sel)} />}
    >
      <Row between style={{ minHeight: 48 }}>
        {edit ? <View /> : <StepDots count={2} index={0} />}
        {!edit ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              store.set({ interests: [], onboarded: true });
              track('onboarding_skipped', { step: 1 });
              router.replace('/(tabs)/explore');
            }}
          >
            <T v="caption" muted weight="semibold">
              Bỏ qua
            </T>
          </Pressable>
        ) : null}
      </Row>
      <T v="display">Bạn quan tâm điều gì?</T>
      <T v="caption" muted>
        Chọn ít nhất 1 mục để Mẹo Nhà gợi ý đúng hơn.
      </T>
      <Grid min={2} gap={10}>
        {CATEGORIES.map((cat) => {
          const on = sel.includes(cat.id);
          return (
            <Pressable
              key={cat.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(cat.id)}
              style={{
                minHeight: 96,
                borderRadius: 14,
                padding: 14,
                gap: 10,
                backgroundColor: on ? c.at : c.surface,
                borderWidth: on ? 2 : 1,
                borderColor: on ? c.a : c.line,
              }}
            >
              <Row between>
                <Thumb icon={cat.icon} size={32} color={cat.id === 'plants' ? c.a2 : undefined} />
                <Check on={on} />
              </Row>
              <T v="headline">{cat.name}</T>
            </Pressable>
          );
        })}
      </Grid>
    </Screen>
  );
}
