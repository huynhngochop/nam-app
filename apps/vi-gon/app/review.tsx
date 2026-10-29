import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Button, Card, EmptyState, Row, Screen, T, useToast } from '@nam/ui';
import { hhmm, shortDate, track } from '@nam/core';
import { deleteTx, getTx, insertTx, listTx, updateTx, useQuery } from '../src/db';
import { Tx } from '../src/types';
import { Money } from '../src/ui';

const SRC: Record<Tx['source'], string> = { auto: 'thông báo', manual: 'nhập tay', import: 'dán tin' };

/** VG-19 · Trùng & chuyển nội bộ: không tính chi tiêu hai lần. */
export default function Review() {
  const toast = useToast();
  const flagged = useQuery(() => listTx({ flagged: true, limit: 200 }), [], []);
  const pairs: [Tx, Tx | null][] = [];
  const seen = new Set<string>();
  for (const t of flagged) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    const other = t.pairId ? getTx(t.pairId) : null;
    if (other) seen.add(other.id);
    pairs.push([t, other]);
  }

  const clear = (a: Tx, b: Tx | null) => { updateTx(a.id, { flag: null, pairId: null }); if (b) updateTx(b.id, { flag: null, pairId: null }); };
  const merge = (a: Tx, b: Tx) => {
    const drop = a.source === 'auto' && b.source !== 'auto' ? b : b.createdAt > a.createdAt ? b : a;
    const keep = drop === a ? b : a;
    deleteTx(drop.id);
    updateTx(keep.id, { flag: null, pairId: null, status: 'confirmed' });
    track('dup_merged');
    toast('Đã gộp làm một', { action: { label: 'Hoàn tác', onPress: () => insertTx(drop) } });
  };
  const markTransfer = (a: Tx, b: Tx) => {
    updateTx(a.id, { kind: 'transfer', flag: null, status: 'confirmed', categoryId: null });
    updateTx(b.id, { kind: 'transfer', flag: null, status: 'confirmed', categoryId: null });
    track('transfer_marked');
    toast('Đã đánh dấu chuyển nội bộ — không tính vào thu chi');
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title="Kiểm tra giao dịch" onBack={() => router.back()} />
      {!pairs.length ? <EmptyState icon="check-circle" title="Không còn gì cần kiểm tra" /> : pairs.map(([a, b]) => {
        const isDup = a.flag === 'dup';
        return (
          <View key={a.id} style={{ gap: 8 }}>
            <Card variant="tint">
              <T v="headline">{isDup ? 'Có thể là cùng một giao dịch' : 'Chuyển giữa tài khoản của bạn?'}</T>
              <T v="caption">{isDup ? `Cùng số tiền${b ? `, cách nhau ${Math.round(Math.abs(a.at - b.at) / 1000)} giây` : ''}.` : 'Một khoản ra và một khoản vào cùng số tiền, khác tài khoản.'}</T>
            </Card>
            {[a, b].filter(Boolean).map((t) => (
              <Card key={t!.id}>
                <Row between>
                  <View style={{ flex: 1 }}>
                    <T v="headline">{`${t!.account ? `*${t!.account} · ` : ''}${hhmm(new Date(t!.at))} ${shortDate(new Date(t!.at))}`}</T>
                    <T v="caption" muted>{`${t!.merchant} · ${SRC[t!.source]}`}</T>
                  </View>
                  <Money amount={t!.amount} kind={t!.kind} />
                </Row>
              </Card>
            ))}
            <Row>
              <View style={{ flex: 1 }}><Button title={isDup ? 'Giữ cả hai' : 'Không phải'} variant="secondary" size="md" onPress={() => clear(a, b)} /></View>
              {b ? <View style={{ flex: 1 }}><Button title={isDup ? 'Gộp làm một' : 'Đúng vậy'} size="md" onPress={() => (isDup ? merge(a, b) : markTransfer(a, b))} /></View> : null}
            </Row>
          </View>
        );
      })}
    </Screen>
  );
}
