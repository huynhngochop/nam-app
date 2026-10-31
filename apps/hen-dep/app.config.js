// Cấu hình động bọc quanh app.json.
// Chặn build production khi chưa có máy chủ: thiếu EXPO_PUBLIC_API_BASE_URL thì app không đăng nhập được.
module.exports = ({ config }) => {
  if (process.env.EXPO_PUBLIC_APP_VARIANT === 'production' && !process.env.EXPO_PUBLIC_API_BASE_URL) {
    throw new Error(
      'Hẹn Đẹp production cần EXPO_PUBLIC_API_BASE_URL (đặt trong biến môi trường EAS của profile production).',
    );
  }
  return config;
};
