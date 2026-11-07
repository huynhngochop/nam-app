import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import { Icon, IconName, T, ttNight, useLayout } from '@nam/ui';
import { track } from '@nam/core';
import { BPM_MAX, BPM_MIN, chantLines, chantPlan, kinhById } from '../../../src/data/kinh';
import type { ChantLine } from '../../../src/data/kinh';
import { ChantPos, gotoLine, gotoStep, nextLine, startPos, tick } from '../../../src/lib/chant';
import { bell, closeChantAudio, knock, openChantAudio, openRecording, setMoVolume } from '../../../src/chantAudio';
import { useTT } from '../../../src/store';

const FONTS = [22, 24, 26, 28, 30];

function Ctl({
  icon,
  label,
  onPress,
  on,
  big,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  on?: boolean;
  big?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!on, disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => ({
        minWidth: big ? 88 : 60,
        minHeight: big ? 64 : 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingHorizontal: 8,
        backgroundColor: big ? ttNight.gold : on ? ttNight.now : ttNight.soft,
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={big ? 26 : 20} color={big ? ttNight.bg : on ? ttNight.gold : ttNight.ink} />
      <T
        v="caption"
        color={big ? ttNight.bg : on ? ttNight.gold : ttNight.inkMuted}
        style={{ fontSize: 11 }}
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </T>
    </Pressable>
  );
}

const TOKEN = /[^\s\-–]+[\s\-–]*/g;

/** Một dòng kinh. Dòng đang tụng tô sáng, chữ đã gõ mõ đổi màu vàng. */
const Line = memo(function Line({
  text,
  active,
  beat,
  font,
  mantra,
  onPress,
}: {
  text: string;
  active: boolean;
  beat: number;
  font: number;
  mantra: boolean;
  onPress: () => void;
}) {
  const lh = Math.round(font * 1.55);
  let n = 0;
  const parts = active
    ? (text.match(TOKEN) ?? [text]).map((tok, i) => {
        const word = /\p{L}/u.test(tok);
        const done = word && n++ < beat;
        return (
          <T key={i} v="body" color={done ? ttNight.gold : ttNight.ink} style={{ fontSize: font, lineHeight: lh }}>
            {tok}
          </T>
        );
      })
    : text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Tụng từ câu này"
      style={{
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: active ? ttNight.now : 'transparent',
      }}
    >
      <T
        v="body"
        color={active ? ttNight.ink : ttNight.inkMuted}
        weight={active ? 'semibold' : undefined}
        style={{ fontSize: font, lineHeight: lh, fontStyle: mantra ? 'italic' : 'normal' }}
        maxFontSizeMultiplier={1.4}
      >
        {parts}
      </T>
    </Pressable>
  );
});

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** TT-32 · Màn tụng: nền tối, giữ màn sáng, mõ giữ nhịp từng chữ, chuông chuyển bài, giọng máy đọc cùng. */
export default function ChantPlay() {
  const insets = useSafeAreaInsets();
  const first = initialWindowMetrics?.insets;
  const safe = {
    top: Math.max(insets.top, first?.top ?? 0),
    bottom: Math.max(insets.bottom, first?.bottom ?? 0),
    left: insets.left,
    right: insets.right,
  };
  const L = useLayout();
  const { id, ritual, src } = useLocalSearchParams<{ id: string; ritual?: string; src?: string }>();
  const chant = useTT((s) => s.chant);
  const setChant = useTT((s) => s.setChant);
  const prayFont = useTT((s) => s.prayFont);
  const set = useTT((s) => s.set);
  const logPray = useTT((s) => s.logPray);
  const rec = useTT((s) => (src === 'rec' ? s.recordings[id] : undefined));

  const plan = useMemo(() => chantPlan(id, chant.full), [id, chant.full]);
  const lines = useMemo<ChantLine[]>(() => (plan ? chantLines(plan.steps) : []), [plan]);

  const posRef = useRef<ChantPos>(startPos());
  const [pos, setPosState] = useState<ChantPos>(posRef.current);
  const setPos = useCallback((p: ChantPos) => {
    posRef.current = p;
    setPosState(p);
  }, []);
  const [playing, setPlaying] = useState(false);
  const [jump, setJump] = useState(0);
  const [noVoice, setNoVoice] = useState(false);
  const prefs = useRef(chant);
  prefs.current = chant;
  const voice = chant.voice && !noVoice && !rec;

  // Giữ màn sáng, mở âm thanh; dọn khi rời màn.
  useEffect(() => {
    activateKeepAwakeAsync('chant').catch(() => {});
    openChantAudio();
    return () => {
      Speech.stop();
      closeChantAudio();
      Promise.resolve()
        .then(() => deactivateKeepAwake('chant'))
        .catch(() => {});
    };
  }, []);
  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((v: { language: string }[]) => setNoVoice(!v.some((x) => x.language?.toLowerCase().startsWith('vi'))))
      .catch(() => {});
  }, []);
  useEffect(() => setMoVolume(voice ? 0.45 : 1), [voice]);

  // Đổi gọn/đầy đủ thì tụng lại từ đầu.
  useEffect(() => {
    setPos(startPos());
    setPlaying(false);
  }, [lines, setPos]);

  // Chế độ theo mõ: mỗi nhịp một chữ. Hẹn giờ bù trễ để nhịp đều.
  useEffect(() => {
    if (!playing || voice || rec || !lines.length) return;
    const ms = 60000 / chant.bpm;
    let next = Date.now() + ms;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const r = tick(posRef.current, lines);
      if (r.mo && prefs.current.mo) knock();
      if (r.bell && prefs.current.chuong) bell();
      setPos(r.pos);
      if (r.pos.done) {
        setPlaying(false);
        return;
      }
      next += ms;
      t = setTimeout(loop, Math.max(0, next - Date.now()));
    };
    t = setTimeout(loop, ms);
    return () => clearTimeout(t);
  }, [playing, voice, rec, lines, chant.bpm, setPos, jump]);

  // Chế độ giọng máy: đọc từng câu, xong câu sang câu kế; mõ gõ nhẹ theo nhịp ở nền.
  useEffect(() => {
    if (!playing || !voice || !lines.length) return;
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | undefined;
    const rate = Math.min(1.4, Math.max(0.6, chant.bpm / 110));
    const speakCur = () => {
      if (cancelled) return;
      const p = posRef.current;
      if (p.done) {
        setPlaying(false);
        return;
      }
      Speech.speak(lines[p.idx].text, {
        language: 'vi-VN',
        rate,
        onDone: () => {
          if (cancelled) return;
          const n = nextLine(posRef.current, lines);
          if (n.bell && prefs.current.chuong) bell();
          setPos({ ...n.pos, gap: 0 });
          if (n.pos.done) {
            setPlaying(false);
            return;
          }
          t = setTimeout(speakCur, n.bell ? 2600 : 120);
        },
        onError: () => {
          if (!cancelled) setNoVoice(true);
        },
      });
    };
    if (posRef.current.gap > 0) {
      setPos({ ...posRef.current, gap: 0 });
      t = setTimeout(speakCur, 2600);
    } else speakCur();
    const ms = 60000 / chant.bpm;
    const mo = setInterval(() => prefs.current.mo && knock(), ms);
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
      clearInterval(mo);
      Speech.stop();
    };
  }, [playing, voice, lines, chant.bpm, setPos, jump]);

  // Bản ghi riêng: phát tệp, chữ để người tụng tự cuộn theo.
  const recPlayer = useMemo(() => (rec ? openRecording(rec.uri) : null), [rec]);
  const [recTime, setRecTime] = useState({ cur: 0, dur: 0 });
  useEffect(() => {
    if (!recPlayer) return;
    const iv = setInterval(() => {
      try {
        setRecTime({ cur: recPlayer.currentTime ?? 0, dur: recPlayer.duration ?? 0 });
      } catch {
        // bỏ qua
      }
    }, 500);
    return () => {
      clearInterval(iv);
      try {
        recPlayer.pause();
        recPlayer.remove();
      } catch {
        // bỏ qua
      }
    };
  }, [recPlayer]);

  // Tự cuộn tới câu đang tụng.
  const scroll = useRef<ScrollView>(null);
  const lineY = useRef<number[]>([]);
  const viewH = useRef(600);
  // Cuộn khi đang tụng, và khi người dùng chuyển bài lúc đang dừng.
  useEffect(() => {
    if (!playing && !jump) return;
    const y = lineY.current[pos.idx];
    if (y != null) scroll.current?.scrollTo({ y: Math.max(0, y - viewH.current * 0.3), animated: true });
  }, [pos.idx, playing, jump]);

  const onLine = useCallback(
    (i: number) => {
      setPos(gotoLine(posRef.current, lines, i));
      setJump((j) => j + 1);
    },
    [lines, setPos],
  );
  const onLineHandlers = useMemo(() => lines.map((_, i) => () => onLine(i)), [lines, onLine]);

  if (!plan) return null;
  const cur = lines[pos.idx];
  const step = cur?.step ?? 0;
  const stepCount = plan.steps.length;
  const curKinh = cur ? kinhById(cur.kinh) : undefined;
  const font = prayFont;

  const togglePlay = () => {
    if (rec) {
      if (!recPlayer) return;
      try {
        if (recPlayer.playing) recPlayer.pause();
        else recPlayer.play();
      } catch {
        // bỏ qua
      }
      setPlaying((p) => !p);
      return;
    }
    if (playing) {
      setPlaying(false);
      Speech.stop();
      return;
    }
    if (posRef.current.done) setPos(startPos());
    if (posRef.current.gap > 0 && chant.chuong) bell();
    track('chant_play', { id, voice });
    setPlaying(true);
  };
  const goStep = (s: number) => {
    if (s < 0 || s >= stepCount) return;
    setPos(gotoStep(lines, s));
    if (playing && chant.chuong) bell();
    setJump((j) => j + 1);
  };
  const finish = () => {
    track('chant_done', { id, ritual: ritual ?? null });
    if (ritual) logPray(ritual);
    router.back();
  };

  const rows: React.ReactNode[] = [];
  lines.forEach((l, i) => {
    if (i === 0 || lines[i - 1].step !== l.step) {
      const k = kinhById(l.kinh)!;
      rows.push(
        <View
          key={`h-${l.step}`}
          style={{
            paddingTop: i ? 28 : 4,
            paddingBottom: 6,
            paddingHorizontal: 10,
            flexDirection: 'row',
            gap: 8,
            alignItems: 'baseline',
          }}
        >
          <T v="headline" color={ttNight.gold} accessibilityRole="header" style={{ flex: 1 }}>
            {k.title}
          </T>
          {l.times > 1 ? (
            <T v="caption" color={ttNight.inkMuted}>
              {l.times} lần
            </T>
          ) : null}
        </View>,
      );
    }
    rows.push(
      <View
        key={`l-${i}`}
        onLayout={(e) => {
          lineY.current[i] = e.nativeEvent.layout.y;
        }}
      >
        <Line
          text={l.text}
          active={!rec && i === pos.idx}
          beat={i === pos.idx ? pos.beat : 0}
          font={font}
          mantra={l.mantra}
          onPress={onLineHandlers[i]}
        />
      </View>,
    );
    const nx = lines[i + 1];
    const para = kinhById(l.kinh)!.paras[l.para];
    if (chant.nghia && para.vi?.length && (!nx || nx.para !== l.para || nx.step !== l.step)) {
      rows.push(
        <T
          key={`v-${i}`}
          v="body"
          color={ttNight.inkMuted}
          style={{
            fontSize: Math.round(font * 0.72),
            lineHeight: Math.round(font * 1.1),
            paddingHorizontal: 10,
            paddingBottom: 6,
          }}
        >
          {para.vi.join('\n')}
        </T>,
      );
    }
  });

  const status = rec
    ? `${mmss(recTime.cur)}${recTime.dur ? ` / ${mmss(recTime.dur)}` : ''}`
    : pos.done
      ? 'Đã tụng xong'
      : `Bài ${step + 1}/${stepCount}${cur && cur.times > 1 ? ` · lần ${pos.rep}/${cur.times}` : ''}`;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: ttNight.bg,
        paddingTop: safe.top,
        paddingBottom: safe.bottom,
        paddingLeft: safe.left,
        paddingRight: safe.right,
      }}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 56, gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          hitSlop={8}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" color={ttNight.ink} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T v="headline" color={ttNight.ink} numberOfLines={1} maxFontSizeMultiplier={1.4}>
            {rec ? rec.name : (curKinh?.title ?? plan.title)}
          </T>
          <T
            v="caption"
            color={ttNight.inkMuted}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
            maxFontSizeMultiplier={1.4}
          >
            {status}
          </T>
        </View>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView
        ref={scroll}
        onLayout={(e) => {
          viewH.current = e.nativeEvent.layout.height;
        }}
        contentContainerStyle={{ paddingHorizontal: L.gutter, paddingTop: 8, paddingBottom: 200, alignItems: 'center' }}
      >
        <View style={{ width: '100%', maxWidth: 760 }}>
          {rows}
          {pos.done || rec ? (
            <Pressable
              onPress={finish}
              accessibilityRole="button"
              style={({ pressed }) => ({
                marginTop: 28,
                minHeight: 56,
                borderRadius: 14,
                backgroundColor: ttNight.gold,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <T v="headline" color={ttNight.bg}>
                Tụng xong
              </T>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          {!rec ? (
            <Ctl icon="skip-back" label="Bài trước" onPress={() => goStep(step - 1)} disabled={step <= 0} />
          ) : null}
          <Ctl icon={playing ? 'pause' : 'play'} label={playing ? 'Tạm dừng' : 'Tụng'} onPress={togglePlay} big />
          {!rec ? (
            <Ctl
              icon="skip-forward"
              label="Bài sau"
              onPress={() => goStep(step + 1)}
              disabled={step >= stepCount - 1}
            />
          ) : null}
        </View>
        {!rec ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Ctl
              icon="minus"
              label="Chậm"
              onPress={() => setChant({ bpm: Math.max(BPM_MIN, chant.bpm - 10) })}
              disabled={chant.bpm <= BPM_MIN}
            />
            <View style={{ minWidth: 56, minHeight: 54, alignItems: 'center', justifyContent: 'center' }}>
              <T v="headline" color={ttNight.ink} maxFontSizeMultiplier={1.3}>
                {chant.bpm}
              </T>
              <T v="caption" color={ttNight.inkMuted} style={{ fontSize: 11 }} maxFontSizeMultiplier={1.3}>
                nhịp/phút
              </T>
            </View>
            <Ctl
              icon="plus"
              label="Nhanh"
              onPress={() => setChant({ bpm: Math.min(BPM_MAX, chant.bpm + 10) })}
              disabled={chant.bpm >= BPM_MAX}
            />
            <Ctl icon="disc" label="Mõ" on={chant.mo} onPress={() => setChant({ mo: !chant.mo })} />
            {!noVoice ? (
              <Ctl
                icon="volume-2"
                label="Giọng máy"
                on={chant.voice}
                onPress={() => setChant({ voice: !chant.voice })}
              />
            ) : null}
            <Ctl
              icon="type"
              label={`Chữ ${font}`}
              onPress={() => set({ prayFont: FONTS[(FONTS.indexOf(font) + 1) % FONTS.length] ?? 24 })}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
