import { useEffect } from 'react';
import { initAds, setAdsHidden, type AdUnits } from '@nam/ads';
import { useMeo } from './store';

/**
 * Quảng cáo AdMob (Android và iPhone). Mã đơn vị thật đặt ở biến môi trường lúc build
 * (EXPO_PUBLIC_ADMOB_MEO_NHA_*); thiếu thì dùng mã thử của Google.
 * Mẹo Nhà
 */
const UNITS: AdUnits = {
  banner: {
    android: process.env.EXPO_PUBLIC_ADMOB_MEO_NHA_ANDROID_BANNER,
    ios: process.env.EXPO_PUBLIC_ADMOB_MEO_NHA_IOS_BANNER,
  },
  native: {
    android: process.env.EXPO_PUBLIC_ADMOB_MEO_NHA_ANDROID_NATIVE,
    ios: process.env.EXPO_PUBLIC_ADMOB_MEO_NHA_IOS_NATIVE,
  },
};

/** Gọi một lần ở gốc app: khởi tạo quảng cáo, ẩn hết khi người dùng có gói trả phí. */
export function useAppAds() {
  const paid = useMeo((s) => s.plus);
  useEffect(() => {
    setAdsHidden(paid);
  }, [paid]);
  useEffect(() => {
    void initAds({ units: UNITS, contentRating: 'PG' });
  }, []);
}
