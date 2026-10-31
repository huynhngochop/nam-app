import React, { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  AppBar,
  Badge,
  Chip,
  Chips,
  EmptyState,
  Icon,
  Row,
  Screen,
  SectionHeader,
  SearchField,
  T,
  useTheme,
} from '@nam/ui';
import { track } from '@nam/core';
import { search } from '../src/lib/search';
import { useTT } from '../src/store';

const SUGGEST = ['ông Táo', 'giỗ đầu', 'hương cháy', 'nhập trạch', 'Thần tài', 'Vu Lan', 'hóa vàng', 'mâm ngũ quả'];

/** TT-06 · Tìm kiếm trên máy: không dấu, có từ đồng nghĩa. */
export default function Search() {
  const { c } = useTheme();
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const recent = useTT((s) => s.recentSearches);
  const addSearch = useTT((s) => s.addSearch);
  const removeSearch = useTT((s) => s.removeSearch);
  const results = useMemo(() => search(dq), [dq]);
  const go = (href: string) => {
    if (q.trim()) {
      addSearch(q.trim());
      track('search', { len: q.trim().length, hits: results.length });
    }
    router.push(href as never);
  };

  return (
    <Screen>
      <AppBar onBack={() => router.back()} title="Tìm kiếm" />
      <SearchField
        value={q}
        onChangeText={setQ}
        placeholder="Ví dụ: cúng ông Táo, giỗ đầu…"
        autoFocus
        onSubmit={() => q.trim() && addSearch(q.trim())}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 4, paddingBottom: 24 }}>
        {dq.trim().length < 2 ? (
          <>
            {recent.length ? (
              <>
                <SectionHeader title="Tìm gần đây" />
                <Chips>
                  {recent.map((r) => (
                    <Chip key={r} label={r} icon="clock" onPress={() => setQ(r)} />
                  ))}
                </Chips>
              </>
            ) : null}
            <SectionHeader title="Gợi ý" />
            <Chips>
              {SUGGEST.map((s) => (
                <Chip key={s} label={s} onPress={() => setQ(s)} />
              ))}
            </Chips>
          </>
        ) : results.length === 0 ? (
          <EmptyState
            icon="search"
            title="Chưa có kết quả"
            body="Thử từ khác, ví dụ: rằm, giỗ, Thần tài. Thư viện đang được bổ sung thêm."
          />
        ) : (
          results.map((r) => (
            <Pressable
              key={`${r.type}-${r.id}`}
              onPress={() => go(r.href)}
              onLongPress={() => removeSearch(q)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 60,
                paddingVertical: 8,
                borderBottomWidth: 0.5,
                borderColor: c.line,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Row gap={8}>
                  <Badge label={r.type} tone={r.type === 'Lễ' ? 'accent' : 'neutral'} />
                </Row>
                <T v="headline" numberOfLines={2}>
                  {r.title}
                </T>
                <T v="caption" muted numberOfLines={1}>
                  {r.sub}
                </T>
              </View>
              <Icon name="chevron-right" size={18} color={c.inkMuted} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
