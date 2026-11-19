import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, Chips, EmptyState, IconButton, Row, SearchField, T, TwoPane, useLayout, useTheme } from '@nam/ui';
import { dayMonth, startOfDay, vnd, weekdayLong } from '@nam/core';
import { countWhere, listTx, useQuery } from '../../src/db';
import { catOf, periodOf, useVi } from '../../src/store';
import { Tx } from '../../src/types';
import { TxRow } from '../../src/ui';
import { TxDetail } from '../../src/TxDetail';

type Item = { type: 'header'; key: string; label: string; net: number } | { type: 'tx'; key: string; tx: Tx };

/** Giao dịch theo ngày. Tablet / máy gập mở: danh sách trái, chi tiết phải. Nhận ?from&to&categoryId&kind từ "Hỏi Ví Gọn". */
export default function Transactions() {
  const { c } = useTheme();
  const layout = useLayout();
  const state = useVi();
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    categoryId?: string;
    kind?: 'expense' | 'income';
  }>();
  const [q, setQ] = useState('');
  // Truy vấn SQLite chạy đồng bộ trên luồng JS: gõ liền nhiều phím chỉ truy vấn một lần (sau 200 ms).
  const [dq, setDq] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDq(q.trim()), 200);
    return () => clearTimeout(timer);
  }, [q]);
  const [offset, setOffset] = useState(0);
  const [kind, setKind] = useState<'all' | 'expense' | 'income'>(params.kind || 'all');
  const [onlyPending, setOnlyPending] = useState(false);
  const [cat, setCat] = useState<string | undefined>(params.categoryId || undefined);
  // Tab đã mở sẵn: khi "Hỏi Ví Gọn" đẩy bộ lọc mới thì áp dụng lại.
  useEffect(() => {
    setKind(params.kind || 'all');
    setCat(params.categoryId || undefined);
    setOffset(0);
  }, [params.from, params.to, params.kind, params.categoryId]);
  const [sel, setSel] = useState<string | null>(null);
  const period = periodOf(state.monthStartDay, offset);
  const from = params.from && offset === 0 ? Number(params.from) : period.from;
  const to = params.to && offset === 0 ? Number(params.to) : period.to;

  const list = useQuery(
    () =>
      listTx({
        from,
        to,
        q: dq || undefined,
        kind: kind === 'all' ? undefined : kind,
        status: onlyPending ? 'pending' : undefined,
        categoryId: cat,
      }),
    [from, to, dq, kind, onlyPending, cat],
    [],
  );
  const pending = useQuery(() => countWhere("status = 'pending'"), [], 0);

  const items = useMemo(() => {
    const out: Item[] = [];
    let day = -1;
    let header: Extract<Item, { type: 'header' }> | null = null;
    for (const tx of list) {
      const dayStart = startOfDay(new Date(tx.at)).getTime();
      if (dayStart !== day) {
        day = dayStart;
        const dt = new Date(dayStart);
        const today = startOfDay(new Date()).getTime();
        header = {
          type: 'header',
          key: `h${dayStart}`,
          label:
            dayStart === today
              ? `Hôm nay · ${dayMonth(dt)}`
              : dayStart === today - 86400000
                ? `Hôm qua · ${dayMonth(dt)}`
                : `${weekdayLong(dt)} · ${dayMonth(dt)}`,
          net: 0,
        };
        out.push(header);
      }
      if (header && tx.status === 'confirmed')
        header.net += tx.kind === 'income' ? tx.amount : tx.kind === 'expense' ? -tx.amount : 0;
      out.push({ type: 'tx', key: tx.id, tx });
    }
    return out;
  }, [list]);

  const open = (id: string) => (layout.twoPane ? setSel(id) : router.push(`/tx/${id}`));
  const hide = state.hideAmounts;

  const main = (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: layout.gutter, gap: 10, paddingTop: 8 }}>
        <Row between>
          <T v="display" accessibilityRole="header" style={{ flex: 1 }}>
            Giao dịch
          </T>
          <IconButton icon="clipboard" label="Dán tin ngân hàng" onPress={() => router.push('/import')} />
          <IconButton icon="plus" label="Thêm giao dịch" onPress={() => router.push('/add')} />
        </Row>
        <SearchField value={q} onChangeText={setQ} placeholder="Tìm nơi chi, ghi chú, số tiền" />
        <Chips scroll>
          <Chip label="‹" onPress={() => setOffset((o) => o - 1)} />
          <Chip label={offset === 0 && params.from ? 'Kỳ đã chọn' : period.label} selected />
          {offset < 0 ? <Chip label="›" onPress={() => setOffset((o) => o + 1)} /> : null}
          <Chip
            label="Chi"
            selected={kind === 'expense'}
            onPress={() => setKind(kind === 'expense' ? 'all' : 'expense')}
          />
          <Chip
            label="Thu"
            selected={kind === 'income'}
            onPress={() => setKind(kind === 'income' ? 'all' : 'income')}
          />
          {pending ? (
            <Chip
              label={`Chờ xác nhận (${pending})`}
              selected={onlyPending}
              onPress={() => setOnlyPending((x) => !x)}
            />
          ) : null}
          {cat ? <Chip label={catOf(cat, state.categories).name} selected onRemove={() => setCat(undefined)} /> : null}
        </Chips>
      </View>
      {!items.length ? (
        <ScrollView>
          <EmptyState
            icon="inbox"
            title={q ? 'Không tìm thấy' : 'Chưa có giao dịch'}
            body={q ? 'Thử từ khóa khác hoặc đổi kỳ.' : 'Giao dịch tự ghi và nhập tay sẽ hiện ở đây.'}
            action={q ? undefined : 'Thêm giao dịch'}
            onAction={() => router.push('/add')}
          />
        </ScrollView>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => i.key}
          getItemType={(i) => i.type}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingBottom: 32 }}
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <Row between style={{ paddingTop: 16, paddingBottom: 4 }}>
                <T v="caption" muted weight="semibold">
                  {item.label}
                </T>
                <T v="caption" color={item.net >= 0 ? c.positive : c.inkMuted}>
                  {hide ? '•••' : `${item.net >= 0 ? '+' : '−'}${vnd(Math.abs(item.net))}`}
                </T>
              </Row>
            ) : (
              <TxRow tx={item.tx} selected={sel === item.tx.id} onPress={() => open(item.tx.id)} />
            )
          }
        />
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <TwoPane
        list={main}
        detail={
          sel ? (
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <TxDetail id={sel} onClose={() => setSel(null)} />
            </ScrollView>
          ) : undefined
        }
        emptyDetail={<EmptyState icon="file-text" title="Chọn một giao dịch" body="Chi tiết hiện ở đây." />}
      />
    </SafeAreaView>
  );
}
