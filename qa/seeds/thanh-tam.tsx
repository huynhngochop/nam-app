// Seed QA (chỉ chép vào bản build QA thành app/qa-seed.tsx): một gia đình dùng Thành Tâm nhiều năm,
// cộng thêm dữ liệu cực lớn để thử tải: 1.000 ngày giỗ, 60 người, 500 lần khấn, lưu mọi mục.
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Text } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { router, useLocalSearchParams } from 'expo-router';
import { useTT } from '../src/store';
import { RITUALS } from '../src/data/rituals';
import { PRAYERS } from '../src/data/prayers';
import { SIGNS, TIPS } from '../src/data/signs';
import { FACE_PARTS } from '../src/face/data';
import { planNotifications } from '../src/lib/schedule';
import { lunarOf } from '../src/calendar/lunar';
import { search } from '../src/lib/search';

let seed = 1975;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ'];
const DEM = ['Văn', 'Thị', 'Hữu', 'Đức', 'Ngọc', 'Minh', 'Thanh', 'Xuân', 'Thu', 'Quang'];
const TEN = ['An', 'Bình', 'Cúc', 'Dũng', 'Hạnh', 'Khoa', 'Lan', 'Mai', 'Nam', 'Phúc', 'Quyên', 'Sơn', 'Tâm', 'Uyên', 'Vinh', 'Yến'];
const REL = ['Ông nội', 'Bà nội', 'Ông ngoại', 'Bà ngoại', 'Cụ', 'Bác', 'Chú', 'Cô', 'Dì', 'Cậu', 'Anh', 'Chị'];
const name = () => `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`;

async function run(small: boolean) {
  const t0 = Date.now();
  const big = !small;
  const N_GIO = big ? 1000 : 25;
  const N_PEOPLE = big ? 60 : 6;
  // Ngày giỗ: có cả ca biên (30 tháng thiếu, tháng nhuận, rằm, tháng Chạp).
  const edge = [
    { day: 30, month: 12, leap: false },
    { day: 15, month: 6, leap: true },
    { day: 1, month: 1, leap: false },
    { day: 29, month: 2, leap: false },
  ];
  const anniversaries = Array.from({ length: N_GIO }, (_, i) => ({
    id: `g${i}`,
    name: i === 0 ? 'Nguyễn Thị Phương Thảo Hoàng Bảo Ngọc Diễm Quỳnh' : name(),
    relation: pick(REL),
    lunar: i < edge.length ? edge[i] : { day: 1 + Math.floor(rnd() * 30), month: 1 + Math.floor(rnd() * 12), leap: false },
    missingDayRule: 'ngay-cuoi-thang' as const,
    remindDays: [7, 3, 1],
    dishes: rnd() < 0.3 ? 'Xôi gấc, gà luộc, canh măng, nem rán' : undefined,
    deathSolar: i === 4 ? new Date(Date.now() - 20 * 86400000).toISOString() : undefined,
  }));
  const people = Array.from({ length: N_PEOPLE }, (_, i) => {
    const y = i === 0 ? 1975 : 1930 + Math.floor(rnd() * 95);
    return {
      id: `p${i}`,
      name: i === 0 ? 'Trần Văn Minh' : name(),
      short: i === 0 ? 'Tôi' : pick(TEN),
      relation: i === 0 ? 'Tôi' : pick(['Vợ', 'Con', 'Bố', 'Mẹ', 'Anh', 'Chị', 'Em']),
      sex: rnd() < 0.5 ? ('nam' as const) : ('nu' as const),
      birthLunarYear: i === 0 ? 1974 : y,
      birth: i === 0 ? { calendar: 'duong' as const, day: 10, month: 2, year: 1975 } : { calendar: 'duong' as const, day: 0, month: 0, year: y },
      isHouseOwner: i === 0,
    };
  });
  const now = Date.now();
  useTT.setState({
    onboarded: true,
    household: {
      tinChu: 'Nguyễn Thị Lan',
      diaChi: 'Số 12 ngõ 34 phố Hoàng Hoa Thám, phường Ngọc Hà, thành phố Hà Nội',
      hoGiaTien: 'Nguyễn',
      region: 'bac',
      diet: 'man',
      altars: ['gia-tien', 'than-tai', 'phat', 'ong-tao'],
    },
    remind: { mung1Ram: true, eveBefore: true, mung10: true, festivals: true, time: '06:30' },
    people,
    anniversaries,
    prayLogs: Array.from({ length: 500 }, (_, i) => ({ id: `l${i}`, ritualId: pick(RITUALS).id, at: now - i * 43200000 })),
    saves: [
      ...RITUALS.map((r) => `ritual:${r.id}`),
      ...PRAYERS.map((p) => `prayer:${p.id}`),
      ...SIGNS.map((s) => `sign:${s.id}`),
      ...TIPS.map((t) => `tip:${t.id}`),
    ],
    offeringChecks: Object.fromEntries(RITUALS.map((r) => [r.id, ['Hương (nhang)', 'Hoa tươi']])),
    recentSearches: ['ông Táo', 'giỗ đầu', 'hương cháy', 'nhap trach', 'Thần tài', 'vu lan', 'hóa vàng', 'mâm ngũ quả'],
    face: { answers: Object.fromEntries(FACE_PARTS.map((p) => [p.id, p.options[0].id])), savedAt: now },
    fontScale: 1.15,
    prayFont: 24,
  });
  // Đo các phép tính nặng nhất với dữ liệu này.
  const m: Record<string, number> = {};
  let t = Date.now();
  const plan = planNotifications(new Date(), useTT.getState().remind, RITUALS, anniversaries);
  m.planNotificationsMs = Date.now() - t;
  m.planned = plan.length;
  t = Date.now();
  for (let d = 0; d < 366; d++) lunarOf(new Date(2026, 0, 1 + d));
  m.lunarYearMs = Date.now() - t;
  t = Date.now();
  for (const q of ['ong tao', 'giỗ', 'huong', 'than tai', 'vu lan', 'nhập trạch', 'xyz']) search(q);
  m.search7Ms = Date.now() - t;
  await new Promise((r) => setTimeout(r, 2500));
  const kv = (await Storage.getItem('thanh-tam')) ?? '';
  return { app: 'thanh-tam', giỗ: N_GIO, người: N_PEOPLE, ...m, totalMs: Date.now() - t0, kvBytes: kv.length };
}

export default function QaSeed() {
  const { small } = useLocalSearchParams<{ small?: string }>();
  const [lines, setLines] = useState<string[]>(['Đang tạo dữ liệu…']);
  useEffect(() => {
    run(!!small)
      .then((r) => {
        setLines((l) => [...l, `QA_SEED_DONE ${JSON.stringify(r)}`]);
        if (Platform.OS !== 'web') setTimeout(() => router.replace('/today'), 500);
      })
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
