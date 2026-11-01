import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppBar,
  Button,
  Card,
  Chip,
  Chips,
  Dialog,
  EmptyState,
  ProgressBar,
  Row,
  Screen,
  Segmented,
  Sheet,
  Stepper,
  T,
  TextField,
  Toggle,
  useTheme,
  useToast,
} from '@nam/ui';
import { shortDate, track, uid, vnd } from '@nam/core';
import { insertTx, totals, useQuery } from '../../src/db';
import { monthlyNeed } from '../../src/funds';
import { periodOf, useVi } from '../../src/store';
import { FUND_ICON_NAMES, FUND_ICONS } from '../../src/types';

const digits = (s: string) => Number(s.replace(/\D/g, '')) || 0;
const money = (n: number) => (n ? n.toLocaleString('vi-VN') : '');

/** VG-14 Quỹ mới (id = "new") · Chi tiết quỹ: góp / rút (ghi là chuyển quỹ, không tính vào chi tiêu). */
export default function FundScreen() {
  const { c } = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useVi();
  const fund = s.funds.find((f) => f.id === id);
  const isNew = id === 'new';
  const [name, setName] = useState(fund?.name ?? '');
  const [icon, setIcon] = useState(fund?.icon ?? FUND_ICONS[0]);
  const [goal, setGoal] = useState(money(fund?.goal ?? 0));
  const [months, setMonths] = useState(
    fund?.deadline ? Math.max(1, Math.round((fund.deadline - Date.now()) / (30.4 * 86400000))) : 6,
  );
  const [hasDeadline, setHasDeadline] = useState(isNew ? true : !!fund?.deadline);
  const [remind, setRemind] = useState(fund?.remindPayday ?? true);
  const [edit, setEdit] = useState(isNew);
  const [move, setMove] = useState<null | 'in' | 'out'>(null);
  const [amount, setAmount] = useState('');
  const [del, setDel] = useState(false);

  // Dư trung bình 3 kỳ trước. Qua useQuery (IT4): không truy vấn SQLite mỗi lần vẽ / mỗi phím gõ, lỗi CSDL không làm hỏng màn.
  const avg = useQuery(
    () => {
      const arr = Array.from({ length: 3 }, (_, k) => {
        const p = periodOf(s.monthStartDay, -1 - k);
        const t = totals(p.from, p.to);
        return t.income - t.expense;
      }).filter((x) => x > 0);
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    },
    [s.monthStartDay],
    0,
  );

  if (!isNew && !fund)
    return (
      <Screen>
        <AppBar onBack={() => router.back()} />
        <EmptyState icon="target" title="Không tìm thấy quỹ" />
      </Screen>
    );

  const deadline = hasDeadline
    ? new Date(new Date().getFullYear(), new Date().getMonth() + months, 28).getTime()
    : null;
  const need = monthlyNeed({ goal: digits(goal), saved: fund?.saved ?? 0, deadline });

  if (edit) {
    return (
      <Screen
        scroll
        edges={['top', 'bottom']}
        footer={
          <Button
            title={isNew ? 'Tạo quỹ' : 'Lưu'}
            disabled={name.trim().length < 2 || digits(goal) < 10000}
            onPress={() => {
              const fid = s.upsertFund({
                id: isNew ? undefined : id,
                name: name.trim(),
                icon,
                goal: digits(goal),
                deadline,
                remindPayday: remind,
              });
              track(isNew ? 'fund_created' : 'fund_updated');
              toast(isNew ? 'Đã tạo quỹ' : 'Đã lưu', { tone: 'success' });
              if (isNew) router.replace(`/fund/${fid}`);
              else setEdit(false);
            }}
          />
        }
      >
        <AppBar
          title={isNew ? 'Quỹ mới' : 'Sửa quỹ'}
          onBack={() => (isNew ? router.back() : setEdit(false))}
          backIcon="x"
        />
        <TextField
          label="Tên quỹ"
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: Mua laptop mới"
          maxLength={40}
          autoFocus={isNew}
        />
        <Chips>
          {FUND_ICONS.map((i) => (
            <Chip
              key={i}
              label=""
              icon={i}
              accessibilityLabel={`Biểu tượng ${FUND_ICON_NAMES[i] ?? i}`}
              selected={icon === i}
              onPress={() => setIcon(i)}
            />
          ))}
        </Chips>
        <TextField
          label="Mục tiêu (đồng)"
          value={goal}
          onChangeText={(v) => setGoal(money(digits(v)))}
          keyboardType="number-pad"
          placeholder="25.000.000"
        />
        <Row between>
          <T v="body">Đặt hạn</T>
          <Toggle label="Đặt hạn" value={hasDeadline} onChange={setHasDeadline} />
        </Row>
        {hasDeadline ? (
          <Row between>
            <T v="body" style={{ flex: 1 }}>{`Trong · đến ${shortDate(new Date(deadline!))}`}</T>
            <Stepper value={months} min={1} max={120} onChange={setMonths} format={(n) => `${n} tháng`} />
          </Row>
        ) : null}
        {need != null && digits(goal) ? (
          <Card variant="tint">
            <T v="caption">Cần để dành</T>
            <T v="title" color={c.a}>{`${vnd(need)} / tháng`}</T>
            {avg ? <T v="caption">{`≈ ${Math.round((need / avg) * 100)}% số tiết kiệm trung bình của bạn`}</T> : null}
          </Card>
        ) : null}
        <Row between>
          <T v="body" style={{ flex: 1 }}>{`Nhắc góp vào ngày ${s.monthStartDay} hằng tháng`}</T>
          <Toggle label="Nhắc ngày lương" value={remind} onChange={setRemind} />
        </Row>
      </Screen>
    );
  }

  const f = fund!;
  const pct = f.goal ? Math.min(1, f.saved / f.goal) : 0;
  const n = monthlyNeed(f);
  const doMove = () => {
    const a = digits(amount);
    if (!a) return;
    if (move === 'out' && a > f.saved) {
      toast('Số tiền rút lớn hơn số trong quỹ');
      return;
    }
    s.moveFund(f.id, move === 'in' ? a : -a);
    insertTx({
      id: uid(),
      amount: a,
      kind: 'transfer',
      categoryId: null,
      merchant: move === 'in' ? `Góp quỹ ${f.name}` : `Rút quỹ ${f.name}`,
      note: '',
      at: Date.now(),
      account: null,
      source: 'manual',
      status: 'confirmed',
      raw: null,
      fundId: f.id,
      flag: null,
      pairId: null,
      createdAt: Date.now(),
    });
    toast(move === 'in' ? `Đã góp ${vnd(a)}` : `Đã rút ${vnd(a)}`, { tone: 'success' });
    if (move === 'in' && f.saved + a >= f.goal) toast(`Chúc mừng! Quỹ ${f.name} đã đủ mục tiêu`, { tone: 'success' });
    setMove(null);
    setAmount('');
  };

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <Row>
          <View style={{ flex: 1 }}>
            <Button title="Rút" variant="secondary" disabled={!f.saved} onPress={() => setMove('out')} />
          </View>
          <View style={{ flex: 2 }}>
            <Button title="Góp vào quỹ" icon="plus" onPress={() => setMove('in')} />
          </View>
        </Row>
      }
    >
      <AppBar
        title={f.name}
        onBack={() => router.back()}
        right={<Button title="Sửa" size="sm" variant="text" onPress={() => setEdit(true)} />}
      />
      <Card variant="tint">
        <T v="display">{vnd(f.saved)}</T>
        <T v="caption">{`/ ${vnd(f.goal)} · ${Math.round(pct * 100)}%`}</T>
        <ProgressBar value={pct} color={pct >= 1 ? c.positive : c.a} height={10} />
        {f.deadline ? (
          <T v="caption">{`Hạn ${shortDate(new Date(f.deadline))}${n ? ` · cần ${vnd(n)}/tháng` : ''}`}</T>
        ) : null}
      </Card>
      <Button title="Xóa quỹ" variant="danger" size="md" onPress={() => setDel(true)} />
      <Sheet
        visible={!!move}
        onClose={() => setMove(null)}
        title={move === 'in' ? 'Góp vào quỹ' : 'Rút khỏi quỹ'}
        footer={<Button title="Xong" disabled={!digits(amount)} onPress={doMove} />}
      >
        <View style={{ gap: 12 }}>
          <Segmented
            options={[
              { key: 'in', label: 'Góp' },
              { key: 'out', label: 'Rút' },
            ]}
            value={move ?? 'in'}
            onChange={(k) => setMove(k)}
          />
          <TextField
            label="Số tiền"
            value={amount}
            onChangeText={(v) => setAmount(money(digits(v)))}
            keyboardType="number-pad"
            autoFocus
          />
          {n && move === 'in' ? (
            <Chip label={`Góp ${vnd(n)} (đủ tiến độ)`} onPress={() => setAmount(money(n))} />
          ) : null}
          <T v="caption" muted>
            Ghi là chuyển quỹ — không tính vào chi tiêu.
          </T>
        </View>
      </Sheet>
      <Dialog
        visible={del}
        title={`Xóa quỹ ${f.name}?`}
        body={
          f.saved
            ? `Quỹ đang có ${vnd(f.saved)}. Số tiền chỉ là con số theo dõi, không ảnh hưởng tài khoản ngân hàng.`
            : undefined
        }
        confirm="Xóa"
        destructive
        onCancel={() => setDel(false)}
        onConfirm={() => {
          s.removeFund(f.id);
          setDel(false);
          router.back();
          toast('Đã xóa quỹ');
        }}
      />
    </Screen>
  );
}
