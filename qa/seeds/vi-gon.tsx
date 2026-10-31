// Seed QA (chỉ chép vào bản build trong CI thành app/qa-seed.tsx): dữ liệu lớn như dùng thật 18 tháng.
import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { countWhere, insertMany, wipeTx } from '../src/db';
import { useVi } from '../src/store';
import { Tx } from '../src/types';

let seed = 20261031;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const pad = (n: number) => String(n).padStart(2, '0');
const dot = (n: number) => n.toLocaleString('en-US').replace(/,/g, '.');

const SPEND: [string, string, number, number][] = [
  ['food', 'COM TAM BA GHIEN', 35, 75],
  ['food', 'HIGHLANDS COFFEE', 35, 65],
  ['food', 'PHUC LONG', 45, 70],
  ['food', 'GRABFOOD', 60, 220],
  ['food', 'SHOPEEFOOD', 50, 180],
  ['food', 'BUN BO HUE O XUAN', 40, 60],
  ['food', 'CIRCLE K', 15, 90],
  ['move', 'GRAB', 25, 140],
  ['move', 'XANH SM', 30, 160],
  ['move', 'PETROLIMEX', 60, 120],
  ['move', 'GUI XE', 5, 10],
  ['shop', 'SHOPEE', 80, 1200],
  ['shop', 'LAZADA', 90, 900],
  ['shop', 'WINMART', 120, 650],
  ['shop', 'UNIQLO', 300, 900],
  ['home', 'EVN TIEN DIEN', 600, 1400],
  ['home', 'TIEN NUOC', 80, 200],
  ['home', 'FPT TELECOM INTERNET', 220, 220],
  ['phone', 'VIETTEL NAP TIEN DT', 100, 200],
  ['health', 'PHARMACITY', 50, 400],
  ['health', 'NHA KHOA', 300, 2500],
  ['study', 'FAHASA', 90, 450],
  ['study', 'HOC PHI TIENG ANH', 2500, 4500],
  ['fun', 'CGV', 90, 260],
  ['fun', 'NETFLIX', 260, 260],
  ['fun', 'SPOTIFY', 59, 59],
  ['gift', 'MUNG DAM CUOI', 500, 2000],
  ['family', 'GUI BO ME', 2000, 5000],
  ['other', 'CHUYEN KHOAN', 50, 900],
];

