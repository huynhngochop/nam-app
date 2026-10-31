import React, { useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  AppBar,
  Button,
  Chip,
  Chips,
  Keypad,
  Screen,
  Segmented,
  T,
  TextField,
  useLayout,
  useTheme,
  useToast,
} from '@nam/ui';
import { addDays, shortDate, track, uid, vnd } from '@nam/core';
import { insertTx } from '../src/db';
import { useVi } from '../src/store';

type Kind = 'expense' | 'income' | 'fund';

/** VG-08 · Thêm giao dịch nhanh bằng bàn phím số. Tablet ngang: bàn phím bên phải, chi tiết bên trái. */
export default function Add() {
  const { c } = useTheme();
  const L = useLayout();
  const toast = useToast();
  const s = useVi();
  const [kind, setKind] = useState<Kind>('expense');
  const [amount, setAmount] = useState(0);
  const [cat, setCat] = useState<string>('food');
  const [fundId, setFundId] = useState<string | undefined>(s.funds[0]?.id);
  const [day, setDay] = useState(0);
  const [note, setNote] = useState('');
  const [merchant, setMerchant] = useState('');
  const cats = s.categories.filter((x) => x.kind === (kind === 'income' ? 'income' : 'expense'));

  const onKey = (k: string) => {
    Haptics.selectionAsync().catch(() => {});
    setAmount((a) => {
      if (k === '⌫') return Math.floor(a / 10);
      const n = Number(`${a || ''}${k}`);
      return n > 9_999_999_999 ? a : n;
    });
  };
  const save = () => {
    if (!amount) return;
    const at = addDays(new Date(), -day);
    if (day) at.setHours(12, 0, 0, 0);
    else at.setTime(Date.now());
    const fund = s.funds.find((f) => f.id === fundId);
    insertTx({
      id: uid(),
      amount,
      kind: kind === 'fund' ? 'transfer' : kind,
      categoryId: kind === 'fund' ? null : cat,
      merchant:
        merchant.trim() ||
        (kind === 'fund' ? `Góp quỹ ${fund?.name ?? ''}` : (cats.find((x) => x.id === cat)?.name ?? '')),
      note: note.trim(),
      at: at.getTime(),
      account: null,
      source: 'manual',
      status: 'confirmed',
      raw: null,
      fundId: kind === 'fund' ? (fundId ?? null) : null,
      flag: null,
      pairId: null,
      createdAt: Date.now(),
    });
    if (kind === 'fund' && fundId) s.moveFund(fundId, amount);
    track('tx_manual_added', { kind });
    toast(`Đã lưu ${vnd(amount)}`, { tone: 'success' });
    router.back();
  };

  const details = (
    <View style={{ gap: 12 }}>
      <Segmented
        options={[
          { key: 'expense', label: 'Chi' },
          { key: 'income', label: 'Thu' },
          { key: 'fund', label: 'Góp quỹ' },
        ]}
        value={kind}
        onChange={(k) => {
          setKind(k);
          setCat(k === 'income' ? 'salary' : 'food');
        }}
      />
      <View style={{ alignItems: 'center', paddingVertical: 4 }}>
        <T
          v="display"
          color={kind === 'income' ? c.positive : c.ink}
          accessibilityLiveRegion="polite"
        >{`${kind === 'income' ? '+' : kind === 'expense' ? '−' : ''}${vnd(amount)}`}</T>
      </View>
      {kind === 'fund' ? (
        s.funds.length ? (
          <Chips>
            {s.funds.map((f) => (
              <Chip
                key={f.id}
                label={f.name}
                icon={f.icon}
                selected={fundId === f.id}
                onPress={() => setFundId(f.id)}
              />
            ))}
          </Chips>
        ) : (
          <Button title="Tạo quỹ trước" variant="secondary" size="sm" onPress={() => router.replace('/fund/new')} />
        )
      ) : (
        <Chips>
          {cats.map((x) => (
            <Chip key={x.id} label={x.name} icon={x.icon} selected={cat === x.id} onPress={() => setCat(x.id)} />
          ))}
        </Chips>
      )}
      <Chips scroll>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <Chip
            key={d}
            label={d === 0 ? 'Hôm nay' : d === 1 ? 'Hôm qua' : shortDate(addDays(new Date(), -d))}
            selected={day === d}
            onPress={() => setDay(d)}
          />
        ))}
      </Chips>
      {kind !== 'fund' ? (
        <TextField
          label={kind === 'income' ? 'Nguồn' : 'Nơi chi'}
          value={merchant}
          onChangeText={setMerchant}
          placeholder={kind === 'income' ? 'Ví dụ: Công ty' : 'Ví dụ: Cơm tấm'}
          maxLength={48}
        />
      ) : null}
      <TextField label="Ghi chú" value={note} onChangeText={setNote} placeholder="Không bắt buộc" maxLength={200} />
    </View>
  );

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      readable={!L.twoPane}
      footer={<Button title="Lưu" disabled={!amount || (kind === 'fund' && !fundId)} onPress={save} />}
    >
      <AppBar title="Thêm giao dịch" onBack={() => router.back()} backIcon="x" />
      {L.twoPane ? (
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <View style={{ flex: 1 }}>{details}</View>
          <View style={{ width: 360 }}>
            <Keypad onKey={onKey} />
          </View>
        </View>
      ) : (
        <>
          {details}
          <Keypad onKey={onKey} />
        </>
      )}
    </Screen>
  );
}
