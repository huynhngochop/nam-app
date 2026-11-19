import { purchasesReady } from '@nam/core';
import { useVi } from './store';

/**
 * Phần nào của Ví Gọn đã chạy thật được; phần chưa xong thì ẩn lối vào.
 * Ví Gọn Pro chỉ bán khi đã nối cửa hàng. Chưa nối thì mọi người dùng đủ tính năng Pro, không bị chặn hay mời mua.
 */
export const features = {
  proForSale: () => purchasesReady(),
};

/** Có quyền lợi Pro: đã mua, hoặc gói chưa mở bán. */
export function usePro(): boolean {
  const bought = useVi((s) => s.isPro);
  return bought || !features.proForSale();
}
