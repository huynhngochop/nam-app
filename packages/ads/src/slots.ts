/**
 * Chỗ đặt quảng cáo xen trong danh sách. Logic thuần (có kiểm thử), không phụ thuộc thư viện quảng cáo.
 * Quy tắc: không đặt ở đầu danh sách, cách đều `every` mục, danh sách ngắn hơn `first` thì không có quảng cáo.
 */
export type AdSlot = { kind: 'ad'; key: string };
export type WithAds<T> = T | AdSlot;

export function isAdSlot<T>(row: WithAds<T>): row is AdSlot {
  return typeof row === 'object' && row !== null && (row as AdSlot).kind === 'ad' && 'key' in row;
}

export function withAds<T>(
  items: readonly T[],
  opts: { first?: number; every?: number; enabled?: boolean } = {},
): WithAds<T>[] {
  const first = opts.first ?? 3;
  const every = Math.max(4, opts.every ?? 8);
  if (opts.enabled === false || items.length < first) return [...items];
  const rows: WithAds<T>[] = [];
  items.forEach((item, index) => {
    rows.push(item);
    const position = index + 1;
    if (position >= first && (position - first) % every === 0 && position < items.length) {
      rows.push({ kind: 'ad', key: `ad-${position}` });
    }
  });
  return rows;
}
