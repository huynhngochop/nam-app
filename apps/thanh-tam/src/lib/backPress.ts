/**
 * Nút Quay lại của Android, quyết định thuần (có kiểm thử):
 * - Còn màn trước: để điều hướng tự quay lại (`nav`).
 * - Không còn màn trước mà đang ở màn lẻ (mở từ thông báo, đường dẫn): về Hôm nay (`home`).
 * - Ở màn chính: lần đầu nhắc "chạm lần nữa để thoát" (`warn`); chạm lần hai trong `EXIT_WINDOW_MS` thì thoát (`exit`).
 */
export const EXIT_WINDOW_MS = 2000;

/** Màn chính: bốn tab dưới (đường dẫn bỏ nhóm `(tabs)`). */
const TAB_ROOTS = new Set(['/', '/today', '/rituals', '/calendar', '/explore']);
export const isTabRoot = (path: string) => TAB_ROOTS.has(path.replace(/^\/\(tabs\)/, '') || '/');

export type BackAction = 'nav' | 'home' | 'warn' | 'exit';

export function decideBack(o: { canGoBack: boolean; path: string; now: number; lastWarn: number }): BackAction {
  if (o.canGoBack) return 'nav';
  if (!isTabRoot(o.path)) return 'home';
  return o.now - o.lastWarn < EXIT_WINDOW_MS ? 'exit' : 'warn';
}
