import { setAdsState, type AdUnits } from './state';

/** Bản web không có quảng cáo (thư viện AdMob chỉ chạy trên điện thoại). */
export async function initAds(_opts: { units: AdUnits; contentRating?: 'G' | 'PG' | 'T' }) {
  setAdsState({ ready: false });
}
export function setAdsHidden(hidden: boolean) {
  setAdsState({ hidden });
}
