import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Badge, Button, Card, Dialog, Icon, IconButton, Row, Segmented, T, useTheme, useToast } from '@nam/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ApiError,
  sendTurn,
  serverEnabled,
  startSession,
  type Correction,
  type RecallResult,
  type SessionKind,
} from '../src/api';
import { useSpeechRecorder } from '../src/recorder';
import { useXuan } from '../src/store';
import { pickTopic, topicById } from '../src/topics';
import { speak, stopSpeaking } from '../src/voice';
import { CLOSE_AFTER } from '../src/loop';

type Bubble =
  | { kind: 'examiner'; text: string }
  | { kind: 'learner'; text: string }
  | { kind: 'fix'; items: Correction[] }
  | { kind: 'hint'; text: string }
  | { kind: 'recall'; r: RecallResult };

/** Số lượt nói mỗi loại buổi trước khi tự chuyển sang chấm. */
const TURNS: Record<SessionKind, number> = { placement: 6, part1: 6, part2: 3, part3: 5, mock: 12, free: 8 };

/** 4 · Luyện nói 1:1: ghi âm → giám khảo AI trả lời, sửa lỗi, gài lại lỗi cũ → chấm cuối buổi. */
export default function SessionScreen() {
  useKeepAwake();
  const { c } = useTheme();
  const toast = useToast();
  const p = useLocalSearchParams<{ kind?: string; mode?: string; topic?: string; lesson?: string; first?: string }>();
  const kind = (p.kind ?? 'part1') as SessionKind;
  const [mode, setMode] = useState<'practice' | 'exam'>(
    p.mode === 'exam' || kind === 'mock' || kind === 'placement' ? 'exam' : 'practice',
  );
  const settings = useXuan((s) => s.settings);
  const authed = useXuan((s) => !!s.auth);
  const practiced = useXuan((s) => s.practiced);
  const online = serverEnabled() && authed;

  const topic = topicById(p.topic ?? '') ?? pickTopic(kind === 'part3' ? 3 : kind === 'part2' ? 2 : 1, practiced);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState(0);
  const [left, setLeft] = useState<number | null>(null);
  const [retryUri, setRetryUri] = useState<string | null>(null);
  const [quit, setQuit] = useState(false);
  const offlineQ = useRef(0);
  const scroll = useRef<ScrollView>(null);
  const rec = useSpeechRecorder();

  const say = useCallback(
    (text: string) => {
      setBubbles((b) => [...b, { kind: 'examiner', text }]);
      speak(text, settings.accent, settings.speed);
    },
    [settings.accent, settings.speed],
  );

  // Mở buổi: có máy chủ → tạo buổi trên máy chủ (không tốn lượt AI); không có → luyện với đề trong máy
  useEffect(() => {
    let alive = true;
    const first = p.first ?? topic.questions[0];
    if (!online) {
      say(first);
      return;
    }
    setBusy(true);
    startSession(kind, mode, topic.id, first, topic.title)
      .then((r) => {
        if (!alive) return;
        setSessionId(r.session_id);
        say(r.reply);
      })
      .catch((e) => {
        if (!alive) return;
        toast(e instanceof ApiError ? e.messageVi : 'Không mở được buổi nói.', { tone: 'error' });
        say(first);
      })
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
      stopSpeaking();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [bubbles.length]);

  const finish = useCallback(() => {
    stopSpeaking();
    if (sessionId)
      router.replace({
        pathname: '/feedback',
        params: { session: sessionId, kind, topic: topic.id, lesson: p.lesson ?? '' },
      });
    else {
      if (p.lesson) useXuan.getState().markDone(p.lesson);
      useXuan.getState().logSession({ id: `local-${Date.now()}`, kind, topic: topic.id, at: Date.now() });
      router.back();
    }
  }, [sessionId, kind, topic.id, p.lesson]);

  const submit = async (uri: string) => {
    if (!sessionId) {
      // Ngoại tuyến: chỉ luyện, câu hỏi tiếp theo lấy từ đề trong máy
      setBubbles((b) => [...b, { kind: 'learner', text: '(đã ghi âm)' }]);
      offlineQ.current += 1;
      const q = topic.questions[offlineQ.current];
      if (q) say(q);
      else finish();
      return;
    }
    setBusy(true);
    setRetryUri(null);
    try {
      const r = await sendTurn(sessionId, uri);
      const add: Bubble[] = [{ kind: 'learner', text: r.transcript }];
      if (r.recall) add.push({ kind: 'recall', r: r.recall });
      if (r.corrections.length) add.push({ kind: 'fix', items: r.corrections });
      if (r.hint_vi) add.push({ kind: 'hint', text: r.hint_vi });
      setBubbles((b) => [...b, ...add]);
      setLeft(r.turns_left);
      const n = turns + 1;
      setTurns(n);
      if (r.recall?.result === 'correct') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (n >= TURNS[kind]) {
        setBubbles((b) => [...b, { kind: 'examiner', text: 'Thank you. That is the end of this part.' }]);
        setTimeout(finish, 900);
      } else say(r.reply);
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      if (err?.status === 429) {
        toast(err.messageVi, { tone: 'error' });
        router.push('/paywall');
      } else {
        setRetryUri(uri);
        toast(err?.messageVi ?? 'Có lỗi, thử lại nhé.', { tone: 'error' });
      }
    } finally {
      setBusy(false);
    }
  };

  const canGrade = !!sessionId && turns > 0;
  const leave = () => {
    setQuit(false);
    stopSpeaking();
    router.back();
  };

  const onMic = async () => {
    if (busy) return;
    if (rec.isRecording) {
      const uri = await rec.stop();
      if (!uri) return toast('Câu trả lời quá ngắn, nói lại nhé.');
      await submit(uri);
    } else {
      stopSpeaking();
      const ok = await rec.start();
      if (ok) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f1626' }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}>
        <Row gap={12}>
          <IconButton icon="x" label="Thoát" onPress={() => setQuit(true)} color="#ffffff" bg="#1c2538" />
          <View style={{ flex: 1 }}>
            <T v="headline" color="#ffffff" numberOfLines={1}>
              {kind === 'mock' ? 'Thi thử' : kind === 'placement' ? 'Nói thử đầu vào' : `Part ${kind.slice(-1)}`} ·{' '}
              {topic.title}
            </T>
            <T v="caption" color="#9aa4bd">
              Lượt {Math.min(turns + 1, TURNS[kind])}/{TURNS[kind]}
              {left !== null ? ` · còn ${left} lượt hôm nay` : ''}
              {!online ? ' · ngoại tuyến' : ''}
            </T>
          </View>
        </Row>
        {kind !== 'mock' && kind !== 'placement' && turns === 0 ? (
          <Segmented
            options={[
              { key: 'practice', label: 'Luyện tập · sửa ngay' },
              { key: 'exam', label: 'Thi thật · không gợi ý' },
            ]}
            value={mode}
            onChange={setMode}
          />
        ) : null}
      </View>

      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 10 }}>
        {bubbles.map((b, i) => (
          <BubbleView key={i} b={b} />
        ))}
        {busy ? <ActivityIndicator color="#9aaaf7" style={{ alignSelf: 'flex-start', marginTop: 4 }} /> : null}
        {!online ? (
          <Card style={{ backgroundColor: '#1c2538', borderColor: '#2c3a66' }}>
            <T v="caption" color="#c9d0e3">
              Chế độ ngoại tuyến: bạn trả lời theo đề trong máy, chưa có chấm và sửa lỗi. Kết nối mạng và đăng nhập để
              nói với giám khảo AI.
            </T>
          </Card>
        ) : null}
      </ScrollView>

      <View style={{ alignItems: 'center', gap: 10, paddingBottom: 16 }}>
        {retryUri ? (
          <Button title="Gửi lại câu vừa nói" size="md" full={false} onPress={() => submit(retryUri)} />
        ) : null}
        <T v="caption" color="#c9d0e3">
          {rec.isRecording
            ? `Đang nghe… ${rec.seconds}s · bấm để gửi`
            : busy
              ? 'Giám khảo đang nghe…'
              : 'Bấm để trả lời'}
        </T>
        <Row gap={28}>
          <IconButton icon="flag" label="Kết thúc và chấm" onPress={finish} color="#ffffff" bg="#1c2538" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rec.isRecording ? 'Dừng và gửi' : 'Bắt đầu nói'}
            disabled={busy}
            onPress={onMic}
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              borderWidth: 6,
              borderColor: '#2c3a66',
              backgroundColor: rec.isRecording ? c.negative : '#f5a524',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Icon name={rec.isRecording ? 'square' : 'mic'} size={30} color="#121826" />
          </Pressable>
          <View style={{ width: 44 }} />
        </Row>
        {rec.permission === 'denied' ? (
          <T v="caption" color="#f28b82" center>
            Chưa có quyền micro. Mở Cài đặt máy để cho phép Xuan English dùng micro.
          </T>
        ) : null}
      </View>

      <Dialog
        visible={quit}
        title="Kết thúc buổi nói?"
        body={canGrade ? 'Bạn có thể chấm luôn phần đã nói.' : 'Phần đã nói chưa được chấm.'}
        confirm={canGrade ? 'Chấm luôn' : 'Thoát'}
        destructive={!canGrade}
        onConfirm={() => {
          setQuit(false);
          if (canGrade) finish();
          else leave();
        }}
        cancel="Nói tiếp"
        onCancel={() => setQuit(false)}
      >
        {canGrade ? <Button title="Thoát không chấm" variant="text" onPress={leave} /> : null}
      </Dialog>
    </SafeAreaView>
  );
}

