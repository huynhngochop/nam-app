/**
 * Bộ lưu cho zustand persist, gom nhiều lần ghi liền nhau thành một (IT3).
 *
 * `createJSONStorage` chuyển toàn bộ state thành JSON và ghi ngay sau MỖI thay đổi. Với store vài MB
 * (Hẹn Đẹp: 10 nghìn lịch hẹn ≈ 2,9 MB) mỗi thao tác tốn một lần stringify + ghi cả khối trên luồng JS.
 * Ở đây chỉ giữ giá trị mới nhất; stringify và ghi chạy một lần sau `delayMs` yên lặng, hoặc ngay khi
 * gọi `flush()` (app gọi khi chuyển nền để không mất dữ liệu).
 */
export type PersistValue<S> = { state: S; version?: number };

type Backing = {
  getItem: (k: string) => string | null | Promise<string | null>;
  setItem: (k: string, v: string) => unknown;
  removeItem: (k: string) => unknown;
};

export function createDebouncedStorage<S>(backing: () => Backing, delayMs = 400) {
  const pending = new Map<string, PersistValue<S>>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    const b = backing();
    for (const [k, v] of pending) b.setItem(k, JSON.stringify(v));
    pending.clear();
  };

  return {
    flush,
    getItem: async (name: string): Promise<PersistValue<S> | null> => {
      // Đọc lại ngay sau khi ghi (chưa kịp xả) vẫn thấy giá trị mới nhất.
      const p = pending.get(name);
      if (p) return p;
      const raw = await backing().getItem(name);
      return raw == null ? null : (JSON.parse(raw) as PersistValue<S>);
    },
    setItem: (name: string, value: PersistValue<S>) => {
      pending.set(name, value);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    removeItem: (name: string) => {
      pending.delete(name);
      return backing().removeItem(name);
    },
  };
}
