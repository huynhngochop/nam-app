import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Chip, Chips, EmptyState, Icon, IconButton, Row, Screen, Stepper, T, useLayout, useTheme, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { ingName, RECIPES } from '../../src/data/recipes';
import { useMeo } from '../../src/store';
import { IngredientChecklist } from '../../src/components';

const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** MN-11 · Chi tiết công thức. Tablet: nguyên liệu và các bước chia hai cột. */
export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const L = useLayout();
  const toast = useToast();
  const r = RECIPES.find((x) => x.id === id);
  const pantry = useMeo((s) => s.pantry);
  const saved = useMeo((s) => (r ? s.savedRecipes.includes(r.id) : false));
  const toggleSave = useMeo((s) => s.toggleSaveRecipe);
  const [servings, setServings] = useState(r?.baseServings ?? 2);
  const items = useMemo(() => (r ? r.ingredients.map((i) => ({ id: i.id, name: ingName(i.id), qty: `${fmtQty((i.qty * servings) / r.baseServings)} ${i.unit}`, have: pantry.includes(i.id) })) : []), [r, servings, pantry]);
  if (!r) return <Screen><EmptyState icon="alert-circle" title="Không tìm thấy công thức" action="Quay lại" onAction={() => router.back()} /></Screen>;
  const missing = items.filter((i) => !i.have);
  const steps = (
    <View style={{ gap: 8 }}>
      <T v="headline">Các bước</T>
      {r.steps.map((s, i) => (
        <Row key={i} style={{ alignItems: 'flex-start' }} gap={10}>
          <T v="headline" accent style={{ width: 22 }}>{i + 1}</T>
          <View style={{ flex: 1 }}>{s.title ? <T v="micro" accent>{s.title}</T> : null}<T v="body">{s.text}</T></View>
        </Row>
      ))}
    </View>
  );
  return (
    <Screen scroll readable={!L.twoPane} footer={<Button title="Bắt đầu nấu" icon="play" onPress={() => { track('cook_started', { recipeId: r.id }); router.push(`/cook/${r.id}`); }} />}>
      <View style={{ height: 160, marginHorizontal: -L.gutter, backgroundColor: c.at, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="coffee" size={64} color={c.a} />
        <View style={{ position: 'absolute', top: 12, left: L.gutter }}><IconButton icon="chevron-left" label="Quay lại" bg={c.surface} onPress={() => router.back()} /></View>
        <View style={{ position: 'absolute', top: 12, right: L.gutter }}><IconButton icon="bookmark" label="Lưu" bg={c.surface} color={saved ? c.a : undefined} onPress={() => toggleSave(r.id)} /></View>
      </View>
      <T v="title">{r.title}</T>
      <Chips>
        <Chip label={`${r.minutes} phút`} icon="clock" disabled />
        <Chip label={r.difficulty === 'easy' ? 'Dễ' : 'Vừa'} disabled />
        {r.kcal ? <Chip label={`${r.kcal} kcal`} icon="zap" disabled /> : null}
      </Chips>
      <View style={{ flexDirection: L.twoPane ? 'row' : 'column', gap: 24 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Row between wrap>
            <T v="headline">Nguyên liệu</T>
            <Stepper value={servings} onChange={setServings} min={1} max={10} format={(n) => `${n} người`} />
          </Row>
          <IngredientChecklist items={items} />
          {missing.length ? (
            <Button title={`Ghi ${missing.length} món thiếu để đi chợ`} variant="text" size="sm" icon="list"
              onPress={() => toast(`Đã ghi: ${missing.map((m) => m.name).join(', ')}`, { tone: 'success' })} />
          ) : null}
        </View>
        {L.twoPane ? <View style={{ flex: 1 }}>{steps}</View> : null}
      </View>
      {!L.twoPane ? steps : null}
    </Screen>
  );
}
