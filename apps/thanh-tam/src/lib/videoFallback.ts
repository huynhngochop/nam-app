/**
 * Quy tắc cho trình phát YouTube trong app (hàm thuần, có kiểm thử).
 * Mã lỗi IFrame API: 2 tham số sai, 5 lỗi HTML5, 100 video bị gỡ hay riêng tư, 101/150 chủ kênh tắt nhúng,
 * 152/153 lỗi cấu hình trình phát (thiếu nguồn nhúng). Gặp các mã này thì chuyển sang bản kế.
 */
export const YT_BLOCKED_CODES = [2, 5, 100, 101, 150, 152, 153];

export const nextPlayable = {
  /**
   * Cho phép tải trong WebView? Khung con (iframe trình phát) luôn được. Khung chính chỉ được là trang trình phát
   * (about:blank, data:, hay trang gốc của app). Mọi đường khác (youtube.com/watch, trang kênh, đăng nhập) bị chặn:
   * người dùng ở lại trong app.
   */
  allowNavigation(url: string, isTopFrame: boolean | undefined, origin: string): boolean {
    if (isTopFrame === false) return true;
    if (url.startsWith('about:') || url.startsWith('data:')) return true;
    return url === origin || url.startsWith(`${origin}/`);
  },
  /** Bản kế tiếp chưa thử, vòng quanh danh sách; hết thì -1. */
  next(count: number, current: number, tried: Set<number>): number {
    for (let k = 1; k <= count; k++) {
      const j = (current + k) % count;
      if (!tried.has(j)) return j;
    }
    return -1;
  },
};
