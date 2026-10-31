import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Banner,
  Card,
  Chip,
  Chips,
  EmptyState,
  IconButton,
  Row,
  SearchField,
  T,
  TwoPane,
  useLayout,
  useTheme,
} from '@nam/ui';
import { getConfig, greeting, track, useOnline } from '@nam/core';
import { CATEGORIES, Tip, tipById } from '../../src/data/tips';
import { useMeo } from '../../src/store';
import { dailyTip, feedFor } from '../../src/lib/search';
import { AdNative, TipDetail, TipRow } from '../../src/components';

type FeedRow = { kind: 'tip'; tip: Tip } | { kind: 'ad'; key: string };

/** MN-04 · Khám phá (+ MN-17 khi ngoại tuyến). Tablet/máy gập mở ngang: danh sách + chi tiết cạnh nhau. */
export default function Explore() {
  const { c } = useTheme();
  const L = useLayout();
  const online = useOnline();
  const interests = useMeo((s) => s.interests);
  const name = useMeo((s) => s.name);
  const savedTips = useMeo((s) => s.savedTips);
  const [selected, setSelected] = useState<string | null>(null);

  const today = useMemo(() => dailyTip(interests), [interests]);
  const rows = useMemo<FeedRow[]>(() => {
    const src = online ? feedFor(interests) : savedTips.map((id) => tipById(id)!).filter(Boolean);
    const n = getConfig().adEveryN;
    const out: FeedRow[] = [];
    src.forEach((t, i) => {
      out.push({ kind: 'tip', tip: t });
      if (online && (i + 1) % n === 0) out.push({ kind: 'ad', key: `ad${i}` });
    });
    return out;
  }, [interests, online, savedTips]);

  const open = useCallback(
    (id: string) => {
      track('feed_tip_opened', { tipId: id });
      if (L.twoPane) setSelected(id);
      else router.push(`/tip/${id}`);
    },
    [L.twoPane],
  );

  const header = (
    <View style={{ gap: 12, paddingBottom: 4 }}>
      <Row between style={{ paddingTop: 8 }}>
        <View style={{ flex: 1 }}>
          <T v="caption" muted>
            {greeting()}
            {name ? `, ${name}` : ''}
          </T>
          <T v="display" accessibilityRole="header">
            Hôm nay sửa gì?
          </T>
        </View>
        <IconButton
          icon="message-circle"
          label="Hỏi Mẹo Nhà"
          onPress={() => router.push('/ask')}
          color={c.a}
          bg={c.at}
        />
      </Row>
      <SearchField placeholder="Tẩy vết dầu, cây vàng lá…" onPress={() => router.push('/search')} />
      <Chips scroll>
        {CATEGORIES.map((cat) => (
          <Chip key={cat.id} label={cat.name} icon={cat.icon} onPress={() => router.push(`/category/${cat.id}`)} />
        ))}
      </Chips>
      <Card variant="tint" onPress={() => open(today.id)} accessibilityLabel={`Mẹo hôm nay: ${today.title}`}>
        <T v="micro" accent>{`Mẹo hôm nay · ${today.minutes} phút${online ? '' : ' · đã tải sẵn'}`}</T>
        <T v="headline" numberOfLines={2}>
          {today.title}
        </T>
        <T v="caption" numberOfLines={3}>
          {today.summary}
        </T>
      </Card>
      {!online ? <T v="micro" muted>{`Đọc được khi không có mạng · ${savedTips.length} mẹo`}</T> : null}
    </View>
  );

  const list = (
    <FlashList
      data={rows}
      keyExtractor={(r) => (r.kind === 'tip' ? r.tip.id : r.key)}
      getItemType={(r) => r.kind}
      ListHeaderComponent={header}
      ListEmptyComponent={
        !online ? (
          <EmptyState icon="wifi-off" title="Chưa có mẹo đã lưu" body="Lưu mẹo khi có mạng để đọc lúc ngoại tuyến." />
        ) : null
      }
      ListFooterComponent={
        !online ? (
          <Card>
            <T v="caption" muted>
              Tìm kiếm và “Tủ lạnh có gì?” cần mạng — sẽ tự bật lại khi có kết nối.
            </T>
          </Card>
        ) : (
          <View style={{ height: 24 }} />
        )
      }
      renderItem={({ item }) =>
        item.kind === 'ad' ? (
          <View style={{ paddingVertical: 8 }}>
            <AdNative />
          </View>
        ) : (
          <TipRow tip={item.tip} onPress={() => open(item.tip.id)} />
        )
      }
      contentContainerStyle={{ paddingHorizontal: L.gutter }}
    />
  );

  const detailTip = selected ? tipById(selected) : today;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      {!online ? <Banner text="Đang ngoại tuyến — hiển thị mẹo đã tải" /> : null}
      <TwoPane
        list={list}
        detail={
          detailTip ? (
            <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 720 }}>
              <TipDetail tip={detailTip} />
            </ScrollView>
          ) : undefined
        }
        emptyDetail={<EmptyState icon="book-open" title="Chọn một mẹo" body="Mẹo sẽ hiện ở đây." />}
      />
    </SafeAreaView>
  );
}
