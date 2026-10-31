import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { kvStorage } from './storage';
import { uid } from './id';

/**
 * Hàng chờ thay đổi khi ngoại tuyến (Chuẩn spec › 10–11). Mỗi mục có idempotencyKey để máy chủ không ghi trùng.
 * `sender` do từng app cung cấp; khi chưa có máy chủ, app có thể bỏ qua (dữ liệu đã nằm trên máy).
 */
export type OutboxItem = {
  id: string;
  kind: string;
  payload: unknown;
  createdAt: number;
  tries: number;
  lastError?: string;
};
type Sender = (item: OutboxItem) => Promise<'ok' | 'conflict'>;

type S = {
  items: OutboxItem[];
  conflicts: OutboxItem[];
  enqueue: (kind: string, payload: unknown) => void;
  flush: (send: Sender) => Promise<void>;
  resolveConflict: (id: string) => void;
};

export function createOutbox(name: string) {
  return create<S>()(
    persist(
      (set, get) => ({
        items: [],
        conflicts: [],
        enqueue: (kind, payload) =>
          set((s) => ({ items: [...s.items, { id: uid(), kind, payload, createdAt: Date.now(), tries: 0 }] })),
        flush: async (send) => {
          for (const it of [...get().items]) {
            try {
              const r = await send(it);
              set((s) => ({
                items: s.items.filter((x) => x.id !== it.id),
                conflicts: r === 'conflict' ? [...s.conflicts, it] : s.conflicts,
              }));
            } catch (e) {
              set((s) => ({
                items: s.items.map((x) => (x.id === it.id ? { ...x, tries: x.tries + 1, lastError: String(e) } : x)),
              }));
              break; // giữ thứ tự: dừng ở mục lỗi đầu tiên, thử lại lần sau
            }
          }
        },
        resolveConflict: (id) => set((s) => ({ conflicts: s.conflicts.filter((x) => x.id !== id) })),
      }),
      { name: `outbox:${name}`, storage: kvStorage },
    ),
  );
}
