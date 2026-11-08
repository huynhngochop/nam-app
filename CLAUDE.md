# Năm App: quy tắc làm việc

Monorepo 5 app tiếng Việt (Mẹo Nhà, Nhịp, Hẹn Đẹp, Ví Gọn, Thành Tâm) trên Expo SDK 54, React Native 0.81, kiến trúc mới.
Đọc tệp này trước mọi việc. Mỗi app có `apps/<app>/CLAUDE.md` riêng với ngân sách và hiện trạng; tệp của app thắng khi hai tệp khác nhau.

Mọi thay đổi phải qua 5 góc nhìn dưới đây. Một tính năng chỉ xong khi đạt mục "Xong là xong" ở cuối tệp.

## 1. Quản lý sản phẩm (PM)

- Mỗi tính năng trả lời được: ai dùng, dùng lúc nào, đo thành công bằng sự kiện `track()` nào.
- Mỗi tính năng có giá: bao nhiêu MB bản cài, bao nhiêu ms mở màn, thêm thư viện nào. Ghi giá đó trong mô tả commit.
  Tính năng làm bản cài vượt ngân sách thì cắt bớt hoặc tải sau, không mặc nhiên nhận.
- Không bán tính năng chưa có. Phần trả phí nằm sau cờ trong `src/config.ts` (ví dụ `TAM_AN_READY`), tắt cho tới khi đủ.
- Không dùng nội dung có bản quyền khi chưa có giấy phép (bản ghi tụng kinh, nhạc, ảnh). Dùng nguồn phạm vi công cộng, tự tạo, hoặc dẫn link tới kênh chính thức.
- Chữ hiển thị là tiếng Việt thường ngày, không từ kỹ thuật (có ca kiểm thử quét chữ).

## 2. Lập trình viên chính (senior dev)

- Nhập theo đường dẫn con, không nhập gốc gói lớn:
  `@expo/vector-icons/Feather`, `@expo-google-fonts/be-vietnam-pro/400Regular`. Nhập gốc từng kéo 25 tệp phông (≈8 MB) vào bản cài.
- Thêm thư viện mới: nêu dung lượng thêm vào bản cài và lý do không tự viết được. Thư viện chỉ dùng khi phát triển
  (`expo-dev-client`) không nằm trong `dependencies` của app phát hành: nó kéo theo máy quét QR ≈5 MB mỗi kiểu chip.
