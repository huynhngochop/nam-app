// Seed QA (chỉ chép vào bản build trong CI thành app/qa-seed.tsx): người dùng đã dùng Mẹo Nhà nhiều tháng.
import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { TIPS } from '../src/data/tips';
import { INGREDIENTS, RECIPES } from '../src/data/recipes';
import { useMeo } from '../src/store';

let seed = 77;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

async function run() {
  const t0 = Date.now();
  const now = Date.now();
  const ids = TIPS.map((t) => t.id);
  const d = (n: number) => new Date(now - n * 86400000).toISOString().slice(0, 10);
  useMeo.setState({
    onboarded: true, name: 'Thu Hà', interests: ['kitchen', 'home', 'laundry'], dailyTipOn: true, notifyTime: '06:30', noAds: false,
    savedTips: ids,
    savedRecipes: RECIPES.map((r) => r.id),
    doneTips: Object.fromEntries(ids.filter(() => rnd() < 0.6).map((id, i) => [id, now - i * 86400000 * 3])),
    safetyAck: ids.filter(() => rnd() < 0.3),
    collections: [
      { id: 'tet', name: 'Dọn nhà Tết', tipIds: ids.slice(0, 6) },
      { id: 'nom', name: 'Mùa nồm', tipIds: ids.slice(4, 9) },
      { id: 'bep', name: 'Dọn bếp cuối tuần', tipIds: ids.slice(9, 14) },
      { id: 'cay', name: 'Cây ban công', tipIds: ids.slice(14, 20) },
    ],
    pantry: INGREDIENTS.slice(0, 15).map((i) => i.id),
    recentSearches: ['nồm ẩm', 'vết dầu', 'cây vàng lá', 'mùi tủ lạnh', 'giặt gối', 'tiền điện', 'kiến', 'ố vàng cổ áo', 'gián', 'mốc tường', 'ron gạch', 'lò vi sóng', 'bồn cầu', 'muỗi', 'ố kính', 'cháy nồi', 'giày hôi', 'rỉ sét', 'chuột', 'tắc cống'],
    askHistory: Array.from({ length: 50 }, (_, i) => ({ q: pick(['Áo trắng bị ố vàng?', 'Tường nồm chảy nước?', 'Hết mùi tủ lạnh?', 'Cây lưỡi hổ úng rễ?']), at: now - i * 3600000 })),
    askQuota: { day: d(0), used: 3 },
    streak: { last: d(0), days: 23 },
  });
  await new Promise((r) => setTimeout(r, 2500));
  const kv = (await Storage.getItem('meo-nha')) ?? '';
  return { app: 'meo-nha', savedTips: ids.length, collections: 4, totalMs: Date.now() - t0, kvBytes: kv.length };
}

export default function QaSeed() {
  const [lines, setLines] = useState<string[]>(['Đang tạo dữ liệu…']);
  useEffect(() => {
    run()
      .then((r) => setLines((l) => [...l, `QA_SEED_DONE ${JSON.stringify(r)}`]))
      .catch((e) => setLines((l) => [...l, `QA_SEED_FAIL ${String(e?.stack || e)}`]));
  }, []);
  return <ScrollView contentContainerStyle={{ padding: 24 }}>{lines.map((l, i) => <Text key={i}>{l}</Text>)}</ScrollView>;
}
