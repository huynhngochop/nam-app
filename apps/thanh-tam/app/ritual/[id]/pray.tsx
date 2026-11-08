import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StatusBar, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Icon, IconName, T, ttNight, useLayout } from '@nam/ui';
import { track } from '@nam/core';
import { useTT } from '../../../src/store';
import { usePrayer } from '../../../src/usePrayer';
import { plainText } from '../../../src/lib/prayer';
import { goBack } from '../../../src/nav';
import { speakVi, stopSpeaking, ttsStatus } from '../../../src/voice';
import {
  bytesToDownload,
  downloadVoices,
  formatMB,
  getManifest,
  playVoice,
  voiceState,
  voiceTimings,
  type VoicePlayback,
} from '../../../src/sampleVoice';
import { khanCues, khanVoiceId } from '../../../src/lib/voiceCues';

const SPEEDS = [0, 18, 28, 40]; // điểm ảnh mỗi giây; 0 = tự cuộn tắt

function Ctl({ icon, label, onPress, on }: { icon: IconName; label: string; onPress: () => void; on?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        minWidth: 64,
        minHeight: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        backgroundColor: on ? ttNight.now : ttNight.soft,
        opacity: pressed ? 0.7 : 1,
        paddingHorizontal: 8,
      })}
    >
      <Icon name={icon} size={20} color={on ? ttNight.gold : ttNight.ink} />
      <T v="caption" color={on ? ttNight.gold : ttNight.inkMuted} style={{ fontSize: 11 }} numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

