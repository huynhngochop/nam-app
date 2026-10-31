import React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AppBar, Button, Grid, Radio, Row, Screen, StepBar, T, useTheme } from '@nam/ui';
import { FACE_PARTS } from '../../../src/face/data';
import { useSession } from '../../../src/session';

/** TT-34 · Chọn nét mặt (8 bước). */
export default function FaceStep() {
  const { c } = useTheme();
  const { n } = useLocalSearchParams<{ n: string }>();
  const i = Math.max(0, Math.min(FACE_PARTS.length - 1, Number(n) || 0));
  const part = FACE_PARTS[i];
  const draft = useSession((s) => s.faceDraft);
  const set = useSession((s) => s.set);
  const chosen = draft[part.id];
  const last = i === FACE_PARTS.length - 1;
  const next = () => (last ? router.replace('/face/result') : router.replace(`/face/step/${i + 1}`));
  const pick = (id: string) => set({ faceDraft: { ...draft, [part.id]: id } });

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <Row gap={8}>
          <Button
            title="Không chắc"
            variant="secondary"
            onPress={() => {
              pick('khong-chac');
              next();
            }}
            style={{ flexGrow: 0.6 }}
          />
          <Button title={last ? 'Xem kết quả' : 'Tiếp'} disabled={!chosen} onPress={next} />
        </Row>
      }
    >
      <AppBar
        onBack={() => (i === 0 ? router.back() : router.replace(`/face/step/${i - 1}`))}
        backIcon={i === 0 ? 'x' : 'chevron-left'}
        title={`Bước ${i + 1}/${FACE_PARTS.length} · ${part.name}`}
      />
      <StepBar count={FACE_PARTS.length} index={i} />
      <T v="title">{part.question}</T>
      {part.hint ? (
        <T v="caption" muted>
          {part.hint}
        </T>
      ) : null}
      <Grid min={1} gap={10}>
        {part.options.map((o) => {
          const on = chosen === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => pick(o.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.label}
              style={{
                minHeight: 64,
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: on ? c.at : c.surface,
                borderWidth: on ? 2 : 1,
                borderColor: on ? c.a : c.line,
              }}
            >
              {o.shape ? (
                <View style={{ width: 40, height: 48 }}>
                  <Svg width={40} height={48} viewBox="0 0 40 48">
                    <Path d={o.shape} fill="none" stroke={on ? c.a : c.inkMuted} strokeWidth={2} />
                  </Svg>
                </View>
              ) : null}
              <T v="headline" style={{ flex: 1 }}>
                {o.label}
              </T>
              <Radio on={on} />
            </Pressable>
          );
        })}
      </Grid>
    </Screen>
  );
}
