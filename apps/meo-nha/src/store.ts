import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dateKey, DailyQuota, kvStorage, quotaUse, uid } from '@nam/core';
import type { ThemePref } from '@nam/ui';
import { CategoryId, registerUserTips, Tip } from './data/tips';

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
  /** Mẹo tự viết, lưu trên máy (gửi lên đội Mẹo Nhà khi có máy chủ). */
  myTips: Tip[];
  /** Mẹo đã báo sai / nguy hiểm: ẩn khỏi danh sách của người này. */
  hiddenTips: string[];
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
  addMyTip: (t: Pick<Tip, 'title' | 'categoryId' | 'steps'>) => string;
  hideTip: (id: string) => void;
};

// Ngày theo giờ máy (không phải UTC): chuỗi ngày không gãy khi mở app trước 7 giờ sáng.
const today = () => dateKey(new Date());

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
      pantry: [],
      recentSearches: [],
      askHistory: [],
      streak: { last: '', days: 0 },
      myTips: [],
      hiddenTips: [],
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
        const y = dateKey(new Date(Date.now() - 86400000));
        set({ streak: { last: t, days: last === y ? days + 1 : 1 } });
      },
      addMyTip: ({ title, categoryId, steps }) => {
        const tip: Tip = {
          id: `my-${uid()}`,
          title: title.trim(),
          summary: steps[0] ?? '',
          categoryId,
          minutes: 5,
          difficulty: 'easy',
          rating: 0,
          ratingCount: 0,
          steps,
          keywords: '',
        };
        set((s) => ({ myTips: [tip, ...s.myTips], savedTips: [tip.id, ...s.savedTips] }));
        return tip.id;
      },
      hideTip: (id) => set((s) => ({ hiddenTips: s.hiddenTips.includes(id) ? s.hiddenTips : [...s.hiddenTips, id] })),
    }),
    {
      name: 'meo-nha',
      storage: kvStorage,
      partialize: ({ hydrated, set: _s, ...rest }) => rest as never,
      onRehydrateStorage: () => (st) => {
        registerUserTips(st?.myTips ?? []);
        useMeo.setState({ hydrated: true });
      },
    },
  ),
);
useMeo.subscribe((s, p) => {
  if (s.myTips !== p.myTips) registerUserTips(s.myTips);
});
