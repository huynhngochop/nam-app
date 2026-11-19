import { getConfig, purchasesReady } from '@nam/core';
import { useMeo } from './store';

/**
 * Phần nào của Mẹo Nhà đã chạy thật được. Phần chưa xong thì ẩn lối vào thay vì để người dùng bấm vào chỗ không làm gì.
 * - Gói Plus: chỉ bán khi đã nối cửa hàng. Chưa nối thì mọi người dùng được như có Plus (không chặn, không mời mua).
 * - Gửi mẹo, báo mẹo sai: cần máy chủ nhận.
 * - Chụp nguyên liệu: chưa có mô hình nhận diện trên máy.
 */
export const features = {
  plusForSale: () => purchasesReady(),
  server: () => !!getConfig().apiBaseUrl,
  scan: false,
};

/** Người dùng có quyền lợi Plus: đã mua, hoặc gói chưa mở bán. */
export function usePlus(): boolean {
  const bought = useMeo((s) => s.plus);
  return bought || !features.plusForSale();
}
