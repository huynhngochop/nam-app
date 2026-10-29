import React, { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Button, Card, Chip, Dialog, Icon, IconButton, night, Ring, Row, T, useLayout, useToast } from '@nam/ui';
import { mmss, track } from '@nam/core';
import { BREAK_TIPS, SOUNDS } from '../src/data';
import { focusedSecOf, useNhip } from '../src/store';
import { useNow } from '../src/clock';
import { syncMix } from '../src/audio';
import { cancelPhaseEnd, schedulePhaseEnd } from '../src/notify';

const GREEN = '#5cc48e';

/** NH-04 Phiên đang chạy · NH-05 Nghỉ giải lao. Luôn nền tối, không quảng cáo. */
export default function SessionScreen() {
  const L = useLayout();
  const toast = useToast();
  const s = useNhip();
  const sess = s.session;
  const running = sess?.status === 'running';
  const now = useNow(!!sess && running);
  const [stopAsk, setStopAsk] = useState(false);
  const bgAt = useRef<number | null>(null);
  const ended = useRef(false);
  const tipIdx = useRef(Math.floor(Math.random() * BREAK_TIPS.length));

  const isFocus = sess?.phase === 'focus';
  const remaining = sess ? (sess.mode === 'countup' ? focusedSecOf(sess, now) : sess.status === 'paused' ? sess.pausedRemainingSec ?? 0 : Math.max(0, Math.round((sess.endAt - now) / 1000))) : 0;
  const progress = sess && sess.mode === 'pomodoro' && sess.plannedSec ? 1 - remaining / sess.plannedSec : 0;
  const mix = s.mixes.find((m) => m.id === s.mixId);

  // Âm thanh nền chỉ phát trong phiên tập trung.
  useEffect(() => { syncMix(mix?.layers ?? [], !!(running && isFocus)).catch(() => {}); }, [mix, running, isFocus]);
  useEffect(() => () => { syncMix([], false).catch(() => {}); }, []);
  // Giữ sáng màn hình nếu người dùng bật.
  useEffect(() => {
    if (!s.settings.keepAwake) return;
    activateKeepAwakeAsync('nhip-session');
    return () => { deactivateKeepAwake('nhip-session'); };
  }, [s.settings.keepAwake]);
  // Nhịp ghi mỗi 30 giây để khôi phục khi app bị tắt (NH-17).
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => useNhip.getState().heartbeat(), 30_000);
    return () => clearInterval(t);
  }, [running]);
  // Chế độ nghiêm: rời app > 10 giây trong phiên tập trung = bỏ phiên.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') { bgAt.current = Date.now(); return; }
      const away = bgAt.current ? Date.now() - bgAt.current : 0;
      bgAt.current = null;
      const cur = useNhip.getState();
      if (cur.settings.strict && cur.session?.phase === 'focus' && cur.session.status === 'running' && away > 10_000) {
        cur.endSession('violated', focusedSecOf(cur.session));
        cancelPhaseEnd();
        track('strict_violation');
        toast('Phiên bị tính là bỏ vì đã rời app', { tone: 'error' });
        router.replace('/(tabs)/timer');
      }
    });
    return () => sub.remove();
  }, [toast]);
  // Hết giờ.
  useEffect(() => {
    if (!sess || sess.mode !== 'pomodoro' || !running || remaining > 0 || ended.current) return;
    ended.current = true;
    if (s.settings.vibrate) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isFocus) {
      s.endSession('completed');
      track('session_completed', { focusMin: Math.round(sess.plannedSec / 60) });
      router.replace({ pathname: '/done', params: { cycle: String(sess.cycleIndex + 1) } });
    } else if (s.settings.autoNext) {
      startFocus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  if (!sess) return <Redirect href="/(tabs)/timer" />;

  function startFocus() {
    ended.current = false;
    const n = useNhip.getState().startPhase('focus', { cycleIndex: sess!.cycleIndex });
    schedulePhaseEnd(n.endAt, 'Hết phiên!', 'Nghỉ một chút nhé.');
  }
  const togglePause = () => {
    if (running) { s.pause(); cancelPhaseEnd(); track('session_paused'); }
    else { s.resume(); const cur = useNhip.getState().session!; if (cur.mode === 'pomodoro') schedulePhaseEnd(cur.endAt, isFocus ? 'Hết phiên!' : 'Hết giờ nghỉ', isFocus ? 'Nghỉ một chút nhé.' : 'Vào phiên tiếp nào.'); }
  };
  const stop = () => {
    const sec = focusedSecOf(sess);
    if (isFocus) s.endSession(sess.mode === 'countup' ? 'completed' : 'stopped', sec);
    else s.set({ session: null });
    cancelPhaseEnd();
    track('session_stopped', { elapsedSec: sec });
    router.replace('/(tabs)/timer');
  };

  const task = s.tasks.find((t) => t.id === sess.taskId);
  const ringSize = Math.min(L.width - 64, L.height * (L.landscape ? 0.62 : 0.42), 340);
  const breakDone = !isFocus && remaining <= 0;
  const tips = [0, 1, 2].map((k) => BREAK_TIPS[(tipIdx.current + k) % BREAK_TIPS.length]);
  const content = isFocus ? (
    <View style={{ gap: 12, width: '100%', maxWidth: 420 }}>
      <T v="caption" color={night.inkMuted} center>Âm thanh nền</T>
      <Row wrap style={{ justifyContent: 'center' }}>
        {SOUNDS.filter((x) => x.file).map((x) => {
          const on = !!mix?.layers.find((l) => l.id === x.id);
          return <Chip key={x.id} label={x.name} icon={x.icon} selected={on} onPress={() => s.setLayer(x.id, on ? null : 0.6)} />;
        })}
      </Row>
      {s.settings.strict ? <T v="caption" color={night.inkMuted} center>Chế độ nghiêm: thoát app sẽ bị tính là bỏ phiên</T> : null}
    </View>
  ) : (
    <View style={{ gap: 12, width: '100%', maxWidth: 420 }}>
      <T v="title" color={night.ink} center>Đứng dậy, rời màn hình</T>
      <Card style={{ backgroundColor: night.soft, borderColor: 'transparent' }}>
        {tips.map((t) => <Row key={t.text} style={{ paddingVertical: 6 }}><Icon name={t.icon} color={GREEN} size={18} /><T v="body" color={night.ink}>{t.text}</T></Row>)}
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: night.bg }}>
      <View style={{ flex: 1, paddingHorizontal: L.gutter, paddingBottom: 12, width: '100%', maxWidth: 960, alignSelf: 'center' }}>
        <Row between style={{ minHeight: 56 }}>
          <View style={{ flex: 1 }}>
            <T v="caption" color={night.inkMuted}>{isFocus ? 'Đang làm' : sess.phase === 'long' ? 'Nghỉ dài' : 'Nghỉ ngắn'}</T>
            <T v="headline" color={night.ink} numberOfLines={1}>{isFocus ? task?.title ?? 'Tập trung' : 'Thư giãn một chút'}</T>
          </View>
          {!isFocus ? <IconButton icon="skip-forward" label="Bỏ nghỉ" bg={night.soft} color={night.ink} onPress={startFocus} /> : s.settings.strict ? <IconButton icon="lock" label="Chế độ nghiêm" bg={night.soft} color={night.ink} onPress={() => toast('Chế độ nghiêm đang bật')} /> : null}
        </Row>
        <View style={{ flex: 1, flexDirection: L.landscape && !L.isCompact ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <Ring size={ringSize} stroke={12} progress={sess.mode === 'countup' ? 1 : progress} color={isFocus ? '#f07a68' : GREEN} track="rgba(255,255,255,0.1)"
            label={mmss(remaining)} labelColor={night.ink} subColor={night.inkMuted}
            sub={isFocus ? (sess.mode === 'countup' ? 'Đếm lên' : `Phiên ${sess.cycleIndex + 1} / ${s.settings.longEvery} · Tập trung`) : `Nghỉ · rồi vào phiên ${sess.cycleIndex + 1}`} />
          {content}
        </View>
        <View style={{ gap: 10, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          {breakDone || !isFocus ? (
            <Button title="Vào phiên tiếp ngay" color={GREEN} textColor="#14110f" onPress={startFocus} />
          ) : (
            <Row>
              <Button title="Dừng" icon="x" variant="secondary" color={night.soft} textColor={night.ink} style={{ backgroundColor: night.soft }} onPress={() => setStopAsk(true)} />
              {!(s.settings.strict && isFocus) ? <Button title={running ? 'Tạm dừng' : 'Tiếp tục'} icon={running ? 'pause' : 'play'} color="#f07a68" textColor="#14110f" onPress={togglePause} /> : null}
            </Row>
          )}
          {!isFocus ? <Button title="Về trang chính" variant="text" textColor={night.inkMuted} onPress={() => { s.set({ session: null }); cancelPhaseEnd(); router.replace('/(tabs)/timer'); }} /> : null}
        </View>
      </View>
      <Dialog visible={stopAsk} title="Dừng phiên?" body="Thời gian đã tập trung vẫn được lưu." confirm="Dừng" cancel="Tập trung tiếp" onConfirm={stop} onCancel={() => setStopAsk(false)} />
    </SafeAreaView>
  );
}

