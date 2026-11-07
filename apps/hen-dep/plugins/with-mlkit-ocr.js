// Cài app xong thì Play services tải sẵn mô hình đọc chữ (khỏi chờ ở lần chụp đầu).
// expo-dev-launcher cũng khai báo meta-data này (barcode_ui), nên app ghi đè bằng giá trị gộp.
const { withAndroidManifest } = require('expo/config-plugins');

const NAME = 'com.google.mlkit.vision.DEPENDENCIES';

module.exports = function withMlkitOcr(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const app = manifest.application[0];
    app['meta-data'] = (app['meta-data'] || []).filter((m) => m.$['android:name'] !== NAME);
    app['meta-data'].push({
      $: { 'android:name': NAME, 'android:value': 'ocr,barcode_ui', 'tools:replace': 'android:value' },
    });
    return cfg;
  });
};
