import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { mmss } from '@nam/core';
import { AppBar, Button, Card, Chip, Chips, Row, Screen, T, useTheme } from '@nam/ui';
import { useBand7 } from '../src/store';
import { pickTopic, topicById } from '../src/topics';

const PREP_SEC = 60;
const PHRASES = [
  'a steep learning curve',
  "it didn't come naturally",
  'looking back',
  'a sense of achievement',
  'what made it special was',
];

/** 7 · Part 2: 1 phút chuẩn bị có đồng hồ, ghi chú, khung chia thời gian → vào nói (tối đa 2 phút). */
export default function Part2() {
  const { c } = useTheme();
  const p = useLocalSearchParams<{ topic?: string; lesson?: string }>();
  const practiced = useBand7((s) => s.practiced);
  const topic = topicById(p.topic ?? '') ?? pickTopic(2, practiced);
  const [cue, ...bullets] = topic.questions;
  const [left, setLeft] = useState(PREP_SEC);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const go = () =>
    router.replace({
      pathname: '/session',
      params: {
        kind: 'part2',
        topic: topic.id,
        lesson: p.lesson ?? '',
        first: `${cue} You should say: ${bullets.join(', ')}.`,
      },
    });

  return (
    <Screen
      scroll
      footer={<Button title={left > 0 ? 'Bắt đầu nói ngay' : 'Hết giờ chuẩn bị · nói'} icon="mic" onPress={go} />}
    >
      <AppBar
        onBack={() => router.back()}
        title="Part 2 · Chuẩn bị"
        right={
          <View
            style={{
              minWidth: 56,
              height: 40,
              borderRadius: 20,
              borderWidth: 3,
              borderColor: left > 10 ? c.a2 : c.negative,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <T v="headline">{mmss(left)}</T>
          </View>
        }
      />
      <Card>
        <T v="micro" accent>
          Cue card
        </T>
        <T v="title">{cue}</T>
        {bullets.map((b) => (
          <T key={b} v="body" muted>
            • {b}
          </T>
        ))}
      </Card>
      <T v="caption" muted weight="semibold">
        Ghi chú của bạn (từ khoá, không viết cả câu)
      </T>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="ví dụ: bơi · 10 tuổi · sợ nước · 2 mùa hè · tự hào"
        placeholderTextColor={c.inkMuted}
        style={{
          minHeight: 96,
          borderRadius: 10,
          backgroundColor: c.surface2,
          color: c.ink,
          padding: 12,
          textAlignVertical: 'top',
          fontSize: 15,
        }}
        accessibilityLabel="Ghi chú"
      />
      <Card variant="fill">
        <T v="headline">Khung 2 phút gợi ý</T>
        <Row gap={6}>
          {[
            ['Mở bài', '15s'],
            ['Quá trình', '40s'],
            ['Khó khăn', '40s'],
            ['Cảm nhận', '25s'],
          ].map(([a, b]) => (
            <View
              key={a}
              style={{ flex: 1, backgroundColor: c.surface, borderRadius: 8, padding: 8, alignItems: 'center' }}
            >
              <T v="caption" weight="semibold">
                {a}
              </T>
              <T v="caption" muted>
                {b}
              </T>
            </View>
          ))}
        </Row>
        <T v="caption" muted>
          Cụm từ band 7 nên thử
        </T>
        <Chips>
          {PHRASES.map((ph) => (
            <Chip key={ph} label={ph} />
          ))}
        </Chips>
      </Card>
      <T v="caption" muted center>
        Ghi chú chỉ nằm trên máy bạn. Chế độ Thi thật sẽ ẩn khung gợi ý.
      </T>
    </Screen>
  );
}
