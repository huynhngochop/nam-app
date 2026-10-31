import React, { useCallback, useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Banner,
  Button,
  Card,
  Chip,
  Dialog,
  Icon,
  IconButton,
  ListItem,
  Radio,
  Ring,
  Row,
  Screen,
  Segmented,
  Sheet,
  T,
  useLayout,
  useTheme,
  useToast,
} from '@nam/ui';
import { dateKey, mmss, track, weekdayLong } from '@nam/core';
import { focusedSecOf, useNhip } from '../../src/store';
import { notifyStatus, requestNotify, schedulePhaseEnd } from '../../src/notify';
import { useNow } from '../../src/clock';
import { classifySession } from '../../src/recovery';

/** Đã kiểm tra "phiên dở" kể từ khi app khởi động chưa (biến cấp module: mất khi app bị tắt hẳn). */
let launchChecked = false;

/** NH-03 Hẹn giờ · NH-17 Khôi phục phiên · NH-18 Thông báo bị tắt. */
export default function Timer() {
  const { c } = useTheme();
  const toast = useToast();
  const L = useLayout();
  const s = useNhip();
  const [mode, setMode] = useState<'pomodoro' | 'countup'>('pomodoro');
  const [quick, setQuick] = useState(false);
  const [mixOpen, setMixOpen] = useState(false);
  const [notif, setNotif] = useState<'granted' | 'denied' | 'undetermined'>('granted');
  const [keepAwakeOnce, setKeepAwakeOnce] = useState(false);

  // N1/N2: chỉ hỏi "phiên dở" ở lần mở đầu tiên sau khi app khởi động (app đã bị tắt giữa phiên).
  const [firstOpen] = useState(() => {
    const first = !launchChecked;
    launchChecked = true;
    return first;
  });
  const now = useNow(!!s.session && s.session.status === 'running', 1000);
  const state = classifySession(s.session, now, firstOpen);
  const stale = state === 'stale' ? s.session : null;
  const active = state === 'active' ? s.session : null;
  useEffect(() => {
    if (state !== 'expired' || !s.session) return;
    const sess = s.session;
    // Phiên đã đủ giờ trong lúc người dùng không ở màn phiên (hoặc app bị tắt): tính là hoàn thành.
    if (sess.phase === 'focus') {
      s.endSession('completed');
      track('session_completed', { focusMin: Math.round(sess.plannedSec / 60), recovered: true });
      toast(`Đã xong phiên ${Math.round(sess.plannedSec / 60)} phút`, { tone: 'success' });
    } else s.set({ session: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  useFocusEffect(
    useCallback(() => {
      notifyStatus().then(setNotif);
    }, []),
  );

  const todayKey = dateKey(new Date());
  const doneToday = s.logs.filter((l) => l.status === 'completed' && dateKey(new Date(l.at)) === todayKey).length;
  const goalSessions = Math.max(1, Math.round(s.goalMin / s.settings.focusMin));
  const task = s.tasks.find((t) => t.id === s.currentTaskId);
  const mix = s.mixes.find((m) => m.id === s.mixId);

  const start = async () => {
    const sess = s.startPhase('focus', { mode, cycleIndex: s.session?.cycleIndex ?? 0 });
    if (keepAwakeOnce) s.setSettings({ keepAwake: true });
    if (mode === 'pomodoro') schedulePhaseEnd(sess.endAt, 'Hết phiên!', 'Nghỉ một chút nhé.');
    track('session_started', { mode, focusMin: s.settings.focusMin, hasTask: !!task });
    router.push('/session');
  };

  const size = Math.min(L.width - 64, L.height * 0.34, 300);
  return (
    <Screen scroll padded={false} edges={['top']}>
      {notif !== 'granted' ? (
        <Banner tone="negative" icon="bell-off" text="Thông báo đang tắt — sẽ không báo hết giờ khi bạn ở app khác" />
      ) : null}
      <View style={{ paddingHorizontal: L.gutter, gap: 14 }}>
        <Row between style={{ paddingTop: 8 }}>
          <View style={{ flex: 1 }}>
            <T v="caption" muted>{`${weekdayLong(new Date())} · ${doneToday}/${goalSessions} phiên hôm nay`}</T>
            <T v="title">Sẵn sàng tập trung?</T>
          </View>
          <IconButton icon="settings" label="Cài đặt hẹn giờ" onPress={() => router.push('/timer-settings')} />
        </Row>
        {notif !== 'granted' ? (
          <Card variant="tint">
            <T v="headline">Bật thông báo để không lỡ giờ nghỉ</T>
            <T v="caption">Hoặc giữ Nhịp mở — màn hình sẽ luôn sáng trong phiên.</T>
            <Row>
              <Button
                title="Bật ngay"
                size="sm"
                onPress={async () => {
                  if (notif === 'denied') Linking.openSettings();
                  else setNotif((await requestNotify()) ? 'granted' : 'denied');
                }}
              />
              <Button
                title={keepAwakeOnce ? 'Sẽ giữ sáng ✓' : 'Giữ sáng'}
                size="sm"
                variant="secondary"
                onPress={() => setKeepAwakeOnce(true)}
              />
            </Row>
          </Card>
        ) : null}
        <Card onPress={() => router.push({ pathname: '/tasks', params: { pick: '1' } })} accessibilityLabel="Chọn việc">
          <Row gap={10}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.a }} />
            <View style={{ flex: 1 }}>
              <T v="caption" muted>
                Việc đang làm
              </T>
              <T v="headline" numberOfLines={1}>
                {task?.title ?? 'Chọn việc (không bắt buộc)'}
              </T>
            </View>
            <Icon name="chevron-down" color={c.inkMuted} />
          </Row>
        </Card>
        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          <Ring
            size={size}
            progress={0}
            label={mode === 'countup' ? '00:00' : `${s.settings.focusMin}:00`}
            sub={mode === 'countup' ? 'Đếm lên' : `Pomodoro · ${s.settings.longEvery} phiên`}
          />
          {mode === 'pomodoro' ? (
            <Button
              title="Đổi thời lượng"
              variant="text"
              size="sm"
              onPress={() => setQuick(true)}
              style={{ alignSelf: 'center' }}
            />
          ) : null}
        </View>
        <Segmented
          value={mode}
          onChange={(m) => setMode(m)}
          options={[
            { key: 'pomodoro', label: 'Pomodoro' },
            { key: 'countup', label: 'Đếm lên' },
          ]}
        />
        <Row between>
          <T v="caption" muted>
            Âm thanh nền
          </T>
          <Chip label={mix?.name ?? 'Tắt'} icon="headphones" selected={!!mix} onPress={() => setMixOpen(true)} />
        </Row>
        {active ? (
          <Card variant="tint">
            <Row between>
              <View style={{ flex: 1 }}>
                <T v="headline">{active.phase === 'focus' ? 'Đang có phiên tập trung' : 'Đang nghỉ giải lao'}</T>
                <T v="caption" muted>
                  {active.mode === 'countup'
                    ? `Đã ${mmss(focusedSecOf(active, now))}`
                    : `Còn ${mmss(active.status === 'paused' ? (active.pausedRemainingSec ?? 0) : Math.max(0, Math.round((active.endAt - now) / 1000)))}${active.status === 'paused' ? ' · tạm dừng' : ''}`}
                </T>
              </View>
              <Button
                title="Quay lại phiên"
                size="sm"
                icon="play"
                full={false}
                onPress={() => router.push('/session')}
              />
            </Row>
          </Card>
        ) : (
          <Button title="Bắt đầu" icon="play" onPress={start} />
        )}
      </View>

      <Sheet visible={quick} onClose={() => setQuick(false)} title="Thời lượng tập trung">
        <Row wrap>
          {[15, 25, 45, 60].map((m) => (
            <Chip
              key={m}
              label={`${m} phút`}
              selected={s.settings.focusMin === m}
              onPress={() => {
                s.setSettings({ focusMin: m });
                setQuick(false);
              }}
            />
          ))}
        </Row>
      </Sheet>
      <Sheet visible={mixOpen} onClose={() => setMixOpen(false)} title="Âm thanh nền">
        {s.mixes.map((m) => (
          <ListItem
            key={m.id}
            title={m.name}
            strong={false}
            left={<Radio on={s.mixId === m.id} />}
            onPress={() => {
              s.set({ mixId: m.id });
              setMixOpen(false);
            }}
          />
        ))}
        <ListItem
          title="Tắt âm thanh"
          strong={false}
          left={<Radio on={!mix} />}
          onPress={() => {
            s.set({ mixId: '' });
            setMixOpen(false);
          }}
        />
        <Button
          title="Mở trộn âm thanh"
          variant="secondary"
          onPress={() => {
            setMixOpen(false);
            router.push('/(tabs)/sounds');
          }}
        />
      </Sheet>

      {stale ? (
        <Dialog
          visible
          dismissable={false}
          title="Tiếp tục phiên dở?"
          body={`Phiên “${s.tasks.find((t) => t.id === stale.taskId)?.title ?? 'Tập trung'}” bị gián đoạn lúc ${new Date(stale.lastHeartbeatAt).toTimeString().slice(0, 5)}. Đã tính ${Math.round(focusedSecOf(stale, stale.lastHeartbeatAt) / 60)} phút tập trung.`}
          confirm={
            stale.phase === 'focus' && stale.mode === 'pomodoro'
              ? `Tiếp tục · còn ${mmss(stale.plannedSec - focusedSecOf(stale, stale.lastHeartbeatAt))}`
              : 'Tiếp tục'
          }
          cancel={`Lưu ${Math.round(focusedSecOf(stale, stale.lastHeartbeatAt) / 60)} phút, kết thúc`}
          onConfirm={() => {
            const remaining = Math.max(1, stale.plannedSec - focusedSecOf(stale, stale.lastHeartbeatAt));
            const endAt = Date.now() + remaining * 1000;
            useNhip.setState({ session: { ...stale, endAt, status: 'running', lastHeartbeatAt: Date.now() } });
            schedulePhaseEnd(endAt, 'Hết phiên!', 'Nghỉ một chút nhé.');
            track('session_recovered', { choice: 'resume' });
            router.push('/session');
          }}
          onCancel={() => {
            s.endSession('stopped', focusedSecOf(stale, stale.lastHeartbeatAt));
            track('session_recovered', { choice: 'finish' });
          }}
        />
      ) : null}
    </Screen>
  );
}
