import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { relativeTime } from '@nam/core';
import { AppBar, Badge, Button, Card, EmptyState, Icon, Row, Screen, T, useTheme } from '@nam/ui';
import { fetchErrorEvents, serverEnabled, type ErrorEvent } from '../../src/api';
import { milestones, statusLabel } from '../../src/loop';
import { CRITERION_VI } from '../../src/plan';
import { useEmma } from '../../src/store';

const EVENT_VI: Record<string, string> = {
  caught: 'Bắt lỗi',
  repair_ok: 'Sửa ngay · nói đúng',
  repair_fail: 'Sửa ngay · chưa đúng',
  recall_ok: 'Gài lại · tự dùng đúng',
  recall_fail: 'Gài lại · sai lại',
};

/** 15 · Hồ sơ một lỗi: hành trình qua vòng sửa lỗi + lịch sử từng lần. */
export default function ErrorDetail() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = useEmma((s) => s.errors.find((x) => x.id === id));
  const [events, setEvents] = useState<ErrorEvent[] | null>(null);

  useEffect(() => {
    if (!serverEnabled() || !id) return;
    let alive = true;
    fetchErrorEvents(id)
      .then((r) => alive && setEvents(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  if (!e)
    return (
      <Screen>
        <AppBar onBack={() => router.back()} />
        <EmptyState icon="search" title="Không tìm thấy lỗi này" />
      </Screen>
    );
  const st = statusLabel(e);
  const steps = milestones(e);

  return (
    <Screen
      scroll
      footer={
        e.status === 'repairing' ? (
          <Button
            title="Sửa ngay"
            icon="mic"
            onPress={() => router.push({ pathname: '/repair', params: { id: e.id } })}
          />
        ) : null
      }
    >
      <AppBar onBack={() => router.back()} />
      <T v="micro" accent>
        {CRITERION_VI[e.category]}
        {e.code ? ` · mã ${e.code}` : ''}
      </T>
      <T v="title">{e.right_text}</T>
      <Row gap={8}>
        <Badge label={st.label} tone={st.tone} />
        {e.next_due_at ? (
          <T v="caption" muted>
            Lần kiểm tra tới: {new Date(e.next_due_at).toLocaleDateString('vi-VN')}
          </T>
        ) : null}
      </Row>

      <Card>
        <T v="headline">Hành trình của lỗi</T>
        {steps.map((m) => (
          <Row key={m.label} gap={10}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: m.state === 'done' ? c.at : 'transparent',
                borderWidth: m.state === 'next' ? 2 : m.state === 'todo' ? 1 : 0,
                borderStyle: m.state === 'next' ? 'dashed' : 'solid',
                borderColor: m.state === 'next' ? c.a : c.line,
              }}
            >
              {m.state === 'done' ? <Icon name="check" size={13} color={c.positive} /> : null}
            </View>
            <T v="body" color={m.state === 'todo' ? c.inkMuted : m.state === 'next' ? c.a : c.ink}>
              {m.label}
            </T>
          </Row>
        ))}
        <T v="caption" muted>
          Đúng 3 lần liên tiếp khi bị gài thì đóng lỗi. Sai lại thì quay về mốc 1 ngày.
        </T>
      </Card>

      <Card variant="fill">
        <T v="micro" muted>
          Bạn đã nói
        </T>
        <T v="body" style={{ textDecorationLine: 'line-through' }}>
          {e.wrong_text}
        </T>
        {e.band7_text ? (
          <>
            <T v="micro" muted>
              Câu nâng cấp của bạn
            </T>
            <T v="body">“{e.band7_text}”</T>
          </>
        ) : null}
      </Card>
      {e.explain_vi ? (
        <Card variant="tint">
          <T v="headline">So với tiếng Việt</T>
          <T v="body">{e.explain_vi}</T>
        </Card>
      ) : null}

      {events?.length ? (
        <Card>
          <T v="headline">Lịch sử</T>
          {events.map((ev, k) => (
            <Row key={k} between>
              <T v="body">{EVENT_VI[ev.kind] ?? ev.kind}</T>
              <T v="caption" muted>
                {relativeTime(ev.created_at)}
              </T>
            </Row>
          ))}
        </Card>
      ) : null}
      <T v="caption" muted>
        Đã mắc {e.occurrences} lần
      </T>
    </Screen>
  );
}
