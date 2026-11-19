import mobileAds, { AdsConsent, MaxAdContentRating } from 'react-native-google-mobile-ads';
import { getAdsState, setAdsState, type AdUnits } from './state';

let started = false;

/**
 * Khởi tạo quảng cáo một lần khi mở app: hỏi đồng ý theo quy định (UMP, chỉ hiện ở nơi luật yêu cầu),
 * giới hạn nội dung quảng cáo, rồi khởi tạo SDK. Lỗi gì cũng bỏ qua: app vẫn chạy, chỉ không có quảng cáo.
 */
export async function initAds(opts: { units: AdUnits; contentRating?: 'G' | 'PG' | 'T' }) {
  setAdsState({ units: opts.units, contentRating: opts.contentRating ?? getAdsState().contentRating });
  if (started) return;
  started = true;
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // không hỏi được thì vẫn khởi tạo; quảng cáo sẽ không cá nhân hóa
  }
  try {
    const rating = getAdsState().contentRating;
    await mobileAds().setRequestConfiguration({
      maxAdContentRating:
        rating === 'G' ? MaxAdContentRating.G : rating === 'T' ? MaxAdContentRating.T : MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    setAdsState({ ready: true });
  } catch {
    started = false;
  }
}

/** Người dùng đã mua gói không quảng cáo (hoặc gói trả phí của app) thì ẩn mọi quảng cáo. */
export function setAdsHidden(hidden: boolean) {
  if (getAdsState().hidden !== hidden) setAdsState({ hidden });
}
