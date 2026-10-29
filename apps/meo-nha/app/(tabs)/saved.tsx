import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Button, Chip, Chips, EmptyState, IconButton, ListItem, Row, Screen, SearchField, Segmented, Sheet, T, TextField, Thumb, useLayout, useToast } from '@nam/ui';
import { fold, relativeTime, track } from '@nam/core';
import { categoryOf, tipById } from '../../src/data/tips';
import { RECIPES } from '../../src/data/recipes';
import { useMeo } from '../../src/store';

const FREE_COLLECTIONS = 3;

/** MN-13 · Đã lưu. */
export default function Saved() {
  const L = useLayout();
  const s = useMeo();
  const toast = useToast();
  const [tab, setTab] = useState<'tips' | 'recipes'>('tips');
  const [col, setCol] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [newCol, setNewCol] = useState(false);
  const [colName, setColName] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const tips = useMemo(() => {
    let ids = s.savedTips;
    if (col) ids = s.collections.find((x) => x.id === col)?.tipIds ?? [];
    return ids.map((id) => tipById(id)!).filter(Boolean).filter((t) => !q || fold(t.title).includes(fold(q)));
  }, [s.savedTips, s.collections, col, q]);
  const recipes = RECIPES.filter((r) => s.savedRecipes.includes(r.id));

  const createCol = () => {
    if (s.collections.length >= FREE_COLLECTIONS && !s.noAds) { setNewCol(false); router.push('/paywall'); return; }
    s.addCollection(colName); track('collection_created'); setColName(''); setNewCol(false);
  };

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: L.gutter, gap: 12, paddingTop: 8 }}>
        <Row between><T v="display" accessibilityRole="header">Đã lưu</T><IconButton icon="search" label="Tìm trong đã lưu" onPress={() => setSearching((x) => !x)} /></Row>
        {searching ? <SearchField value={q} onChangeText={setQ} placeholder="Tìm trong mục đã lưu" autoFocus /> : null}
        <Segmented value={tab} onChange={setTab} options={[{ key: 'tips', label: `Mẹo (${s.savedTips.length})` }, { key: 'recipes', label: `Công thức (${recipes.length})` }]} />
        {tab === 'tips' ? (
          <Chips scroll>
            <Chip label="Tất cả" selected={!col} onPress={() => setCol(null)} />
            {s.collections.map((k) => <Chip key={k.id} label={k.name} selected={col === k.id} onPress={() => setCol(k.id)} />)}
            <Chip label="Bộ mới" icon="plus" onPress={() => setNewCol(true)} />
          </Chips>
        ) : null}
      </View>
      {tab === 'tips' ? (
        <FlashList
          data={tips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: L.gutter, paddingBottom: 24 }}
          ListEmptyComponent={<EmptyState icon="bookmark" title="Chưa lưu mẹo nào" body="Nhấn biểu tượng lưu ở mẹo bất kỳ để đọc lại sau." action="Khám phá mẹo" onAction={() => router.push('/(tabs)/explore')} />}
          renderItem={({ item }) => {
            const done = s.doneTips[item.id];
            return (
              <ListItem left={<Thumb icon={categoryOf(item.categoryId).icon} />} title={item.title} subtitle={done ? `Đã làm · ${relativeTime(done)}` : 'Chưa làm'}
                onPress={() => router.push(`/tip/${item.id}`)} right={<IconButton soft={false} icon="more-horizontal" label="Tùy chọn" onPress={() => setMenuFor(item.id)} />} />
            );
          }}
        />
      ) : (
        <FlashList
          data={recipes}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: L.gutter, paddingBottom: 24 }}
          ListEmptyComponent={<EmptyState icon="coffee" title="Chưa lưu công thức" body="Lưu công thức từ “Tủ lạnh có gì?”." />}
          renderItem={({ item }) => <ListItem left={<Thumb icon="coffee" />} title={item.title} subtitle={`${item.minutes} phút`} onPress={() => router.push(`/recipe/${item.id}`)} chevron />}
        />
      )}
      <Sheet visible={newCol} onClose={() => setNewCol(false)} title="Bộ sưu tập mới" footer={<Button title="Tạo" disabled={!colName.trim()} onPress={createCol} />}>
        <TextField label="Tên bộ sưu tập" value={colName} onChangeText={setColName} maxLength={30} autoFocus placeholder="Ví dụ: Dọn bếp" />
        {!s.noAds ? <T v="caption" muted>{`Miễn phí tối đa ${FREE_COLLECTIONS} bộ sưu tập.`}</T> : null}
      </Sheet>
      <Sheet visible={!!menuFor} onClose={() => setMenuFor(null)} title="Tùy chọn">
        <T v="caption" muted>Chuyển vào bộ</T>
        <Chips>{s.collections.map((k) => <Chip key={k.id} label={k.name} onPress={() => { s.moveToCollection(menuFor!, k.id); setMenuFor(null); toast(`Đã chuyển vào “${k.name}”`); }} />)}</Chips>
        <Button title="Bỏ lưu" variant="danger" icon="trash-2" onPress={() => { const id = menuFor!; s.toggleSaveTip(id); setMenuFor(null); track('save_removed'); toast('Đã bỏ lưu', { action: { label: 'Hoàn tác', onPress: () => s.toggleSaveTip(id) } }); }} />
      </Sheet>
    </Screen>
  );
}
