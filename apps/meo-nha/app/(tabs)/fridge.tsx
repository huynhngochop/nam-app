import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Badge, Button, Card, Chip, Chips, EmptyState, ListItem, Row, Screen, SearchField, Sheet, T, Thumb } from '@nam/ui';
import { fold, track } from '@nam/core';
import { ingName, INGREDIENTS, matchRecipes } from '../../src/data/recipes';
import { useMeo } from '../../src/store';

/** MN-09 · Tủ lạnh có gì? Tính món nấu được ngay trên máy. */
export default function Fridge() {
  const pantry = useMeo((s) => s.pantry);
  const toggle = useMeo((s) => s.togglePantry);
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState('');
  const matches = useMemo(() => matchRecipes(pantry), [pantry]);
  const options = INGREDIENTS.filter((i) => !pantry.includes(i.id) && (!q || fold(i.name).includes(fold(q)) || i.aliases.some((a) => a.includes(fold(q)))));
  return (
    <Screen scroll>
      <T v="display" accessibilityRole="header" style={{ paddingTop: 8 }}>Tủ lạnh có gì?</T>
      <Card>
        <Row between>
          <T v="headline" style={{ flex: 1 }}>Nguyên liệu của bạn</T>
          <Button title="Chụp" icon="camera" variant="secondary" size="sm" onPress={() => router.push('/scan')} />
        </Row>
        <Chips>
          {pantry.map((id) => <Chip key={id} label={ingName(id)} selected onRemove={() => toggle(id)} />)}
          <Chip label="+ Thêm" onPress={() => setAddOpen(true)} />
        </Chips>
        <T v="caption" muted>Nhận diện ảnh chạy ngay trên máy, ảnh không gửi đi.</T>
      </Card>
      {!pantry.length ? (
        <EmptyState icon="archive" title="Tủ lạnh của bạn có gì?" body="Chụp hoặc chọn nguyên liệu để xem món nấu được ngay." action="Chụp nguyên liệu" onAction={() => router.push('/scan')} />
      ) : (
        <>
          <Row between><T v="title">Nấu được ngay</T><T v="caption" muted>{matches.length} món</T></Row>
          {matches.map((m) => {
            const full = !m.missing.length;
            return (
              <ListItem key={m.recipe.id} left={<Thumb icon="coffee" />} title={m.recipe.title}
                subtitle={`${m.recipe.minutes} phút · ${full ? 'Dễ' : `Thiếu: ${m.missing.map(ingName).join(', ')}`}`}
                right={full ? <Badge label={`Đủ ${m.have}/${m.total}`} tone="positive" /> : <Badge label={`${m.have}/${m.total}`} />}
                onPress={() => { track('recipe_opened', { from: 'fridge', have: m.have, total: m.total }); router.push(`/recipe/${m.recipe.id}`); }} />
            );
          })}
        </>
      )}
      <Sheet visible={addOpen} onClose={() => { setAddOpen(false); setQ(''); }} title="Thêm nguyên liệu">
        <SearchField value={q} onChangeText={setQ} placeholder="Tìm nguyên liệu" />
        <Chips>{options.map((i) => <Chip key={i.id} label={i.name} onPress={() => { toggle(i.id); track('pantry_updated', { count: pantry.length + 1 }); }} />)}</Chips>
        {!options.length ? <T v="caption" muted>Không còn nguyên liệu phù hợp.</T> : null}
      </Sheet>
    </Screen>
  );
}
