import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Chip,
  Chips,
  EmptyState,
  Icon,
  IconButton,
  Row,
  Screen,
  Stepper,
  T,
  useLayout,
  useTheme,
  useToast,
} from '@nam/ui';
import { track } from '@nam/core';
import { ingName, RECIPES } from '../../src/data/recipes';
import { useMeo } from '../../src/store';
import { IngredientChecklist } from '../../src/components';

const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** Chi tiết công thức. Tablet: nguyên liệu và các bước chia hai cột. */
export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const layout = useLayout();
  const toast = useToast();
  const recipe = RECIPES.find((x) => x.id === id);
  const pantry = useMeo((s) => s.pantry);
  const saved = useMeo((s) => (recipe ? s.savedRecipes.includes(recipe.id) : false));
  const toggleSave = useMeo((s) => s.toggleSaveRecipe);
  const [servings, setServings] = useState(recipe?.baseServings ?? 2);
  const items = useMemo(
    () =>
      recipe
        ? recipe.ingredients.map((i) => ({
            id: i.id,
            name: ingName(i.id),
            qty: `${fmtQty((i.qty * servings) / recipe.baseServings)} ${i.unit}`,
            have: pantry.includes(i.id),
          }))
        : [],
    [recipe, servings, pantry],
  );
  if (!recipe)
    return (
      <Screen>
        <EmptyState
          icon="alert-circle"
          title="Không tìm thấy công thức"
          action="Quay lại"
          onAction={() => router.back()}
        />
      </Screen>
    );
  const missing = items.filter((i) => !i.have);
  const steps = (
    <View style={{ gap: 8 }}>
      <T v="headline">Các bước</T>
      {recipe.steps.map((s, i) => (
        <Row key={i} style={{ alignItems: 'flex-start' }} gap={10}>
          <T v="headline" accent style={{ width: 22 }}>
            {i + 1}
          </T>
          <View style={{ flex: 1 }}>
            {s.title ? (
              <T v="micro" accent>
                {s.title}
              </T>
            ) : null}
            <T v="body">{s.text}</T>
          </View>
        </Row>
      ))}
    </View>
  );
  return (
    <Screen
      scroll
      readable={!layout.twoPane}
      footer={
        <Button
          title="Bắt đầu nấu"
          icon="play"
          onPress={() => {
            track('cook_started', { recipeId: recipe.id });
            router.push(`/cook/${recipe.id}`);
          }}
        />
      }
    >
      <View
        style={{
          height: 160,
          marginHorizontal: -layout.gutter,
          backgroundColor: c.at,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="coffee" size={64} color={c.a} />
        <View style={{ position: 'absolute', top: 12, left: layout.gutter }}>
          <IconButton icon="chevron-left" label="Quay lại" bg={c.surface} onPress={() => router.back()} />
        </View>
        <View style={{ position: 'absolute', top: 12, right: layout.gutter }}>
          <IconButton
            icon="bookmark"
            label="Lưu"
            bg={c.surface}
            color={saved ? c.a : undefined}
            onPress={() => toggleSave(recipe.id)}
          />
        </View>
      </View>
      <T v="title">{recipe.title}</T>
      <Chips>
        <Chip label={`${recipe.minutes} phút`} icon="clock" disabled />
        <Chip label={recipe.difficulty === 'easy' ? 'Dễ' : 'Vừa'} disabled />
        {recipe.kcal ? <Chip label={`${recipe.kcal} kcal`} icon="zap" disabled /> : null}
      </Chips>
      <View style={{ flexDirection: layout.twoPane ? 'row' : 'column', gap: 24 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Row between wrap>
            <T v="headline">Nguyên liệu</T>
            <Stepper value={servings} onChange={setServings} min={1} max={10} format={(n) => `${n} người`} />
          </Row>
          <IngredientChecklist items={items} />
          {missing.length ? (
            <Button
              title={`Ghi ${missing.length} món thiếu để đi chợ`}
              variant="text"
              size="sm"
              icon="list"
              onPress={() => toast(`Đã ghi: ${missing.map((m) => m.name).join(', ')}`, { tone: 'success' })}
            />
          ) : null}
        </View>
        {layout.twoPane ? <View style={{ flex: 1 }}>{steps}</View> : null}
      </View>
      {!layout.twoPane ? steps : null}
    </Screen>
  );
}
