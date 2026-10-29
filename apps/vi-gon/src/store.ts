import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { kvStorage, uid } from '@nam/core';
import type { ThemePref } from '@nam/ui';
import { Category, DEFAULT_CATEGORIES, Fund, Rule, Unparsed } from './types';

type State = {
  hydrated: boolean;
  onboarded: boolean;
  name: string;
  theme: ThemePref;
  /** Ngân sách tổng tháng (đồng). 0 = chưa đặt. */
  monthlyBudget: number;
  /** Ngày bắt đầu tháng chi tiêu (1–28), ví dụ ngày nhận lương. */
  monthStartDay: number;
  budgets: Record<string, number>;
  categories: Category[];
  rules: Rule[];
  funds: Fund[];
  allowedApps: string[];
  askBeforeSave: boolean;
  lockEnabled: boolean;
  hideAmounts: boolean;
  aiSummary: boolean;
  isPro: boolean;
  unparsed: Unparsed[];
  /** Mẫu định dạng đã học từ VG-18: dấu hiệu đầu thông báo → app. */
  learned: { sig: string; app: string | null }[];
  listenerState: 'unknown' | 'granted' | 'lost' | 'unsupported';
  lostSince: number | null;
  lastBackupAt: number | null;
  backupHint: string;
  askUsed: { day: string; used: number };
  alerted: string[];
  set: (p: Partial<State>) => void;
  addRule: (keyword: string, categoryId: string) => void;
  removeRule: (id: string) => void;
  upsertCategory: (c: Omit<Category, 'id'> & { id?: string }) => void;
  removeCategory: (id: string) => void;
  upsertFund: (f: Omit<Fund, 'id' | 'createdAt' | 'saved'> & { id?: string; saved?: number }) => string;
  moveFund: (id: string, delta: number) => void;
  removeFund: (id: string) => void;
  addUnparsed: (u: Omit<Unparsed, 'id'>) => void;
  dropUnparsed: (id: string) => void;
};

export const useVi = create<State>()(persist((set) => ({
  hydrated: false,
  onboarded: false,
  name: '',
  theme: 'system',
  monthlyBudget: 0,
  monthStartDay: 1,
  budgets: {},
  categories: DEFAULT_CATEGORIES,
  rules: [],
  funds: [],
  allowedApps: [],
  askBeforeSave: true,
  lockEnabled: false,
  hideAmounts: false,
  aiSummary: false,
  isPro: false,
  unparsed: [],
  learned: [],
  listenerState: 'unknown',
  lostSince: null,
  lastBackupAt: null,
  backupHint: '',
  askUsed: { day: '', used: 0 },
  alerted: [],
  set: (p) => set(p),
  addRule: (keyword, categoryId) => set((s) => {
    const k = keyword.trim().toUpperCase();
    if (!k) return {};
    return { rules: [{ id: uid(), keyword: k, categoryId }, ...s.rules.filter((r) => r.keyword !== k)] };
  }),
  removeRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
  upsertCategory: (c) => set((s) => {
    const id = c.id ?? uid();
    return { categories: s.categories.some((x) => x.id === id) ? s.categories.map((x) => (x.id === id ? { ...x, ...c, id } : x)) : [...s.categories, { ...c, id }] };
  }),
  removeCategory: (id) => set((s) => ({ categories: s.categories.filter((x) => x.id !== id || x.builtin), rules: s.rules.filter((r) => r.categoryId !== id) })),
  upsertFund: (f) => {
    const id = f.id ?? uid();
    set((s) => ({ funds: s.funds.some((x) => x.id === id) ? s.funds.map((x) => (x.id === id ? { ...x, ...f, id } : x)) : [...s.funds, { saved: 0, ...f, id, createdAt: Date.now() }] }));
    return id;
  },
  moveFund: (id, delta) => set((s) => ({ funds: s.funds.map((x) => (x.id === id ? { ...x, saved: Math.max(0, x.saved + delta) } : x)) })),
  removeFund: (id) => set((s) => ({ funds: s.funds.filter((x) => x.id !== id) })),
  addUnparsed: (u) => set((s) => ({ unparsed: [{ ...u, id: uid() }, ...s.unparsed].slice(0, 50) })),
  dropUnparsed: (id) => set((s) => ({ unparsed: s.unparsed.filter((x) => x.id !== id) })),
}), {
  name: 'vi-gon',
  storage: kvStorage,
  partialize: ({ hydrated, ...rest }) => rest as never,
  onRehydrateStorage: () => () => useVi.setState({ hydrated: true }),
}));

export const catOf = (id: string | null | undefined, cats: Category[]) => cats.find((c) => c.id === id) ?? cats.find((c) => c.id === 'other')!;

/** Kỳ chi tiêu hiện tại theo ngày bắt đầu tháng (ví dụ lương ngày 10 → 10/10–9/11). */
export function periodOf(startDay: number, offset = 0, now = new Date()) {
  const y = now.getFullYear();
  let m = now.getMonth();
  if (now.getDate() < startDay) m -= 1;
  m += offset;
  const from = new Date(y, m, startDay, 0, 0, 0, 0);
  const to = new Date(y, m + 1, startDay, 0, 0, 0, 0);
  return { from: from.getTime(), to: to.getTime(), label: startDay === 1 ? `Tháng ${from.getMonth() + 1}` : `${from.getDate()}/${from.getMonth() + 1} – ${new Date(to.getTime() - 1).getDate()}/${new Date(to.getTime() - 1).getMonth() + 1}`, month: from.getMonth() + 1 };
}
