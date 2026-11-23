import { useEffect } from 'react';
import { initAds, setAdsHidden, type AdUnits } from '@nam/ads';
import { useTT } from './store';

/**
 * Quảng cáo AdMob (Android và iPhone). Mã đơn vị thật của tài khoản chủ app ghi sẵn ở đây (không bí mật);
 * biến môi trường EXPO_PUBLIC_ADMOB_THANH_TAM_* ghi đè. Dạng nào chưa có mã thật thì bản phát hành không hiện dạng đó.
 * Thành Tâm: giới hạn quảng cáo ở mức G (mọi lứa tuổi); không đặt ở màn khấn, tụng kinh, chi tiết lễ.
 */
const UNITS: AdUnits = {
  banner: {
    android: process.env.EXPO_PUBLIC_ADMOB_THANH_TAM_ANDROID_BANNER || 'ca-app-pub-3572139488685748/4209154307',
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
