# Chuẩn bị đăng Google Play và App Store

Cửa hàng không xem mã nguồn. Họ kiểm tra file app đã build, mô tả trên trang cửa hàng và các khai báo trong Play Console / App Store Connect. Phần lớn lỗi bị từ chối nằm ở khai báo thiếu hoặc sai, không nằm ở code.

## Phần đã có sẵn trong code

| Yêu cầu | Ở đâu |
| --- | --- |
| Quảng cáo có nhãn "Quảng cáo", không đặt sát nút bấm, không hiện ở màn tập trung, màn nhập tiền, màn hỏi đáp | `packages/ui/src/ads.tsx`, các chỗ đặt `<AdBanner>` |
| Bản phát hành không bao giờ hiện quảng cáo thử của Google | `ads.tsx`: chỉ bản dev/preview dùng `TestIds`, thiếu mã thật thì không hiện |
| Hỏi đồng ý quảng cáo theo luật nơi người dùng ở (UMP) trước khi tải quảng cáo | `ads.tsx`, `AdsConsent.gatherConsent()` |
| iOS: câu xin quyền theo dõi (ATT), danh sách SKAdNetwork | khối `react-native-google-mobile-ads` trong `app.json` |
| Người mua bản không quảng cáo / gói trả phí không thấy quảng cáo | `hidden={...}` ở mỗi `<AdBanner>` |
| Ví Gọn giải thích trước khi xin quyền đọc thông báo (prominent disclosure) | `apps/vi-gon/app/onboarding/privacy.tsx`, `permission.tsx` |
| App không văng trên mọi màn hình, nút Quay lại đúng | `smoke-apk.sh` trên máy ảo ở mỗi PR |
| Bản phát hành không có công cụ dev, không có link affiliate | `docs/lean-app.md`; kho mẹo không còn trường sản phẩm |

## Phần chủ app phải làm (cần tài khoản)

**AdMob** (admob.google.com):
1. Tạo mỗi app một bản trên AdMob, riêng cho Android và iOS (tối đa 8 bản).
2. Thay App ID thử (`ca-app-pub-3940256099942544~…`) trong khối `react-native-google-mobile-ads` của từng `app.json` bằng App ID thật.
3. Tạo mỗi app một mã banner. Đặt vào biến môi trường EAS của profile `production`:
   - `EXPO_PUBLIC_ADMOB_BANNER_ANDROID`
   - `EXPO_PUBLIC_ADMOB_BANNER_IOS`
4. Trong mục Quyền riêng tư & tin nhắn, bật thông báo GDPR. Với iOS, bật thêm thông báo IDFA để hiện ATT.
5. Đăng `app-ads.txt` trên website nhà phát triển ghi trong trang cửa hàng.

**Google Play Console**, cho mỗi app:
- Chính sách quyền riêng tư (URL công khai): ghi rõ dữ liệu nằm trên máy, AdMob thu thập mã quảng cáo và thông tin thiết bị để hiện quảng cáo.
- Mục "Ứng dụng có quảng cáo": **Có**.
- Khai báo **Advertising ID**: có dùng, cho mục đích quảng cáo. SDK tự thêm quyền `AD_ID`.
- An toàn dữ liệu (Data safety):
  - Mã thiết bị / mã quảng cáo, tương tác trong app, chẩn đoán: thu thập bởi AdMob, cho quảng cáo và phân tích.
  - Dữ liệu tài chính của Ví Gọn: **không** thu thập, vì chỉ nằm trên máy.
- Đối tượng: 18+ hoặc 13+, **không** chọn nhóm trẻ em. Có trẻ em thì phải dùng mạng quảng cáo được chứng nhận cho gia đình.
- Bảng câu hỏi xếp hạng nội dung.
- Quyền truy cập app cho người duyệt:
  - Hẹn Đẹp cần tài khoản thử và máy chủ OTP. Bản phát hành chưa build được khi chưa có `EXPO_PUBLIC_API_BASE_URL`.
- Tài khoản cá nhân tạo sau 11/2023: chạy thử kín với ít nhất 12 người trong 14 ngày trước khi lên bản chính thức.

**App Store Connect**, cho mỗi app:
- App Privacy (nhãn dinh dưỡng): khai như mục An toàn dữ liệu ở trên, đánh dấu "Dùng để theo dõi" nếu bật quảng cáo cá nhân hóa.
- Chính sách quyền riêng tư (URL), thông tin liên hệ hỗ trợ.
- Ví Gọn trên iPhone không đọc được thông báo ngân hàng. Mô tả trên cửa hàng chỉ nói tới Phím tắt và nhập tay, không hứa tự ghi.

## Trước mỗi lần nộp

- [ ] CI xanh, máy ảo mở mọi màn hình không văng (`android-native.yml`).
- [ ] Đổi `version` trong `app.json`; Android tăng `versionCode` nếu đã có trên Play.
- [ ] Ảnh chụp màn hình và mô tả khớp với tính năng thật của bản này.
- [ ] Không còn App ID, mã banner thử trong biến môi trường production.
