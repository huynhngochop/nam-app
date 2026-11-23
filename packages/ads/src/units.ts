import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';
import { getAdsState } from './state';

/** Bản chạy thử (máy phát triển, máy ảo QA trên CI với EXPO_PUBLIC_ADS_TEST=1): luôn dùng quảng cáo thử. */
const TEST_BUILD = __DEV__ || process.env.EXPO_PUBLIC_ADS_TEST === '1';

/**
 * Mã đơn vị quảng cáo theo nền tảng.
 * - Bản chạy thử: mã thử của Google (không tính tiền, không làm bẩn số liệu, không bị khóa tài khoản vì tự bấm).
 * - Bản phát hành: mã thật; dạng nào chưa có mã thật thì trả null và không hiện dạng đó (không đưa quảng cáo thử tới người dùng).
 */
export function unitId(format: 'banner' | 'native'): string | null {
  if (TEST_BUILD) return format === 'banner' ? TestIds.ADAPTIVE_BANNER : TestIds.NATIVE;
  const os = Platform.OS === 'ios' ? 'ios' : 'android';
  return getAdsState().units[format]?.[os] || null;
}

/** iPhone: không xin quyền theo dõi (ATT), chỉ quảng cáo không cá nhân hóa. Android: theo đồng ý của người dùng (UMP). */
export function requestOptions() {
  return { requestNonPersonalizedAdsOnly: Platform.OS === 'ios' };
}
