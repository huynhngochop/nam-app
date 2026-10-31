import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { AppBar, Card, Chip, Chips, IconButton, Row, Screen, Segmented, T, Thumb, useLayout, useTheme } from '@nam/ui';
import { CATEGORIES, CategoryId, TIPS } from '../../src/data/tips';
import { TipRow } from '../../src/components';

type Sort = 'popular' | 'new' | 'easy';

/** MN-07 · Danh mục. */
export default function Category() {
  const { id } = useLocalSearchParams<{ id: CategoryId }>();
  const { c } = useTheme();
  const L = useLayout();
  const cat = CATEGORIES.find((x) => x.id === id) ?? CATEGORIES[0];
  const [sub, setSub] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('popular');
  const list = useMemo(() => {
    let l = TIPS.filter((t) => t.categoryId === cat.id && (!sub || t.sub === sub));
    l = [...l].sort((a, b) =>
      sort === 'easy'
        ? a.minutes - b.minutes
        : sort === 'new'
          ? b.id.localeCompare(a.id)
          : b.ratingCount - a.ratingCount,
    );
    return l;
  }, [cat.id, sub, sort]);
  return (
    <Screen padded={false}>
      <FlashList
        data={list}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: L.gutter, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingBottom: 8 }}>
            <AppBar
              onBack={() => router.back()}
              right={<IconButton icon="search" label="Tìm" onPress={() => router.push('/search')} />}
            />
            <Card variant="tint">
              <Row gap={12}>
                <Thumb icon={cat.icon} bg={c.surface} color={cat.id === 'plants' ? c.a2 : c.a} />
                <View>
                  <T v="title">{cat.name}</T>
                  <T v="caption">{`${TIPS.filter((t) => t.categoryId === cat.id).length} mẹo · cập nhật hằng tuần`}</T>
                </View>
              </Row>
            </Card>
            <Chips>
              {cat.subs.map((s) => (
                <Chip key={s} label={s} selected={sub === s} onPress={() => setSub(sub === s ? null : s)} />
              ))}
            </Chips>
            <Segmented
              value={sort}
              onChange={setSort}
              options={[
                { key: 'popular', label: 'Phổ biến' },
                { key: 'new', label: 'Mới nhất' },
                { key: 'easy', label: 'Dễ làm' },
              ]}
            />
          </View>
        }
        renderItem={({ item }) => (
          <TipRow tip={item} meta={`${item.rating.toString().replace('.', ',')} ★ · ${item.steps.length} bước`} />
        )}
      />
    </Screen>
  );
}
