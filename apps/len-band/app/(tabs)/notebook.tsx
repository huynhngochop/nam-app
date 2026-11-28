import React, { memo, useCallback, useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar, Badge, Card, Chip, Chips, EmptyState, Row, Segmented, T, useLayout, useTheme } from '@nam/ui';
import { serverEnabled, type LearnerError } from '../../src/api';
import { statusLabel, toRepair } from '../../src/loop';
import { CRITERION_VI, type Criterion } from '../../src/plan';
import { useLenBand } from '../../src/store';
import { refreshErrors } from '../../src/sync';

type Filter = 'all' | Criterion;

/** 10 · Sổ tay: lỗi của tôi (theo vòng sửa lỗi) và câu nâng cấp của tôi. */
export default function Notebook() {
  const { c } = useTheme();
  const layout = useLayout();
  const errors = useLenBand((s) => s.errors);
  const authed = useLenBand((s) => !!s.auth);
  const [tab, setTab] = useState<'errors' | 'upgrade'>('errors');
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const counts = useMemo(() => {
    const m: Record<Filter, number> = { all: errors.length, FC: 0, LR: 0, GRA: 0, P: 0 };
    for (const e of errors) m[e.category] += 1;
    return m;
  }, [errors]);
  const rows = useMemo(() => {
    const list = filter === 'all' ? errors : errors.filter((e) => e.category === filter);
    return tab === 'upgrade' ? list.filter((e) => e.band7_text) : list;
  }, [errors, filter, tab]);
  const newOnes = useMemo(() => toRepair(errors).length, [errors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshErrors(true);
    setRefreshing(false);
  }, []);
  const open = useCallback((id: string) => router.push({ pathname: '/error/[id]', params: { id } }), []);

  const header = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <AppBar large title="Sổ tay" />
      <Segmented
        options={[
          { key: 'errors', label: 'Lỗi của tôi' },
          { key: 'upgrade', label: 'Câu nâng cấp' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {newOnes > 0 ? (
        <Card variant="accent" onPress={() => router.push('/repair')}>
          <T v="headline">{newOnes} lỗi mới cần sửa ngay</T>
          <T v="caption">Nói lại câu đúng 2 lần. Lỗi đang gài lại sẽ xuất hiện trong buổi nói.</T>
        </Card>
      ) : null}
      <Chips scroll>
        {(['all', 'GRA', 'LR', 'P', 'FC'] as Filter[]).map((k) => (
          <Chip
            key={k}
            label={`${k === 'all' ? 'Tất cả' : CRITERION_VI[k]} ${counts[k]}`}
            selected={filter === k}
            onPress={() => setFilter(k)}
          />
        ))}
      </Chips>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <FlashList
        data={rows}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="book"
            title="Sổ tay còn trống"
            body={
              serverEnabled() && authed
                ? 'Sau mỗi buổi nói, lỗi của bạn sẽ được ghi vào đây cùng câu đúng và câu nâng cấp lên band mục tiêu.'
                : 'Kết nối mạng và đăng nhập để giám khảo AI chấm và ghi lỗi của bạn.'
            }
          />
        }
        renderItem={({ item }) =>
          tab === 'upgrade' ? <UpgradeRow e={item} onPress={open} /> : <ErrorRow e={item} onPress={open} />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const ErrorRow = memo(function ErrorRow({ e, onPress }: { e: LearnerError; onPress: (id: string) => void }) {
  const { c } = useTheme();
  const st = statusLabel(e);
  return (
    <Card onPress={() => onPress(e.id)} style={{ marginBottom: 8 }}>
      <Row between>
        <T v="micro" accent>
          {e.category}
          {e.code ? ` · ${e.code}` : ''}
        </T>
        <Badge label={st.label} tone={st.tone} />
      </Row>
      <T v="caption" color={c.negative} style={{ textDecorationLine: 'line-through' }}>
        {e.wrong_text}
      </T>
      <T v="headline" color={c.positive}>
        {e.right_text}
      </T>
      {e.occurrences > 1 ? (
        <T v="caption" muted>
          Đã mắc {e.occurrences} lần
        </T>
      ) : null}
    </Card>
  );
});

const UpgradeRow = memo(function UpgradeRow({ e, onPress }: { e: LearnerError; onPress: (id: string) => void }) {
  return (
    <Card onPress={() => onPress(e.id)} style={{ marginBottom: 8 }}>
      <T v="body">“{e.band7_text}”</T>
      <T v="caption" muted>
        Từ câu: {e.wrong_text}
      </T>
    </Card>
  );
});
