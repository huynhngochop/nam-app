# Năm App: 5 ứng dụng di động (React Native + Expo)

| App | Thư mục | Tóm tắt |
|---|---|---|
| **Mẹo Nhà** | `apps/meo-nha` | Mẹo nhà cửa, công thức từ tủ lạnh, hỏi đáp (AI qua cổng máy chủ, có phương án không AI) |
| **Nhịp** | `apps/nhip` | Hẹn giờ tập trung, âm thanh nền, thống kê, thói quen. Không dùng AI. |
| **Hẹn Đẹp** | `apps/hen-dep` | Lịch hẹn cho salon / spa / nail: lịch theo thợ, khách, doanh thu, link đặt lịch, đọc bảng giá, soạn tin ưu đãi |
| **Thành Tâm** | `apps/thanh-tam` | Sổ tay cúng lễ tại gia: văn khấn tự điền tên, lễ vật theo miền, chế độ khấn chữ to, lịch âm, sổ giỗ, dấu hiệu & mẹo, Tuổi & năm, nhân tướng tự chọn. Mọi thứ chạy trên máy. |
| **Ví Gọn** | `apps/vi-gon` | Sổ chi tiêu trên máy: đọc tin ngân hàng, ngân sách, quỹ, hỏi đáp tính trên máy, sao lưu mã hóa |

Thư viện dùng chung:
- `packages/ui`: design tokens, các component, bố cục thích ứng.
- `packages/core`: định dạng tiếng Việt, lưu trữ, hàng chờ offline, client cổng AI, mua trong app, cấu hình giá.

## Chạy thử

Cần Node 20 trở lên, Xcode (iOS) hoặc Android Studio (Android).

```bash
npm install
# Đồng bộ phiên bản thư viện với Expo SDK 54 (bắt buộc ở lần đầu):
for a in meo-nha nhip hen-dep vi-gon thanh-tam; do (cd apps/$a && npx expo install --fix); done

# Chạy một app (dev build, vì app có module native: SQLite, thông báo, âm thanh, sinh trắc học):
cd apps/vi-gon
npx expo run:android      # hoặc: npx expo run:ios
# Các lần sau chỉ cần: npm run vi   (ở thư mục gốc: meo | nhip | hen | vi | tt)
```

Build cài đặt: `npx eas build -p android --profile preview` (cấu hình nằm trong `eas.json` của từng app).

Kiểm tra:
- `npm test`: các bài kiểm tra logic chạy bằng tsx, gồm bộ đọc tin ngân hàng, hiểu câu hỏi, đọc bảng giá, mẫu tin ưu đãi, chặn câu nguy hiểm và cỡ cửa sổ.
- `npm run typecheck`: kiểm tra kiểu bằng TypeScript đầy đủ, sau khi đã `npm install`.

## Màn hình gập, tablet, nhiều độ phân giải

Toàn bộ bố cục đi qua `useLayout()` (`packages/ui/src/layout.ts`), tính lại ngay khi gập/mở máy, xoay màn hình hoặc chia đôi màn hình. Có 3 cỡ cửa sổ:

| Cỡ cửa sổ | Chiều rộng | Thiết bị |
|---|---|---|
| compact | < 600 dp | điện thoại, máy gập khi gập |
| medium | 600–839 dp | máy gập mở dọc, tablet nhỏ |
| expanded | ≥ 840 dp | tablet ngang, máy gập mở ngang |

Hành vi theo cỡ cửa sổ:
- **Thanh điều hướng:** tab dưới chuyển thành thanh dọc bên trái khi expanded.
- **Danh sách và chi tiết:** dùng `TwoPane`, hai cột cạnh nhau khi expanded. Áp dụng cho lịch hẹn, khách, giao dịch.
- **Lưới thẻ:** `Grid` tự tăng số cột.
- **Nội dung đọc:** giới hạn rộng 720 dp để chữ không bị kéo dãn.
- **Sheet:** nằm giữa màn hình khi màn rộng.
- **Xoay màn hình:** `orientation: default` để xoay tự do. iOS bật `supportsTablet`, Android bật edge-to-edge.

Hiệu năng:
- Danh sách dài dùng FlashList.
- Giao dịch của Ví Gọn nằm trong SQLite có chỉ mục; các phép tổng hợp chạy bằng SQL.
- Bộ hẹn giờ Nhịp tính theo thời điểm kết thúc, nên không lệch giờ khi app chạy nền.

