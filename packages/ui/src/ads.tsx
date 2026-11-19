/**
 * Quảng cáo Google (AdMob), dùng chung cho mọi app.
 *
 * - SDK chỉ được khởi động khi có banner sắp hiện và sau khi màn đầu đã vẽ xong, để không làm chậm lúc mở app.
 * - Trước khi tải quảng cáo, hỏi người dùng đồng ý theo luật nơi họ ở (bộ UMP của Google: EU, Anh…).
 *   Ở Việt Nam thường không hiện hộp hỏi nào.
 * - Bản thử (dev, preview) dùng mã quảng cáo thử của Google. Bản phát hành dùng mã thật trong
 *   EXPO_PUBLIC_ADMOB_BANNER_ANDROID / _IOS; thiếu mã thật thì không hiện quảng cáo, không bao giờ hiện quảng cáo thử
 *   cho người dùng thật (vi phạm chính sách AdMob).
 * - Banner luôn có nhãn "Quảng cáo". Không tải được thì thu lại hẳn, không để khoảng trống.
 */
import React, { useEffect, useState } from 'react';
import { InteractionManager, Platform, View } from 'react-native';
import mobileAds, { AdsConsent, BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { T } from './components/base';

const variant = process.env.EXPO_PUBLIC_APP_VARIANT ?? '';
const isTestBuild = __DEV__ || variant === 'development' || variant === 'preview';
const releaseBannerId = Platform.select({
  android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
  ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
});
const bannerUnitId = isTestBuild ? TestIds.ADAPTIVE_BANNER : releaseBannerId;

let adsReady: Promise<boolean> | null = null;

/** Hỏi đồng ý rồi khởi động SDK, đúng một lần cho cả app. Trả về false nếu không được phép tải quảng cáo. */
function startAds(): Promise<boolean> {
  adsReady ??= new Promise((resolve) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        await AdsConsent.gatherConsent().catch(() => undefined);
        const { canRequestAds } = await AdsConsent.getConsentInfo();
        if (!canRequestAds) {
          resolve(false);
          return;
        }
        await mobileAds().initialize();
        resolve(true);
      } catch {
        resolve(false);
      }
    });
  });
  return adsReady;
}

type AdBannerProps = {
  /** Ẩn hẳn (người dùng đã mua bản không quảng cáo, đang ngoại tuyến…). */
  hidden?: boolean;
};

/** Banner co theo bề ngang màn hình. Đặt xa nút bấm để tránh bấm nhầm (chính sách AdMob). */
export function AdBanner({ hidden }: AdBannerProps) {
  const [canShow, setCanShow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (hidden || !bannerUnitId) return;
    let mounted = true;
    startAds().then((allowed) => {
      if (mounted) setCanShow(allowed);
    });
    return () => {
      mounted = false;
    };
  }, [hidden]);

  if (hidden || !bannerUnitId || !canShow || failed) return null;
  return (
    <View style={{ alignItems: 'center', gap: 4, paddingVertical: loaded ? 8 : 0 }}>
      {loaded ? (
        <T v="caption" muted>
          Quảng cáo
        </T>
      ) : null}
      <BannerAd
        unitId={bannerUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
