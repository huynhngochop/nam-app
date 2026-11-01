export * from '../packages/core/src/format';
export class AiUnavailableError extends Error {}
export class AiQuotaError extends Error {}
export async function callAi<T>(_f: string, _p: unknown, _o?: unknown): Promise<T> {
  throw new AiUnavailableError();
}
export const track = (_e: string, _p?: unknown) => {};
let n = 0;
export const uid = () => `id${++n}`;

/* Bộ lưu và hàng chờ giả cho test import thẳng store của app (không cần SQLite). */
export function createOutbox(_name: string) {
  const state = { items: [] as unknown[], enqueue: (_k: string, _p: unknown) => {} };
  const hook = () => state;
  hook.getState = () => state;
  return hook;
}
const mem = new Map<string, unknown>();
export function bigKvStorage<S>(_ms = 0) {
  return {
    getItem: (k: string) => (mem.get(k) as { state: S } | undefined) ?? null,
    setItem: (k: string, v: { state: S }) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    flush: () => {},
  };
}
export const kvStorage = bigKvStorage();
