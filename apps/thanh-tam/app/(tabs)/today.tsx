import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Icon,
  Row,
  Screen,
  SearchField,
  SectionHeader,
  T,
  Thumb,
  useLayout,
  useTheme,
} from '@nam/ui';
import { greeting } from '@nam/core';
import { useTT } from '../../src/store';
import { useFamilyYearCard, useUpcoming } from '../../src/hooks';
import { ritualById } from '../../src/data/rituals';
import { TIPS } from '../../src/data/signs';
import { LunarCard, inDays, solarWithWeekday } from '../../src/components';
import { canChiYear, lunarOf, lunarShort } from '../../src/calendar/lunar';

/** TT-04 · Hôm nay. Không quảng cáo. */
export default function Today() {
  const { c } = useTheme();
  const L = useLayout();
  const tinChu = useTT((s) => s.household.tinChu);
  const firstTime = useTT((s) => s.prayLogs.length === 0 && !s.firstTimeDismissed);
  const set = useTT((s) => s.set);
  const { today, rituals, gios } = useUpcoming(30);
  const fam = useFamilyYearCard();
  const todays = rituals.filter((r) => r.days === 0);
  const later = rituals.filter((r) => r.days > 0).slice(0, 5);
  const tip = TIPS[(today.getDate() + today.getMonth()) % TIPS.length];

  const header = (
    <Row between style={{ minHeight: 56 }}>
      <View style={{ flex: 1 }}>
        <T v="caption" muted>
          {greeting()}
        </T>
        <T v="title" numberOfLines={1}>
          {tinChu ? tinChu.split(' ').pop() : 'Thành Tâm'}
        </T>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trang cá nhân"
        onPress={() => router.push('/me')}
        hitSlop={8}
      >
        <Avatar name={tinChu || 'T T'} size={40} soft />
      </Pressable>
    </Row>
  );

  const todayBlock = todays.length
    ? todays.map((u) => {
        const r = ritualById(u.id)!;
        return (
          <Card key={u.id} variant="outlineAccent">
            <Row gap={12}>
              <Thumb icon={r.icon} />
              <View style={{ flex: 1 }}>
                <Badge label="Hôm nay" tone="accent" />
                <T v="title">{r.title}</T>
              </View>
            </Row>
            <T v="body" muted numberOfLines={2}>
              {r.summary}
            </T>
            <Row gap={8}>
              <Button
                title="Lễ vật"
                variant="secondary"
                size="md"
                icon="check-square"
                onPress={() => router.push(`/ritual/${r.id}/offerings`)}
              />
              <Button
                title="Văn khấn"
                size="md"
                icon="book-open"
                onPress={() => router.push(`/ritual/${r.id}/prayer`)}
              />
            </Row>
          </Card>
        );
      })
    : null;

  const upcoming = (
    <View>
      <SectionHeader title="Sắp tới" action="Xem lịch" onAction={() => router.push('/(tabs)/calendar')} />
      <Card style={{ paddingVertical: 4 }}>
        {later.length === 0 && gios.length === 0 ? (
          <T v="body" muted style={{ paddingVertical: 12 }}>
            Ba mươi ngày tới chưa có lễ nào.
          </T>
        ) : null}
        {[
          ...later.map((u) => ({
            k: `r-${u.id}`,
            title: u.title,
            date: u.date,
            days: u.days,
            icon: ritualById(u.id)!.icon,
            go: `/ritual/${u.id}`,
          })),
          ...gios.slice(0, 3).map((g) => ({
            k: `g-${g.a.id}`,
            title: `Giỗ ${g.a.relation.toLowerCase()} ${g.a.name}`,
            date: g.date,
            days: g.days,
            icon: 'users' as const,
            go: '/anniversaries',
          })),
        ]
          .sort((a, b) => a.days - b.days)
          .map((x, i, arr) => (
            <Pressable
              key={x.k}
              onPress={() => router.push(x.go as never)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 60,
                paddingVertical: 8,
                borderBottomWidth: i < arr.length - 1 ? 0.5 : 0,
                borderColor: c.line,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Thumb icon={x.icon} size={36} />
              <View style={{ flex: 1 }}>
                <T v="headline" numberOfLines={1}>
                  {x.title}
                </T>
                <T v="caption" muted>
                  {solarWithWeekday(x.date)} · {lunarShort(lunarOf(x.date))}
                </T>
              </View>
              <T v="caption" accent weight="semibold" style={{ flexShrink: 0, maxWidth: '40%', textAlign: 'right' }}>
                {inDays(x.days)}
              </T>
            </Pressable>
          ))}
      </Card>
    </View>
  );

  const side = (
    <View style={{ gap: 12 }}>
      {fam.show ? (
        <Card
          variant="tint"
          onPress={() => router.push('/age')}
          accessibilityLabel={`Năm ${canChiYear(fam.year)} của nhà mình`}
        >
          <Row gap={10}>
            <Icon name="star" color={c.a} />
            <T v="headline" style={{ flex: 1 }}>
              Năm {canChiYear(fam.year)} của nhà mình
            </T>
            <Icon name="chevron-right" color={c.inkMuted} />
          </Row>
          <T v="caption" muted numberOfLines={3}>
            {fam.namTuoi.length ? `${fam.namTuoi.map((p) => p.short || p.name).join(', ')} gặp năm tuổi. ` : ''}Xem
            tuổi, sao, vận hạn và lời khuyên cho từng người, theo lịch dân gian.
          </T>
        </Card>
      ) : null}
      {firstTime ? (
        <Card>
          <Row between>
            <T v="headline">Lần đầu lập bàn thờ?</T>
            <Pressable hitSlop={10} accessibilityLabel="Ẩn gợi ý" onPress={() => set({ firstTimeDismissed: true })}>
              <Icon name="x" size={18} color={c.inkMuted} />
            </Pressable>
          </Row>
          <T v="caption" muted numberOfLines={3}>
            Hướng dẫn an vị bát hương, chọn chỗ đặt, lễ vật tối giản cho nhà mới ra ở riêng.
          </T>
          <Button
            title="Xem hướng dẫn"
            variant="secondary"
            size="md"
            onPress={() => router.push('/ritual/an-vi-bat-huong')}
          />
        </Card>
      ) : null}
      <SectionHeader title="Mẹo hôm nay" />
      <Card onPress={() => router.push(`/tip/${tip.id}`)} accessibilityLabel={tip.title}>
        <T v="headline">{tip.title}</T>
        <T v="body" muted numberOfLines={3}>
          {tip.summary}
        </T>
        <T v="caption" accent weight="semibold">
          Xem thêm
        </T>
      </Card>
      <Card onPress={() => router.push('/anniversaries')} accessibilityLabel="Sổ giỗ">
        <Row gap={10}>
          <Icon name="book" color={c.a} />
          <T v="headline" style={{ flex: 1 }}>
            Sổ giỗ
          </T>
          <Icon name="chevron-right" color={c.inkMuted} />
        </Row>
        <T v="caption" muted>
          {gios.length
            ? `${gios.length} ngày giỗ trong 30 ngày tới`
            : 'Ghi ngày giỗ âm lịch, được nhắc trước 7, 3, 1 ngày.'}
        </T>
      </Card>
    </View>
  );

  return (
    <Screen scroll readable={false}>
      <View style={{ width: '100%', maxWidth: L.twoPane ? 1100 : L.readableWidth, alignSelf: 'center', gap: 12 }}>
        {header}
        <SearchField placeholder="Tìm lễ, văn khấn, điềm báo…" onPress={() => router.push('/search')} />
        {L.isCompact ? (
          <>
            <LunarCard date={today} onPress={() => router.push('/(tabs)/calendar')} />
            {todayBlock}
            {upcoming}
            {side}
          </>
        ) : (
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            <View style={{ flex: 1.2, gap: 12 }}>
              <LunarCard date={today} onPress={() => router.push('/(tabs)/calendar')} />
              {todayBlock}
              {upcoming}
            </View>
            <View style={{ flex: 1, gap: 12 }}>{side}</View>
          </View>
        )}
      </View>
    </Screen>
  );
}
