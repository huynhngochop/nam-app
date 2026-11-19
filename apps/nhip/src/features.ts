import { purchasesReady } from '@nam/core';
import { useNhip } from './store';

/**
 * Phần nào của Nhịp đã chạy thật được; phần chưa xong thì ẩn lối vào.
 * - Nhịp Pro: chỉ bán khi đã nối cửa hàng. Chưa nối thì mọi người dùng đủ tính năng Pro, không bị chặn hay mời mua.
 * - Cửa hàng gói âm thanh: cần cửa hàng và máy chủ nội dung (EXPO_PUBLIC_CONTENT_URL) để tải gói.
 */
export const features = {
  proForSale: () => purchasesReady(),
  soundStore: () => purchasesReady() && !!process.env.EXPO_PUBLIC_CONTENT_URL,
};

/** Có quyền lợi Pro: đã mua, hoặc gói chưa mở bán. */
export function usePro(): boolean {
  const bought = useNhip((s) => s.isPro);
  return bought || !features.proForSale();
}
