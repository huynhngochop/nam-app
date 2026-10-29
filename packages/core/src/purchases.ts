/**
 * Mua trong app. Lớp giao tiếp chung để nối StoreKit / Google Play Billing (ví dụ thư viện expo-iap hoặc RevenueCat)
 * mà không sửa màn hình. Chưa nối nhà cung cấp → trả 'unavailable'; bản dev có thể giả lập để thử giao diện.
 * Giá hiển thị luôn lấy từ cửa hàng theo productId (Chuẩn spec › 6), không viết cứng.
 */
export type PurchaseResult = { status: 'success' | 'cancelled' | 'pending' | 'failed' | 'unavailable'; code?: string };
export type PurchaseProvider = {
  buy: (productId: string) => Promise<PurchaseResult>;
  restore: () => Promise<string[]>;
  priceOf?: (productId: string) => Promise<string | null>;
};

let provider: PurchaseProvider | null = null;
export function setPurchaseProvider(p: PurchaseProvider) { provider = p; }

export async function buy(productId: string): Promise<PurchaseResult> {
  if (provider) return provider.buy(productId);
  if (__DEV__) return { status: 'success', code: 'DEV_SIMULATED' };
  return { status: 'unavailable', code: 'IAP_NOT_CONFIGURED' };
}
export async function restorePurchases(): Promise<string[]> {
  if (provider) return provider.restore();
  return [];
}
export async function storePrice(productId: string): Promise<string | null> {
  return provider?.priceOf ? provider.priceOf(productId) : null;
}
export const PURCHASE_MESSAGES: Record<PurchaseResult['status'], string> = {
  success: 'Cảm ơn bạn!',
  cancelled: '',
  pending: 'Cửa hàng chưa xác nhận thanh toán. Bạn chưa bị trừ tiền.',
  failed: 'Thanh toán không thành công. Bạn chưa bị trừ tiền.',
  unavailable: 'Mua trong app chưa sẵn sàng ở bản này.',
};
