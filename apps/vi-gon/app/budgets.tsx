import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  AppBar,
  Button,
  Card,
  Chip,
  Chips,
  Dialog,
  ListItem,
  ProgressBar,
  Row,
  Screen,
  Sheet,
  T,
  TextField,
  Thumb,
  useTheme,
  useToast,
} from '@nam/ui';
import { shortMoney, vnd } from '@nam/core';
import { byCategory, totals, useQuery } from '../src/db';
import { catOf, periodOf, useVi } from '../src/store';

const digits = (s: string) => Number(s.replace(/\D/g, '')) || 0;
const fmt = (n: number) => (n ? n.toLocaleString('vi-VN') : '');

/** VG-10 · Ngân sách tổng và theo danh mục, cảnh báo 80% / vượt. */
export default function Budgets() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useVi();
  const p = periodOf(s.monthStartDay);
  const spentTotal = useQuery(() => totals(p.from, p.to).expense, [p.from], 0);
  const spent = useQuery(() => byCategory(p.from, p.to), [p.from], []);
  const [edit, setEdit] = useState<string | null>(null);
  const [val, setVal] = useState('');
  const [del, setDel] = useState<string | null>(null);
  const ids = Object.keys(s.budgets).filter((k) => s.budgets[k]);
  const sumCats = ids.reduce((a, k) => a + s.budgets[k], 0);
  const pct = s.monthlyBudget ? spentTotal / s.monthlyBudget : 0;

  const open = (id: string) => {
    setEdit(id);
    setVal(fmt(id === 'total' ? s.monthlyBudget : (s.budgets[id] ?? 0)));
  };
  const save = () => {
    const n = digits(val);
    if (edit === 'total') s.set({ monthlyBudget: n });
    else if (edit) s.set({ budgets: { ...s.budgets, [edit]: n } });
    setEdit(null);
    toast('Đã lưu ngân sách', { tone: 'success' });
  };
  const suggest = edit && edit !== 'total' ? spent.find((x) => x.categoryId === edit)?.total : undefined;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title={`Ngân sách ${p.label.toLowerCase()}`} onBack={() => router.back()} />
      <Card variant="fill" onPress={() => open('total')} accessibilityLabel="Sửa ngân sách tổng">
        <T v="caption">Tổng ngân sách</T>
        <T v="title">
          {s.monthlyBudget ? `${shortMoney(spentTotal)} / ${shortMoney(s.monthlyBudget)}` : 'Chưa đặt — chạm để đặt'}
        </T>
        {s.monthlyBudget ? (
          <ProgressBar
            value={Math.min(1, pct)}
            color={pct >= 1 ? c.negative : c.onAccent}
            track="rgba(255,255,255,0.25)"
          />
        ) : null}
      </Card>
      {sumCats > s.monthlyBudget && s.monthlyBudget ? (
        <T
          v="caption"
          color={c.warning}
        >{`Tổng ngân sách danh mục (${shortMoney(sumCats)}) lớn hơn ngân sách tháng.`}</T>
      ) : null}
      {ids.map((id) => {
        const cat = catOf(id, s.categories);
        const used = spent.find((x) => x.categoryId === id)?.total ?? 0;
        const limit = s.budgets[id];
        const r = used / limit;
        return (
          <ListItem
            key={id}
            left={<Thumb icon={cat.icon} color={c.a} bg={c.at} />}
            onPress={() => open(id)}
            onLongPress={() => setDel(id)}
            title={cat.name}
            subtitle={
              r >= 1
                ? `Vượt ${vnd(used - limit)}`
                : r >= 0.8
                  ? `Đã dùng ${Math.round(r * 100)}%`
                  : `${shortMoney(used)} / ${shortMoney(limit)}`
            }
            right={
              <View style={{ width: 96 }}>
                <ProgressBar value={Math.min(1, r)} color={r >= 1 ? c.negative : r >= 0.8 ? c.warning : c.a} />
              </View>
            }
          />
        );
      })}
      <T v="caption" muted>
        Nhấn giữ để bỏ ngân sách danh mục.
      </T>
      <T v="headline">Thêm ngân sách danh mục</T>
      <Chips>
        {s.categories
          .filter((x) => x.kind === 'expense' && !s.budgets[x.id])
          .map((x) => (
            <Chip key={x.id} label={x.name} icon="plus" onPress={() => open(x.id)} />
          ))}
      </Chips>

      <Sheet
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit === 'total' ? 'Ngân sách tháng' : `Ngân sách ${edit ? catOf(edit, s.categories).name : ''}`}
        footer={<Button title="Lưu" disabled={!digits(val)} onPress={save} />}
      >
        <View style={{ gap: 12 }}>
          <TextField
            label="Số tiền mỗi kỳ"
            value={val}
            onChangeText={(v) => setVal(fmt(digits(v)))}
            keyboardType="number-pad"
            autoFocus
          />
          {suggest ? (
            <Row>
              <T v="caption" muted style={{ flex: 1 }}>{`Kỳ này đã chi ${vnd(suggest)}`}</T>
              <Button
                title="Dùng mức này"
                size="sm"
                variant="text"
                onPress={() => setVal(fmt(Math.ceil(suggest / 100000) * 100000))}
              />
            </Row>
          ) : null}
        </View>
      </Sheet>
      <Dialog
        visible={!!del}
        title="Bỏ ngân sách danh mục này?"
        confirm="Bỏ"
        destructive
        onCancel={() => setDel(null)}
        onConfirm={() => {
          const b = { ...s.budgets };
          delete b[del!];
          s.set({ budgets: b });
          setDel(null);
        }}
      />
    </Screen>
  );
}
