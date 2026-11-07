// Config plugin dùng chung (cả 4 app): bản release Android nhẹ hơn.
// - R8 rút gọn / làm rối mã Java-Kotlin + bỏ tài nguyên không dùng (Expo & React Native có sẵn luật giữ lớp cần thiết).
// - Chỉ đóng gói thư viện native cho điện thoại thật (arm64-v8a, armeabi-v7a), bỏ x86 / x86_64 của máy ảo:
//   APK cài thử (preview) nhẹ đi gần một nửa. Bản Google Play (AAB) vốn tách theo kiến trúc nên không đổi.
// Đặt qua gradle.properties mà mẫu android của Expo đọc khi prebuild.
const { withGradleProperties } = require('expo/config-plugins');

const PROPS = {
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableProguardInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
  reactNativeArchitectures: 'armeabi-v7a,arm64-v8a',
};

module.exports = function withAndroidRelease(config) {
  return withGradleProperties(config, (c) => {
    for (const [key, value] of Object.entries(PROPS)) {
      c.modResults = c.modResults.filter((p) => !(p.type === 'property' && p.key === key));
      c.modResults.push({ type: 'property', key, value });
    }
    return c;
  });
};
