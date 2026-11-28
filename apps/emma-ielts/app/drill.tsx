import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { AppBar, Button, Card, Icon, ProgressBar, Row, Screen, T, useTheme } from '@nam/ui';
import { drillByTitle, shadowDrill, warmupFor, type Drill } from '../src/drills';
import { modelBand, overallOf } from '../src/plan';
import { useSpeechRecorder } from '../src/recorder';
import { useEmma } from '../src/store';
import { speak, voiceAvailable } from '../src/voice';

/** Bài ngắn ngoại tuyến: đọc giải thích → đọc to từng câu → nghe lại giọng mình. Không cần mạng, không tốn lượt AI. */
export default function DrillScreen() {
  const { c } = useTheme();
  const p = useLocalSearchParams<{ kind: string; title: string; lesson?: string }>();
  const markDone = useEmma((s) => s.markDone);
  const errors = useEmma((s) => s.errors);
  const settings = useEmma((s) => s.settings);
  const bands = useEmma((s) => s.bands);
  const target = useEmma((s) => s.goal?.target ?? 7);

  const sample = modelBand(overallOf(bands), target);
  const drill: Drill = useMemo(() => {
    if (p.kind === 'warmup') return warmupFor(new Date().getDate());
    if (p.kind === 'shadow') {
      // Ưu tiên câu nâng cấp của chính người học (từ sổ lỗi)
      const own = errors
        .map((e) => e.band7_text)
        .filter((x): x is string => !!x)
        .slice(0, 3);
      return own.length
        ? {
            title: 'Nói nhại câu nâng cấp của bạn',
            explain: 'Nghe, rồi đọc to theo đúng nhịp. Câu lấy từ chính bài nói của bạn.',
            lines: own,
          }
        : shadowDrill(sample);
    }
    return drillByTitle(p.title) ?? shadowDrill(sample);
  }, [p.kind, p.title, errors, sample]);

  const [i, setI] = useState(0);
  const [myUri, setMyUri] = useState<string | null>(null);
  const rec = useSpeechRecorder();
  const player = useAudioPlayer(myUri ? { uri: myUri } : null);
  const line = drill.lines[i];
  const last = i >= drill.lines.length - 1;

  const toggleRecord = async () => {
    if (rec.isRecording) setMyUri(await rec.stop());
    else {
      setMyUri(null);
      await rec.start();
    }
  };
  const next = () => {
    if (last) {
      if (p.lesson) markDone(p.lesson);
      router.back();
    } else {
      setI(i + 1);
      setMyUri(null);
    }
  };

  return (
    <Screen
      scroll
      footer={<Button title={last ? 'Xong bài' : 'Câu tiếp'} icon={last ? 'check' : 'arrow-right'} onPress={next} />}
    >
      <AppBar onBack={() => router.back()} title={drill.title} />
      <ProgressBar value={(i + 1) / drill.lines.length} />
      <Card variant="tint">
        <T v="body">{drill.explain}</T>
      </Card>
      <Card>
        <T v="micro" muted>
          Câu {i + 1}/{drill.lines.length} · đọc to
        </T>
        <T v="title">{line}</T>
        <Row gap={8} wrap>
          {voiceAvailable() ? (
            <Button
              title="Nghe mẫu"
              icon="volume-2"
              variant="secondary"
              size="sm"
              onPress={() => speak(line, settings.accent, 'slow')}
            />
          ) : null}
          {myUri ? (
            <Button
              title="Nghe giọng bạn"
              icon="play"
              variant="secondary"
              size="sm"
              onPress={() => {
                player.seekTo(0);
                player.play();
              }}
            />
          ) : null}
        </Row>
      </Card>
      <Button
        title={rec.isRecording ? `Dừng · ${rec.seconds}s` : myUri ? 'Đọc lại' : 'Bấm để đọc'}
        icon={rec.isRecording ? 'square' : 'mic'}
        color={rec.isRecording ? c.negative : undefined}
        onPress={toggleRecord}
      />
      {rec.permission === 'denied' ? (
        <Row gap={8}>
          <Icon name="mic-off" color={c.negative} />
          <T v="caption" color={c.negative} style={{ flex: 1 }}>
            Chưa có quyền micro. Mở Cài đặt máy để cho phép Emma IELTS dùng micro.
          </T>
        </Row>
      ) : null}
    </Screen>
  );
}
