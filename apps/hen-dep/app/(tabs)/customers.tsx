import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  Badge,
  Chip,
  Chips,
  EmptyState,
  FAB,
  ListItem,
  SearchField,
  T,
  TwoPane,
  useLayout,
  useTheme,
} from '@nam/ui';
import { fold, relativeTime, vnd } from '@nam/core';
import { customerIndex, useHen } from '../../src/store';
import { CustomerDetail } from '../../src/CustomerDetail';

type Filter = 'all' | 'vip' | 'lapsed' | 'new' | 'birthday';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'vip', label: 'VIP' },
  { key: 'lapsed', label: 'Lâu chưa đến' },
  { key: 'new', label: 'Khách mới' },
  { key: 'birthday', label: 'Sinh nhật tháng này' },
];

/** HD-C08 · Danh sách khách. Tablet: danh sách trái, hồ sơ khách phải. */
export default function Customers() {
  const { c } = useTheme();
  const L = useLayout();
  // Chọn từng phần: màn không vẽ lại khi phần khác của store đổi.
  const customers = useHen((x) => x.customers);
  const bookings = useHen((x) => x.bookings);
  const services = useHen((x) => x.services);
  const settings = useHen((x) => x.shop.settings);
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filter>('all');
  const [sel, setSel] = useState<string | null>(null);
  const { vipVisits, vipSpend } = settings;
  const month = new Date().getMonth() + 1;

  // Số liệu khách tính một lần cho mọi khách (IT2); gõ tìm hay đổi bộ lọc không tính lại.
  const index = useMemo(() => customerIndex(bookings, services), [bookings, services]);
  const rows = useMemo(() => {
    const now = Date.now();
    const fq = fold(q);
    const phoneQ = q.replace(/\s/g, '');
    return customers
      .map((cu) => ({ cu, st: index.get(cu.id) }))
      .filter(({ cu, st }) => {
        if (q && !fold(cu.name).includes(fq) && !(cu.phone ?? '').includes(phoneQ)) return false;
        if (f === 'vip') return st.visits >= vipVisits || st.spend >= vipSpend;
        if (f === 'lapsed') return !!st.lastAt && now - st.lastAt > 45 * 86400000;
        if (f === 'new') return now - cu.createdAt < 30 * 86400000;
        if (f === 'birthday') return !!cu.birthday && Number(cu.birthday.split('/')[1]) === month;
        return true;
      })
      .sort((a, b) => (b.st.lastAt ?? 0) - (a.st.lastAt ?? 0));
  }, [customers, index, q, f, vipVisits, vipSpend, month]);

  const open = (id: string) => (L.twoPane ? setSel(id) : router.push(`/customer/${id}`));

  const list = (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: L.gutter, gap: 10, paddingTop: 8 }}>
        <T v="display" accessibilityRole="header">
          Khách hàng
        </T>
        <SearchField value={q} onChangeText={setQ} placeholder="Tìm tên hoặc SĐT" />
        <Chips scroll>
          {FILTERS.map((x) => (
            <Chip key={x.key} label={x.label} selected={f === x.key} onPress={() => setF(x.key)} />
          ))}
        </Chips>
        <T v="caption" muted>{`${rows.length} khách`}</T>
      </View>
      {!rows.length ? (
        <EmptyState
          icon="users"
          title={customers.length ? 'Không có khách phù hợp' : 'Chưa có khách'}
          body={customers.length ? 'Thử bộ lọc khác.' : 'Khách đặt qua link sẽ tự vào danh sách.'}
        />
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r) => r.cu.id}
          contentContainerStyle={{ paddingHorizontal: L.gutter, paddingBottom: 96 }}
          renderItem={({ item: { cu, st } }) => {
            const vip = st.visits >= vipVisits || st.spend >= vipSpend;
            return (
              <ListItem
                left={<Avatar name={cu.name} soft />}
                title={cu.name}
                subtitle={`${st.visits} lần · ${vnd(st.spend)}${st.lastAt ? ` · ${relativeTime(st.lastAt)}` : ''}`}
                right={
                  vip ? (
                    <Badge label="VIP" tone="pro" />
                  ) : st.noShows ? (
                    <Badge label={`${st.noShows} lần bỏ hẹn`} tone="negative" />
                  ) : undefined
                }
                onPress={() => open(cu.id)}
                titleColor={sel === cu.id ? c.a : undefined}
              />
            );
          }}
        />
      )}
      <FAB label="Thêm khách" onPress={() => router.push('/customer/new')} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <TwoPane
        list={list}
        detail={sel ? <CustomerDetail id={sel} embedded /> : undefined}
        emptyDetail={<EmptyState icon="user" title="Chọn một khách" body="Lịch sử và ghi chú hiện ở đây." />}
      />
    </SafeAreaView>
  );
}
