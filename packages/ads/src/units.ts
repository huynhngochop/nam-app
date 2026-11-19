import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';
import { getAdsState } from './state';

/**
 * Mã đơn vị quảng cáo theo nền tảng. Chưa có mã thật (chưa tạo trong AdMob) thì dùng mã thử của Google:
 * quảng cáo thử hiện bình thường nhưng không tính tiền, tránh bị khóa tài khoản vì tự bấm quảng cáo thật.
 */
export function unitId(format: 'banner' | 'native'): string {
  const os = Platform.OS === 'ios' ? 'ios' : 'android';
  const real = getAdsState().units[format]?.[os];
  if (real && !__DEV__) return real;
  return format === 'banner' ? TestIds.ADAPTIVE_BANNER : TestIds.NATIVE;
}

/** iPhone: không xin quyền theo dõi (ATT), chỉ quảng cáo không cá nhân hóa. Android: theo đồng ý của người dùng (UMP). */
export function requestOptions() {
  return { requestNonPersonalizedAdsOnly: Platform.OS === 'ios' };
}
