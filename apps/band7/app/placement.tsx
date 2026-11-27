import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Button, Card, Chip, Chips, Row, Screen, Segmented, StepBar, T } from '@nam/ui';
import { serverEnabled } from '../src/api';
import { CRITERIA, CRITERION_VI, overallOf, type Bands, type Criterion } from '../src/plan';
import { useBand7 } from '../src/store';

/** Mô tả dễ hiểu cho từng mức, để người học tự đánh giá nhanh khi chưa nói thử được. */
const SELF: Record<Criterion, { band: number; text: string }[]> = {
  FC: [
    { band: 4.5, text: 'Ngập ngừng nhiều, câu rất ngắn' },
    { band: 5.5, text: 'Nói được nhưng hay dừng tìm từ' },
    { band: 6.5, text: 'Nói dài được, đôi lúc lặp ý' },
    { band: 7.5, text: 'Nói trôi, nối ý tự nhiên' },
  ],
  LR: [
    { band: 4.5, text: 'Chỉ dùng từ cơ bản' },
    { band: 5.5, text: 'Đủ từ cho chủ đề quen, hay lặp' },
    { band: 6.5, text: 'Dùng được vài cụm từ hay' },
    { band: 7.5, text: 'Linh hoạt, dùng collocation tự nhiên' },
  ],
  GRA: [
    { band: 4.5, text: 'Hay sai thì, câu đơn' },
    { band: 5.5, text: 'Có câu phức nhưng sai khá nhiều' },
    { band: 6.5, text: 'Câu phức khá ổn, còn lỗi nhỏ' },
    { band: 7.5, text: 'Phần lớn câu đúng' },
  ],
  P: [
    { band: 4.5, text: 'Người nghe khó hiểu' },
    { band: 5.5, text: 'Hiểu được, hay mất âm cuối' },
    { band: 6.5, text: 'Rõ ràng, còn giọng Việt' },
    { band: 7.5, text: 'Rõ, có trọng âm và ngữ điệu' },
  ],
};

const STEPS = [3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

/** 0b · Đầu vào: nói thử với AI · tự đánh giá nhanh · nhập điểm thi thật. */
export default function Placement() {
  const recordBands = useBand7((s) => s.recordBands);
  const authed = useBand7((s) => !!s.auth);
  const [mode, setMode] = useState<'self' | 'real'>('self');
  const [b, setB] = useState<Bands>({ FC: 5.5, LR: 5.5, GRA: 5.5, P: 5.5 });
  const canSpeak = serverEnabled() && authed;

  const save = () => {
    recordBands(mode === 'real' ? 'real_exam' : 'self', b);
    router.replace('/goals');
  };

  return (
    <Screen scroll footer={<Button title={`Lưu: band ${overallOf(b).toFixed(1)} · tiếp tục`} onPress={save} />}>
      <AppBar onBack={() => router.replace('/welcome')} />
      <StepBar count={3} index={1} />
      <T v="display">Trình độ hiện tại</T>
      <T v="body" muted>
        Lộ trình được tính từ band từng tiêu chí của bạn. Càng sát thì giáo án càng đúng chỗ.
      </T>

      {canSpeak ? (
        <Card
          variant="accent"
          onPress={() => router.push({ pathname: '/session', params: { kind: 'placement', mode: 'exam' } })}
        >
          <T v="headline">Nói thử 4 phút với giám khảo AI</T>
          <T v="caption">Chính xác nhất. 3 phần ngắn như phòng thi, chấm theo 4 tiêu chí.</T>
        </Card>
      ) : (
        <Card variant="fill">
          <T v="caption" muted>
            Nói thử với AI cần kết nối máy chủ và đăng nhập. Tạm thời bạn có thể tự đánh giá, sau này app sẽ chấm lại
            sau buổi nói đầu tiên.
          </T>
        </Card>
      )}

      <Segmented
        options={[
          { key: 'self', label: 'Tự đánh giá nhanh' },
          { key: 'real', label: 'Có điểm IELTS thật' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {CRITERIA.map((k) => (
        <View key={k} style={{ gap: 8 }}>
          <Row between>
            <T v="headline">{CRITERION_VI[k]}</T>
            <T v="headline" accent>
              {b[k].toFixed(1)}
            </T>
          </Row>
          {mode === 'self' ? (
            <Chips>
              {SELF[k].map((o) => (
                <Chip
                  key={o.band}
                  label={o.text}
                  selected={b[k] === o.band}
                  onPress={() => setB({ ...b, [k]: o.band })}
                />
              ))}
            </Chips>
          ) : (
            <Chips scroll>
              {STEPS.map((s) => (
                <Chip key={s} label={s.toFixed(1)} selected={b[k] === s} onPress={() => setB({ ...b, [k]: s })} />
              ))}
            </Chips>
          )}
        </View>
      ))}
    </Screen>
  );
}
