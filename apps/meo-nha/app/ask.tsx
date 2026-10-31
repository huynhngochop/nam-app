import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppBar,
  Badge,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  ListItem,
  Row,
  Screen,
  SectionHeader,
  Skeleton,
  T,
  TextField,
  Thumb,
  useTheme,
  useToast,
} from '@nam/ui';
import { getLimit, quotaLeft, track } from '@nam/core';
import { useMeo } from '../src/store';
import { ask, AskAnswer, POPULAR_QUESTIONS } from '../src/lib/ask';

type Turn = { q: string; a?: AskAnswer; loading?: boolean; error?: boolean };

/** MN-21 Hỏi · MN-22 Trả lời · MN-23 Từ chối an toàn. Không quảng cáo. */
export default function Ask() {
  const { c } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ q?: string }>();
  const s = useMeo();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const scroll = useRef<ScrollView>(null);
  const limit = getLimit(s.noAds ? 'AI_ASK_DAILY_NOADS' : 'AI_ASK_DAILY_FREE', 5);
  const left = quotaLeft(s.askQuota, limit);

  const send = async (q: string, popular = false) => {
    const text = q.trim();
    if (!text) return;
    if (!popular && left <= 0) {
      toast('Hết lượt hôm nay · làm mới lúc 00:00');
      return;
    }
    setInput('');
    setTurns((t) => [...t, { q: text, loading: true }]);
    try {
      const a = await ask(
        text,
        turns.map((t) => t.q),
      );
      // Câu từ chối / chưa có mẹo / câu phổ biến không trừ lượt.
      if (!popular && a.kind === 'answer') s.consumeAsk(text);
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { q: text, a } : x)));
      track(a.kind === 'answer' ? 'ask_answered' : 'ask_refused', { reason: a.kind });
    } catch {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { q: text, error: true } : x)));
    }
  };
  useEffect(() => {
    if (params.q) send(String(params.q)); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);
  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [turns]);

  return (
    <Screen edges={['top', 'bottom']}>
      <AppBar title="Hỏi Mẹo Nhà" onBack={() => router.back()} backIcon="x" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          ref={scroll}
          contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {!turns.length ? (
            <>
              <Card variant="tint">
                <Row>
                  <Icon name="zap" color={c.a} size={18} />
                  <T v="headline">Hỏi bằng lời của bạn</T>
                </Row>
                <T v="caption">Mẹo Nhà trả lời dựa trên kho mẹo đã được kiểm chứng, kèm link mẹo gốc.</T>
              </Card>
              <SectionHeader title="Mọi người hay hỏi" />
              {POPULAR_QUESTIONS.map((q) => (
                <ListItem
                  key={q}
                  strong={false}
                  left={<Thumb icon="help-circle" size={32} />}
                  title={q}
                  chevron
                  onPress={() => send(q, true)}
                />
              ))}
            </>
          ) : null}
          {turns.map((t, i) => (
            <View key={i} style={{ gap: 10 }}>
              <View
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '86%',
                  backgroundColor: c.at,
                  borderRadius: 16,
                  borderBottomRightRadius: 4,
                  padding: 12,
                }}
              >
                <T v="body">{t.q}</T>
              </View>
              {t.loading ? (
                <Card>
                  <Skeleton w="60%" />
                  <Skeleton />
                  <Skeleton w="80%" />
                  <T v="caption" muted>
                    Đang tìm trong kho mẹo…
                  </T>
                </Card>
              ) : null}
              {t.error ? (
                <Card variant="danger">
                  <T v="body">Không trả lời được lúc này. Thử lại sau.</T>
                  <Button title="Thử lại" size="sm" onPress={() => send(t.q)} />
                </Card>
              ) : null}
              {t.a ? (
                <AnswerCard
                  a={t.a}
                  onFeedback={(ok) => {
                    track('ask_feedback', { helpful: ok });
                    toast('Cảm ơn góp ý!');
                  }}
                />
              ) : null}
            </View>
          ))}
        </ScrollView>
        <View style={{ gap: 6, paddingVertical: 8 }}>
          <T v="caption" muted center>
            {left > 0 ? `Còn ${left}/${limit} câu hỏi hôm nay` : 'Hết lượt hôm nay · làm mới lúc 00:00'}
          </T>
          {left <= 0 && !s.noAds ? (
            <Button
              title="Bỏ quảng cáo để có thêm lượt"
              variant="text"
              size="sm"
              onPress={() => router.push('/paywall')}
              style={{ alignSelf: 'center' }}
            />
          ) : null}
          <Row>
            <View style={{ flex: 1 }}>
              <TextField
                value={input}
                onChangeText={setInput}
                placeholder={turns.length ? 'Hỏi tiếp…' : 'Gõ câu hỏi về nhà cửa, bếp, cây…'}
                maxLength={200}
                returnKeyType="send"
                onSubmitEditing={() => send(input)}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gửi"
              onPress={() => send(input)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: c.a,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="send" color={c.onAccent} />
            </Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function AnswerCard({ a, onFeedback }: { a: AskAnswer; onFeedback: (ok: boolean) => void }) {
  const { c } = useTheme();
  if (a.kind === 'danger') {
    return (
      <Card variant="danger">
        <Row>
          <Icon name="alert-circle" color={c.negative} />
          <T v="headline" color={c.negative}>
            Không nên làm
          </T>
        </Row>
        <T v="body">{a.text}</T>
        {a.sources.map((s) => (
          <Chip key={s.id} label={s.title} icon="book" onPress={() => router.push(`/tip/${s.id}`)} />
        ))}
      </Card>
    );
  }
  if (a.kind === 'no_tip' || a.kind === 'out_of_scope') {
    return (
      <Card>
        <Row>
          <Icon name="zap" color={c.a} size={16} />
          <T v="micro" accent>
            {a.kind === 'no_tip' ? 'Chưa có mẹo cho câu này' : 'Ngoài phạm vi'}
          </T>
        </Row>
        <T v="body">
          {a.kind === 'no_tip'
            ? 'Mẹo Nhà chưa có mẹo đã kiểm chứng về việc này nên không đoán.'
            : 'Câu này ngoài phạm vi mẹo nhà cửa. Hãy hỏi người có chuyên môn.'}
        </T>
        {a.kind === 'no_tip' ? (
          <Button title="Gửi cho đội Mẹo Nhà" icon="flag" size="sm" onPress={() => router.push('/submit')} />
        ) : null}
      </Card>
    );
  }
  return (
    <Card>
      <Row between>
        <Row>
          <Icon name="zap" color={c.a} size={16} />
          <T v="micro" accent>
            Mẹo Nhà trả lời
          </T>
        </Row>
        {!a.viaAi ? <Badge label="Từ mẹo gốc" /> : null}
      </Row>
      {a.safety.length ? (
        <Card variant="danger">
          {a.safety.map((r, i) => (
            <T key={i} v="caption">
              {r}
            </T>
          ))}
        </Card>
      ) : null}
      <T v="body">{a.text}</T>
      {a.steps.map((s, i) => (
        <Row key={i} style={{ alignItems: 'flex-start' }}>
          <Badge label={String(i + 1)} tone="accent" />
          <T v="body" style={{ flex: 1 }}>
            {s}
          </T>
        </Row>
      ))}
      <Row wrap>
        {a.sources.map((s) => (
          <Chip key={s.id} label={s.title} icon="book" onPress={() => router.push(`/tip/${s.id}`)} />
        ))}
      </Row>
      <Row between>
        <T v="caption" muted>
          Có hữu ích không?
        </T>
        <Row>
          <IconButton icon="thumbs-up" label="Hữu ích" onPress={() => onFeedback(true)} />
          <IconButton icon="thumbs-down" label="Không hữu ích" onPress={() => onFeedback(false)} />
        </Row>
      </Row>
    </Card>
  );
}
