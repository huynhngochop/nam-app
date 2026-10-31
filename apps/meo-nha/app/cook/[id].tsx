import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Button, Card, Dialog, IconButton, Row, Screen, StepBar, T, useLayout, useToast } from '@nam/ui';
import { mmss, track } from '@nam/core';
import { RECIPES } from '../../src/data/recipes';

/** MN-12 · Chế độ nấu: màn luôn sáng, chữ to, hẹn giờ từng bước (đếm theo thời điểm kết thúc, đúng cả khi app chạy nền). */
export default function Cook() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const L = useLayout();
  const toast = useToast();
  const r = RECIPES.find((x) => x.id === id)!;
  const [i, setI] = useState(0);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [quit, setQuit] = useState(false);
  const notifId = useRef<string | null>(null);
  const step = r.steps[i];
  const left = endAt ? Math.max(0, Math.round((endAt - now) / 1000)) : (step.timerSec ?? 0);

  useEffect(() => {
    if (!endAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [endAt]);
  useEffect(() => {
    if (endAt && now >= endAt) {
      setEndAt(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast('Hết giờ cho bước này', { tone: 'success' });
    }
  }, [now, endAt, toast]);
  useEffect(
    () => () => {
      if (notifId.current) Notifications.cancelScheduledNotificationAsync(notifId.current);
    },
    [],
  );

  const startTimer = async () => {
    const sec = step.timerSec ?? 0;
    const end = Date.now() + sec * 1000;
    setEndAt(end);
    setNow(Date.now());
    track('cook_timer_started', { sec });
    try {
      notifId.current = await Notifications.scheduleNotificationAsync({
        content: { title: 'Hết giờ', body: `${r.title} · bước ${i + 1}` },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, sec),
          channelId: Platform.OS === 'android' ? 'daily' : undefined,
        },
      });
    } catch {
      /* không có quyền thông báo: vẫn đếm trong app */
    }
  };
  const stopTimer = () => {
    setEndAt(null);
    if (notifId.current) Notifications.cancelScheduledNotificationAsync(notifId.current);
  };
  const go = (d: number) => {
    stopTimer();
    setI((x) => Math.min(r.steps.length - 1, Math.max(0, x + d)));
  };
  const finish = () => {
    stopTimer();
    track('cook_completed', { recipeId: r.id });
    toast('Ngon miệng nhé!', { tone: 'success' });
    router.back();
  };
  const big = L.isCompact ? 24 : 32;

  return (
    <Screen
      footer={
        <Row>
          <Button title="Trước" icon="chevron-left" variant="secondary" disabled={i === 0} onPress={() => go(-1)} />
          {i < r.steps.length - 1 ? (
            <Button title="Tiếp" onPress={() => go(1)} />
          ) : (
            <Button title="Hoàn thành" icon="check" onPress={finish} />
          )}
        </Row>
      }
    >
      <Row between style={{ paddingTop: 8 }}>
        <IconButton icon="x" label="Dừng nấu" onPress={() => setQuit(true)} />
        <T v="headline">{`Bước ${i + 1} / ${r.steps.length}`}</T>
        <View style={{ width: 40 }} />
      </Row>
      <StepBar count={r.steps.length} index={i} />
      <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
        {step.title ? (
          <T v="micro" accent>
            {step.title}
          </T>
        ) : null}
        <T v="title" style={{ fontSize: big, lineHeight: big * 1.4 }} accessibilityLiveRegion="polite">
          {step.text}
        </T>
        {step.timerSec ? (
          <Card variant="tint" style={{ alignItems: 'center' }}>
            <T v="numeral" accent>
              {mmss(left)}
            </T>
            <T v="caption">Hẹn giờ cho bước này</T>
            {endAt ? (
              <Button
                title="Tạm dừng"
                icon="pause"
                size="sm"
                variant="secondary"
                full={false}
                onPress={stopTimer}
                style={{ alignSelf: 'center' }}
              />
            ) : (
              <Button
                title="Bắt đầu"
                icon="play"
                size="sm"
                full={false}
                onPress={startTimer}
                style={{ alignSelf: 'center' }}
              />
            )}
          </Card>
        ) : null}
        <T v="caption" muted center>
          Màn hình luôn sáng khi đang nấu
        </T>
      </View>
      <Dialog
        visible={quit}
        title="Dừng nấu?"
        body="Bạn có thể quay lại công thức bất kỳ lúc nào."
        confirm="Dừng"
        cancel="Nấu tiếp"
        onConfirm={() => {
          stopTimer();
          router.back();
        }}
        onCancel={() => setQuit(false)}
      />
    </Screen>
  );
}
