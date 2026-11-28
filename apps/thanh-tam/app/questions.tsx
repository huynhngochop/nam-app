import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Badge, Card, EmptyState, ListItem, Screen, T, Thumb } from '@nam/ui';
import { myQuestions, type SentQuestion } from '@nam/core';
import { goBack } from '../src/nav';
import { APP, flushQuestions } from '../src/lib/cloud';

const LABEL: Record<SentQuestion['status'], { text: string; tone: 'neutral' | 'accent' | 'positive' | 'warning' }> = {
  queued: { text: 'Chờ có mạng', tone: 'warning' },
  new: { text: 'Đã gửi', tone: 'neutral' },
  grouped: { text: 'Đang biên tập', tone: 'accent' },
  answered: { text: 'Đã có trả lời', tone: 'positive' },
  rejected: { text: 'Chưa trả lời được', tone: 'neutral' },
};

/** Câu hỏi đã gửi cho Thành Tâm. Câu đã có trả lời: bấm để hỏi lại, câu trả lời mới hiện ngay trên máy. */
export default function Questions() {
  const [list, setList] = useState<SentQuestion[] | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setBusy(true);
    setList(await flushQuestions(APP).catch(() => myQuestions(APP)));
    setBusy(false);
  }, []);
  useEffect(() => {
    myQuestions(APP).then(setList);
    refresh();
  }, [refresh]);

  return (
    <Screen edges={['top', 'bottom']}>
      <AppBar title="Câu hỏi đã gửi" onBack={goBack} />
      <ScrollView
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh} />}
      >
        <T v="caption" muted>
          Câu hỏi được gom lại và biên tập theo nếp dân gian phổ biến trước khi đưa vào app. Câu trả lời mới về máy
          trong vài ngày.
        </T>
        {list && !list.length ? (
          <EmptyState icon="inbox" title="Chưa gửi câu hỏi nào" body="Khi Thành Tâm chưa trả lời được, bấm “Gửi câu hỏi này”." />
        ) : null}
        {list?.length ? (
          <Card style={{ paddingVertical: 4 }}>
            {list.map((q, i) => {
              const l = LABEL[q.status];
              const ready = q.status === 'answered' && !!q.itemId;
              return (
                <ListItem
                  key={q.id ?? `q${i}`}
                  strong={false}
                  left={<Thumb icon={ready ? 'check-circle' : 'help-circle'} size={32} />}
                  title={q.text}
                  subtitle={ready && q.title ? q.title : q.status === 'rejected' && q.reason ? q.reason : undefined}
                  right={<Badge label={l.text} tone={l.tone} />}
                  onPress={ready ? () => router.push({ pathname: '/ask', params: { q: q.text } }) : undefined}
                  divider={i < list.length - 1}
                />
              );
            })}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
