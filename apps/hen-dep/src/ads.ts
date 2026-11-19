import { useEffect } from 'react';
import { initAds, setAdsHidden, type AdUnits } from '@nam/ads';
import { useHen } from './store';

/**
 * Quảng cáo AdMob (Android và iPhone). Mã đơn vị thật đặt ở biến môi trường lúc build
 * (EXPO_PUBLIC_ADMOB_HEN_DEP_*); thiếu thì dùng mã thử của Google.
 * Hẹn Đẹp: không đặt ở màn đặt lịch, thanh toán.
 */
const UNITS: AdUnits = {
  banner: {
    android: process.env.EXPO_PUBLIC_ADMOB_HEN_DEP_ANDROID_BANNER,
    ios: process.env.EXPO_PUBLIC_ADMOB_HEN_DEP_IOS_BANNER,
  },
  native: {
    android: process.env.EXPO_PUBLIC_ADMOB_HEN_DEP_ANDROID_NATIVE,
    ios: process.env.EXPO_PUBLIC_ADMOB_HEN_DEP_IOS_NATIVE,
  },
};

/** Gọi một lần ở gốc app: khởi tạo quảng cáo, ẩn hết khi người dùng có gói trả phí. */
export function useAppAds() {
  const paid = useHen((s) => s.plan.code !== 'trial');
  useEffect(() => {
    setAdsHidden(paid);
  }, [paid]);
  useEffect(() => {
    void initAds({ units: UNITS, contentRating: 'PG' });
  }, []);
}
