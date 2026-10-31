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
- `npm test`: 22 bài kiểm tra logic chạy bằng tsx, gồm bộ đọc tin ngân hàng, hiểu câu hỏi, đọc bảng giá, mẫu tin ưu đãi, chặn câu nguy hiểm và cỡ cửa sổ.
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

## Những phần đã để sẵn chỗ nối, chưa có thật

| Phần | Hiện tại | Cần làm thêm |
|---|---|---|
| Mua trong app | `buy()` giả lập thành công khi chạy dev | Nối RevenueCat hoặc react-native-iap qua `setPurchaseProvider()` |
| Ví Gọn: đọc thông báo Android | `src/listener.ts` tự nhận module native tên `ViGonNotificationListener` nếu có. Khi chưa có: dán tin ngân hàng, hoặc nhập nhanh. | Viết module native (Expo Modules API) |
| Ví Gọn: iPhone | Phím tắt → Tự động hóa → mở `vigon://import?text=…` | Chạy được ngay |
| Hẹn Đẹp: đọc chữ trên ảnh bảng giá | Chọn hoặc chụp ảnh để đối chiếu, dán chữ, rồi bộ tách chạy trên máy (hoặc AI nếu có cổng) | OCR trên máy (ML Kit / Vision) |
| Hẹn Đẹp: máy chủ, gửi Zalo, trang đặt lịch web | Mọi thay đổi ghi vào hàng chờ outbox, xử lý được xung đột | Viết API |
| Mẹo Nhà: nhận diện nguyên liệu bằng camera | Gợi ý chọn nhanh | Mô hình nhận diện |
| Nhịp: tải gói âm thanh | Báo lỗi rõ ràng, 4 âm cơ bản có sẵn trong app | Máy chủ nội dung |

## Bảo mật và riêng tư

- Không có khóa API nào nằm trong app.
- Ví Gọn không gửi giao dịch đi đâu.
- Hỏi Ví Gọn: chỉ khi không hiểu câu hỏi mới gửi chính câu hỏi lên cổng AI, kèm tên danh mục và tên quỹ. Mọi con số đều tính trên máy.
- Nhận xét tổng kết bằng AI: mặc định tắt. Khi bật, chỉ gửi số tổng theo danh mục, đã làm tròn.
- Sao lưu Ví Gọn: mã hóa XChaCha20-Poly1305, khóa sinh từ mật khẩu bằng PBKDF2-SHA256 (150k vòng). Quên mật khẩu thì không mở được bản sao lưu.
- Khóa Face ID / vân tay luôn cho dùng mật mã máy làm phương án dự phòng.
