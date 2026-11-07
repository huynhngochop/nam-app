import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Badge, Button, Card, Row, Screen, SectionHeader, T, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { FACE_ADVICE, FACE_DISCLAIMER, FACE_PARTS, FACE_REAL, optionOf, topTraits } from '../../src/face/data';
import { useSession } from '../../src/session';
import { useTT } from '../../src/store';
import { Brief } from '../../src/components';

/** TT-35 · Kết quả nhân tướng: 3 nét nổi bật + từng bộ vị (3 dòng, Xem thêm). */
export default function FaceResult() {
  const toast = useToast();
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const draft = useSession((s) => s.faceDraft);
  const set = useTT((s) => s.set);
  const traits = topTraits(draft);
  const answered = FACE_PARTS.filter((p) => optionOf(p.id, draft[p.id]));
  return (
    <Screen
      scroll
      footer={
        saved ? undefined : (
          <>
            <Button
              title="Lưu cho tôi"
              onPress={() => {
                set({ face: { answers: draft, savedAt: Date.now() } });
                track('face_saved', { parts: answered.length });
                toast('Đã lưu trên máy này', { tone: 'success' });
                router.back();
              }}
            />
            <Button
              title="Không lưu"
              variant="text"
              size="sm"
              onPress={() => router.back()}
              style={{ alignSelf: 'center' }}
            />
          </>
        )
      }
    >
      <AppBar onBack={() => router.back()} title="Kết quả" />
      <T v="micro" muted>
        {FACE_DISCLAIMER}
      </T>
      {traits.length ? (
        <Card variant="tint">
          <T v="caption" muted>
            Ba nét nổi bật
          </T>
          <Row wrap gap={8}>
            {traits.map((t) => (
              <Badge key={t} label={t} tone="accent" />
            ))}
          </Row>
          <T v="body">
            Theo nhân tướng dân gian, bạn là người {traits.join(', ')}. Hãy coi đây là gợi ý để nhìn lại điểm mạnh của
            mình.
          </T>
        </Card>
      ) : (
        <Card>
          <T v="body">Bạn chưa chọn bước nào. Có thể làm lại bất cứ lúc nào.</T>
        </Card>
      )}
      {answered.length ? <SectionHeader title="Từng nét" /> : null}
      {answered.map((p) => {
        const o = optionOf(p.id, draft[p.id])!;
        return (
          <Card key={p.id}>
            <T v="micro" muted>
              {p.name}
            </T>
            <T v="headline">{o.label}</T>
            <Brief text={o.summary} href={`/face/part/${p.id}/${o.id}`} />
          </Card>
        );
      })}
      <SectionHeader title="Nhìn thực tế" />
      <Card>
        <T v="body">{FACE_REAL}</T>
        <T v="body" weight="semibold">
          {FACE_ADVICE}
        </T>
      </Card>
    </Screen>
  );
}
