// Gắn plugin AdMob vào cấu hình Expo của một app (dùng trong apps/<app>/app.config.js).
// Mã ứng dụng AdMob thật đặt ở biến môi trường lúc build; chưa có thì dùng mã ứng dụng thử của Google
// (app vẫn chạy, quảng cáo là quảng cáo thử, không tính tiền).
const SAMPLE = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

/** prefix ví dụ 'THANH_TAM' → đọc ADMOB_THANH_TAM_ANDROID_APP_ID, ADMOB_THANH_TAM_IOS_APP_ID. */
module.exports = function withAdMob(config, prefix) {
  const androidAppId = process.env[`ADMOB_${prefix}_ANDROID_APP_ID`] || SAMPLE.android;
  const iosAppId = process.env[`ADMOB_${prefix}_IOS_APP_ID`] || SAMPLE.ios;
  if (process.env.EXPO_PUBLIC_APP_VARIANT === 'production' && androidAppId === SAMPLE.android) {
    console.warn(`[admob] ${prefix}: đang dùng mã ứng dụng AdMob thử, quảng cáo sẽ không có doanh thu`);
  }
  const plugins = (config.plugins || []).filter(
    (p) => (Array.isArray(p) ? p[0] : p) !== 'react-native-google-mobile-ads',
  );
  plugins.push([
    'react-native-google-mobile-ads',
    {
      androidAppId,
      iosAppId,
      // Chỉ bắt đầu đo lường của AdMob khi app gọi khởi tạo (sau bước hỏi đồng ý).
      delayAppMeasurementInit: true,
    },
  ]);
  return { ...config, plugins };
};
