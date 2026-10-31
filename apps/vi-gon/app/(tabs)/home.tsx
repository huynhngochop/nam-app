import React from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Banner,
  Button,
  Card,
  FAB,
  Grid,
  IconButton,
  Ring,
  Row,
  Screen,
  SectionHeader,
  T,
  useTheme,
} from '@nam/ui';
import { dayMonth, greeting, vnd } from '@nam/core';
import { countWhere, listTx, totals, useQuery } from '../../src/db';
import { periodOf, useVi } from '../../src/store';
import { Money, TxRow } from '../../src/ui';
import { openPermissionSettings } from '../../src/listener';

/** VG-05 Tổng quan + VG-17 Mất quyền tự ghi. Tablet: vòng ngân sách và danh sách đặt cạnh nhau. */
export default function Home() {
  const { c } = useTheme();
  const s = useVi();
  const p = periodOf(s.monthStartDay);
  const t = useQuery(() => totals(p.from, p.to), [p.from], { expense: 0, income: 0, count: 0 });
  const recent = useQuery(() => listTx({ limit: 6 }), [], []);
  const pending = useQuery(() => countWhere("status = 'pending'"), [], 0);
  const flagged = useQuery(() => countWhere('flag IS NOT NULL'), [], 0);
  const daysLeft = Math.max(1, Math.ceil((p.to - Date.now()) / 86400000));
  const budget = s.monthlyBudget;
  const pct = budget ? t.expense / budget : 0;
  const left = budget - t.expense;
  const hide = s.hideAmounts;

  return (
    <Screen scroll overlay={<FAB label="Thêm giao dịch" onPress={() => router.push('/add')} />}>
      <Row between>
        <View style={{ flex: 1 }}>
          <T v="caption" muted>{`${p.label} · còn ${daysLeft} ngày`}</T>
          <T v="title" accessibilityRole="header">
            {s.name ? `${greeting()}, ${s.name}` : greeting()}
          </T>
        </View>
        <IconButton
          icon={hide ? 'eye-off' : 'eye'}
          label={hide ? 'Hiện số tiền' : 'Ẩn số tiền'}
          onPress={() => s.set({ hideAmounts: !hide })}
        />
        <IconButton icon="settings" label="Cài đặt" onPress={() => router.push('/settings')} />
      </Row>

      {s.listenerState === 'lost' ? (
        <Card variant="danger">
          <T v="headline">{`Có thể thiếu giao dịch từ ${s.lostSince ? dayMonth(new Date(s.lostSince)) : 'gần đây'}`}</T>
          <T v="caption">Android đôi khi tắt quyền đọc thông báo sau khi cập nhật hoặc khi tiết kiệm pin.</T>
          <Row wrap>
            <Button title="Bật lại" size="sm" onPress={openPermissionSettings} />
            <Button title="Dán tin bị thiếu" size="sm" variant="secondary" onPress={() => router.push('/import')} />
            <Button
              title="Tối ưu pin"
              size="sm"
              variant="text"
              onPress={() => Linking.openSettings().catch(() => {})}
            />
          </Row>
        </Card>
      ) : null}

      <Grid min={1}>
        <Card onPress={() => router.push('/budgets')} accessibilityLabel="Ngân sách">
          {budget ? (
            <Row gap={16}>
              <Ring
                size={112}
                stroke={12}
                progress={Math.min(1, pct)}
                color={pct >= 1 ? c.negative : pct >= 0.8 ? c.warning : c.a}
                label={hide ? '••' : `${Math.round(pct * 100)}%`}
                sub="ngân sách"
              />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="caption" muted>
                  Đã chi
                </T>
                <Money amount={t.expense} v="title" masked plain />
                <T v="caption" muted>
                  {hide ? '/ ••••••' : `/ ${vnd(budget)}`}
                </T>
                <T v="caption" color={left >= 0 ? c.positive : c.negative}>
                  {hide
                    ? ' '
                    : left >= 0
                      ? `Còn ${vnd(Math.round(left / daysLeft / 1000) * 1000)}/ngày`
                      : `Vượt ${vnd(-left)}`}
                </T>
              </View>
            </Row>
          ) : (
            <View style={{ gap: 6 }}>
              <T v="caption" muted>{`Đã chi ${p.label.toLowerCase()}`}</T>
              <Money amount={t.expense} v="title" masked plain />
              <Button
                title="Đặt ngân sách tháng"
                size="sm"
                variant="secondary"
                onPress={() => router.push('/budgets')}
              />
            </View>
          )}
        </Card>
        <View style={{ gap: 12 }}>
          {pending ? (
            <Card variant="tint" onPress={() => router.push('/pending')} accessibilityLabel="Giao dịch chờ xác nhận">
              <Row>
                <IconButton icon="bell" label="Chờ xác nhận" color={c.a} bg={c.surface} />
                <T v="body" style={{ flex: 1 }}>{`${pending} giao dịch chờ xác nhận`}</T>
                <Button title="Xem" size="sm" onPress={() => router.push('/pending')} />
              </Row>
            </Card>
          ) : null}
          {flagged ? (
            <Banner
              tone="warning"
              icon="copy"
              text={`${flagged} giao dịch nghi trùng / chuyển nội bộ — chạm để kiểm tra`}
              onPress={() => router.push('/review')}
            />
          ) : null}
          {s.unparsed.length ? (
            <Banner
              tone="warning"
              icon="help-circle"
              text={`${s.unparsed.length} thông báo chưa đọc được — chạm để điền giúp`}
              onPress={() => router.push('/import')}
            />
          ) : null}
          <Card variant="fill">
            <Row between>
              <T v="caption" muted>
                Thu kỳ này
              </T>
              <Money amount={t.income} kind="income" masked />
            </Row>
            <Row between>
              <T v="caption" muted>
                Chênh lệch
              </T>
              <Money
                amount={Math.abs(t.income - t.expense)}
                kind={t.income >= t.expense ? 'income' : 'expense'}
                masked
              />
            </Row>
          </Card>
          <Card onPress={() => router.push('/ask')} accessibilityLabel="Hỏi Ví Gọn">
            <Row>
              <IconButton icon="message-circle" label="Hỏi Ví Gọn" color={c.a} bg={c.at} />
              <View style={{ flex: 1 }}>
                <T v="headline">Hỏi Ví Gọn</T>
                <T v="caption" muted>
                  “Tháng này ăn uống hết bao nhiêu?”
                </T>
              </View>
            </Row>
          </Card>
        </View>
      </Grid>

      <SectionHeader title="Vừa ghi nhận" action="Tất cả" onAction={() => router.push('/(tabs)/transactions')} />
      {recent.length ? (
        recent.map((tx) => <TxRow key={tx.id} tx={tx} onPress={() => router.push(`/tx/${tx.id}`)} />)
      ) : (
        <Card variant="fill">
          <T v="body">Chưa có giao dịch. Nhấn + để ghi nhanh, hoặc dán tin nhắn ngân hàng.</T>
          <Button
            title="Dán tin ngân hàng"
            size="sm"
            variant="secondary"
            icon="clipboard"
            onPress={() => router.push('/import')}
          />
        </Card>
      )}
    </Screen>
  );
}
