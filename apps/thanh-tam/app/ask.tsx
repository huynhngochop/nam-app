import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { AppBar, Button, Card, Icon, Row, Screen, T, TextField, useTheme, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { goBack } from '../src/nav';
import { useTT } from '../src/store';
import { useToday } from '../src/hooks';
import { ask, type Answer } from '../src/lib/ask';
import { FAQ, FAQ_SUGGEST } from '../src/data/faq';
import { NavRow, Sources } from '../src/components';
import { askTeam, hasCloud } from '../src/lib/cloud';

type Turn = { q: string; a: Answer };

/**
 * Hỏi Thành Tâm. Trả lời ngay trên máy từ nội dung của app (lễ, văn khấn, kinh, mẹo, sổ giỗ của bạn).
 * Câu chưa có trả lời thì nói rõ, gợi ý mục liên quan, không đoán; người dùng có thể tự bấm gửi câu đó để
 * Thành Tâm biên tập câu trả lời (chỉ gửi đúng câu chữ, không kèm sổ giỗ).
 */
export default function Ask() {
  const { c } = useTheme();
  const today = useToday();
  const anniversaries = useTT((s) => s.anniversaries);
  const [q, setQ] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const scroll = useRef<ScrollView>(null);
  const toast = useToast();
  const cloud = hasCloud();

  const sendToTeam = async (text: string) => {
    setSent((s) => [...s, text]);
    await askTeam(text).catch(() => {});
    track('question_sent', { app: 'thanhtam' });
    toast('Đã gửi. Khi có câu trả lời, Thành Tâm sẽ trả lời được câu này', { tone: 'success' });
  };

  const params = useLocalSearchParams<{ q?: string }>();
  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const a = ask(t, { today, anniversaries });
    track('ask', { kind: a.kind, faq: a.faq?.id ?? null });
    setTurns((s) => [...s, { q: t, a }].slice(-20));
    setQ('');
    setTimeout(() => scroll.current?.scrollToEnd?.({ animated: true }), 50);
  };

  // Mở từ "Câu hỏi đã gửi" (?q=): hỏi lại câu đó một lần khi mở màn.
  useEffect(() => {
    if (params.q) send(String(params.q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen
      scroll
      scrollProps={{ ref: scroll, keyboardShouldPersistTaps: 'handled' } as never}
      footer={
        <Row gap={8} style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Câu hỏi"
              value={q}
              onChangeText={setQ}
              placeholder="Ví dụ: giỗ tháng nhuận cúng ngày nào?"
              returnKeyType="send"
              onSubmitEditing={() => send(q)}
            />
          </View>
          <Button title="Hỏi" icon="send" full={false} disabled={!q.trim()} onPress={() => send(q)} />
        </Row>
      }
    >
      <AppBar title="Hỏi Thành Tâm" onBack={goBack} />
      <T v="body" muted>
        Hỏi về cúng lễ, ngày giỗ, tụng kinh. Thành Tâm trả lời từ nội dung trong app và sổ giỗ của bạn, ngay trên máy.
        {cloud ? ' Câu chưa có trả lời, bạn có thể bấm gửi để Thành Tâm biên tập thêm.' : ' Câu hỏi không gửi đi đâu.'}
      </T>
      {!turns.length ? (
        <>
          <T v="caption" muted>
            Câu hay hỏi
          </T>
          <Card style={{ paddingVertical: 4 }}>
            {FAQ_SUGGEST.map((id) => {
              const f = FAQ.find((x) => x.id === id)!;
              return <NavRow key={id} icon="message-circle" title={f.q} onPress={() => send(f.q)} />;
            })}
          </Card>
        </>
      ) : null}
      {turns.map((t, i) => (
        <View key={i} style={{ gap: 8 }}>
          <View
            style={{
              alignSelf: 'flex-end',
              maxWidth: '85%',
              backgroundColor: c.at,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <T v="body">{t.q}</T>
          </View>
          <Card variant={t.a.kind === 'chua-co' ? 'default' : 'tint'}>
            <Row gap={8}>
              <Icon name={t.a.kind === 'chua-co' ? 'help-circle' : 'message-circle'} color={c.a} />
              <T v="headline" style={{ flex: 1 }}>
                {t.a.title}
              </T>
            </Row>
            {t.a.text.map((p, j) => (
              <T key={j} v="body">
                {p}
              </T>
            ))}
            {t.a.links.length ? (
              <View>
                {t.a.links.map((l) => (
                  <NavRow key={l.href} icon="arrow-right" title={l.title} onPress={() => router.push(l.href as Href)} />
                ))}
              </View>
            ) : null}
            {t.a.faq?.sources?.length ? <Sources sources={t.a.faq.sources} /> : null}
            {t.a.faq?.id.startsWith('c-') ? (
              <T v="caption" muted>
                Biên tập từ câu hỏi của người dùng, theo nếp dân gian phổ biến.
              </T>
            ) : null}
            {t.a.kind === 'chua-co' && cloud ? (
              sent.includes(t.q) ? (
                <Button
                  title="Xem câu hỏi đã gửi"
                  icon="inbox"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push('/questions' as Href)}
                />
              ) : (
                <Button title="Gửi câu hỏi này cho Thành Tâm" icon="send" size="sm" onPress={() => sendToTeam(t.q)} />
              )
            ) : null}
          </Card>
          {t.a.related.length ? (
            <>
              <T v="caption" muted>
                Mục liên quan
              </T>
              <Card style={{ paddingVertical: 4 }}>
                {t.a.related.map((l) => (
                  <NavRow key={l.href} icon="chevron-right" title={l.title} subtitle={l.sub} href={l.href} />
                ))}
              </Card>
            </>
          ) : null}
        </View>
      ))}
      <T v="caption" muted>
        Câu trả lời theo nếp dân gian phổ biến và hướng dẫn của Giáo hội. Mỗi miền, mỗi nhà một nếp; nhà có lệ riêng thì
        theo lệ nhà mình.
      </T>
    </Screen>
  );
}
