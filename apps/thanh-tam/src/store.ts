import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { kvStorage, uid } from '@nam/core';
import type { ThemePref } from '@nam/ui';
import type { Diet, Region } from './data/types';
import type { Anniversary, RemindSettings } from './lib/schedule';
import type { Sex } from './age';
import type { FaceAnswers } from './face/data';

export type Altar = 'gia-tien' | 'than-tai' | 'phat' | 'ong-tao';
export type Household = {
  tinChu: string;
  diaChi: string;
  hoGiaTien: string;
  region: Region;
  diet: Diet;
  altars: Altar[];
};
export type Person = {
  id: string;
  name: string;
  short: string;
  relation: string;
  sex: Sex;
  /** Năm âm sinh đã quy đổi (sinh trước Tết thuộc năm trước). */
  birthLunarYear: number;
  birth: { calendar: 'duong' | 'am'; day: number; month: number; year: number; leap?: boolean };
  isHouseOwner?: boolean;
};
export type PrayLog = { id: string; ritualId: string; at: number };

type State = {
  hydrated: boolean;
  onboarded: boolean;
  household: Household;
  remind: RemindSettings;
  theme: ThemePref;
  /** Cỡ chữ văn khấn: 1, 1.15, 1.3, 1.5 */
  fontScale: number;
  /** Cỡ chữ riêng ở chế độ khấn (22–30). */
  prayFont: number;
  ttsEnabled: boolean;
  tamAn: boolean;
  people: Person[];
  anniversaries: Anniversary[];
  prayLogs: PrayLog[];
  saves: string[];
  offeringChecks: Record<string, string[]>;
  levelByRitual: Record<string, 'day-du' | 'gian-di'>;
  recentSearches: string[];
  fireAck: string[];
  face?: { answers: FaceAnswers; savedAt: number };
  firstTimeDismissed: boolean;
  set: (p: Partial<State>) => void;
  setHousehold: (p: Partial<Household>) => void;
  setRemind: (p: Partial<RemindSettings>) => void;
  toggleSave: (key: string) => boolean;
  toggleOffering: (ritualId: string, name: string) => void;
  resetOfferings: (ritualId: string) => void;
  logPray: (ritualId: string) => PrayLog;
  upsertAnniversary: (a: Omit<Anniversary, 'id'> & { id?: string }) => string;
  removeAnniversary: (id: string) => Anniversary | undefined;
  upsertPerson: (p: Omit<Person, 'id'> & { id?: string }) => string;
  removePerson: (id: string) => void;
  addSearch: (q: string) => void;
  removeSearch: (q: string) => void;
  wipe: () => void;
};

const DEFAULTS = {
  onboarded: false,
  household: {
    tinChu: '',
    diaChi: '',
    hoGiaTien: '',
    region: 'bac' as Region,
    diet: 'man' as Diet,
    altars: ['gia-tien'] as Altar[],
  },
  remind: { mung1Ram: true, eveBefore: true, mung10: false, festivals: true, time: '06:30' },
  theme: 'system' as ThemePref,
  fontScale: 1.15,
  prayFont: 24,
  ttsEnabled: false,
  tamAn: false,
  people: [] as Person[],
  anniversaries: [] as Anniversary[],
  prayLogs: [] as PrayLog[],
  saves: [] as string[],
  offeringChecks: {} as Record<string, string[]>,
  levelByRitual: {} as Record<string, 'day-du' | 'gian-di'>,
  recentSearches: [] as string[],
  fireAck: [] as string[],
  firstTimeDismissed: false,
};

export const useTT = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...DEFAULTS,
      set: (p) => set(p),
      setHousehold: (p) => set((s) => ({ household: { ...s.household, ...p } })),
      setRemind: (p) => set((s) => ({ remind: { ...s.remind, ...p } })),
      toggleSave: (key) => {
        const on = !get().saves.includes(key);
        set((s) => ({ saves: on ? [key, ...s.saves] : s.saves.filter((x) => x !== key) }));
        return on;
      },
      toggleOffering: (ritualId, name) =>
        set((s) => {
          const cur = s.offeringChecks[ritualId] ?? [];
          return {
            offeringChecks: {
              ...s.offeringChecks,
              [ritualId]: cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name],
            },
          };
        }),
      resetOfferings: (ritualId) => set((s) => ({ offeringChecks: { ...s.offeringChecks, [ritualId]: [] } })),
      logPray: (ritualId) => {
        const log = { id: uid(), ritualId, at: Date.now() };
        set((s) => ({ prayLogs: [log, ...s.prayLogs].slice(0, 500) }));
        return log;
      },
      upsertAnniversary: (a) => {
        const id = a.id ?? uid();
        set((s) => ({ anniversaries: [...s.anniversaries.filter((x) => x.id !== id), { ...a, id }] }));
        return id;
      },
      removeAnniversary: (id) => {
        const a = get().anniversaries.find((x) => x.id === id);
        set((s) => ({ anniversaries: s.anniversaries.filter((x) => x.id !== id) }));
        return a;
      },
      upsertPerson: (p) => {
        const id = p.id ?? uid();
        set((s) => {
          let people = [...s.people.filter((x) => x.id !== id), { ...p, id }];
          if (p.isHouseOwner) people = people.map((x) => ({ ...x, isHouseOwner: x.id === id }));
          return { people };
        });
        return id;
      },
      removePerson: (id) => set((s) => ({ people: s.people.filter((x) => x.id !== id) })),
      addSearch: (q) => set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 8) })),
      removeSearch: (q) => set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== q) })),
      wipe: () => set({ ...DEFAULTS, onboarded: true }),
    }),
    {
      name: 'thanh-tam',
      storage: kvStorage,
      version: 1,
      partialize: ({ hydrated, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as never,
      onRehydrateStorage: () => () => useTT.setState({ hydrated: true }),
    },
  ),
);

export const isSaved = (saves: string[], key: string) => saves.includes(key);
