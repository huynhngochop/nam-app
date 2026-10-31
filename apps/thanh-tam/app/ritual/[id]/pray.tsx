import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StatusBar, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import { Icon, IconName, T, ttNight, useLayout } from '@nam/ui';
import { track } from '@nam/core';
import { useTT } from '../../../src/store';
import { usePrayer } from '../../../src/usePrayer';
import { plainText } from '../../../src/lib/prayer';

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
  useKeepAwake();
  const L = useLayout();
  const { id, prayerId } = useLocalSearchParams<{ id: string; prayerId?: string }>();
  const data = usePrayer(id, prayerId);
  const prayFont = useTT((s) => s.prayFont);
  const set = useTT((s) => s.set);
  const logPray = useTT((s) => s.logPray);

  const ref = useAnimatedRef();
  const y = useSharedValue(0);
  const speed = useSharedValue(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [noVoice, setNoVoice] = useState(false);
  const paraY = useRef<number[]>([]);
  const stopRef = useRef(false);

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
      Speech.stop();
    },
    [],
  );
  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((v: { language: string }[]) => setNoVoice(!v.some((x) => x.language?.toLowerCase().startsWith('vi'))))
      .catch(() => {});
  }, []);

  if (!data) return null;
  const { r, p, paras } = data;
  const lh = Math.round(prayFont * 1.6);

  const speakFrom = (i: number) => {
    if (i >= paras.length || stopRef.current) {
      setSpeaking(null);
      return;
    }
    setSpeaking(i);
    ref.current?.scrollTo?.({ y: Math.max(0, (paraY.current[i] ?? 0) - 80), animated: true });
    const text = plainText(paras[i]).replace(/\((\d+) lần\)$/, '');
    const times = paras[i].repeat ?? 1;
    let n = 0;
    const once = () =>
      Speech.speak(text, {
        language: 'vi-VN',
        rate: 0.9,
        onDone: () => (++n < times ? once() : speakFrom(i + 1)),
        onStopped: () => setSpeaking(null),
        onError: () => setSpeaking(null),
      });
    once();
  };
  const toggleSpeak = () => {
    if (speaking !== null) {
      stopRef.current = true;
      Speech.stop();
      setSpeaking(null);
      return;
    }
    stopRef.current = false;
    speed.value = 0;
    setSpeedIdx(0);
    track('pray_tts', {});
    speakFrom(0);
  };
  const cycleSpeed = () => {
    const n = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(n);
    speed.value = SPEEDS[n] * (prayFont / 24);
  };
  const finish = () => {
    stopRef.current = true;
    Speech.stop();
    speed.value = 0;
    logPray(r.id);
    track('pray_done', { id: p.id });
    router.replace(`/ritual/${r.id}/after`);
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: ttNight.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52, gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
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
        {!noVoice ? (
          <Ctl
            icon={speaking !== null ? 'pause' : 'volume-2'}
            label={speaking !== null ? 'Dừng đọc' : 'Giọng máy'}
            on={speaking !== null}
            onPress={toggleSpeak}
          />
        ) : null}
        <Ctl icon="check" label="Khấn xong" onPress={finish} />
      </View>
    </SafeAreaView>
  );
}
