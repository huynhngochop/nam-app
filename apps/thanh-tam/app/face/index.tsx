import React from 'react';
import { router } from 'expo-router';
import { AppBar, Badge, Button, Card, Row, Screen, T, useTheme } from '@nam/ui';
import { FACE_ADVICE, FACE_DISCLAIMER, FACE_PARTS, topTraits } from '../../src/face/data';
import { useTT } from '../../src/store';
import { useSession } from '../../src/session';

/** TT-33 · Nhân tướng: giới thiệu + kết quả đã lưu. Không camera, không ảnh, không điểm số. */
export default function FaceIntro() {
  const { c } = useTheme();
  const face = useTT((s) => s.face);
  const setDraft = useSession((s) => s.set);
  const start = () => {
    setDraft({ faceDraft: {} });
    router.push('/face/step/0');
  };
  return (
    <Screen
      scroll
      footer={
        <Button title={face ? 'Chọn lại từ đầu' : 'Bắt đầu'} variant={face ? 'secondary' : 'primary'} onPress={start} />
      }
    >
      <AppBar onBack={() => router.back()} title="Nhân tướng" large />
      <T v="body" muted>
        Tự chọn nét mặt của chính mình qua {FACE_PARTS.length} bước. Thành Tâm tra theo nhân tướng học dân gian và ghép
        3 nét tính cách nổi bật.
      </T>
      {face ? (
        <Card
          variant="tint"
          onPress={() => {
            setDraft({ faceDraft: face.answers });
            router.push('/face/result?saved=1');
          }}
          accessibilityLabel="Kết quả đã lưu"
        >
          <T v="micro" muted>
            Kết quả đã lưu
          </T>
          <Row wrap gap={6}>
            {topTraits(face.answers).map((t) => (
              <Badge key={t} label={t} tone="accent" />
            ))}
          </Row>
          <T v="caption" accent weight="semibold">
            Xem lại
          </T>
        </Card>
      ) : null}
      <Card>
        <T v="headline">Cách làm</T>
        <T v="body">• Nhìn gương hoặc ảnh của chính bạn.</T>
        <T v="body">• Mỗi bước chọn kiểu gần nhất; không chắc thì bỏ qua.</T>
        <T v="body">• Không cần ảnh, không gửi gì đi đâu. Chỉ lưu khi bạn bấm “Lưu cho tôi”.</T>
      </Card>
      <Card style={{ borderColor: c.line }}>
        <T v="body">{FACE_ADVICE}</T>
        <T v="caption" muted>
          {FACE_DISCLAIMER}
        </T>
      </Card>
    </Screen>
  );
}