async function run(log: (s: string) => void) {
  const t0 = Date.now();
  const now = Date.now();
  const startDay = 10;
  wipeTx();
  const list: Tx[] = [];
  let k = 0;
  const mk = (p: Partial<Tx> & { amount: number; kind: Tx['kind']; at: number }): Tx => ({
    id: `qa${++k}`,
    categoryId: null,
    merchant: '',
    note: '',
    account: pick(['1234', '5678', '9012']),
    source: 'auto',
    status: 'confirmed',
    raw: null,
    fundId: null,
    flag: null,
    pairId: null,
    createdAt: p.at,
    ...p,
  });
  const days = 540;
  for (let d = days; d >= 0; d--) {
    const day = new Date(now - d * 86400000);
    if (day.getDate() === startDay) {
      const at = new Date(day);
      at.setHours(9, 2, 0, 0);
      const amt = 18_500_000 + int(0, 4) * 500_000;
      list.push(
        mk({
          amount: amt,
          kind: 'income',
          at: at.getTime(),
          categoryId: 'salary',
          merchant: 'Luong thang',
          raw: `TK 1234 +${dot(amt)} VND luc 09:02 ${pad(day.getDate())}/${pad(day.getMonth() + 1)}. ND: LUONG THANG ${day.getMonth() + 1}`,
        }),
      );
    }
    if (rnd() < 0.04)
      list.push(
        mk({
          amount: int(5, 40) * 100_000,
          kind: 'income',
          at: day.getTime() + 3600000 * 15,
          categoryId: pick(['bonus', 'side', 'in_other']),
          merchant: pick(['Thuong du an', 'Ban do cu', 'Hoan tien']),
        }),
      );
    const n = int(14, 30);
    for (let i = 0; i < n; i++) {
      const [cat, m, lo, hi] = pick(SPEND);
      const at = new Date(day);
      at.setHours(int(6, 23), int(0, 59), 0, 0);
      if (at.getTime() > now) continue;
      const amt = int(lo, hi) * 1000;
      const auto = rnd() < 0.75;
      list.push(
        mk({
          amount: amt,
          kind: 'expense',
          at: at.getTime(),
          categoryId: cat,
          merchant: m.charAt(0) + m.slice(1).toLowerCase(),
          source: auto ? 'auto' : 'manual',
          note: rnd() < 0.05 ? 'Ghi chú QA' : '',
          raw: auto
            ? `TK *${pick(['1234', '5678'])} -${dot(amt)} VND luc ${pad(at.getHours())}:${pad(at.getMinutes())} ${pad(at.getDate())}/${pad(at.getMonth() + 1)}. ND: ${m}`
            : null,
        }),
      );
    }
  }
  // Chờ xác nhận gần đây, cặp nghi trùng và chuyển nội bộ để màn Kiểm tra có việc.
  for (let i = 0; i < 25; i++) {
    const t = list[list.length - 1 - i * 3];
    if (t.kind === 'expense') t.status = 'pending';
  }
  for (let i = 0; i < 4; i++) {
    const at = now - (i + 1) * 7200000;
    const amt = int(10, 90) * 10_000;
    const a = mk({
      amount: amt,
      kind: 'expense',
      at,
      merchant: 'Circle k',
      categoryId: 'food',
      raw: `TK *1234 -${dot(amt)} VND. ND: CIRCLE K`,
    });
    const b = mk({
      amount: amt,
      kind: 'expense',
      at: at + 60000,
      merchant: 'Circle k',
      categoryId: 'food',
      source: 'manual',
    });
    a.flag = b.flag = 'dup';
    a.pairId = b.id;
    b.pairId = a.id;
    list.push(a, b);
    const c = mk({
      amount: 2_000_000 + i * 100_000,
      kind: 'expense',
      at: at - 3600000,
      account: '1234',
      raw: `TK 1234 -${dot(2_000_000 + i * 100_000)} VND ND: CHUYEN TIEN`,
    });
    const e = mk({
      amount: 2_000_000 + i * 100_000,
      kind: 'income',
      at: at - 3590000,
      account: '5678',
      raw: `TK 5678 +${dot(2_000_000 + i * 100_000)} VND ND: CHUYEN TIEN`,
    });
    c.flag = e.flag = 'transfer';
    c.pairId = e.id;
    e.pairId = c.id;
    list.push(c, e);
  }
  // Lô nhỏ: SQLite bản web (worker đồng bộ) lỗi với giao dịch lớn. Ghi lại chi tiết lỗi đầu tiên để báo cáo.
  // Lô 1.000 dòng: bản web của expo-sqlite có giới hạn thời gian cho mỗi lệnh đồng bộ, một giao dịch 12 nghìn dòng vượt giới hạn đó (IT6, chỉ web).
  let chunk = 1000;
  for (let i = 0; i < list.length; ) {
    const t1 = Date.now();
    try {
      insertMany(list.slice(i, i + chunk));
    } catch (e) {
      const detail = e && typeof e === 'object' ? JSON.stringify(e, Object.getOwnPropertyNames(e)) : String(e);
      log(`LỖI GHI lô ${i}-${i + chunk}: ${detail.slice(0, 600)}`);
      if (chunk > 25) {
        chunk = Math.floor(chunk / 2);
        continue;
      }
      throw new Error(`Ghi SQLite thất bại ở dòng ${i}: ${detail.slice(0, 300)}`);
    }
    i += chunk;
    if (i % 2000 < chunk)
      log(`Đã ghi ${Math.min(list.length, i)}/${list.length} giao dịch (lô ${chunk} dòng, ${Date.now() - t1} ms)`);
    await new Promise((r) => setTimeout(r, 0));
  }
  const tTx = Date.now() - t0;

  useVi.setState({
    onboarded: true,
    name: 'Minh Anh',
    monthlyBudget: 15_000_000,
    monthStartDay: startDay,
    isPro: true,
    askBeforeSave: true,
    budgets: { food: 4_000_000, move: 1_200_000, shop: 2_500_000, fun: 800_000, home: 2_200_000, health: 1_000_000 },
    funds: [
      {
        id: 'f1',
        name: 'Du lịch Đà Nẵng',
        icon: 'map-pin',
        goal: 12_000_000,
        saved: 7_400_000,
        deadline: now + 120 * 86400000,
        remindPayday: true,
        createdAt: now - 200 * 86400000,
      },
      {
        id: 'f2',
        name: 'Quỹ khẩn cấp',
        icon: 'shield',
        goal: 60_000_000,
        saved: 23_500_000,
        deadline: null,
        remindPayday: true,
        createdAt: now - 400 * 86400000,
      },
      {
        id: 'f3',
        name: 'Mua laptop mới',
        icon: 'smartphone',
        goal: 32_000_000,
        saved: 32_000_000,
        deadline: now - 10 * 86400000,
        remindPayday: false,
        createdAt: now - 300 * 86400000,
      },
      {
        id: 'f4',
        name: 'Học thạc sĩ',
        icon: 'book-open',
        goal: 150_000_000,
        saved: 18_000_000,
        deadline: now + 700 * 86400000,
        remindPayday: true,
        createdAt: now - 90 * 86400000,
      },
      {
        id: 'f5',
        name: 'Quà Tết bố mẹ',
        icon: 'gift',
        goal: 8_000_000,
        saved: 1_500_000,
        deadline: now + 80 * 86400000,
        remindPayday: true,
        createdAt: now - 30 * 86400000,
      },
    ],
    rules: SPEND.slice(0, 20).map(([cat, m], i) => ({
      id: `r${i}`,
      keyword: m.split(' ').slice(0, 2).join(' '),
      categoryId: cat,
    })),
    unparsed: Array.from({ length: 8 }, (_, i) => ({
      id: `u${i}`,
      text: `MoMo: Ban da nhan ${dot(int(1, 50) * 10000)}d tu NGUYEN VAN ${String.fromCharCode(65 + i)}`,
      app: 'com.mservice.momotransfer',
      at: now - i * 3600000,
    })),
  });
  await new Promise((r) => setTimeout(r, 2500));
  const kv = (await Storage.getItem('vi-gon')) ?? '';
  return { app: 'vi-gon', tx: countWhere('1 = 1'), txWriteMs: tTx, totalMs: Date.now() - t0, kvBytes: kv.length };
}

export default function QaSeed() {
  const [lines, setLines] = useState<string[]>(['Đang tạo dữ liệu…']);
  useEffect(() => {
    run((s) => setLines((l) => [...l, s]))
      .then((r) => setLines((l) => [...l, `QA_SEED_DONE ${JSON.stringify(r)}`]))
      .catch((e) => setLines((l) => [...l, `QA_SEED_FAIL ${String(e?.stack || e)}`]));
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      {lines.map((l, i) => (
        <Text key={i}>{l}</Text>
      ))}
    </ScrollView>
  );
}
