import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dateKey, kvStorage, uid } from '@nam/core';
import type { ThemePref } from '@nam/ui';
import type { SoundId } from './data';

export type Phase = 'focus' | 'short' | 'long';
export type TimerSettings = {
  focusMin: number; shortMin: number; longMin: number; longEvery: number;
  autoBreak: boolean; autoNext: boolean; strict: boolean; vibrate: boolean; keepAwake: boolean;
};
export type Session = {
  id: string; taskId?: string; phase: Phase; mode: 'pomodoro' | 'countup';
  plannedSec: number; startedAt: number; endAt: number; pausedRemainingSec?: number; pausedAccumSec: number;
  cycleIndex: number; lastHeartbeatAt: number; status: 'running' | 'paused';
};
export type Task = { id: string; title: string; est: number; done: number; due: string; finished: boolean; order: number };
export type Habit = { id: string; name: string; icon: string; target: number; unit: string; auto?: 'focus_sessions' };
export type Mix = { id: string; name: string; layers: { id: SoundId; vol: number }[] };
export type FocusLog = { id: string; taskId?: string; minutes: number; at: number; rating?: 1 | 2 | 3; note?: string; status: 'completed' | 'stopped' | 'violated' };

type State = {
  hydrated: boolean;
  onboarded: boolean;
  name: string;
  goalMin: number;
  purposes: string[];
  theme: ThemePref;
  isPro: boolean;
  ownedPacks: string[];
  settings: TimerSettings;
  session: Session | null;
  currentTaskId?: string;
  tasks: Task[];
  habits: Habit[];
  habitLogs: Record<string, Record<string, number>>; // date → habitId → value
  logs: FocusLog[];
  daily: Record<string, number>; // date → phút tập trung (tính sẵn để thống kê nhanh)
  mixes: Mix[];
  mixId: string;
  restDays: string[];
  set: (p: Partial<State>) => void;
  setSettings: (p: Partial<TimerSettings>) => void;
  startPhase: (phase: Phase, opts?: { mode?: 'pomodoro' | 'countup'; cycleIndex?: number }) => Session;
  pause: () => void;
  resume: () => void;
  heartbeat: () => void;
  endSession: (status: FocusLog['status'], focusedSec?: number) => FocusLog | null;
  rateLast: (rating: 1 | 2 | 3, note?: string) => void;
  addTask: (title: string, est: number, due: string) => void;
  updateTask: (id: string, p: Partial<Task>) => void;
  removeTask: (id: string) => void;
  logHabit: (habitId: string, delta: number) => void;
  addHabit: (h: Omit<Habit, 'id'>) => void;
  saveMix: (name: string) => void;
  setLayer: (id: SoundId, vol: number | null) => void;
};

const DEFAULT_SETTINGS: TimerSettings = { focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4, autoBreak: true, autoNext: false, strict: false, vibrate: true, keepAwake: false };

export const phaseMinutes = (s: TimerSettings, p: Phase) => (p === 'focus' ? s.focusMin : p === 'short' ? s.shortMin : s.longMin);

