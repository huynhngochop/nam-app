import React, { useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAdsVisible } from './state';
import { requestOptions, unitId } from './units';

/**
 * Dải quảng cáo ở cuối màn danh sách. Rộng theo màn (adaptive banner), cao ≈ 50–60 pt.
 * Không có quảng cáo để hiện hay lỗi mạng thì thu gọn hẳn, không để khoảng trống.
 */
export function AdBanner() {
  const visible = useAdsVisible();
  const [failed, setFailed] = useState(false);
  const unit = unitId('banner');
  if (!visible || failed || !unit) return null;
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }} accessibilityLabel="Quảng cáo">
      <BannerAd
        unitId={unit}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={requestOptions()}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
