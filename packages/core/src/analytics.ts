/** Ghi sự kiện (tên snake_case theo Chuẩn spec › 3). Nối nhà cung cấp analytics sau; hiện chỉ ghi log khi dev. */
type Props = Record<string, string | number | boolean | null | undefined>;
let sink: ((name: string, props: Props) => void) | null = null;
export function setAnalyticsSink(fn: (name: string, props: Props) => void) {
  sink = fn;
}
export function track(name: string, props: Props = {}) {
  if (sink) sink(name, props);
  else if (__DEV__) console.log('[event]', name, props);
}
