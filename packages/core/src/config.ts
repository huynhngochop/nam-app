/**
 * Cấu hình đổi được từ xa (remote config). Giá trị mặc định dùng khi chưa có máy chủ.
 * Giá (PRICE_*) và hạn mức AI (AI_*) chưa chốt — để null/giá trị gợi ý, cập nhật sau cùng.
 */
export type RemoteConfig = {
  aiGatewayUrl: string | null;
  apiBaseUrl: string | null;
  prices: Record<string, string | null>;
  limits: Record<string, number>;
  adEveryN: number;
};

let current: RemoteConfig = {
  aiGatewayUrl: process.env.EXPO_PUBLIC_AI_GATEWAY_URL ?? null,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? null,
  prices: {},
  limits: {
    AI_ASK_DAILY_FREE: 5,
    AI_ASK_DAILY_NOADS: 30,
    AI_FINANCE_DAILY_FREE: 10,
    AI_FINANCE_DAILY_PRO: 200,
    AI_QUOTA_BASIC: 10,
    AI_QUOTA_STANDARD: 60,
    AI_QUOTA_CHAIN: 200,
  },
  adEveryN: 6,
};

export function getConfig(): RemoteConfig {
  return current;
}
export function setConfig(patch: Partial<RemoteConfig>) {
  current = { ...current, ...patch };
}
/** Giá hiển thị hoặc null khi chưa chốt → UI hiện PricePlaceholder. */
export function getPrice(key: string): string | null {
  return current.prices[key] ?? null;
}
export function getLimit(key: string, fallback = 0): number {
  return current.limits[key] ?? fallback;
}
