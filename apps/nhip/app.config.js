// Cấu hình động bọc quanh app.json: gắn mã ứng dụng AdMob từ biến môi trường lúc build.
const withAdMob = require('../../packages/ads/app-config');

module.exports = ({ config }) => withAdMob(config, 'NHIP');
