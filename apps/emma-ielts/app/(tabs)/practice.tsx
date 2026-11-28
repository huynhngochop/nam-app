import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { AppBar, Card, Chip, Chips, Grid, Icon, ListItem, Row, Screen, SectionHeader, T, useTheme } from '@nam/ui';
import { useEmma } from '../../src/store';
import { topics, type Topic } from '../../src/topics';

const PARTS = [
  { key: 0, label: 'Tất cả' },
  { key: 1, label: 'Part 1' },
  { key: 2, label: 'Part 2' },
  { key: 3, label: 'Part 3' },
] as const;

/** 11 · Luyện nói: chọn kiểu luyện + ngân hàng đề (có sẵn trong máy, dùng được khi ngoại tuyến). */
export default function Practice() {
  const { c } = useTheme();
  const practiced = useEmma((s) => s.practiced);
  const sessions = useEmma((s) => s.sessions);
  const remote = useEmma((s) => s.remoteTopics); // đề mới từ máy chủ
  const [part, setPart] = useState<0 | 1 | 2 | 3>(0);
  const [onlyNew, setOnlyNew] = useState(false);
  const bestByTopic = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) if (s.overall !== undefined) m.set(s.topic, Math.max(m.get(s.topic) ?? 0, s.overall));
    return m;
  }, [sessions]);
  const list = useMemo(
    () => topics().filter((t) => (part === 0 || t.part === part) && (!onlyNew || !practiced.includes(t.id))),
    [part, onlyNew, practiced, remote], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const open = (t: Topic) =>
    t.part === 2
      ? router.push({ pathname: '/part2', params: { topic: t.id } })
      : router.push({ pathname: '/session', params: { kind: `part${t.part}`, topic: t.id } });

  return (
    <Screen scroll>
      <AppBar large title="Luyện nói" />
      <Card
        variant="accent"
        onPress={() => router.push({ pathname: '/session', params: { kind: 'mock', mode: 'exam' } })}
      >
        <Row gap={12}>
          <Icon name="clock" size={22} />
          <T v="headline" style={{ flex: 1 }}>
            Thi thử đầy đủ
          </T>
        </Row>
        <T v="caption">3 part · 11–14 phút · như phòng thi thật</T>
      </Card>
      <Grid min={2}>
        <Mode
          title="Part 1"
          sub="Hỏi nhanh đời thường"
          onPress={() => router.push({ pathname: '/session', params: { kind: 'part1' } })}
        />
        <Mode title="Part 2" sub="Cue card có đồng hồ" onPress={() => router.push('/part2')} />
        <Mode
          title="Part 3"
          sub="Thảo luận, lập luận"
          onPress={() => router.push({ pathname: '/session', params: { kind: 'part3' } })}
        />
        <Mode
          title="Phát âm"
          sub="Âm khó với người Việt"
          onPress={() => router.push({ pathname: '/drill', params: { kind: 'warmup', title: '' } })}
        />
      </Grid>
      <Card onPress={() => router.push({ pathname: '/session', params: { kind: 'free' } })}>
        <Row between>
          <T v="headline">Nói tự do & tình huống</T>
          <Icon name="chevron-right" color={c.inkMuted} />
        </Row>
        <T v="caption" muted>
          Phỏng vấn du học, visa, đời sống
        </T>
      </Card>

      <SectionHeader title="Ngân hàng đề" />
      <Chips scroll>
        {PARTS.map((o) => (
          <Chip key={o.key} label={o.label} selected={part === o.key} onPress={() => setPart(o.key)} />
        ))}
        <Chip label="Chưa luyện" icon="circle" selected={onlyNew} onPress={() => setOnlyNew(!onlyNew)} />
      </Chips>
      {list.map((t) => {
        const best = bestByTopic.get(t.id);
        return (
          <ListItem
            key={t.id}
            title={t.title}
            subtitle={`Part ${t.part} · ${t.part === 2 ? 'cue card' : `${t.questions.length} câu`}`}
            right={
              <T v="caption" weight="semibold" color={best ? c.positive : c.inkMuted}>
                {best ? best.toFixed(1) : practiced.includes(t.id) ? 'đã luyện' : 'mới'}
              </T>
            }
            onPress={() => open(t)}
          />
        );
      })}
    </Screen>
  );
}

function Mode({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  return (
    <Card onPress={onPress}>
      <T v="headline">{title}</T>
      <T v="caption" muted>
        {sub}
      </T>
    </Card>
  );
}
