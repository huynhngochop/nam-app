import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyQuota, kvStorage, quotaUse, uid } from '@nam/core';
import type { ThemePref } from '@nam/ui';
import type { CategoryId } from './data/tips';

export type Collection = { id: string; name: string; tipIds: string[] };
type AskTurn = { q: string; at: number };

type State = {
  hydrated: boolean;
  onboarded: boolean;
  name: string;
  interests: CategoryId[];
  notifyTime: string;
  dailyTipOn: boolean;
  seasonalOn: boolean;
  theme: ThemePref;
  personalAds: boolean;
  noAds: boolean;
  savedTips: string[];
  savedRecipes: string[];
  doneTips: Record<string, number>;
  safetyAck: string[];
  collections: Collection[];
  pantry: string[];
  recentSearches: string[];
  askQuota?: DailyQuota;
  askHistory: AskTurn[];
  streak: { last: string; days: number };
  set: (p: Partial<State>) => void;
  toggleSaveTip: (id: string) => boolean;
  toggleSaveRecipe: (id: string) => void;
  markDone: (id: string) => void;
  addSearch: (q: string) => void;
  removeSearch: (q: string) => void;
  togglePantry: (id: string) => void;
  addPantry: (ids: string[]) => void;
  addCollection: (name: string) => void;
  moveToCollection: (tipId: string, colId: string) => void;
  consumeAsk: (q: string) => void;
  touchStreak: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export const useMeo = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      name: '',
      interests: [],
      notifyTime: '07:00',
      dailyTipOn: false,
      seasonalOn: true,
      theme: 'system',
      personalAds: false,
      noAds: false,
      savedTips: [],
      savedRecipes: [],
      doneTips: {},
      safetyAck: [],
      collections: [
        { id: 'tet', name: 'Dọn nhà Tết', tipIds: [] },
        { id: 'nom', name: 'Mùa nồm', tipIds: [] },
      ],
      pantry: ['trung', 'ca-chua', 'hanh-la', 'com-nguoi'],
      recentSearches: [],
      askHistory: [],
      streak: { last: '', days: 0 },
      set: (p) => set(p),
      toggleSaveTip: (id) => {
        const on = !get().savedTips.includes(id);
        set((s) => ({ savedTips: on ? [id, ...s.savedTips] : s.savedTips.filter((x) => x !== id) }));
        return on;
      },
      toggleSaveRecipe: (id) =>
        set((s) => ({
          savedRecipes: s.savedRecipes.includes(id) ? s.savedRecipes.filter((x) => x !== id) : [id, ...s.savedRecipes],
        })),
      markDone: (id) => {
        set((s) => ({ doneTips: { ...s.doneTips, [id]: Date.now() } }));
        get().touchStreak();
      },
      addSearch: (q) => set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 20) })),
      removeSearch: (q) => set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== q) })),
      togglePantry: (id) =>
        set((s) => ({ pantry: s.pantry.includes(id) ? s.pantry.filter((x) => x !== id) : [...s.pantry, id] })),
      addPantry: (ids) => set((s) => ({ pantry: Array.from(new Set([...s.pantry, ...ids])) })),
      addCollection: (name) =>
        set((s) => ({ collections: [...s.collections, { id: uid(), name: name.trim().slice(0, 30), tipIds: [] }] })),
      moveToCollection: (tipId, colId) =>
        set((s) => ({
          collections: s.collections.map((c) => ({
            ...c,
            tipIds: c.id === colId ? Array.from(new Set([...c.tipIds, tipId])) : c.tipIds.filter((x) => x !== tipId),
          })),
          savedTips: s.savedTips.includes(tipId) ? s.savedTips : [tipId, ...s.savedTips],
        })),
      consumeAsk: (q) =>
        set((s) => ({
          askQuota: quotaUse(s.askQuota),
          askHistory: [{ q, at: Date.now() }, ...s.askHistory].slice(0, 50),
        })),
      touchStreak: () => {
        const t = today();
        const { last, days } = get().streak;
        if (last === t) return;
        const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        set({ streak: { last: t, days: last === y ? days + 1 : 1 } });
      },
    }),
    {
      name: 'meo-nha',
      storage: kvStorage,
      partialize: ({ hydrated, set: _s, ...rest }) => rest as never,
      onRehydrateStorage: () => () => useMeo.setState({ hydrated: true }),
    },
  ),
);
