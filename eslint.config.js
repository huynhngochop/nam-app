// ESLint (flat config) cho cả monorepo. Lỗi (error) làm CI đỏ; cảnh báo (warn) chỉ để sửa dần.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-web/**',
      '**/.expo/**',
      // Màn tạo dữ liệu QA: chỉ được chép vào app trong CI (it-round.yml), import tương đối theo vị trí đó.
      'qa/seeds/**',
      // Crawler chạy ngoài monorepo, Playwright cài riêng trong CI.
      'qa/crawl.mjs',
      'qa-out/**',
      '**/expo-env.d.ts',
      'tests/typestubs/**',
    ],
  },
  {
    rules: {
      // Lỗi phụ thuộc hook gây lệch dữ liệu khó thấy — giữ ở mức cảnh báo, sửa dần thay vì tắt từng dòng.
      'react-hooks/exhaustive-deps': 'warn',
      // Code review C5: "ngày" và "tháng" luôn theo giờ máy qua dateKey()/monthKey(), không dùng UTC.
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.property.name='slice'][callee.object.callee.property.name='toISOString']",
          message: 'toISOString() là giờ UTC — dùng dateKey() trong @nam/core để lấy ngày theo giờ máy.',
        },
      ],
    },
  },
]);
