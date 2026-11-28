import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, ProgressBar, Row, Screen, Skeleton, T, useTheme } from '@nam/ui';
import { ApiError, fetchTurns, gradeSession, type GradeResult, type TurnRow } from '../src/api';
import { CRITERION_VI, type Bands, type Criterion } from '../src/plan';
import { toRepair } from '../src/loop';
import { useEmma } from '../src/store';
import { refreshErrors } from '../src/sync';

/** 5 · Chấm band cuối buổi + đưa người học vào vòng sửa lỗi. */
export default function Feedback() {
  const { c } = useTheme();
  const p = useLocalSearchParams<{ session: string; kind: string; topic: string; lesson?: string }>();
  const recordBands = useEmma((s) => s.recordBands);
  // band trước buổi này (lấy 1 lần lúc mở màn, trước khi ghi band mới)
  const [prev] = useState(() => useEmma.getState().history[useEmma.getState().history.length - 1]?.overall);
  const errors = useEmma((s) => s.errors);
  const [g, setG] = useState<GradeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [turns, setTurns] = useState<TurnRow[] | null>(null);
  const showTranscript = () => {
    if (turns) return setTurns(null);
    fetchTurns(p.session)
      .then((r) => setTurns(r ?? []))
      .catch(() => setTurns([]));
  };

  useEffect(() => {
    let alive = true;
    setErr(null);
    gradeSession(p.session)
      .then(async (r) => {
        if (!alive) return;
        setG(r);
        const b: Bands = { FC: r.fc, LR: r.lr, GRA: r.gra, P: r.p };
        const st = useEmma.getState();
        recordBands(p.kind === 'mock' ? 'mock' : p.kind === 'placement' ? 'placement' : 'session', b);
        st.logSession({ id: p.session, kind: p.kind, topic: p.topic, at: Date.now(), overall: r.overall });
        if (p.lesson) st.markDone(p.lesson);
        await refreshErrors(true);
      })
      .catch((e) => alive && setErr(e instanceof ApiError ? e.messageVi : 'Chưa chấm được, thử lại nhé.'));
    return () => {
      alive = false;
    };
  }, [p.session, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const repairs = toRepair(errors);
  const placement = p.kind === 'placement';

  if (err)
    return (
      <Screen>
        <EmptyState
          icon="alert-circle"
          title="Chưa chấm được"
          body={err}
          action="Thử lại"
          onAction={() => setAttempt((a) => a + 1)}
        />
        <Button title="Để sau" variant="text" onPress={() => router.replace('/(tabs)/today')} />
      </Screen>
    );

  const rows: [Criterion, number | undefined][] = [
    ['FC', g?.fc],
    ['LR', g?.lr],
    ['GRA', g?.gra],
    ['P', g?.p],
  ];
  return (
    <Screen
      scroll
      footer={
        placement ? (
          <Button title="Đặt mục tiêu" icon="arrow-right" disabled={!g} onPress={() => router.replace('/goals')} />
        ) : (
          <Row gap={10}>
            <Button title="Để sau" variant="secondary" onPress={() => router.replace('/(tabs)/today')} />
            <Button
              title={repairs.length ? `Sửa ngay ${Math.min(3, repairs.length)} lỗi` : 'Xong'}
              disabled={!g}
              onPress={() => (repairs.length ? router.replace('/repair') : router.replace('/(tabs)/today'))}
            />
          </Row>
        )
      }
    >
      <Row gap={16} style={{ marginTop: 16 }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            borderWidth: 6,
            borderColor: c.a,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {g ? <T v="title">{g.overall.toFixed(1)}</T> : <Skeleton w={36} h={22} />}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <T v="micro" muted>
            {placement ? 'Band đầu vào' : 'Band buổi này'}
          </T>
          <T v="title">
            {!g
              ? 'Đang chấm…'
              : prev !== undefined && !placement
                ? deltaText(g.overall - prev)
                : 'Ước lượng theo 4 tiêu chí'}
          </T>
        </View>
      </Row>

      <Card>
        {rows.map(([k, v]) => (
          <Row key={k} gap={10}>
            <T v="caption" weight="semibold" style={{ width: 118 }}>
              {CRITERION_VI[k]} ({k}){k === 'P' ? '*' : ''}
            </T>
            <View style={{ flex: 1 }}>
              <ProgressBar value={v ? (v - 3) / 6 : 0} height={8} />
            </View>
            <T v="headline" style={{ width: 32, textAlign: 'right' }}>
              {v?.toFixed(1) ?? '–'}
            </T>
          </Row>
        ))}
        <T v="caption" muted>
          * Phát âm là ước lượng từ những từ AI nghe sai.
        </T>
      </Card>

      {g?.strengths_vi.length ? (
        <Card variant="tint">
          <T v="headline">Làm tốt</T>
          {g.strengths_vi.map((s) => (
            <T key={s} v="body">
              • {s}
            </T>
          ))}
        </Card>
      ) : null}
      {g?.priorities_vi.length ? (
        <Card>
          <T v="headline">Ưu tiên tuần này</T>
          {g.priorities_vi.map((s) => (
            <T key={s} v="body">
              • {s}
            </T>
          ))}
        </Card>
      ) : null}
      {g ? (
        <Button
          title={turns ? 'Ẩn bản ghi' : 'Xem lại bản ghi buổi nói'}
          variant="text"
          icon="file-text"
          onPress={showTranscript}
        />
      ) : null}
      {turns ? (
        <Card variant="fill">
          {turns.length === 0 ? (
            <T v="caption" muted>
              Chưa tải được bản ghi.
            </T>
          ) : (
            turns.map((t, k) => (
              <T key={k} v="body" color={t.role === 'learner' ? c.a : c.ink}>
                {t.role === 'learner' ? 'Bạn: ' : 'Giám khảo: '}
                {t.text}
              </T>
            ))
          )}
        </Card>
      ) : null}
      {!placement && repairs.length ? (
        <Card variant="outlineAccent">
          <T v="headline">{repairs.length} lỗi mới vào sổ</T>
          <T v="body" muted>
            Sửa ngay bây giờ (nói lại câu đúng 2 lần). Sau đó giám khảo sẽ gài lại sau 1, 3 và 7 ngày cho tới khi bạn
            hết sai.
          </T>
        </Card>
      ) : null}
    </Screen>
  );
}

function deltaText(d: number) {
  if (d > 0) return `Tăng ${d.toFixed(1)} so với lần trước`;
  if (d < 0) return `Giảm ${Math.abs(d).toFixed(1)} so với lần trước`;
  return 'Giữ như lần trước';
}
