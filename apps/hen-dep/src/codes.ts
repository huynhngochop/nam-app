/**
 * Mã lịch hẹn hiển thị cho khách (HD-3001…). Tính từ các mã đã có thay vì bộ đếm trong bộ nhớ,
 * nên mở lại app không cấp lại mã cũ (lỗi H4). Mã bắt đầu từ 3001.
 */
export function nextBookingCode(existing: { code: string }[]): string {
  let max = 3000;
  for (const b of existing) {
    const n = Number(b.code.replace(/^HD-/, ''));
    if (Number.isInteger(n) && n > max) max = n;
  }
  return `HD-${max + 1}`;
}
