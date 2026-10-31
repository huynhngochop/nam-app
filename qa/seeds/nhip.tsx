// Seed QA (chỉ chép vào bản build trong CI thành app/qa-seed.tsx): một năm dùng Nhịp mỗi ngày.
import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { dateKey } from '@nam/core';
import { FocusLog, Habit, Task, useNhip } from '../src/store';

let seed = 1031;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

const TITLES = ['Viết báo cáo quý', 'Ôn từ vựng IELTS', 'Đọc tài liệu React Native', 'Chuẩn bị slide họp', 'Sửa lỗi đăng nhập', 'Học SQL', 'Viết blog', 'Dịch tài liệu', 'Làm bài tập Toán', 'Thiết kế màn hình', 'Phỏng vấn ứng viên', 'Lên kế hoạch tuần'];

async function run(log: (s: string) => void) {
  const t0 = Date.now();
  const now = Date.now();
  const tasks: Task[] = Array.from({ length: 80 }, (_, i) => {
    const due = dateKey(new Date(now + int(-20, 14) * 86400000));
    const est = int(1, 8);
    return { id: `t${i}`, title: `${pick(TITLES)} ${i + 1}`, est, done: int(0, est), due, finished: rnd() < 0.45, order: i };
  });
  const logs: FocusLog[] = [];
  const daily: Record<string, number> = {};
  for (let d = 365; d >= 0; d--) {
    const day = new Date(now - d * 86400000);
    if (rnd() < 0.08) continue;
    const n = int(1, 9);
    for (let i = 0; i < n; i++) {
      const at = new Date(day); at.setHours(int(7, 22), int(0, 59), 0, 0);
      if (at.getTime() > now) continue;
      const r = rnd();
      const status: FocusLog['status'] = r < 0.85 ? 'completed' : r < 0.97 ? 'stopped' : 'violated';
      const minutes = status === 'completed' ? pick([25, 25, 25, 45, 50]) : int(3, 20);
      logs.push({ id: `l${logs.length}`, taskId: rnd() < 0.7 ? pick(tasks).id : undefined, minutes, at: at.getTime(), rating: rnd() < 0.5 ? (int(1, 3) as 1 | 2 | 3) : undefined, note: rnd() < 0.1 ? 'Xong phần chính' : undefined, status });
      daily[dateKey(at)] = (daily[dateKey(at)] ?? 0) + minutes;
    }
  }
  logs.sort((a, b) => b.at - a.at);
  const habits: Habit[] = [
    { id: 'h-focus', name: 'Phiên tập trung', icon: 'clock', target: 4, unit: 'phiên', auto: 'focus_sessions' },
    { id: 'h-water', name: 'Uống nước', icon: 'droplet', target: 8, unit: 'ly' },
    { id: 'h-read', name: 'Đọc sách', icon: 'book', target: 20, unit: 'trang' },
    { id: 'h-walk', name: 'Đi bộ', icon: 'activity', target: 15, unit: 'phút' },
    { id: 'h-nosocial', name: 'Không mạng xã hội trước 9h', icon: 'smartphone', target: 1, unit: 'lần' },
    { id: 'h-med', name: 'Thiền', icon: 'target', target: 10, unit: 'phút' },
  ];
  const habitLogs: Record<string, Record<string, number>> = {};
  for (let d = 365; d >= 0; d--) {
    const k = dateKey(new Date(now - d * 86400000));
    habitLogs[k] = Object.fromEntries(habits.filter((h) => !h.auto).map((h) => [h.id, rnd() < 0.7 ? int(0, h.target) : 0]));
  }
  log(`${logs.length} nhật ký (giữ 2000 mới nhất như app), ${Object.keys(daily).length} ngày`);
  useNhip.setState({
    onboarded: true, name: 'Quang', goalMin: 120, purposes: ['Học', 'Làm việc'], isPro: true, ownedPacks: ['saigon'],
    tasks, logs: logs.slice(0, 2000), daily, habits, habitLogs, session: null, currentTaskId: tasks[1].id,
    restDays: [dateKey(new Date(now - 30 * 86400000)), dateKey(new Date(now - 31 * 86400000))],
    mixes: [
      { id: 'm1', name: 'Mưa đêm', layers: [{ id: 'rain', vol: 0.7 }, { id: 'brown', vol: 0.3 }] },
      { id: 'm2', name: 'Tập trung sâu', layers: [{ id: 'pink', vol: 0.5 }] },
      { id: 'm3', name: 'Ồn trắng nhẹ', layers: [{ id: 'white', vol: 0.4 }] },
      { id: 'm4', name: 'Mưa + ồn hồng', layers: [{ id: 'rain', vol: 0.5 }, { id: 'pink', vol: 0.4 }] },
      { id: 'm5', name: 'Ba lớp', layers: [{ id: 'rain', vol: 0.5 }, { id: 'pink', vol: 0.3 }, { id: 'brown', vol: 0.2 }] },
      { id: 'm6', name: 'Sài Gòn mưa chiều', layers: [{ id: 'rain', vol: 0.8 }, { id: 'cafe', vol: 0.4 }] },
    ],
    mixId: 'm5',
  });
  await new Promise((r) => setTimeout(r, 2500));
  const kv = (await Storage.getItem('nhip')) ?? '';
  return { app: 'nhip', logs: Math.min(2000, logs.length), days: Object.keys(daily).length, tasks: tasks.length, totalMs: Date.now() - t0, kvBytes: kv.length };
}

export default function QaSeed() {
  const [lines, setLines] = useState<string[]>(['Đang tạo dữ liệu…']);
  useEffect(() => {
    run((s) => setLines((l) => [...l, s]))
      .then((r) => setLines((l) => [...l, `QA_SEED_DONE ${JSON.stringify(r)}`]))
      .catch((e) => setLines((l) => [...l, `QA_SEED_FAIL ${String(e?.stack || e)}`]));
  }, []);
  return <ScrollView contentContainerStyle={{ padding: 24 }}>{lines.map((l, i) => <Text key={i}>{l}</Text>)}</ScrollView>;
}
