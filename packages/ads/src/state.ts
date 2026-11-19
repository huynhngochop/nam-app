import { useSyncExternalStore } from 'react';

/**
 * Trạng thái quảng cáo dùng chung trong app: đã khởi tạo xong chưa, có đang ẩn (người dùng đã mua gói) không,
 * và mã đơn vị quảng cáo của app. Không lưu xuống máy.
 */
export type AdUnits = {
  banner?: { android?: string; ios?: string };
  native?: { android?: string; ios?: string };
};

type AdsState = { ready: boolean; hidden: boolean; units: AdUnits; contentRating: 'G' | 'PG' | 'T' };

let state: AdsState = { ready: false, hidden: false, units: {}, contentRating: 'PG' };
const listeners = new Set<() => void>();

export function getAdsState(): AdsState {
  return state;
}
export function setAdsState(patch: Partial<AdsState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
/** Có hiện quảng cáo lúc này không: SDK đã sẵn sàng và người dùng không thuộc gói không quảng cáo. */
export function useAdsVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.ready && !state.hidden,
    () => false,
  );
}
