import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { AppBar, Badge, Button, Card, EmptyState, FAB, Icon, Row, Screen, T, useTheme, useToast } from '@nam/ui';
import { useTT } from '../../src/store';
import { useToday } from '../../src/hooks';
import { daysBetween, nextGio, type Anniversary, type GioOccurrence } from '../../src/lib/schedule';
import { lunarDayWords, monthName } from '../../src/calendar/lunar';
import { inDays, solarWithWeekday } from '../../src/components';

type RowData = { a: Anniversary; o: GioOccurrence | null; days: number };

/**
 * TT-15 · Sổ giỗ. Danh sách ảo (FlashList): chỉ vẽ các dòng đang thấy, để 1.000 ngày giỗ vẫn mở nhanh
 * (vòng QA dữ liệu lớn: bản vẽ hết tốn 3.002 phần tử, tác vụ chặn luồng 613 ms).
 */
export default function Anniversaries() {
  const today = useToday();
  const list = useTT((s) => s.anniversaries);
  const rows = useMemo<RowData[]>(
    () =>
      list
        .map((a) => {
          const o = nextGio(a, today);
          return { a, o, days: o ? daysBetween(today, o.date) : 9999 };
        })
        .sort((x, y) => x.days - y.days),
    [list, today],
  );

  return (
    <Screen
      overlay={
        list.length ? <FAB label="Thêm ngày giỗ" onPress={() => router.push('/anniversaries/edit')} /> : undefined
      }
    >
      {!list.length ? (
        <>
          <AppBar onBack={() => router.back()} title="Sổ giỗ" large />
          <EmptyState
            icon="book"
            title="Chưa có ngày giỗ nào"
            body="Ghi ngày giỗ theo âm lịch. Thành Tâm tự đổi sang dương lịch mỗi năm và nhắc trước 7, 3, 1 ngày."
            action="Thêm ngày giỗ"
            onAction={() => router.push('/anniversaries/edit')}
          />
        </>
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r) => r.a.id}
          ListHeaderComponent={
            <View style={{ paddingBottom: 12 }}>
              <AppBar onBack={() => router.back()} title="Sổ giỗ" large />
              <T v="caption" muted>
                {rows.length} ngày giỗ · nhắc lúc 8:00 sáng · chỉ lưu trên máy này
              </T>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 96 }}
          renderItem={({ item }) => <GioCard row={item} />}
        />
      )}
    </Screen>
  );
}

const GioCard = memo(function GioCard({ row: { a, o, days } }: { row: RowData }) {
  const { c } = useTheme();
  const toast = useToast();
  const remove = useTT((s) => s.removeAnniversary);
  const upsert = useTT((s) => s.upsertAnniversary);
  return (
    <Card
      onPress={() => router.push(`/anniversaries/edit?id=${a.id}`)}
      accessibilityLabel={`Giỗ ${a.relation} ${a.name}`}
    >
      <Row between style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="micro" muted>
            {a.relation}
          </T>
          <T v="title">{a.name}</T>
          <T v="caption" muted>
            Ngày {lunarDayWords(a.lunar.day)} tháng {monthName(a.lunar.month, a.lunar.leap)} (âm lịch)
          </T>
        </View>
        {o ? <Badge label={inDays(days)} tone={days <= 7 ? 'accent' : 'neutral'} /> : null}
      </Row>
      {o ? <T v="body">Năm nay: {solarWithWeekday(o.date)}</T> : null}
      {o?.missing ? (
        <T v="caption" color={c.warning}>
          Năm nay tháng {monthName(a.lunar.month)} chỉ có 29 ngày, nên giỗ vào ngày 29. Nhiều nhà làm vậy; theo nếp nhà
          mình nếu khác.
        </T>
      ) : null}
      {o?.leapShifted ? (
        <T v="caption" color={c.warning}>
          Năm nay không có tháng nhuận này, giỗ vào tháng {monthName(a.lunar.month)} thường.
        </T>
      ) : null}
      <Row gap={8}>
        <Button
          title="Văn khấn ngày giỗ"
          variant="secondary"
          size="sm"
          icon="book-open"
          onPress={() =>
            router.push(
              `/ritual/gio-thuong/prayer?gioName=${encodeURIComponent(a.name)}&gioRelation=${encodeURIComponent(a.relation)}`,
            )
          }
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xóa giỗ ${a.name}`}
          hitSlop={4}
          onPress={() => {
            const old = remove(a.id);
            toast('Đã xóa ngày giỗ', {
              action: old ? { label: 'Hoàn tác', onPress: () => upsert(old) } : undefined,
            });
          }}
          style={{ marginLeft: 'auto', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="trash-2" size={18} color={c.inkMuted} />
        </Pressable>
      </Row>
    </Card>
  );
});
