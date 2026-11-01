import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Chip,
  Chips,
  Dialog,
  EmptyState,
  Icon,
  Row,
  Sheet,
  T,
  TextField,
  Thumb,
  useTheme,
  useToast,
} from '@nam/ui';
import { hhmm, shortDate, uid, vnd } from '@nam/core';
import { deleteTx, getTx, insertTx, updateTx, useQuery } from './db';
import { ruleKeyword } from './parse';
import { catOf, useVi } from './store';
import { untransferKinds } from './transfer';
import { Tx } from './types';
import { Money } from './ui';

const SOURCE_LABEL: Record<Tx['source'], string> = { auto: 'Tự động', manual: 'Nhập tay', import: 'Dán tin' };

/** VG-09 · Chi tiết giao dịch: đổi danh mục (kèm tạo quy tắc), ghi chú, tách, xóa có hoàn tác. */
export function TxDetail({ id, onClose }: { id: string; onClose?: () => void }) {
  const { c } = useTheme();
  const toast = useToast();
  const s = useVi();
  const tx = useQuery(() => getTx(id), [id], null);
  // Chân kia của cặp chuyển nội bộ (V4). Qua useQuery: không đọc SQLite mỗi lần render, lỗi CSDL không làm sập màn.
  const pairTx = useQuery(
    () => (tx?.kind === 'transfer' && tx.pairId ? getTx(tx.pairId) : null),
    [tx?.kind, tx?.pairId],
    null,
  );
  const [note, setNote] = useState(tx?.note ?? '');
  const [confirmDel, setConfirmDel] = useState(false);
  // Sửa số tiền / nơi chi khi nhập nhầm hay ngân hàng đọc sai (UAT V8: trước đây chỉ xóa rồi nhập lại được).
  const [editAmt, setEditAmt] = useState<null | { amount: string; merchant: string }>(null);
  const [split, setSplit] = useState(false);
  const [parts, setParts] = useState<{ categoryId: string; amount: string }[]>([]);
  useEffect(() => {
    setNote(tx?.note ?? '');
  }, [tx?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Lưu ghi chú cả khi rời màn lúc ô ghi chú còn đang gõ (bấm Quay lại ngay, onBlur không kịp chạy) — UAT V8.
  const latest = useRef({ note, tx });
  latest.current = { note, tx };
  useEffect(
    () => () => {
      const { note: n, tx: t } = latest.current;
      if (t && n.trim() !== (t.note ?? '')) updateTx(t.id, { note: n.trim() });
    },
    [],
  );

  if (!tx) return <EmptyState icon="file" title="Không tìm thấy giao dịch" body="Có thể đã bị xóa." />;
  const cat = catOf(tx.categoryId, s.categories);
  const cats = s.categories.filter((x) => x.kind === (tx.kind === 'income' ? 'income' : 'expense'));

  const setCat = (categoryId: string) => {
    updateTx(tx.id, { categoryId, status: 'confirmed' });
    if (tx.merchant && tx.source !== 'manual') {
      const kw = ruleKeyword(tx.merchant);
      toast(`Đã đổi sang ${catOf(categoryId, s.categories).name}`, {
        action: kw
          ? {
              label: `Luôn xếp “${kw}”`,
              onPress: () => {
                s.addRule(kw, categoryId);
                toast('Đã tạo quy tắc');
              },
            }
          : undefined,
      });
    }
  };
  // V4: trả lại đúng chiều thu/chi cho giao dịch này và chân kia của cặp chuyển khoản.
  const untransfer = tx.kind === 'transfer' ? untransferKinds(tx, pairTx) : { self: null, pair: null };
  // Hai chân của một lần chuyển khoản luôn ngược chiều, nên chân kia lấy chiều ngược với chân này.
  const undoTransfer = (kind: 'expense' | 'income') => {
    const other = kind === 'income' ? 'expense' : 'income';
    updateTx(tx.id, { kind, flag: null, pairId: null, categoryId: kind === 'income' ? 'in_other' : 'other' });
    if (pairTx && pairTx.kind === 'transfer')
      updateTx(pairTx.id, {
        kind: other,
        flag: null,
        pairId: null,
        categoryId: other === 'income' ? 'in_other' : 'other',
      });
    toast(kind === 'income' ? 'Đã chuyển thành khoản thu' : 'Đã chuyển thành khoản chi');
  };
  const remove = () => {
    const copy = { ...tx };
    deleteTx(tx.id);
    setConfirmDel(false);
    toast('Đã xóa giao dịch', { action: { label: 'Hoàn tác', onPress: () => insertTx(copy) } });
    if (onClose) onClose();
    else router.back();
  };
  const partsTotal = parts.reduce((a, p) => a + (Number(p.amount.replace(/\D/g, '')) || 0), 0);
  const doSplit = () => {
    const rest = tx.amount - partsTotal;
    if (rest < 0 || !parts.length) return;
    parts.forEach((p) => {
      const a = Number(p.amount.replace(/\D/g, ''));
      if (a > 0)
        insertTx({
          ...tx,
          id: uid(),
          amount: a,
          categoryId: p.categoryId,
          status: 'confirmed',
          flag: null,
          pairId: null,
          note: `Tách từ ${tx.merchant}`,
          createdAt: Date.now(),
        });
    });
    if (rest > 0) updateTx(tx.id, { amount: rest, status: 'confirmed' });
    else deleteTx(tx.id);
    setSplit(false);
    toast(`Đã tách thành ${parts.length + (rest > 0 ? 1 : 0)} giao dịch`, { tone: 'success' });
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Thumb icon={tx.kind === 'transfer' ? 'repeat' : cat.icon} color={c.a} bg={c.at} size={52} />
        <Money amount={tx.amount} kind={tx.kind} v="display" />
        <T v="body" muted>
          {tx.merchant || cat.name}
        </T>
        {tx.kind !== 'transfer' ? (
          <Button
            title="Sửa số tiền"
            icon="edit-2"
            size="sm"
            variant="text"
            onPress={() => setEditAmt({ amount: tx.amount.toLocaleString('vi-VN'), merchant: tx.merchant })}
          />
        ) : null}
        {tx.status === 'pending' ? <Badge label="Chờ xác nhận" tone="warning" /> : null}
      </View>
      <Card>
        <Row between>
          <T v="caption" muted>
            Thời gian
          </T>
          <T v="headline">{`${hhmm(new Date(tx.at))} · ${shortDate(new Date(tx.at))}`}</T>
        </Row>
        {tx.account ? (
          <Row between>
            <T v="caption" muted>
              Tài khoản
            </T>
            <T v="headline">{`*${tx.account}`}</T>
          </Row>
        ) : null}
        <Row between>
          <T v="caption" muted>
            Nguồn
          </T>
          <Badge label={SOURCE_LABEL[tx.source]} tone="accent" />
        </Row>
      </Card>
      {tx.kind !== 'transfer' ? (
        <>
          <T v="caption" muted weight="semibold">
            Danh mục
          </T>
          <Chips>
            {cats.map((x) => (
              <Chip
                key={x.id}
                label={x.name}
                icon={x.icon}
                selected={tx.categoryId === x.id}
                onPress={() => setCat(x.id)}
              />
            ))}
          </Chips>
        </>
      ) : (
        <Card variant="fill">
          <T v="body">
            {tx.fundId
              ? 'Góp / rút quỹ — không tính vào thu chi.'
              : 'Chuyển giữa tài khoản của bạn — không tính vào chi tiêu.'}
          </T>
          {tx.fundId ? null : untransfer.self ? (
            <Button
              title="Không phải chuyển nội bộ"
              size="sm"
              variant="text"
              onPress={() => undoTransfer(untransfer.self!)}
            />
          ) : (
            <Row wrap>
              <Button title="Thật ra là khoản chi" size="sm" variant="text" onPress={() => undoTransfer('expense')} />
              <Button title="Thật ra là khoản thu" size="sm" variant="text" onPress={() => undoTransfer('income')} />
            </Row>
          )}
        </Card>
      )}
      <TextField
        label="Ghi chú"
        value={note}
        onChangeText={setNote}
        onBlur={() => note !== tx.note && updateTx(tx.id, { note: note.trim() })}
        placeholder="Thêm ghi chú…"
        maxLength={200}
      />
      {tx.status === 'pending' ? (
        <Button
          title="Xác nhận"
          icon="check"
          onPress={() => {
            updateTx(tx.id, { status: 'confirmed' });
            toast('Đã lưu');
          }}
        />
      ) : null}
      {tx.kind === 'expense' ? (
        <Button
          title="Tách giao dịch"
          icon="git-branch"
          variant="secondary"
          size="md"
          onPress={() => {
            setParts([{ categoryId: cats[0].id, amount: '' }]);
            setSplit(true);
          }}
        />
      ) : null}
      {tx.raw ? (
        <Card variant="fill">
          <Row>
            <Icon name="bell" size={16} color={c.inkMuted} />
            <T v="caption" muted style={{ flex: 1 }}>
              {tx.raw}
            </T>
          </Row>
        </Card>
      ) : null}
      <Button title="Xóa giao dịch" icon="trash-2" variant="danger" size="md" onPress={() => setConfirmDel(true)} />

      <Dialog
        visible={confirmDel}
        title="Xóa giao dịch này?"
        body="Bạn có thể hoàn tác ngay sau khi xóa."
        confirm="Xóa"
        destructive
        onCancel={() => setConfirmDel(false)}
        onConfirm={remove}
      />
      <Sheet
        visible={!!editAmt}
        onClose={() => setEditAmt(null)}
        title="Sửa giao dịch"
        footer={
          <Button
            title="Lưu"
            disabled={!editAmt || !(Number(editAmt.amount.replace(/\D/g, '')) > 0)}
            onPress={() => {
              if (!editAmt) return;
              updateTx(tx.id, {
                amount: Number(editAmt.amount.replace(/\D/g, '')),
                merchant: editAmt.merchant.trim(),
              });
              setEditAmt(null);
              toast('Đã lưu', { tone: 'success' });
            }}
          />
        }
      >
        {editAmt ? (
          <View style={{ gap: 12 }}>
            <TextField
              label="Số tiền (đồng)"
              value={editAmt.amount}
              keyboardType="number-pad"
              autoFocus
              onChangeText={(v) => {
                const n = Number(v.replace(/\D/g, ''));
                setEditAmt({ ...editAmt, amount: n ? n.toLocaleString('vi-VN') : '' });
              }}
            />
            <TextField
              label={tx.kind === 'income' ? 'Nguồn' : 'Nơi chi'}
              value={editAmt.merchant}
              maxLength={60}
              onChangeText={(v) => setEditAmt({ ...editAmt, merchant: v })}
            />
          </View>
        ) : null}
      </Sheet>
      <Sheet
        visible={split}
        onClose={() => setSplit(false)}
        title="Tách giao dịch"
        footer={
          <Button
            title="Tách"
            disabled={!parts.some((p) => Number(p.amount.replace(/\D/g, '')) > 0) || partsTotal > tx.amount}
            onPress={doSplit}
          />
        }
      >
        <View style={{ gap: 12 }}>
          <T
            v="caption"
            muted
          >{`Tổng ${vnd(tx.amount)} · phần còn lại giữ ở “${cat.name}”: ${vnd(Math.max(0, tx.amount - partsTotal))}`}</T>
          {parts.map((p, i) => (
            <View key={i} style={{ gap: 6 }}>
              <TextField
                label={`Phần ${i + 1}`}
                value={p.amount}
                keyboardType="number-pad"
                placeholder="Số tiền"
                onChangeText={(v) => setParts(parts.map((x, j) => (j === i ? { ...x, amount: v } : x)))}
              />
              <Chips scroll>
                {cats.map((x) => (
                  <Chip
                    key={x.id}
                    label={x.name}
                    selected={p.categoryId === x.id}
                    onPress={() => setParts(parts.map((y, j) => (j === i ? { ...y, categoryId: x.id } : y)))}
                  />
                ))}
              </Chips>
            </View>
          ))}
          {partsTotal > tx.amount ? (
            <T v="caption" color={c.negative}>
              Tổng các phần lớn hơn số tiền gốc.
            </T>
          ) : null}
          {parts.length < 5 ? (
            <Button
              title="Thêm phần"
              icon="plus"
              variant="text"
              size="sm"
              onPress={() => setParts([...parts, { categoryId: cats[0].id, amount: '' }])}
            />
          ) : null}
        </View>
      </Sheet>
    </View>
  );
}
