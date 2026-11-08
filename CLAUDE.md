# Năm App: hướng dẫn cho người và AI làm việc trong repo

Monorepo npm workspaces: `apps/*` (Expo SDK 54, React Native 0.81, expo-router), `packages/core`, `packages/ui`.

## Luôn áp dụng

- **Gọn nhẹ và nhanh là yêu cầu bắt buộc, không phải việc làm sau.** Mọi thay đổi và mọi app mới theo [`docs/lean-app.md`](docs/lean-app.md):
  - dung lượng APK trong ngân sách `.github/apk-budget.json`;
  - không công cụ dev trong bản phát hành;
  - icon và phông nhập từng phần;
  - âm thanh `.m4a`, ảnh nén;
  - danh sách dài dùng FlashList, cache phép tính nặng, việc nặng để sau khi màn đầu hiện ra.
- Trước khi thêm thư viện: ước lượng dung lượng tăng thêm và ghi vào mô tả PR. Có cách nhẹ hơn thì dùng cách đó.
- Báo cáo dung lượng APK trước và sau khi thay đổi đụng tới thư viện, tài nguyên hoặc native.
- Chạy được khi không có mạng. Phần cần máy chủ đi qua `outbox` và chỉ bật khi có cấu hình.
- Giá để trống `PRICE_*`, chưa điền.
- Ngày và tháng theo giờ máy: dùng `dateKey()` / `monthKey()`, không dùng `toISOString().slice(...)`.

## Lệnh

- `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` (CI chạy cả bốn).
- CI build APK thật và mở mọi màn hình trên máy ảo: `android-native.yml` (PR), `apk-build.yml` (main → nhánh `apk-builds`, kèm GitHub Release khi có `.github/release-notes/v<phiên bản>.md`).
