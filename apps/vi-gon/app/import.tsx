import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  AppBar,
  Banner,
  Button,
  Card,
  Chip,
  Chips,
  ListItem,
  Screen,
  SectionHeader,
  Segmented,
  T,
  TextField,
  useTheme,
  useToast,
} from '@nam/ui';
import { relativeTime, track, uid } from '@nam/core';
import { insertTx } from '../src/db';
import { ingestMany, ingestText } from '../src/ingest';
import { categorize } from '../src/parse';
import { useVi } from '../src/store';
import { Unparsed } from '../src/types';

const digits = (s: string) => Number(s.replace(/\D/g, '')) || 0;

/**
 * Dán tin ngân hàng (Android không có bộ đọc, hoặc tin bị thiếu) · nhận deep link vigon://import?text=… từ Phím tắt iOS ·
 * "Chưa đọc được": người dùng điền giúp một lần.
 */
export default function Import() {
  const { c } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ text?: string }>();
  const state = useVi();
  const [text, setText] = useState('');
  const [teach, setTeach] = useState<Unparsed | null>(null);
  const handled = useRef(false);

  // Deep link từ Phím tắt: xử lý ngay một lần rồi đưa sang màn xác nhận.
  useEffect(() => {
    if (!params.text || handled.current) return;
    handled.current = true;
    let raw = String(params.text);
    try {
      raw = decodeURIComponent(raw);
    } catch {
      /* đã được giải mã sẵn */
    }
    const result = ingestText(raw.slice(0, 1000), { source: 'auto', app: 'ios-shortcut' });
    track('shortcut_import', { status: result.status });
    if (result.status === 'pending') router.replace('/pending');
    else if (result.status === 'saved') {
      toast('Đã ghi giao dịch', { tone: 'success' });
      router.replace('/(tabs)/home');
    } else if (result.status === 'duplicate') {
      toast('Giao dịch này đã có');
      router.replace('/(tabs)/home');
    }
    // Mỗi đoạn tin nhắn được chia sẻ vào chỉ xử lý một lần; `toast` và store không phải lý do để chạy lại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.text]);

  const run = () => {
    const result = ingestMany(text);
    track('paste_import', result);
    setText('');
    const parts = [
      result.saved && `${result.saved} đã lưu`,
      result.pending && `${result.pending} chờ xác nhận`,
      result.duplicate && `${result.duplicate} đã có`,
      result.unparsed && `${result.unparsed} chưa đọc được`,
    ]
      .filter(Boolean)
      .join(' · ');
    toast(parts || 'Không có gì để ghi', { tone: result.saved + result.pending ? 'success' : 'info' });
    if (result.pending && !result.unparsed) router.replace('/pending');
  };

  if (teach) return <Teach item={teach} onDone={() => setTeach(null)} />;

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={<Button title="Đọc tin" disabled={text.trim().length < 8} onPress={run} />}
    >
      <AppBar title="Dán tin ngân hàng" onBack={() => router.back()} backIcon="x" />
      <T v="caption" muted>
        Dán một hoặc nhiều thông báo / SMS biến động số dư. Ví Gọn đọc ngay trên máy, không gửi đi đâu.
      </T>
      <TextField
        value={text}
        onChangeText={setText}
        multiline
        style={{ minHeight: 140 }}
        placeholder={'TK *1234 -85.000 VND lúc 12:31. ND: COM TAM'}
      />
      <Button
        title="Dán từ bộ nhớ tạm"
        icon="clipboard"
        variant="secondary"
        size="md"
        onPress={async () => {
          const clipboard = await Clipboard.getStringAsync().catch(() => '');
          if (clipboard) setText((x) => (x ? `${x}\n\n${clipboard}` : clipboard));
          else toast('Bộ nhớ tạm trống');
        }}
      />
      {state.unparsed.length ? (
        <>
          <SectionHeader title={`Chưa đọc được (${state.unparsed.length})`} />
          {state.unparsed.map((u) => (
            <ListItem key={u.id} title={u.text} subtitle={relativeTime(u.at)} chevron onPress={() => setTeach(u)} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

/** Người dùng dạy app một lần. Không gửi mẫu đi đâu ở bản này (chưa có máy chủ nhận mẫu). */
function Teach({ item, onDone }: { item: Unparsed; onDone: () => void }) {
  const toast = useToast();
  const state = useVi();
  const guess = item.text.match(/([\d]{1,3}(?:[.,]\d{3})+)/);
  const [amount, setAmount] = useState(guess ? digits(guess[1]).toLocaleString('vi-VN') : '');
  const [kind, setKind] = useState<'expense' | 'income'>(/\+/.test(item.text) ? 'income' : 'expense');
  const [merchant, setMerchant] = useState('');
  const { categoryId } = categorize(merchant, kind, state.rules);
  const [cat, setCat] = useState<string | null>(null);
  const cats = state.categories.filter((x) => x.kind === kind);
  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <View style={{ gap: 8 }}>
          <Button
            title="Lưu"
            disabled={!digits(amount)}
            onPress={() => {
              insertTx({
                id: uid(),
                amount: digits(amount),
                kind,
                categoryId: cat ?? categoryId,
                merchant: merchant.trim() || (kind === 'income' ? 'Tiền vào' : 'Chi tiêu'),
                note: '',
                at: item.at,
                account: null,
                source: 'import',
                status: 'confirmed',
                raw: item.text,
                fundId: null,
                flag: null,
                pairId: null,
                createdAt: Date.now(),
              });
              state.dropUnparsed(item.id);
              track('unparsed_taught');
              toast('Đã lưu', { tone: 'success' });
              onDone();
            }}
          />
          <Button
            title="Không phải giao dịch — bỏ"
            variant="text"
            onPress={() => {
              state.dropUnparsed(item.id);
              onDone();
            }}
          />
        </View>
      }
    >
      <AppBar title="Chưa đọc được" onBack={onDone} backIcon="x" />
      <Card variant="fill">
        <T v="caption" muted weight="semibold">
          Thông báo gốc
        </T>
        <T v="caption">{item.text}</T>
      </Card>
      <T v="caption" muted>
        Ví Gọn chưa quen định dạng này. Điền giúp một lần:
      </T>
      <Segmented
        options={[
          { key: 'expense', label: 'Chi' },
          { key: 'income', label: 'Thu' },
        ]}
        value={kind}
        onChange={(k) => {
          setKind(k);
          setCat(null);
        }}
      />
      <TextField
        label="Số tiền"
        value={amount}
        onChangeText={(v) => setAmount(digits(v) ? digits(v).toLocaleString('vi-VN') : '')}
        keyboardType="number-pad"
      />
      <TextField
        label={kind === 'income' ? 'Nguồn' : 'Nơi chi'}
        value={merchant}
        onChangeText={setMerchant}
        placeholder="Ví dụ: Siêu thị"
      />
      <Chips>
        {cats.map((x) => (
          <Chip key={x.id} label={x.name} selected={(cat ?? categoryId) === x.id} onPress={() => setCat(x.id)} />
        ))}
      </Chips>
      <Banner tone="ok" icon="shield" text="Thông tin này chỉ lưu trên máy của bạn." />
    </Screen>
  );
}
