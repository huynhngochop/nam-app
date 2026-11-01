import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Badge, Card, EmptyState, Screen, T } from '@nam/ui';
import { termById } from '../../../src/data/ageContent';
import { Layers, Sources } from '../../../src/components';
import { SRC } from '../../../src/data/sources';

/** TT-32 · Chi tiết sao, hạn, khái niệm (ba lớp). */
export default function TermScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = termById(decodeURIComponent(id ?? ''));
  if (!t)
    return (
      <Screen>
        <AppBar onBack={() => router.back()} />
        <EmptyState icon="star" title="Mục này đang được biên soạn" />
      </Screen>
    );
  return (
    <Screen scroll>
      <AppBar onBack={() => router.back()} />
      <Badge label={t.kind} tone="accent" />
      <T v="display" accessibilityRole="header">
        {t.title}
      </T>
      {t.careful ? (
        <Card variant="tint">
          <T v="body">Đây là quan niệm dân gian, không phải điều chắc chắn sẽ xảy ra.</T>
        </Card>
      ) : null}
      <T v="body" muted>
        {t.summary}
      </T>
      <Layers
        folk={t.folk}
        practical={t.practical}
        advice={t.advice.length ? t.advice : ['Sống điều độ, giữ hòa khí trong nhà là đủ.']}
      />
      {t.careful ? <Sources sources={[SRC.cv033]} /> : null}
    </Screen>
  );
}
