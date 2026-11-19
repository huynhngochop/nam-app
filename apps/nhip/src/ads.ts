import { useEffect } from 'react';
import { initAds, setAdsHidden, type AdUnits } from '@nam/ads';
import { useNhip } from './store';

/**
 * Quảng cáo AdMob (Android và iPhone). Mã đơn vị thật đặt ở biến môi trường lúc build
 * (EXPO_PUBLIC_ADMOB_NHIP_*); thiếu thì dùng mã thử của Google.
 * Nhịp: không đặt ở màn phiên đang chạy, giờ nghỉ.
 */
const UNITS: AdUnits = {
  banner: {
    android: process.env.EXPO_PUBLIC_ADMOB_NHIP_ANDROID_BANNER,
    ios: process.env.EXPO_PUBLIC_ADMOB_NHIP_IOS_BANNER,
  },
  native: {
    android: process.env.EXPO_PUBLIC_ADMOB_NHIP_ANDROID_NATIVE,
    ios: process.env.EXPO_PUBLIC_ADMOB_NHIP_IOS_NATIVE,
  },
};

/** Gọi một lần ở gốc app: khởi tạo quảng cáo, ẩn hết khi người dùng có gói trả phí. */
export function useAppAds() {
  const paid = useNhip((s) => s.isPro);
  useEffect(() => {
    setAdsHidden(paid);
  }, [paid]);
  useEffect(() => {
    void initAds({ units: UNITS, contentRating: 'PG' });
  }, []);
}