## Biến môi trường

| Biến | Dùng cho |
|---|---|
| `EXPO_PUBLIC_AI_GATEWAY_URL` | Cổng AI phía máy chủ (app không chứa khóa API). Bỏ trống thì mọi tính năng tự dùng phương án không AI. |
| `EXPO_PUBLIC_API_BASE_URL` | Máy chủ Hẹn Đẹp (OTP, đồng bộ, gửi Zalo). Bỏ trống thì dùng mã OTP thử `123456` và dữ liệu chỉ nằm trên máy. |

## Giá

Mọi giá đều là ô `PRICE_*`, đọc qua `getPrice()` trong `packages/core/src/config.ts` (lấy từ remote config hoặc giá của App Store / Google Play). Giá sẽ được cập nhật sau cùng.

## Chạy trên máy và phần chờ máy chủ

Mọi tính năng dưới đây chạy trên máy, không cần máy chủ:

| App | Tính năng | Cách chạy |
|---|---|---|
| Ví Gọn | Đọc thông báo ngân hàng (Android) | Module native `modules/vi-gon-notification-listener` (NotificationListenerService). Chỉ giữ thông báo có số tiền; app tắt thì xếp hàng trên máy, mở app thì xử lý. Người dùng bật trong Cài đặt → Truy cập thông báo. |
| Ví Gọn | iPhone | Phím tắt → Tự động hóa → mở `vigon://import?text=…` (Apple không cho đọc thông báo app khác) |
| Hẹn Đẹp | Xác nhận, nhắc lịch, cảm ơn | Soạn sẵn tin trong app Tin nhắn; nhắc 24h / 2h bằng thông báo trên máy cho chủ tiệm |
| Mẹo Nhà | Báo mẹo, gửi mẹo | Báo → ẩn mẹo với người báo; gửi → lưu thành "Mẹo của tôi" |
| Nhịp | Giao diện vòng hẹn giờ | 5 giao diện, miễn phí |

Cần máy chủ / tài khoản cửa hàng (đang ẩn hoặc báo rõ trong app):

| Phần | Hiện tại | Cần làm thêm |
|---|---|---|
| Mua trong app | Bản preview báo "chưa sẵn sàng"; bản dev giả lập | Nối RevenueCat hoặc react-native-iap qua `setPurchaseProvider()`, chốt giá `PRICE_*` |
| Hẹn Đẹp: OTP, đồng bộ, Zalo tự động, trang đặt lịch, cọc | Chưa có `EXPO_PUBLIC_API_BASE_URL` thì ẩn link đặt lịch, khách tự đặt, cọc; hàng chờ outbox không xếp | Viết API |
| Hẹn Đẹp: đọc chữ trên ảnh bảng giá | Dán chữ, bộ tách chạy trên máy (hoặc AI nếu có cổng) | OCR trên máy (ML Kit / Vision) |
| Mẹo Nhà: nhận diện nguyên liệu bằng camera | Đã bỏ màn chụp; chọn nhanh ở tủ lạnh | Mô hình nhận diện |
| Mẹo Nhà, Hẹn Đẹp: AI | Không có `EXPO_PUBLIC_AI_GATEWAY_URL` thì dùng phương án không AI | Cổng AI phía máy chủ |
| Nhịp: tải gói âm thanh | 4 âm cơ bản có sẵn; gói mua thêm báo lỗi rõ | Máy chủ nội dung + mua trong app |

Build Android thật (prebuild + Gradle, không cần EAS): workflow `android-native.yml` chạy cho mỗi pull request đổi thư viện / module native và báo dung lượng APK.

## Bảo mật và riêng tư

- Không có khóa API nào nằm trong app.
- Ví Gọn không gửi giao dịch đi đâu.
- Hỏi Ví Gọn: chỉ khi không hiểu câu hỏi mới gửi chính câu hỏi lên cổng AI, kèm tên danh mục và tên quỹ. Mọi con số đều tính trên máy.
- Nhận xét tổng kết bằng AI: mặc định tắt. Khi bật, chỉ gửi số tổng theo danh mục, đã làm tròn.
- Sao lưu Ví Gọn: mã hóa XChaCha20-Poly1305, khóa sinh từ mật khẩu bằng PBKDF2-SHA256 (150k vòng). Quên mật khẩu thì không mở được bản sao lưu.
- Khóa Face ID / vân tay luôn cho dùng mật mã máy làm phương án dự phòng.
