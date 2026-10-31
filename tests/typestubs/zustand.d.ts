declare module 'zustand' {
  export type SetState<T> = (partial: Partial<T> | T | ((s: T) => Partial<T> | T), replace?: boolean) => void;
  export type StateCreator<T> = (set: SetState<T>, get: () => T, api: any) => T;
  export interface UseBound<T> {
    (): T;
    <U>(selector: (s: T) => U): U;
    getState(): T;
    setState: SetState<T>;
    subscribe(listener: (s: T, prev: T) => void): () => void;
    persist?: any;
  }
  export function create<T>(): (init: StateCreator<T>) => UseBound<T>;
  export function create<T>(init: StateCreator<T>): UseBound<T>;
}
declare module 'zustand/middleware' {
  import { StateCreator } from 'zustand';
  export function persist<T>(
    init: StateCreator<T>,
    opts: {
      name: string;
      storage?: any;
      partialize?: (s: T) => any;
      onRehydrateStorage?: (s: T) => any;
      version?: number;
      migrate?: any;
    },
  ): StateCreator<T>;
  export function createJSONStorage(...a: any[]): any;
}