const BubbleView = React.memo(function BubbleView({ b }: { b: Bubble }) {
  if (b.kind === 'examiner')
    return (
      <View
        style={{
          alignSelf: 'flex-start',
          maxWidth: '84%',
          backgroundColor: '#1c2538',
          borderRadius: 16,
          borderBottomLeftRadius: 4,
          padding: 12,
        }}
      >
        <T v="body" color="#ffffff">
          {b.text}
        </T>
      </View>
    );
  if (b.kind === 'learner')
    return (
      <View
        style={{
          alignSelf: 'flex-end',
          maxWidth: '84%',
          backgroundColor: '#3b5bdb',
          borderRadius: 16,
          borderBottomRightRadius: 4,
          padding: 12,
        }}
      >
        <T v="body" color="#ffffff">
          {b.text}
        </T>
      </View>
    );
  if (b.kind === 'hint')
    return (
      <Row
        gap={8}
        style={{ alignSelf: 'flex-start', backgroundColor: '#2a2416', borderRadius: 12, padding: 10, maxWidth: '90%' }}
      >
        <Icon name="zap" size={16} color="#f5a524" />
        <T v="caption" color="#f7e3b8" style={{ flex: 1 }}>
          {b.text}
        </T>
      </Row>
    );
  if (b.kind === 'recall') {
    const ok = b.r.result === 'correct';
    return (
      <View
        style={{
          backgroundColor: ok ? '#13261f' : '#2a1a18',
          borderRadius: 14,
          padding: 12,
          gap: 6,
          borderWidth: 1,
          borderColor: ok ? '#2f7a5a' : '#7a3a2f',
        }}
      >
        <Row gap={8}>
          <Icon name={ok ? 'check-circle' : 'rotate-ccw'} color={ok ? '#8fe0b0' : '#f28b82'} />
          <T v="headline" color={ok ? '#d7f2e1' : '#f8d4cf'} style={{ flex: 1 }}>
            {ok ? 'Bạn tự dùng đúng, không cần nhắc' : 'Cấu trúc đã học bị sai lại'}
          </T>
        </Row>
        <T v="caption" color={ok ? '#a8d8ba' : '#e8b4ad'}>
          {ok
            ? b.r.status === 'closed'
              ? 'Đã sửa dứt lỗi này. Giám khảo sẽ kiểm tra lại sau 14 ngày.'
              : `Đúng ${b.r.streak ?? 1}/${CLOSE_AFTER} lần liên tiếp.`
            : 'Lỗi này quay về mốc ôn sau 1 ngày.'}
        </T>
      </View>
    );
  }
  return (
    <View
      style={{
        alignSelf: 'flex-end',
        maxWidth: '90%',
        backgroundColor: '#1f2a20',
        borderRadius: 12,
        padding: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: '#3b6b47',
      }}
    >
      <Badge label="Sửa nhanh" tone="positive" />
      {b.items.map((x) => (
        <View key={x.id ?? x.wrong} style={{ gap: 2 }}>
          <T v="caption" color="#9aa4bd" style={{ textDecorationLine: 'line-through' }}>
            {x.wrong}
          </T>
          <T v="body" color="#e3f4e7" weight="semibold">
            {x.right}
          </T>
          {x.explain_vi ? (
            <T v="caption" color="#a8d8ba">
              {x.explain_vi}
            </T>
          ) : null}
        </View>
      ))}
    </View>
  );
});
