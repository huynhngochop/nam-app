import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Badge, EmptyState, Row, Screen, T } from '@nam/ui';
import { FACE_ADVICE, FACE_PARTS, FACE_REAL, optionOf } from '../../../../src/face/data';
import { Layers } from '../../../../src/components';

/** TT-36 · Chi tiết bộ vị. */
export default function FacePart() {
  const { partId, optionId } = useLocalSearchParams<{ partId: string; optionId: string }>();
  const part = FACE_PARTS.find((p) => p.id === partId);
  const o = optionOf(partId, optionId);
  if (!part || !o)
    return (
      <Screen>
        <AppBar onBack={() => router.back()} />
        <EmptyState icon="smile" title="Không tìm thấy mục này" />
      </Screen>
    );
  return (
    <Screen scroll>
      <AppBar onBack={() => router.back()} />
      <T v="micro" muted>
        {part.name}
      </T>
      <T v="display" accessibilityRole="header">
        {o.label}
      </T>
      <Row wrap gap={6}>
        {o.traits.map((t) => (
          <Badge key={t} label={t} tone="accent" />
        ))}
      </Row>
      <T v="body" muted>
        {o.summary}
      </T>
      <Layers
        folk={o.folk ?? o.summary}
        practical={FACE_REAL}
        advice={[FACE_ADVICE, 'Hỏi người thân xem họ thấy điểm mạnh nào ở mình.']}
      />
    </Screen>
  );
}
