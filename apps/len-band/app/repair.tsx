import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppBar, Button, Card, EmptyState, Icon, IconButton, Row, Screen, T, useTheme, useToast } from '@nam/ui';
import { ApiError, sendRepair, serverEnabled, type LearnerError, type RepairResult } from '../src/api';
import { maskSentence, RECALL_DAYS, toRepair } from '../src/loop';
import { useSpeechRecorder } from '../src/recorder';
import { useLenBand } from '../src/store';
import { speak, voiceAvailable } from '../src/voice';

/** 13 · Vòng sửa lỗi · Sửa ngay: nói lại câu đúng 2 lần → lỗi chuyển sang giai đoạn gài lại. */
export default function Repair() {
  const { c } = useTheme();
  const toast = useToast();
  const p = useLocalSearchParams<{ id?: string }>();
  const errors = useLenBand((s) => s.errors);
  const patchError = useLenBand((s) => s.patchError);
  const settings = useLenBand((s) => s.settings);
  // Danh sách cố định lúc mở màn (không đổi khi trạng thái lỗi cập nhật)
  const [queue] = useState<LearnerError[]>(() => {
    if (p.id) return errors.filter((e) => e.id === p.id);
    return toRepair(errors).slice(0, 3);
  });
  const [i, setI] = useState(0);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [busy, setBusy] = useState(false);
  const rec = useSpeechRecorder();
  const e = queue[i];
  const live = useLenBand((s) => s.errors.find((x) => x.id === e?.id)) ?? e;
  const okCount = Math.min(2, live?.repair_ok ?? 0);
  const target = useMemo(
    () => (live?.band7_text && live.band7_text.length < 140 ? live.band7_text : (live?.right_text ?? '')),
    [live],
  );

  if (!e)
    return (
      <Screen>
        <AppBar onBack={() => router.back()} />
        <EmptyState
          icon="check-circle"
          title="Không còn lỗi mới"
          body="Lỗi đang gài lại sẽ xuất hiện trong buổi nói tới."
          action="Về Hôm nay"
          onAction={() => router.replace('/(tabs)/today')}
        />
      </Screen>
    );

  const onMic = async () => {
    if (busy) return;
    if (!rec.isRecording) {
      setResult(null);
      await rec.start();
      return;
    }
    const uri = await rec.stop();
    if (!uri) return toast('Câu quá ngắn, nói lại nhé.');
    if (!serverEnabled()) return toast('Cần kết nối máy chủ để kiểm tra câu nói.', { tone: 'error' });
    setBusy(true);
    try {
      const r = await sendRepair(e.id, uri, target === live.band7_text ? 'band7' : 'right');
      setResult(r);
      patchError(e.id, {
        repair_ok: r.repair_ok ?? live.repair_ok,
        status: r.status ?? live.status,
        next_due_at: r.next_due_at ?? live.next_due_at,
      });
      void Haptics.notificationAsync(
        r.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
    } catch (err) {
      toast(err instanceof ApiError ? err.messageVi : 'Có lỗi, thử lại nhé.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const passed = live.status !== 'repairing';
  const next = () => {
    setResult(null);
    if (i + 1 < queue.length) setI(i + 1);
    else {
      useLenBand.getState().markDone('repair');
      router.back();
    }
  };

  return (
    <Screen
      scroll
      footer={
        passed ? (
          <Button title={i + 1 < queue.length ? 'Lỗi tiếp theo' : 'Xong'} icon="arrow-right" onPress={next} />
        ) : (
          <Button
            title={rec.isRecording ? `Dừng · ${rec.seconds}s` : busy ? 'Đang nghe…' : `Nói lần ${okCount + 1}`}
            icon={rec.isRecording ? 'square' : 'mic'}
            loading={busy}
            color={rec.isRecording ? c.negative : undefined}
            onPress={onMic}
          />
        )
      }
    >
      <AppBar onBack={() => router.back()} title={`Sửa ngay · lỗi ${i + 1}/${queue.length}`} />
      <Stages step={passed ? 2 : 1} />

      <Card>
        <T v="micro" color={c.negative}>
          Bạn đã nói
        </T>
        <T v="body" muted style={{ textDecorationLine: 'line-through' }}>
          {live.wrong_text}
        </T>
        <View style={{ height: 1, backgroundColor: c.line }} />
        <T v="micro" color={c.positive}>
          {target === live.band7_text ? 'Câu nâng cấp của bạn' : 'Câu đúng'}
        </T>
        <Row gap={10}>
          <T v="title" style={{ flex: 1 }}>
            {okCount === 1 && !passed ? maskSentence(target) : target}
          </T>
          {voiceAvailable() ? (
            <IconButton icon="volume-2" label="Nghe câu mẫu" onPress={() => speak(target, settings.accent, 'slow')} />
          ) : null}
        </Row>
      </Card>

      {live.explain_vi ? (
        <Card variant="tint">
          <T v="headline">Vì sao hay sai chỗ này</T>
          <T v="body">{live.explain_vi}</T>
        </Card>
      ) : null}

      <Row gap={8}>
        {[0, 1].map((k) => (
          <Card
            key={k}
            variant={k < okCount ? 'tint' : k === okCount && !passed ? 'outlineAccent' : 'fill'}
            style={{ flex: 1, padding: 12 }}
          >
            <Row gap={6}>
              <Icon name={k < okCount ? 'check' : 'mic'} size={16} color={k < okCount ? c.positive : c.a} />
              <T v="caption" weight="semibold">
                Lần {k + 1} · {k < okCount ? 'đúng' : k === okCount && !passed ? 'đến lượt' : 'chưa'}
              </T>
            </Row>
          </Card>
        ))}
      </Row>
      {okCount === 1 && !passed ? (
        <T v="caption" muted>
          Lần 2 câu bị che bớt để bạn tự nhớ lại.
        </T>
      ) : null}

      {result ? (
        <Card variant={result.ok ? 'tint' : 'danger'}>
          <T v="headline" color={result.ok ? c.positive : c.negative}>
            {result.message_vi}
          </T>
          <T v="caption" muted>
            Bạn nói: “{result.transcript}”
          </T>
          {!result.ok && result.missed.length ? <T v="caption">Chưa đúng: {result.missed.join(', ')}</T> : null}
        </Card>
      ) : null}

      <Card variant="fill">
        <Row gap={8}>
          <Icon name="calendar" color={c.a} />
          <T v="caption" style={{ flex: 1 }}>
            Giám khảo sẽ hỏi lại cấu trúc này vào ngày {RECALL_DAYS.slice(0, 3).join(', ')} và kiểm tra giữ lâu ngày{' '}
            {RECALL_DAYS[3]}, xen trong hội thoại, không báo trước.
          </T>
        </Row>
      </Card>
    </Screen>
  );
}

function Stages({ step }: { step: number }) {
  const { c } = useTheme();
  const labels = ['Bắt lỗi', 'Sửa ngay', 'Gài lại', 'Đóng lỗi'];
  return (
    <Row gap={6}>
      {labels.map((l, k) => (
        <View key={l} style={{ flex: 1, gap: 4 }}>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: k < step ? c.positive : k === step ? c.a : c.surface2,
            }}
          />
          <T v="caption" weight="semibold" color={k <= step ? c.ink : c.inkMuted} center>
            {l}
          </T>
        </View>
      ))}
    </Row>
  );
}
