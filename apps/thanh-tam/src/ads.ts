import { useEffect } from 'react';
import { initAds, setAdsHidden, type AdUnits } from '@nam/ads';
import { useTT } from './store';

/**
 * Quảng cáo AdMob (Android và iPhone). Mã đơn vị thật đặt ở biến môi trường lúc build
 * (EXPO_PUBLIC_ADMOB_THANH_TAM_*); thiếu thì dùng mã thử của Google.
 * Thành Tâm: giới hạn quảng cáo ở mức G (mọi lứa tuổi); không đặt ở màn khấn, tụng kinh, chi tiết lễ.
 */
const UNITS: AdUnits = {
  banner: {
    android: process.env.EXPO_PUBLIC_ADMOB_THANH_TAM_ANDROID_BANNER,
    ios: process.env.EXPO_PUBLIC_ADMOB_THANH_TAM_IOS_BANNER,
  },
  native: {
    android: process.env.EXPO_PUBLIC_ADMOB_THANH_TAM_ANDROID_NATIVE,
    ios: process.env.EXPO_PUBLIC_ADMOB_THANH_TAM_IOS_NATIVE,
  },
};

/** Gọi một lần ở gốc app: khởi tạo quảng cáo, ẩn hết khi người dùng có gói trả phí. */
export function useAppAds() {
  const paid = useTT((s) => s.tamAn);
  useEffect(() => {
    setAdsHidden(paid);
  }, [paid]);
  useEffect(() => {
    void initAds({ units: UNITS, contentRating: 'G' });
  }, []);
}