/** TT-10 · Chế độ khấn: nền tối ấm, chữ to, giữ màn sáng, tự cuộn chạy trên luồng giao diện, đọc to theo đoạn. */
export default function Pray() {
  // Màn toàn màn hình (fullScreenModal) trên iOS báo vùng an toàn trên = 0 (QA iOS vòng 6: tiêu đề đè
  // lên đồng hồ). Lấy giá trị lớn hơn giữa vùng an toàn hiện tại và vùng an toàn lúc mở app.
  const insets = useSafeAreaInsets();
  const first = initialWindowMetrics?.insets;
  const safe = {
    top: Math.max(insets.top, first?.top ?? 0),
    bottom: Math.max(insets.bottom, first?.bottom ?? 0),
    left: insets.left,
    right: insets.right,
  };
  // Giữ màn sáng chỉ trong màn này. Trình duyệt có thể từ chối (Wake Lock) → bỏ qua, không văng lỗi.
  useEffect(() => {
    activateKeepAwakeAsync('pray').catch(() => {});
    return () => {
      Promise.resolve()
        .then(() => deactivateKeepAwake('pray'))
        .catch(() => {});
    };
  }, []);
  const L = useLayout();
  const { id, prayerId } = useLocalSearchParams<{ id: string; prayerId?: string }>();
  const data = usePrayer(id, prayerId);
  const prayFont = useTT((s) => s.prayFont);
  const set = useTT((s) => s.set);
  const logPray = useTT((s) => s.logPray);

  const ref = useAnimatedRef<Animated.ScrollView>();
  const y = useSharedValue(0);
  const speed = useSharedValue(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [noVoice, setNoVoice] = useState(false);
  const paraY = useRef<number[]>([]);
  const stopRef = useRef(false);
  // Giọng đọc mẫu (tải về): đang phát thì giữ bộ điều khiển để dừng.
  const sample = useRef<VoicePlayback | null>(null);
  const [sampleOn, setSampleOn] = useState(false);
  const [dl, setDl] = useState<{ open: boolean; size?: number; busy?: boolean; note?: string }>({ open: false });
  useTT((s) => s.voices); // vẽ lại khi tải xong

  useFrameCallback((f: { timeSincePreviousFrame: number | null }) => {
    'worklet';
    if (speed.value <= 0 || !f.timeSincePreviousFrame) return;
    y.value += (speed.value * f.timeSincePreviousFrame) / 1000;
    scrollTo(ref, 0, y.value, false);
  });
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e: { contentOffset: { y: number } }) => {
      'worklet';
      y.value = e.contentOffset.y;
    },
  });

  useEffect(
    () => () => {
      stopRef.current = true;
      stopSpeaking();
      sample.current?.stop();
    },
    [],
  );
  useEffect(() => {
    ttsStatus()
      .then((t) => setNoVoice(!t.ok))
      .catch(() => setNoVoice(true));
  }, []);

  if (!data) return null;
  const { r, p, paras } = data;
  const lh = Math.round(prayFont * 1.6);

  const speakFrom = (i: number): void => {
    if (i >= paras.length || stopRef.current) {
      setSpeaking(null);
      return;
    }
    setSpeaking(i);
    ref.current?.scrollTo?.({ y: Math.max(0, (paraY.current[i] ?? 0) - 80), animated: true });
    const text = plainText(paras[i]).replace(/\((\d+) lần\)$/, '');
    const times = paras[i].repeat ?? 1;
    let n = 0;
    const once = (): void => {
      speakVi(text, {
        rate: 0.9,
        onDone: (): void => {
          n += 1;
          if (n < times) once();
          else speakFrom(i + 1);
        },
        onStopped: () => setSpeaking(null),
        onError: () => setSpeaking(null),
      });
    };
    once();
  };
  const toggleSpeak = () => {
    if (speaking !== null) {
      stopRef.current = true;
      stopSpeaking();
      sample.current?.stop();
      sample.current = null;
      setSampleOn(false);
      setSpeaking(null);
      return;
    }
    stopRef.current = false;
    speed.value = 0;
    setSpeedIdx(0);
    track('pray_tts', {});
    speakFrom(0);
  };
  // Giọng mẫu: phát bài tải sẵn, tô sáng đoạn đang đọc. Tới chỗ tên, địa chỉ: máy có giọng tiếng Việt thì đọc
  // tên đã điền, không thì để khoảng lặng cho người khấn tự đọc.
  const vid = khanVoiceId(p.id);
  const startSample = () => {
    const v = useTT.getState().voices[vid];
    const tm = voiceTimings(vid);
    if (!v || !tm) return;
    const cues = khanCues(p.id);
    const fieldCues = new Set(cues.map((c, i) => (c.field ? i : -1)).filter((i) => i >= 0));
    stopSpeaking();
    speed.value = 0;
    setSpeedIdx(0);
    stopRef.current = false;
    sample.current = playVoice(v.uri, tm, {
      fieldCues,
      onCue: (i) => {
        const pi = cues[i]?.p ?? 0;
        setSpeaking((cur) => {
          if (cur !== pi) ref.current?.scrollTo?.({ y: Math.max(0, (paraY.current[pi] ?? 0) - 80), animated: true });
          return pi;
        });
      },
      onField: (i) => {
        const f = cues[i]?.field;
        const val = f ? data.values[f]?.trim() : '';
        if (!val || noVoice) return null;
        return new Promise<void>((res) => speakVi(val, { onDone: res, onStopped: res, onError: res }));
      },
      onEnd: () => {
        sample.current = null;
        setSampleOn(false);
        setSpeaking(null);
      },
    });
    if (sample.current) {
      setSampleOn(true);
      track('pray_sample_voice', { id: p.id });
    }
  };
  const toggleSample = async () => {
    if (sampleOn) {
      sample.current?.stop();
      sample.current = null;
      stopSpeaking();
      setSampleOn(false);
      setSpeaking(null);
      return;
    }
    if (speaking !== null) toggleSpeak();
    if (voiceState(vid) === 'san-sang') {
      startSample();
      return;
    }
    setDl({ open: true, busy: true, note: 'Đang kiểm tra…' });
    try {
      const m = await getManifest(true);
      const size = bytesToDownload(m, [vid]);
      setDl(
        size
          ? { open: true, size }
          : { open: true, note: 'Giọng mẫu bài này đang được cập nhật, thử lại sau ít phút.' },
      );
    } catch {
      setDl({ open: true, note: 'Cần mạng để tải giọng đọc mẫu lần đầu. Sau đó nghe không cần mạng.' });
    }
  };
  const doDownload = async () => {
    setDl((d) => ({ ...d, busy: true, note: 'Đang tải…' }));
    try {
      const r = await downloadVoices([vid]);
      if (r.done) {
        setDl({ open: false });
        startSample();
      } else setDl({ open: true, note: 'Giọng mẫu bài này đang được cập nhật, thử lại sau ít phút.' });
    } catch {
      setDl({ open: true, note: 'Tải chưa được. Kiểm tra mạng rồi thử lại.' });
    }
  };
  const cycleSpeed = () => {
    const n = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(n);
    speed.value = SPEEDS[n] * (prayFont / 24);
  };
  const finish = () => {
    stopRef.current = true;
    stopSpeaking();
    sample.current?.stop();
    speed.value = 0;
    logPray(r.id);
    track('pray_done', { id: p.id });
    router.replace(`/ritual/${r.id}/after`);
  };

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
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52, gap: 8 }}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          hitSlop={8}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" color={ttNight.ink} />
        </Pressable>
        <T v="headline" color={ttNight.ink} numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          {p.title}
        </T>
        <View style={{ width: 40 }} />
      </View>
      <Animated.ScrollView
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          if (speed.value > 0) {
            speed.value = 0;
            setSpeedIdx(0);
          }
        }}
        contentContainerStyle={{
          paddingHorizontal: L.gutter,
          paddingTop: 16,
          paddingBottom: 240,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 760, gap: prayFont * 0.9 }}>
          {paras.map((para, i) => (
            <View
              key={i}
              onLayout={(e) => {
                paraY.current[i] = e.nativeEvent.layout.y;
              }}
              style={{
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: speaking === i ? ttNight.now : 'transparent',
              }}
            >
              <T
                v="body"
                color={ttNight.ink}
                style={{ fontSize: prayFont, lineHeight: lh }}
                maxFontSizeMultiplier={1.4}
              >
                {para.segments.map((s, j) =>
                  s.field ? (
                    <T
                      key={j}
                      v="body"
                      weight="semibold"
                      color={s.empty ? ttNight.inkMuted : ttNight.field}
                      style={{ fontSize: prayFont, lineHeight: lh }}
                      maxFontSizeMultiplier={1.4}
                    >
                      {s.text}
                    </T>
                  ) : (
                    s.text
                  ),
                )}
              </T>
              {para.repeat ? (
                <T v="caption" color={ttNight.inkMuted} style={{ marginTop: 4 }}>
                  (đọc {para.repeat} lần)
                </T>
              ) : null}
            </View>
          ))}
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: 24,
              minHeight: 56,
              borderRadius: 14,
              backgroundColor: ttNight.gold,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <T v="headline" color={ttNight.bg}>
              Khấn xong
            </T>
          </Pressable>
        </View>
      </Animated.ScrollView>
      {dl.open ? (
        <View style={{ marginHorizontal: 12, padding: 14, borderRadius: 14, backgroundColor: ttNight.soft, gap: 10 }}>
          <T v="body" color={ttNight.ink}>
            {dl.note ??
              `Tải giọng đọc mẫu bài này (${formatMB(dl.size ?? 0)}). Tải một lần, sau đó nghe không cần mạng. Giọng mẫu đọc, bạn khấn theo; tới chỗ tên, địa chỉ có khoảng lặng để bạn tự đọc.`}
          </T>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <Ctl icon="x" label="Để sau" onPress={() => setDl({ open: false })} />
            {!dl.busy && dl.size ? <Ctl icon="download" label="Tải" onPress={doDownload} on /> : null}
          </View>
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexWrap: 'wrap',
        }}
      >
        <Ctl icon="minus" label="Chữ nhỏ" onPress={() => set({ prayFont: Math.max(22, prayFont - 2) })} />
        <Ctl icon="plus" label="Chữ to" onPress={() => set({ prayFont: Math.min(30, prayFont + 2) })} />
        <Ctl
          icon="chevrons-down"
          label={speedIdx ? `Tự cuộn ${speedIdx}` : 'Tự cuộn'}
          on={speedIdx > 0}
          onPress={cycleSpeed}
        />
        <Ctl
          icon={sampleOn ? 'pause' : 'headphones'}
          label={sampleOn ? 'Dừng nghe' : 'Giọng mẫu'}
          on={sampleOn}
          onPress={toggleSample}
        />
        {!noVoice ? (
          <Ctl
            icon={speaking !== null && !sampleOn ? 'pause' : 'volume-2'}
            label={speaking !== null && !sampleOn ? 'Dừng đọc' : 'Giọng máy'}
            on={speaking !== null && !sampleOn}
            onPress={toggleSpeak}
          />
        ) : null}
        <Ctl icon="check" label="Khấn xong" onPress={finish} />
      </View>
    </View>
  );
}
