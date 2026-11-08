import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { AppBar, Badge, Button, Card, EmptyState, Row, Screen, Segmented, T, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { useTT } from '../../src/store';
import { useSession } from '../../src/session';
import { goBack } from '../../src/nav';
import { applyImport, diffFields, planImport, type Conflict, type Decision } from '../../src/lib/transfer';
import { lunarDayWords, monthName } from '../../src/calendar/lunar';
import type { Anniversary } from '../../src/lib/schedule';

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const when = (a: Anniversary) => `ngày ${lunarDayWords(a.lunar.day)} tháng ${monthName(a.lunar.month, a.lunar.leap)}`;
const who = (a: Anniversary) => `${a.relation ? `${a.relation} ` : ''}${a.name}`;

/**
 * TT-35 · Nhận sổ giỗ. Thêm ngày mới, bỏ qua ngày giống hệt, ngày trùng thì người dùng chọn giữ hay ghi đè
 * (mặc định giữ bản trên máy). Không xóa gì của người dùng.
 */
export default function ImportGio() {
  const toast = useToast();
  const draft = useSession((s) => s.importDraft);
  const setSession = useSession((s) => s.set);
  const current = useTT((s) => s.anniversaries);
  const set = useTT((s) => s.set);
  const plan = useMemo(() => (draft ? planImport(current, draft.list) : null), [draft, current]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const decide = useCallback(
    (i: number, d: Decision) =>
      setDecisions((s) => {
        const n = [...s];
        n[i] = d;
        return n;
      }),
    [],
  );

  if (!draft || !plan) {
    return (
      <Screen>
        <AppBar onBack={() => goBack('/data')} title="Nhận sổ giỗ" />
        <EmptyState icon="inbox" title="Chưa có tệp nào" body="Vào Sao lưu và chia sẻ, chọn Nhận sổ giỗ để mở tệp." />
      </Screen>
    );
  }
  const n = plan.conflicts.length;
  const overwrite = plan.conflicts.filter((_, i) => decisions[i] === 'ghi-de').length;
  const nothing = !plan.add.length && !overwrite;

  const apply = () => {
    const d = plan.conflicts.map((_, i) => decisions[i] ?? 'giu');
    const r = applyImport(current, plan, d, uid);
    set({ anniversaries: r.list });
    setSession({ importDraft: null });
    track('so_gio_imported', {
      added: r.added,
      overwritten: r.overwritten,
      identical: plan.identical,
      source: draft.source,
    });
    toast(`Đã thêm ${r.added} ngày giỗ${r.overwritten ? `, cập nhật ${r.overwritten}` : ''}`);
    // Xong thì mở Sổ giỗ để thấy ngay ngày vừa thêm (không quay về màn chọn tệp).
    router.replace('/anniversaries');
  };

  const header = (
    <View style={{ gap: 12, paddingBottom: 12 }}>
      <AppBar onBack={() => goBack('/data')} title="Nhận sổ giỗ" />
      <T v="body" muted>
        {draft.from ? `Sổ giỗ do ${draft.from} gửi. ` : ''}
        Sổ của bạn được giữ nguyên, chỉ thêm ngày chưa có. Ngày trùng chỉ thay khi bạn chọn Lấy bản mới.
      </T>
      <Card>
        <Row between>
          <T v="body">Ngày giỗ mới sẽ thêm</T>
          <Badge label={String(plan.add.length)} tone="accent" />
        </Row>
        <Row between>
          <T v="body">Giống hệt sổ của bạn, bỏ qua</T>
          <Badge label={String(plan.identical)} />
        </Row>
        <Row between>
          <T v="body">Trùng người nhưng khác nội dung</T>
          <Badge label={String(n)} tone={n ? 'warning' : 'neutral'} />
        </Row>
      </Card>
      {plan.add.length ? (
        <T v="caption" muted numberOfLines={4}>
          Thêm: {plan.add.slice(0, 8).map(who).join(', ')}
          {plan.add.length > 8 ? ` và ${plan.add.length - 8} ngày khác` : ''}
        </T>
      ) : null}
      {n ? (
        <>
          <T v="headline">Ngày trùng: chọn giữ hay ghi đè</T>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            <Button
              title="Giữ tất cả của tôi"
              variant="secondary"
              size="sm"
              full={false}
              onPress={() => setDecisions(plan.conflicts.map(() => 'giu'))}
            />
            <Button
              title="Lấy tất cả bản mới"
              variant="secondary"
              size="sm"
              full={false}
              onPress={() => setDecisions(plan.conflicts.map(() => 'ghi-de'))}
            />
          </Row>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen
      footer={
        <Button
          title={
            nothing ? 'Không có gì mới để thêm' : `Thêm ${plan.add.length}${overwrite ? `, ghi đè ${overwrite}` : ''}`
          }
          disabled={nothing}
          onPress={apply}
        />
      }
    >
      <FlashList
        data={plan.conflicts}
        extraData={decisions}
        keyExtractor={(c) => c.mine.id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item, index }) => (
          <ConflictCard c={item} i={index} d={decisions[index] ?? 'giu'} onDecide={decide} />
        )}
      />
    </Screen>
  );
}

const ConflictCard = memo(function ConflictCard({
  c,
  i,
  d,
  onDecide,
}: {
  c: Conflict;
  i: number;
  d: Decision;
  onDecide: (i: number, d: Decision) => void;
}) {
  const diff = diffFields(c.mine, c.theirs);
  const line = (a: Anniversary) =>
    `${who(a)}, ${when(a)}${a.dishes ? ` · món: ${a.dishes}` : ''}${a.deathSolar ? ` · mất ${a.deathSolar}` : ''}`;
  return (
    <Card>
      <T v="headline">{who(c.mine)}</T>
      <T v="caption" muted>
        Khác ở: {diff.join(', ')}
      </T>
      <T v="caption">Của tôi: {line(c.mine)}</T>
      <T v="caption">Bản mới: {line(c.theirs)}</T>
      <Segmented
        value={d}
        onChange={(v) => onDecide(i, v)}
        options={[
          { key: 'giu', label: 'Giữ của tôi' },
          { key: 'ghi-de', label: 'Lấy bản mới' },
        ]}
      />
    </Card>
  );
});
