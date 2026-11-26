import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bigKvStorage, dateKey } from '@nam/core';
import type { ThemePref } from '@nam/ui';
import { buildPlan, overallOf, type Bands, type Criterion, type Goal, type Plan } from './plan';
import { bindSession, type AuthSession, type LearnerError } from './api';

export type BandSource = 'placement' | 'self' | 'session' | 'mock' | 'real_exam';
export type BandPoint = { at: number; source: BandSource; bands: Bands; overall: number };
export type SessionLog = { id: string; kind: string; topic: string; at: number; overall?: number };
export type Settings = {
  accent: 'uk' | 'us' | 'au';
  speed: 'slow' | 'exam';
  correction: 'light' | 'medium' | 'strict';
  reminderHour: number; // 0–23, -1 = tắt
};

type State = {
  hydrated: boolean;
  onboarded: boolean;
  name: string;
  theme: ThemePref;
  isPro: boolean;
  auth: AuthSession | null;
  goal: Goal | null;
  plan: Plan | null;
  /** Tuần (index) người học đã bấm "Giữ như cũ" cho đề xuất điều chỉnh — không hỏi lại trong tuần đó. */
  adjustDismissedWeek: number | null;
  bands: Bands;
  history: BandPoint[];
  errors: LearnerError[];
  errorsSyncedAt: number;
  practiced: string[];
  sessions: SessionLog[];
  done: Record<string, string[]>; // ngày → id bài đã xong
  settings: Settings;

  set: (p: Partial<State>) => void;
  setGoal: (g: Goal) => void;
  recordBands: (source: BandSource, b: Bands) => void;
  applyAllocation: (alloc: Record<Criterion, number>) => void;
  markDone: (itemId: string) => void;
  cacheErrors: (list: LearnerError[]) => void;
  patchError: (id: string, p: Partial<LearnerError>) => void;
  logSession: (s: SessionLog) => void;
  setSettings: (p: Partial<Settings>) => void;
};

const DEFAULT_BANDS: Bands = { FC: 5.5, LR: 5.5, GRA: 5.5, P: 5.5 };

export const useBand7 = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      name: '',
      theme: 'system',
      isPro: false,
      auth: null,
      goal: null,
      plan: null,
      adjustDismissedWeek: null,
      bands: DEFAULT_BANDS,
      history: [],
      errors: [],
      errorsSyncedAt: 0,
      practiced: [],
      sessions: [],
      done: {},
      settings: { accent: 'uk', speed: 'exam', correction: 'medium', reminderHour: 20 },

      set: (p) => set(p),
      setGoal: (g) => set({ goal: g, plan: buildPlan(g, dateKey(new Date())), adjustDismissedWeek: null }),
      recordBands: (source, b) => {
        const point: BandPoint = { at: Date.now(), source, bands: b, overall: overallOf(b) };
        const history = [...get().history, point].slice(-80);
        set({ bands: b, history });
      },
      applyAllocation: (alloc) => {
        const plan = get().plan;
        if (!plan) return;
        set({ plan: { ...plan, allocation: alloc } });
      },
      markDone: (itemId) => {
        const key = dateKey(new Date());
        const done = { ...get().done };
        done[key] = Array.from(new Set([...(done[key] ?? []), itemId]));
        // chỉ giữ 60 ngày gần nhất
        const keys = Object.keys(done).sort();
        while (keys.length > 60) delete done[keys.shift()!];
        set({ done });
      },
      cacheErrors: (list) => set({ errors: list, errorsSyncedAt: Date.now() }),
      patchError: (id, p) => set({ errors: get().errors.map((e) => (e.id === id ? { ...e, ...p } : e)) }),
      logSession: (s) =>
        set({
          sessions: [s, ...get().sessions.filter((x) => x.id !== s.id)].slice(0, 60),
          practiced: [s.topic, ...get().practiced.filter((t) => t !== s.topic)].slice(0, 40),
        }),
      setSettings: (p) => set({ settings: { ...get().settings, ...p } }),
    }),
    {
      name: 'band7',
      storage: bigKvStorage<State>(),
      partialize: ({ hydrated, ...rest }) => rest as never,
      onRehydrateStorage: () => () => useBand7.setState({ hydrated: true }),
    },
  ),
);

bindSession(
  () => useBand7.getState().auth,
  (s) => useBand7.setState({ auth: s }),
);

/* ───────────── Số liệu tính sẵn (selector) ───────────── */

export type ErrorStats = { closed: number; recalling: number; repairing: number; total: number; due: number };
const statsCache = new WeakMap<LearnerError[], ErrorStats>();
export function errorStats(list: LearnerError[], now = Date.now()): ErrorStats {
  const hit = statsCache.get(list);
  if (hit) return hit;
  const s: ErrorStats = { closed: 0, recalling: 0, repairing: 0, total: list.length, due: 0 };
  for (const e of list) {
    s[e.status] += 1;
    if (e.next_due_at && new Date(e.next_due_at).getTime() <= now) s.due += 1;
  }
  statsCache.set(list, s);
  return s;
}

/** Số ngày học liên tiếp tính tới hôm nay (hoặc hôm qua nếu hôm nay chưa học). */
export function streakDays(done: Record<string, string[]>, today = new Date()): number {
  let n = 0;
  const d = new Date(today);
  if (!done[dateKey(d)]?.length) d.setDate(d.getDate() - 1);
  while (done[dateKey(d)]?.length) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
