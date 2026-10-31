/**
 * Mã lịch hẹn hiển thị cho khách (HD-3001…), lỗi H4.
 * Lấy số lớn nhất giữa các mã đang có và `lastIssued` (mốc đã cấp, lưu bền, không bị đặt lại khi xóa dữ liệu
 * hay nạp dữ liệu mẫu), nên không cấp lại mã cũ. Khi có máy chủ, máy chủ nên cấp mã để hai máy không trùng nhau.
 */
export function nextBookingCode(existing: { code: string }[], lastIssued = 3000): { code: string; n: number } {
  let max = Math.max(3000, lastIssued);
  for (const b of existing) {
    const n = Number(b.code.replace(/^HD-/, ''));
    if (Number.isInteger(n) && n > max) max = n;
  }
  return { code: `HD-${max + 1}`, n: max + 1 };
}
