import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import {
  AppBar,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Row,
  Screen,
  SectionHeader,
  Segmented,
  T,
  useTheme,
  useToast,
} from '@nam/ui';
import { track } from '@nam/core';
import { GROUPS, offeringsFor, ritualById } from '../data/rituals';
import { prayerById } from '../data/prayers';
import { tipById } from '../data/signs';
import { useTT } from '../store';
import { NavRow, SafetyCard, Sources, inDays, solarWithWeekday } from '../components';
import { nextByRule, daysBetween } from '../lib/schedule';
import { useToday } from '../hooks';
import { lunarOf, lunarShort } from '../calendar/lunar';

/** TT-07 · Chi tiết lễ. Dùng làm trang riêng (điện thoại) và cột phải (tablet ngang). */
export function RitualDetail({ id, embedded }: { id: string; embedded?: boolean }) {
  const { c } = useTheme();
  const toast = useToast();
  const r = ritualById(id);
  const hh = useTT((s) => s.household);
  const level = useTT((s) => s.levelByRitual[id] ?? 'day-du');
  const set = useTT((s) => s.set);
  const levelBy = useTT((s) => s.levelByRitual);
  const saved = useTT((s) => s.saves.includes(`ritual:${id}`));
  const toggleSave = useTT((s) => s.toggleSave);
  const today = useToday();
  const [tab, setTab] = useState<'cach' | 'y'>('cach');
  if (!r) {
    return (
      <Screen>
        <AppBar onBack={embedded ? undefined : () => router.back()} />
        <EmptyState
          icon="book-open"
          title="Không tìm thấy lễ này"
          action="Về danh sách"
          onAction={() => router.replace('/(tabs)/rituals')}
        />
      </Screen>
    );
  }
  const simple = level === 'gian-di';
  const offerings = offeringsFor(r, hh.region, hh.diet, simple);
  const next = r.when.rule ? nextByRule(r.when.rule, today) : null;
  const hasFire = r.steps.some((s) => s.fire) || r.afterSteps.some((s) => s.fire);
  const group = GROUPS.find((g) => g.id === r.group);

  return (
    <Screen
      scroll
      edges={embedded ? [] : ['top']}
      footer={
        <Row gap={8}>
          <Button
            title="Lễ vật"
            variant="secondary"
            icon="check-square"
            onPress={() => router.push(`/ritual/${r.id}/offerings`)}
          />
          <Button title="Văn khấn" icon="book-open" onPress={() => router.push(`/ritual/${r.id}/prayer`)} />
        </Row>
      }
    >
      <AppBar
        onBack={embedded ? undefined : () => router.back()}
        right={
          <>
            <IconButton
              icon="share"
              label="Chia sẻ"
              onPress={() =>
                Share.share({ message: `${r.title}: ${r.summary}\nhttps://thanhtam.app/le/${r.id}` }).catch(() => {})
              }
            />
            <IconButton
              icon="bookmark"
              label={saved ? 'Bỏ lưu' : 'Lưu'}
              color={saved ? c.a : undefined}
              onPress={() => {
                const on = toggleSave(`ritual:${r.id}`);
                toast(on ? 'Đã lưu' : 'Đã bỏ lưu');
                track('ritual_saved', { id: r.id, on });
              }}
            />
          </>
        }
      />
      {group ? <Badge label={group.name} tone="accent" /> : null}
      <T v="display" accessibilityRole="header">
        {r.title}
      </T>
      <T v="body" muted>
        {r.summary}
      </T>
      <Card variant="tint">
        <Row gap={16} wrap>
          <View style={{ flex: 1, minWidth: 140 }}>
            <T v="micro" muted>
              Khi nào
            </T>
            <T v="body">{r.when.text}</T>
            {next ? (
              <T v="caption" accent weight="semibold">
                Lần tới: {inDays(daysBetween(today, next))} · {solarWithWeekday(next)} · {lunarShort(lunarOf(next))}
              </T>
            ) : null}
          </View>
          <View style={{ minWidth: 100 }}>
            <T v="micro" muted>
              Thời gian
            </T>
            <T v="body">Khoảng {r.minutes} phút</T>
          </View>
        </Row>
        <T v="caption" muted>
          Cúng ở: {r.where.join(', ')}
        </T>
      </Card>

      <Segmented
        options={[
          { key: 'day-du', label: 'Lễ đầy đủ' },
          { key: 'gian-di', label: 'Lễ giản dị' },
        ]}
        value={level}
        onChange={(k) => set({ levelByRitual: { ...levelBy, [r.id]: k as 'day-du' | 'gian-di' } })}
      />
      {simple ? (
        <T v="caption" muted>
          Tâm thành là chính. Lễ giản dị vẫn trọn vẹn.
        </T>
      ) : null}

      <SectionHeader
        title={`Lễ vật (${offerings.length})`}
        action="Chuẩn bị"
        onAction={() => router.push(`/ritual/${r.id}/offerings`)}
      />
      <Card>
        {offerings.slice(0, 6).map((o) => (
          <Row key={o.name} gap={8} style={{ alignItems: 'flex-start' }}>
            <T v="body" accent>
              •
            </T>
            <T v="body" style={{ flex: 1 }} color={o.avoid ? c.inkMuted : undefined}>
              {o.name}
              {o.optional ? ' (nếu có)' : ''}
              {o.note ? ` · ${o.note}` : ''}
            </T>
          </Row>
        ))}
        {offerings.length > 6 ? (
          <T v="caption" accent weight="semibold" onPress={() => router.push(`/ritual/${r.id}/offerings`)}>
            Xem cả {offerings.length} món
          </T>
        ) : null}
        {r.variantNote && !simple ? (
          <T v="caption" muted>
            {r.variantNote}
          </T>
        ) : null}
      </Card>

      <Segmented
        options={[
          { key: 'cach', label: 'Các bước' },
          { key: 'y', label: 'Ý nghĩa' },
        ]}
        value={tab}
        onChange={(k) => setTab(k as 'cach' | 'y')}
      />
      {tab === 'cach' ? (
        <Card>
          {r.steps.map((s, i) => (
            <Row key={s.title} gap={12} style={{ alignItems: 'flex-start', paddingVertical: 4 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: c.at,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <T v="caption" accent weight="bold">
                  {i + 1}
                </T>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="headline">{s.title}</T>
                <T v="body" muted>
                  {s.text}
                </T>
              </View>
            </Row>
          ))}
        </Card>
      ) : (
        <Card>
          <T v="body">{r.meaning}</T>
        </Card>
      )}
      {hasFire ? <SafetyCard /> : null}
      {r.cautions?.length ? (
        <Card>
          <T v="headline">Lưu ý</T>
          {r.cautions.map((x) => (
            <T key={x} v="body" muted>
              • {x}
            </T>
          ))}
        </Card>
      ) : null}

      <SectionHeader title="Văn khấn" />
      <Card style={{ paddingVertical: 4 }}>
        {r.prayers.map((pid) => {
          const p = prayerById(pid);
          return p ? (
            <NavRow
              key={pid}
              icon="book-open"
              title={p.title}
              subtitle={`Khoảng ${p.minutes} phút`}
              href={`/ritual/${r.id}/prayer?prayerId=${pid}`}
            />
          ) : null;
        })}
      </Card>

      {r.tips?.length ? (
        <>
          <SectionHeader title="Mẹo" />
          <Card style={{ paddingVertical: 4 }}>
            {r.tips.map((tid) => {
              const t = tipById(tid);
              return t ? (
                <NavRow key={tid} icon="zap" title={t.title} subtitle={t.summary} href={`/tip/${tid}`} />
              ) : null;
            })}
          </Card>
        </>
      ) : null}
      <Sources sources={r.sources} />
      <T v="caption" muted>
        Tục lệ mỗi miền, mỗi nhà một khác. Theo nếp nhà mình nếu đã có.
      </T>
    </Screen>
  );
}