export const useNhip = create<State>()(persist((set, get) => ({
  hydrated: false,
  onboarded: false,
  name: '',
  goalMin: 120,
  purposes: [],
  theme: 'system',
  isPro: false,
  ownedPacks: [],
  settings: DEFAULT_SETTINGS,
  session: null,
  tasks: [
    { id: 't1', title: 'Viết báo cáo quý 3', est: 4, done: 0, due: dateKey(new Date()), finished: false, order: 0 },
    { id: 't2', title: 'Ôn từ vựng IELTS', est: 2, done: 0, due: dateKey(new Date()), finished: false, order: 1 },
  ],
  habits: [
    { id: 'h-focus', name: 'Phiên tập trung', icon: 'clock', target: 4, unit: 'phiên', auto: 'focus_sessions' },
    { id: 'h-water', name: 'Uống nước', icon: 'droplet', target: 8, unit: 'ly' },
    { id: 'h-read', name: 'Đọc sách', icon: 'book', target: 20, unit: 'trang' },
  ],
  habitLogs: {},
  logs: [],
  daily: {},
  mixes: [{ id: 'm1', name: 'Mưa đêm', layers: [{ id: 'rain', vol: 0.7 }, { id: 'brown', vol: 0.3 }] }, { id: 'm2', name: 'Tập trung sâu', layers: [{ id: 'pink', vol: 0.5 }] }],
  mixId: 'm1',
  restDays: [],
  set: (p) => set(p),
  setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
  startPhase: (phase, opts) => {
    const st = get().settings;
    const mode = opts?.mode ?? 'pomodoro';
    const plannedSec = mode === 'countup' ? 0 : phaseMinutes(st, phase) * 60;
    const now = Date.now();
    const sess: Session = {
      id: uid(), taskId: get().currentTaskId, phase, mode, plannedSec, startedAt: now, endAt: now + plannedSec * 1000,
      pausedAccumSec: 0, cycleIndex: opts?.cycleIndex ?? (get().session?.cycleIndex ?? 0), lastHeartbeatAt: now, status: 'running',
    };
    set({ session: sess });
    return sess;
  },
  pause: () => set((s) => (s.session && s.session.status === 'running'
    ? { session: { ...s.session, status: 'paused', pausedRemainingSec: Math.max(0, Math.round((s.session.endAt - Date.now()) / 1000)), lastHeartbeatAt: Date.now() } } : {})),
  resume: () => set((s) => {
    const ss = s.session;
    if (!ss || ss.status !== 'paused') return {};
    const now = Date.now();
    if (ss.mode === 'countup') return { session: { ...ss, status: 'running', pausedAccumSec: ss.pausedAccumSec + Math.round((now - ss.lastHeartbeatAt) / 1000), lastHeartbeatAt: now } };
    return { session: { ...ss, status: 'running', endAt: now + (ss.pausedRemainingSec ?? 0) * 1000, pausedRemainingSec: undefined, lastHeartbeatAt: now } };
  }),
  heartbeat: () => set((s) => (s.session && s.session.status === 'running' ? { session: { ...s.session, lastHeartbeatAt: Date.now() } } : {})),
  endSession: (status, focusedSec) => {
    const sess = get().session;
    if (!sess) return null;
    if (sess.phase !== 'focus') { set({ session: null }); return null; }
    const sec = focusedSec ?? (sess.mode === 'countup' ? Math.round((Date.now() - sess.startedAt) / 1000) : sess.plannedSec);
    const minutes = Math.round(sec / 60);
    const log: FocusLog = { id: sess.id, taskId: sess.taskId, minutes, at: Date.now(), status };
    const day = dateKey(new Date());
    set((s) => ({
      session: null,
      logs: [log, ...s.logs].slice(0, 2000),
      daily: { ...s.daily, [day]: (s.daily[day] ?? 0) + minutes },
      tasks: status === 'completed' && sess.taskId ? s.tasks.map((t) => (t.id === sess.taskId ? { ...t, done: t.done + 1 } : t)) : s.tasks,
    }));
    return log;
  },
  rateLast: (rating, note) => set((s) => ({ logs: s.logs.map((l, i) => (i === 0 ? { ...l, rating, note } : l)) })),
  addTask: (title, est, due) => set((s) => ({ tasks: [...s.tasks, { id: uid(), title: title.trim().slice(0, 80), est, done: 0, due, finished: false, order: s.tasks.length }] })),
  updateTask: (id, p) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id), currentTaskId: s.currentTaskId === id ? undefined : s.currentTaskId })),
  logHabit: (habitId, delta) => set((s) => {
    const d = dateKey(new Date());
    const day = { ...(s.habitLogs[d] ?? {}) };
    day[habitId] = Math.max(0, (day[habitId] ?? 0) + delta);
    return { habitLogs: { ...s.habitLogs, [d]: day } };
  }),
  addHabit: (h) => set((s) => ({ habits: [...s.habits, { ...h, id: uid() }] })),
  saveMix: (name) => set((s) => {
    const cur = s.mixes.find((m) => m.id === s.mixId);
    const m: Mix = { id: uid(), name: name.trim().slice(0, 30), layers: cur?.layers ?? [] };
    return { mixes: [...s.mixes, m], mixId: m.id };
  }),
  setLayer: (id, vol) => set((s) => ({
    mixes: s.mixes.map((m) => {
      if (m.id !== s.mixId) return m;
      const rest = m.layers.filter((l) => l.id !== id);
      return { ...m, layers: vol == null ? rest : [...rest, { id, vol }].slice(-5) };
    }),
  })),
}), {
  name: 'nhip',
  storage: kvStorage,
  partialize: ({ hydrated, ...rest }) => rest as never,
  onRehydrateStorage: () => () => useNhip.setState({ hydrated: true }),
}));

/** Số phút đã tập trung trong phiên hiện tại. */
export function focusedSecOf(s: Session, now = Date.now()): number {
  if (s.mode === 'countup') return Math.round(((s.status === 'paused' ? s.lastHeartbeatAt : now) - s.startedAt) / 1000) - s.pausedAccumSec;
  const remaining = s.status === 'paused' ? s.pausedRemainingSec ?? 0 : Math.max(0, (s.endAt - now) / 1000);
  return Math.round(s.plannedSec - remaining);
}

/** Chuỗi ngày: ngày đạt mục tiêu liên tiếp tính đến hôm nay (hôm nay chưa đạt thì tính đến hôm qua). Ngày nghỉ phép giữ chuỗi. */
export function streakOf(daily: Record<string, number>, goal: number, restDays: string[], today = new Date()): number {
  let n = 0;
  const d = new Date(today);
  if ((daily[dateKey(d)] ?? 0) < goal) d.setDate(d.getDate() - 1);
  for (;;) {
    const k = dateKey(d);
    if ((daily[k] ?? 0) >= goal || restDays.includes(k)) { n += 1; d.setDate(d.getDate() - 1); } else break;
    if (n > 3650) break;
  }
  return n;
}
