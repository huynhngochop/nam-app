import React, { memo, useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } from 'react-native-google-mobile-ads';
import { Badge, fonts, radius, useTheme } from '@nam/ui';
import { useAdsVisible } from './state';
import { requestOptions, unitId } from './units';

/**
 * Thẻ quảng cáo xen trong danh sách, cùng kiểu với thẻ nội dung nhưng luôn có nhãn "Tài trợ"
 * để người dùng (nhất là người lớn tuổi) phân biệt được. Tải không được thì không hiện gì.
 */
export const AdNative = memo(function AdNative() {
  const visible = useAdsVisible();
  const { c } = useTheme();
  const [ad, setAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    const unit = unitId('native');
    if (!visible || !unit) return;
    let alive = true;
    let loaded: NativeAd | null = null;
    NativeAd.createForAdRequest(unit, requestOptions())
      .then((nativeAd) => {
        if (alive) {
          loaded = nativeAd;
          setAd(nativeAd);
        } else nativeAd.destroy();
      })
      .catch(() => {});
    return () => {
      alive = false;
      loaded?.destroy();
    };
  }, [visible]);

  if (!visible || !ad) return null;
  const text = { color: c.ink, fontFamily: fonts.regular };
  return (
    <NativeAdView
      nativeAd={ad}
      style={{
        backgroundColor: c.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.line,
        padding: 12,
        gap: 10,
        marginVertical: 6,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        {ad.icon ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: ad.icon.url }} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
          </NativeAsset>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Badge label="Tài trợ" />
            {ad.advertiser ? (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text numberOfLines={1} style={[text, { color: c.inkMuted, fontSize: 13, flexShrink: 1 }]}>
                  {ad.advertiser}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text numberOfLines={2} style={[text, { fontFamily: fonts.semibold, fontSize: 16 }]}>
              {ad.headline}
            </Text>
          </NativeAsset>
        </View>
      </View>
      {ad.body ? (
        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text numberOfLines={2} style={[text, { color: c.inkMuted, fontSize: 15 }]}>
            {ad.body}
          </Text>
        </NativeAsset>
      ) : null}
      {ad.mediaContent ? (
        <NativeMediaView
          resizeMode="cover"
          style={{
            width: '100%',
            aspectRatio: Math.max(1.2, ad.mediaContent.aspectRatio || 16 / 9),
            borderRadius: radius.sm,
            overflow: 'hidden',
          }}
        />
      ) : null}
      {ad.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text
            style={[
              text,
              {
                alignSelf: 'flex-start',
                minHeight: 44,
                textAlignVertical: 'center',
                paddingHorizontal: 16,
                paddingVertical: 11,
                borderRadius: radius.pill,
                overflow: 'hidden',
                backgroundColor: c.at,
                color: c.a,
                fontFamily: fonts.semibold,
                fontSize: 15,
              },
            ]}
          >
            {ad.callToAction}
          </Text>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
});
