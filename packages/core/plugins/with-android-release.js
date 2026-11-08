// Config plugin dùng chung (mọi app): bản release Android nhẹ và nhanh. Quy tắc đầy đủ: docs/lean-app.md.
// - R8 rút gọn / làm rối mã Java-Kotlin + bỏ tài nguyên không dùng (Expo & React Native có sẵn luật giữ lớp cần thiết).
// - Chỉ đóng gói thư viện native cho điện thoại thật (arm64-v8a, armeabi-v7a), bỏ x86 / x86_64 của máy ảo.
// - Chỉ giữ chuỗi giao diện tiếng Việt + tiếng Anh của các thư viện (bỏ hàng chục ngôn ngữ không dùng trong resources.arsc).
// - `-Pnam.abiSplits=true` (workflow APK cài thử): mỗi loại chip một APK thay vì APK gộp — máy chỉ tải phần của mình.
//   Bản Google Play (AAB) vốn được Play tách theo máy nên không cần.
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const PROPS = {
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableProguardInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
  reactNativeArchitectures: 'armeabi-v7a,arm64-v8a',
};

const MARK = '// @nam/lean-android';
const GRADLE = `
${MARK}
android {
    defaultConfig {
        resourceConfigurations += ['vi', 'en']
    }
    if (findProperty('nam.abiSplits') == 'true') {
        splits {
            abi {
                enable true
                reset()
                include(*((findProperty('reactNativeArchitectures') ?: 'armeabi-v7a,arm64-v8a').split(',') as List))
                universalApk false
            }
        }
    }
}
`;

module.exports = function withAndroidRelease(config) {
  config = withGradleProperties(config, (c) => {
    for (const [key, value] of Object.entries(PROPS)) {
      c.modResults = c.modResults.filter((p) => !(p.type === 'property' && p.key === key));
      c.modResults.push({ type: 'property', key, value });
    }
    return c;
  });
  return withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes(MARK)) c.modResults.contents += GRADLE;
    return c;
  });
};
