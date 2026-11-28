import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { dateKey } from '@nam/core';
import {
  AdBanner,
  Badge,
  Card,
  EmptyState,
  Icon,
  ListItem,
  ProgressBar,
  Row,
  Screen,
  T,
  Thumb,
  useTheme,
} from '@nam/ui';
import { dailyLesson, phaseOf, weekIndexOf, type LessonItem } from '../../src/plan';
import { dueCount, toRepair } from '../../src/loop';
import { streakDays, useEmma } from '../../src/store';
import { pickTopic } from '../../src/topics';

const ICON: Record<LessonItem['kind'], React.ComponentProps<typeof Icon>['name']> = {
  warmup: 'activity',
  repair: 'rotate-ccw',
  grammar: 'book-open',
  speak: 'mic',
  shadow: 'repeat',
  mock: 'clock',
};

/** 3 · Hôm nay: giáo án sinh từ lộ trình + lỗi mới + lỗi đến hạn gài lại. */
export default function Today() {
  const { c } = useTheme();
  const plan = useEmma((s) => s.plan);
  const goal = useEmma((s) => s.goal);
  const bands = useEmma((s) => s.bands);
  const errors = useEmma((s) => s.errors);
  const done = useEmma((s) => s.done);
  const practiced = useEmma((s) => s.practiced);
  const isPro = useEmma((s) => s.isPro);
  const name = useEmma((s) => s.name);
  const today = dateKey(new Date());

  const repairs = useMemo(() => toRepair(errors), [errors]);
  const due = useMemo(() => dueCount(errors), [errors]);
  const items = useMemo(
    () =>
      plan && goal
        ? dailyLesson(plan, {
            todayKey: today,
            minutes: goal.minutesPerDay,
            current: bands,
            newErrors: repairs.length,
            dueRecalls: due,
          })
        : [],
    [plan, goal, today, bands, repairs.length, due],
  );
  if (!plan || !goal)
    return (
      <Screen>
        <EmptyState
          icon="map"
          title="Chưa có lộ trình"
          body="Đặt mục tiêu để có giáo án mỗi ngày."
          action="Đặt mục tiêu"
          onAction={() => router.push('/goals')}
        />
      </Screen>
    );

  const doneToday = done[today] ?? [];
  const wi = weekIndexOf(plan, today);
  const phase = phaseOf(plan, wi);
  const streak = streakDays(done);
  const finished = items.filter((i) => doneToday.includes(i.id)).length;

  const open = (it: LessonItem) => {
    if (it.kind === 'repair') return router.push('/repair');
    if (it.kind === 'mock')
      return router.push({ pathname: '/session', params: { kind: 'mock', mode: 'exam', lesson: it.id } });
    if (it.kind === 'speak' && it.part === 2)
      return router.push({ pathname: '/part2', params: { topic: pickTopic(2, practiced).id, lesson: it.id } });
    if (it.kind === 'speak')
      return router.push({
        pathname: '/session',
        params: { kind: `part${it.part ?? 1}`, topic: pickTopic(it.part ?? 1, practiced).id, lesson: it.id },
      });
    return router.push({
      pathname: '/drill',
      params: { kind: it.kind, title: it.title, minutes: String(it.minutes), lesson: it.id },
    });
  };

  return (
    <Screen scroll>
      <Row between style={{ marginTop: 8 }}>
        <T v="caption" muted style={{ flex: 1 }}>
          Tuần {wi + 1}/{plan.weeks} · Giai đoạn {phase.name}
        </T>
        <Badge label={`${streak} ngày liên tiếp`} tone={streak > 0 ? 'pro' : 'neutral'} />
      </Row>
      <T v="display">{name ? `Chào ${name}` : 'Hôm nay'}</T>

      <Card variant="accent">
        <Row between>
          <T v="caption">Giáo án hôm nay · {goal.minutesPerDay} phút</T>
          <T v="headline">
            {finished}/{items.length} xong
          </T>
        </Row>
        <ProgressBar value={items.length ? finished / items.length : 0} color={c.a2} track="rgba(255,255,255,0.25)" />
        <T v="caption">Trọng tâm: {phase.focus}.</T>
      </Card>

      {items.map((it) => {
        const isDone = doneToday.includes(it.id);
        return (
          <ListItem
            key={it.id}
            left={
              <Thumb
                icon={isDone ? 'check' : ICON[it.kind]}
                color={isDone ? c.positive : c.a}
                bg={isDone ? c.surface2 : c.at}
              />
            }
            title={it.title}
            subtitle={it.sub}
            titleColor={isDone ? c.inkMuted : undefined}
            onPress={() => open(it)}
            chevron
          />
        );
      })}

      {due > 0 ? (
        <Card variant="tint">
          <Row gap={8}>
            <Icon name="target" color={c.a} />
            <T v="body" style={{ flex: 1 }}>
              {due} lỗi đến hạn sẽ được giám khảo gài lại trong buổi nói hôm nay. Bạn sẽ không được báo trước.
            </T>
          </Row>
        </Card>
      ) : null}
      <AdBanner hidden={isPro} />
    </Screen>
  );
}
