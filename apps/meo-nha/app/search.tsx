import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Button, Chip, Chips, EmptyState, Icon, IconButton, ListItem, Row, Screen, SearchField, SectionHeader, Sheet, T, Thumb, useLayout, useTheme } from '@nam/ui';
import { track } from '@nam/core';
import { CATEGORIES, CategoryId, Tip } from '../src/data/tips';
import { useMeo } from '../src/store';
import { looksLikeQuestion, searchTips, SortKey, suggestions, TRENDING } from '../src/lib/search';
import { AdNative, TipRow } from '../src/components';

const SORTS: { key: SortKey; label: string }[] = [{ key: 'popular', label: 'Phổ biến' }, { key: 'new', label: 'Mới nhất' }, { key: 'rating', label: 'Đánh giá cao' }];

/** MN-05 Tìm kiếm + MN-06 Kết quả trên cùng một màn: gõ → gợi ý; nhấn Tìm → kết quả. */
export default function Search() {
  const { c } = useTheme();
  const L = useLayout();
  const s = useMeo();
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [sortOpen, setSortOpen] = useState(false);

  const sugg = useMemo(() => suggestions(q), [q]);
  const results = useMemo(() => (submitted ? searchTips(submitted, { category: cat, sort }) : []), [submitted, cat, sort]);
  const cats = useMemo(() => CATEGORIES.filter((k) => searchTips(submitted).some((t) => t.categoryId === k.id)), [submitted]);

  const run = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setQ(t); setSubmitted(t); s.addSearch(t);
    track('search_performed', { query: t });
  };

  const ask = looksLikeQuestion(q);
  const rows: (Tip | 'ad')[] = [];
  results.forEach((t, i) => { rows.push(t); if (i === 1 || (i > 1 && (i - 1) % 8 === 0)) rows.push('ad'); });

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: L.gutter, gap: 12, paddingTop: 8 }}>
        <Row>
          <IconButton icon="chevron-left" label="Quay lại" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <SearchField value={q} onChangeText={(t) => { setQ(t); if (!t) setSubmitted(''); }} placeholder="Tìm mẹo…" autoFocus onSubmit={() => run(q)} />
          </View>
        </Row>
      </View>
      {!submitted ? (
        <FlashList
          data={[0]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: L.gutter }}
          renderItem={() => (
            <View>
              {q.length >= 2 && ask ? (
                <ListItem left={<Thumb icon="message-circle" />} title={`Hỏi Mẹo Nhà: “${q}”`} titleColor={c.a} onPress={() => router.push({ pathname: '/ask', params: { q } })} />
              ) : null}
              {q.length >= 2 ? sugg.map((t) => (
                <ListItem key={t} strong={false} left={<Thumb icon="search" bg={c.surface2} color={c.inkMuted} size={32} />} title={t} onPress={() => run(t)} />
              )) : null}
              {q.length >= 2 && !sugg.length && !ask ? <T v="caption" muted style={{ paddingVertical: 12 }}>Nhấn Tìm để xem kết quả cho “{q}”</T> : null}
              {q.length < 2 ? (
                <>
                  {s.recentSearches.length ? <SectionHeader title="Tìm gần đây" action="Xóa hết" onAction={() => s.set({ recentSearches: [] })} /> : null}
                  {s.recentSearches.slice(0, 5).map((r) => (
                    <ListItem key={r} strong={false} left={<Thumb icon="clock" bg={c.surface2} color={c.inkMuted} size={32} />} title={r} onPress={() => run(r)}
                      right={<IconButton soft={false} icon="x" label="Xóa" onPress={() => s.removeSearch(r)} />} />
                  ))}
                  <SectionHeader title="Đang được tìm nhiều" />
                  <Chips>{TRENDING.map((t) => <Chip key={t} label={t} onPress={() => run(t)} />)}</Chips>
                </>
              ) : null}
            </View>
          )}
        />
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r, i) => (r === 'ad' ? `ad${i}` : r.id)}
          getItemType={(r) => (r === 'ad' ? 'ad' : 'tip')}
          contentContainerStyle={{ paddingHorizontal: L.gutter, paddingBottom: 24 }}
          ListHeaderComponent={
            <View style={{ gap: 10, paddingVertical: 10 }}>
              <Chips scroll>
                <Chip label="Tất cả" selected={cat === 'all'} onPress={() => setCat('all')} />
                {cats.map((k) => <Chip key={k.id} label={k.name} selected={cat === k.id} onPress={() => setCat(k.id)} />)}
              </Chips>
              <Row between>
                <T v="caption" muted>{results.length} mẹo</T>
                <Button title={SORTS.find((x) => x.key === sort)!.label} variant="text" size="sm" icon="chevron-down" onPress={() => setSortOpen(true)} />
              </Row>
            </View>
          }
          ListEmptyComponent={<EmptyState icon="search" title={`Chưa có mẹo cho “${submitted}”`} body="Thử từ khác, hoặc hỏi Mẹo Nhà bằng câu đầy đủ." action="Hỏi Mẹo Nhà" onAction={() => router.push({ pathname: '/ask', params: { q: submitted } })} />}
          renderItem={({ item }) => (item === 'ad' ? <View style={{ paddingVertical: 8 }}><AdNative /></View> : <TipRow tip={item} />)}
        />
      )}
      <Sheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sắp xếp">
        {SORTS.map((o) => (
          <ListItem key={o.key} title={o.label} strong={false} right={sort === o.key ? <Icon name="check" color={c.a} /> : undefined} onPress={() => { setSort(o.key); setSortOpen(false); }} />
        ))}
      </Sheet>
    </Screen>
  );
}