- Danh sách hơn 30 dòng dùng `FlashList` (`@shopify/flash-list`), dòng bọc `memo`, `keyExtractor` ổn định.
- Bộ chọn zustand không trả mảng/đối tượng mới mỗi lần (`?? []` trong selector gây lỗi React #185). Dùng hằng ngoài component.
- Không tính nặng trong render. Dữ liệu tính được lúc build thì sinh sẵn thành tệp (bảng âm lịch là ví dụ).
- Hoạt ảnh và cuộn tự động chạy trên luồng giao diện (Reanimated worklet), không `setInterval` cập nhật state mỗi khung hình.
- Hẹn giờ, âm thanh, giọng đọc, giữ màn sáng: luôn dọn trong hàm trả về của `useEffect`. API máy (âm thanh, wake lock, chia sẻ) bọc `try/catch`, lỗi không làm hỏng màn.
- Điều hướng quay lại dùng `goBack()` của app (có màn dự phòng), không gọi `router.back()` trực tiếp: màn mở từ thông báo không có màn trước.
- Logic mới có kiểm thử đơn vị trước. Mỗi lỗi sửa xong có một ca kiểm thử giữ nó không quay lại.
- Lệnh: `npm test`, `npm run typecheck:stubs`, `npm run lint`. Không chạy được `expo` trên máy này: build và chạy máy ảo nằm ở GitHub Actions.

## 3. Kiến trúc sư (architect)

- Ranh giới: `packages/core` (logic không giao diện: lưu trữ, mua hàng, sự kiện), `packages/ui` (thành phần dùng chung, token),
  `apps/<app>/src/data` (nội dung dạng dữ liệu), `apps/<app>/app` (màn hình, mỏng). Màn hình không chứa nội dung cứng dài.
- Nội dung mở rộng bằng dữ liệu, không bằng mã: thêm lễ, bài kinh, điềm báo là thêm bản ghi vào tệp dữ liệu, có kiểm thử quét toàn bộ.
- Lưu cục bộ trước (SQLite kv qua `@nam/core`), chạy không cần mạng. Trạng thái lưu giữ nhỏ (< 1 MB với dữ liệu lớn); dữ liệu suy ra được thì không lưu.
- Đồng bộ nhiều máy (sổ giỗ chung) sau này đi qua một giao diện trong `@nam/core`, không gọi máy chủ từ màn hình.
- Mỗi app chỉ liên kết thư viện máy nó khai trong `dependencies` (autolinking SDK 54 theo phụ thuộc). Khai thừa là bản cài nặng thêm.
- Bản phát hành Android bật R8 thu gọn mã và tài nguyên (`expo-build-properties`), tách APK theo kiểu chip; lên Google Play thì dùng AAB.
- Thiết kế cho dữ liệu lớn ngay từ đầu: thử với 1.000 bản ghi, 60 người, 200 năm lịch.

## 4. Thiết kế giao diện, trải nghiệm (UI/UX)

- Người dùng gồm người lớn tuổi: chữ tối thiểu 15, vùng chạm ≥ 44 pt, tương phản đạt WCAG AA, không chỉ dựa vào màu.
- Cỡ chữ hệ thống tới 200% không cắt chữ, không chồng lấn. Thanh điều khiển cố định giới hạn phóng (`maxFontSizeMultiplier` 1,3) để chừa chỗ cho nội dung.
- Điện thoại, máy gập (mở, đóng, ngang) và máy tính bảng: dùng `useLayout` (gọn < 600, vừa 600–839, rộng ≥ 840), hai cột khi rộng.
- Mọi màn có đường ra: nút Quay lại hoặc Đóng. Android: ở màn đầu bấm Quay lại hai lần mới thoát. iOS không có nút thoát (Apple không cho app tự đóng).
- Nền tối đủ mọi màn. Màn đọc lâu (khấn, tụng) giữ màn sáng và có chế độ tối riêng.
- Phản hồi trong 100 ms khi chạm; việc lâu hơn 1 giây có trạng thái chờ; lỗi nói điều người dùng làm được tiếp.

## 5. Kiểm thử, chất lượng (QC)

- Tầng kiểm thử: UT (logic, dữ liệu), IT (lint, kiểu, bundle iOS/Android), ST (web 20 cỡ màn, crawler bấm mọi nút,
  Android emulator điện thoại/gập/tablet, iOS Simulator iPhone/iPad), UAT (hành trình người dùng), dữ liệu lớn.
- Mỗi màn mới thêm vào `qa/<app>-routes.json`; mỗi hành trình mới thêm một kịch bản UAT.
- CI chặn khi vượt ngân sách dung lượng (`.github/scripts/tt-apk-size.mjs`). Ngân sách nằm trong `apps/<app>/CLAUDE.md`.
- Crawler báo "không phản hồi": xem từng nút. Nút Quay lại không phản hồi là lỗi, không phải nhiễu.
- Không tự động được thì ghi vào danh sách thử tay của app (âm thanh ra loa, giọng đọc, thông báo, TalkBack/VoiceOver, mua hàng).

## Xong là xong

1. Kiểm thử đơn vị và kiểu đạt; có ca cho logic mới và cho lỗi vừa sửa.
2. QA trên CI xanh: web, crawler, UAT, Android, iOS; không sập, không lỗi JS.
3. Bản cài trong ngân sách; mở màn với dữ liệu lớn dưới 1 giây; không tác vụ dài quá 100 ms khi thao tác.
4. Chạy được ở chữ 200%, nền tối, máy gập, tablet; mọi màn có đường ra.
5. Báo cáo kiểm thử cập nhật; hạng mục chưa xong ghi rõ trong `apps/<app>/CLAUDE.md`.
