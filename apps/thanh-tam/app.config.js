// Cấu hình động bọc quanh app.json: gắn mã ứng dụng AdMob (tài khoản của chủ app).
const withAdMob = require('../../packages/ads/app-config');

module.exports = ({ config }) => withAdMob(config, 'THANH_TAM', { android: 'ca-app-pub-3572139488685748~5358584445' });
