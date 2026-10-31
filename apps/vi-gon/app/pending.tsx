import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Button, Card, Check, Chip, Chips, EmptyState, Row, Screen, T, useTheme, useToast } from '@nam/ui';
import { hhmm, relativeTime, track } from '@nam/core';
import { deleteTx, insertTx, listTx, updateTx, useQuery } from '../src/db';
import { ruleKeyword } from '../src/parse';
import { useVi } from '../src/store';
import { Money } from '../src/ui';

/** VG-06 · Xác nhận giao dịch tự ghi, từng cái một. */
export default function Pending() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useVi();
  const list = useQuery(() => listTx({ status: 'pending', limit: 200 }), [], []);
  const tx = list[list.length - 1];
  const [cat, setCat] = useState<string | null>(null);
  const [learn, setLearn] = useState(true);

  if (!tx) {
    return (
      <Screen edges={['top', 'bottom']}>
        <AppBar title="Chờ xác nhận" onBack={() => router.back()} backIcon="x" />
        <EmptyState
          icon="check-circle"
          title="Đã xác nhận hết"
          body="Giao dịch mới sẽ hiện ở đây khi cần bạn xem."
          action="Về tổng quan"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }
  const chosen = cat ?? tx.categoryId ?? 'other';
  const cats = s.categories.filter((x) => x.kind === (tx.kind === 'income' ? 'income' : 'expense'));
  const kw = ruleKeyword(tx.merchant);
  const save = () => {
    updateTx(tx.id, { status: 'confirmed', categoryId: chosen });
    if (learn && kw && chosen !== tx.categoryId) s.addRule(kw, chosen);
    else if (learn && kw && !s.rules.some((r) => r.keyword === kw)) s.addRule(kw, chosen);
    track('tx_confirmed', { changed: chosen !== tx.categoryId });
    setCat(null);
  };
  const skip = () => {
    const copy = tx;
    deleteTx(tx.id);
    setCat(null);
    toast('Đã bỏ qua', { action: { label: 'Hoàn tác', onPress: () => insertTx(copy) } });
  };

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <Row>
          <View style={{ flex: 1 }}>
            <Button title="Bỏ qua" variant="secondary" onPress={skip} />
          </View>
          <View style={{ flex: 2 }}>
            <Button title="Lưu" icon="check" onPress={save} />
          </View>
        </Row>
      }
    >
      <AppBar title={`Chờ xác nhận · ${list.length}`} onBack={() => router.back()} backIcon="x" />
      {tx.raw ? (
        <Card variant="fill">
          <T v="caption" muted weight="semibold">{`Thông báo · ${relativeTime(tx.createdAt)}`}</T>
          <T v="caption">{tx.raw}</T>
        </Card>
      ) : null}
      {tx.flag === 'dup' ? (
        <Card variant="danger">
          <T v="body">Có thể trùng với một giao dịch khác cùng số tiền.</T>
          <Button title="Kiểm tra" size="sm" variant="text" onPress={() => router.push('/review')} />
        </Card>
      ) : null}
      <T v="caption" color={c.a} weight="semibold">
        Ví Gọn đọc được
      </T>
      <Card variant="tint">
        <Row between>
          <T v="caption">Số tiền</T>
          <Money amount={tx.amount} kind={tx.kind} v="title" />
        </Row>
        <Row between>
          <T v="caption">{tx.kind === 'income' ? 'Nguồn' : 'Nơi chi'}</T>
          <T v="headline" style={{ flexShrink: 1, textAlign: 'right' }}>
            {tx.merchant}
          </T>
        </Row>
        <Row between>
          <T v="caption">Thời gian</T>
          <T v="headline">{`${hhmm(new Date(tx.at))} · ${relativeTime(tx.at)}`}</T>
        </Row>
        {tx.account ? (
          <Row between>
            <T v="caption">Tài khoản</T>
            <T v="headline">{`*${tx.account}`}</T>
          </Row>
        ) : null}
      </Card>
      <T v="headline">Danh mục</T>
      <Chips>
        {cats.map((x) => (
          <Chip key={x.id} label={x.name} icon={x.icon} selected={chosen === x.id} onPress={() => setCat(x.id)} />
        ))}
      </Chips>
      {kw ? (
        <Row>
          <Check on={learn} />
          <T
            v="body"
            style={{ flex: 1 }}
            onPress={() => setLearn((v) => !v)}
          >{`Lần sau tự xếp “${kw}” vào ${cats.find((x) => x.id === chosen)?.name ?? 'danh mục này'}`}</T>
        </Row>
      ) : null}
      <Button title="Mở chi tiết để sửa" variant="text" size="sm" onPress={() => router.push(`/tx/${tx.id}`)} />
    </Screen>
  );
}
