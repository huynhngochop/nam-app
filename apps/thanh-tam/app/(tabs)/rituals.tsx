import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  Chip,
  Chips,
  EmptyState,
  Icon,
  Screen,
  SearchField,
  SectionHeader,
  T,
  Thumb,
  TwoPane,
  useLayout,
  useTheme,
} from '@nam/ui';
import { GROUPS, RITUALS } from '../../src/data/rituals';
import type { Ritual, RitualGroup } from '../../src/data/types';
import { useRitualFilter } from '../../src/hooks';
import { RitualDetail } from '../../src/screens/RitualDetail';

const POPULAR = ['mung-1-ram', 'gio-thuong', 'ong-cong-ong-tao', 'giao-thua', 'than-tai-hang-ngay', 'nhap-trach'];

/** TT-05 · Bài cúng. Tablet ngang / máy gập mở ngang: danh sách bên trái, chi tiết bên phải. */
export default function Rituals() {
  const { c } = useTheme();
  const L = useLayout();
  const relevant = useRitualFilter();
  const [group, setGroup] = useState<RitualGroup | 'all'>('all');
  const [picked, setPicked] = useState<string>(POPULAR[0]);
  const open = (id: string) => (L.twoPane ? setPicked(id) : router.push(`/ritual/${id}`));

  const sections = useMemo(() => {
    const groups = GROUPS.filter((g) => group === 'all' || g.id === group);
    return groups.map((g) => ({ g, items: RITUALS.filter((r) => r.group === g.id) })).filter((s) => s.items.length);
  }, [group]);

  const item = (r: Ritual) => {
    const sel = L.twoPane && picked === r.id;
    return (
      <Pressable
        key={r.id}
        onPress={() => open(r.id)}
        accessibilityRole="button"
        accessibilityState={{ selected: sel }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minHeight: 64,
          paddingVertical: 8,
          paddingHorizontal: 8,
          borderRadius: 12,
          backgroundColor: sel ? c.at : 'transparent',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Thumb icon={r.icon} />
        <View style={{ flex: 1, gap: 2 }}>
          <T v="headline" numberOfLines={2}>
            {r.title}
          </T>
          <T v="caption" muted numberOfLines={1}>
            {r.when.text}
          </T>
        </View>
        {!relevant(r) ? (
          <T v="caption" muted>
            Ban Thần tài
          </T>
        ) : null}
        <Icon name="chevron-right" size={18} color={c.inkMuted} />
      </Pressable>
    );
  };

  const list = (
    <Screen readable={!L.twoPane} padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: L.gutter, paddingBottom: 24, gap: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        <T v="display" accessibilityRole="header" style={{ marginTop: 8 }}>
          Bài cúng
        </T>
        <SearchField placeholder="Tìm lễ, văn khấn…" onPress={() => router.push('/search')} />
        <Chips scroll>
          <Chip label="Tất cả" selected={group === 'all'} onPress={() => setGroup('all')} />
          {GROUPS.filter((g) => RITUALS.some((r) => r.group === g.id)).map((g) => (
            <Chip key={g.id} label={g.name} icon={g.icon} selected={group === g.id} onPress={() => setGroup(g.id)} />
          ))}
        </Chips>
        {group === 'all' ? (
          <>
            <SectionHeader title="Hay cúng nhất" />
            {POPULAR.map((id) => RITUALS.find((r) => r.id === id))
              .filter((r): r is Ritual => !!r)
              .map(item)}
          </>
        ) : null}
        {sections.map(({ g, items }) => (
          <View key={g.id}>
            <SectionHeader title={g.name} />
            {items.map(item)}
          </View>
        ))}
        {!sections.length ? <EmptyState icon="book-open" title="Nhóm này đang được biên soạn" /> : null}
      </ScrollView>
    </Screen>
  );

  return <TwoPane list={list} detail={<RitualDetail key={picked} id={picked} embedded />} listWidth={0.4} />;
}
