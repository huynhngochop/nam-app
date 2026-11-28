import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Badge, Card, EmptyState, ListItem, Screen, T, Thumb } from '@nam/ui';
import { myQuestions, type SentQuestion } from '@nam/core';
import { APP, flushQuestions } from '../src/lib/cloud';
import { tipById } from '../src/data/tips';

const LABEL: Record<SentQuestion['status'], { text: string; tone: 'neutral' | 'accent' | 'positive' | 'warning' }> = {
  queued: { text: 'Chờ có mạng để gửi', tone: 'warning' },
  new: { text: 'Đã gửi', tone: 'neutral' },
  grouped: { text: 'Đang soạn trả lời', tone: 'accent' },
  answered: { text: 'Đã có mẹo', tone: 'positive' },
  rejected: { text: 'Chưa trả lời được', tone: 'neutral' },
};

/** Câu hỏi đã gửi cho Mẹo Nhà và trạng thái. Câu đã có trả lời mở thẳng mẹo mới (khi gói nội dung đã về máy). */
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
      <AppBar title="Câu hỏi đã gửi" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh} />}
      >
        <T v="caption" muted>
          Câu hỏi Mẹo Nhà chưa có mẹo được gom lại và biên tập thành mẹo mới. Mẹo mới về máy trong khoảng một ngày.
        </T>
        {list && !list.length ? (
          <EmptyState icon="inbox" title="Chưa gửi câu hỏi nào" body="Khi Mẹo Nhà chưa có mẹo cho câu bạn hỏi, bấm “Gửi câu hỏi này”." />
        ) : null}
        {list?.length ? (
          <Card style={{ paddingVertical: 4 }}>
            {list.map((q, i) => {
              const tip = q.itemId ? tipById(`c-${q.itemId}`) : undefined;
              const l = LABEL[q.status];
              return (
                <ListItem
                  key={q.id ?? `q${i}`}
                  strong={false}
                  left={<Thumb icon={q.status === 'answered' ? 'check-circle' : 'help-circle'} size={32} />}
                  title={q.text}
                  subtitle={tip ? `Mẹo: ${tip.title}` : q.status === 'rejected' && q.reason ? q.reason : undefined}
                  right={<Badge label={tip ? 'Xem mẹo' : l.text} tone={tip ? 'positive' : l.tone} />}
                  onPress={tip ? () => router.push(`/tip/${tip.id}`) : undefined}
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
