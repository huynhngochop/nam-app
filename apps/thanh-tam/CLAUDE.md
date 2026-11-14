# Thành Tâm: ngân sách, hiện trạng, việc còn dở

Hướng dẫn cúng lễ: văn khấn, lễ vật, lịch âm, sổ giỗ, tụng kinh, Tuổi & năm, nhân tướng. Gói Tâm An 199.000đ/năm (chưa mở bán).
Quy tắc chung ở `/CLAUDE.md`. Tệp này giữ con số cụ thể của app; cập nhật sau mỗi vòng QA.

## Ngân sách hiệu năng

| Chỉ số | Ngân sách | Đo gần nhất | Đo ở đâu |
| --- | --- | --- | --- |
| APK arm64 | ≤ 40 MB (mục tiêu 30) | 29,6 MB (vòng 17, thêm 15 lễ và 10 hình vẫn không tăng; vòng 9 là 97 MB gộp 3 chip) | job `apk`, `tt-apk-size.mjs` (chặn CI) |
| APK arm32 | ≤ 35 MB | 23,7 MB (vòng 17) | job `apk` |
| Mã JS (Hermes) | ≤ 4 MB | 3,1 MB (vòng 10) | bảng dung lượng trong job `apk` |
| Khởi động lạnh | ≤ 1,5 s trên emulator | 0,62–0,82 s khi đã có dữ liệu (vòng 16) | `qa/native/android.sh` mục 6 |
| Bộ nhớ khi chạy | ≤ 200 MB PSS | 104 MB ngay sau khởi động (vòng 16); 380 MB sau khi mở mọi màn kể cả video (WebView nạp Chromium) | `android.sh` mục 5–6 |
| Mở màn chính, dữ liệu lớn | ≤ 1 s | ≈ 800 ms (web) | UAT U11 |
| Tác vụ dài khi bấm | ≤ 100 ms | lớn nhất 151 ms ở /age | crawler `web-crawl/summary.md` |
| Dữ liệu lưu | ≤ 1 MB | 210 KB với 1.000 ngày giỗ, 60 người | seed QA |
| Lịch âm 200 năm | ≤ 100 ms | 51 ms (Node) | `tests/thanh-tam-edge.test.ts` |

Khung hình giật trên emulator dùng đồ họa phần mềm nên chưa kết luận được; đo lại trên máy thật.

## Cấu trúc

- `app/`: màn hình (expo-router). `src/data/`: nội dung (lễ, văn khấn, kinh, điềm báo, nguồn). `src/lib/`: logic thuần, có kiểm thử.
- `src/calendar/lunarData.ts`: bảng âm lịch 1900–2100 sinh sẵn (`npm run gen:lunar`), không tính lúc chạy.
- `src/data/kinhText.ts`: sinh từ `scripts/gen_kinh_ts.py` (nguồn Unlicense). Đừng sửa tay.
- `assets/sounds/`: mõ, chuông tự tổng hợp (`scripts/gen_sounds.py`). Không đưa bản ghi tụng kinh của người khác vào app.
- `src/nav.ts`: `goBack()`; mọi nút quay lại dùng hàm này.
- `src/data/guides.ts` + `src/figures.tsx`: hướng dẫn có hình (bày bàn thờ, mâm cỗ theo miền, vái lạy, trà rượu, thắp hương).
  Hình vẽ bằng `react-native-svg` (không ảnh, vài KB), chỉ có số trên hình; chú thích là chữ bên ngoài để phóng 200 % và đọc được bằng TalkBack.
  Thêm hình: thêm `FigureId`, nhánh vẽ, ô `VB`, và số chú thích trong `tests/thanh-tam-guides.test.ts`.

## Nội dung (vòng 17)

- 29 lễ (đủ 7 nhóm, kể cả Lễ chùa), 24 văn khấn, 13 bài kinh. Lễ mới: tất niên, mùng 1 Tết, hóa vàng, Hàn thực, Phật Đản, Đoan Ngọ,
  cúng chúng sinh, Trung thu, bao sái, tạ đất, động thổ, 49/100 ngày, thôi nôi, xe mới, đi lễ chùa.
- Mỗi lễ có bước ghi rõ số lạy, vái; giỗ và tất niên có ba tuần rượu; mỗi bước có nút "Xem hình" tới hướng dẫn.
- Văn khấn mới tự có giọng mẫu: workflow `thanh-tam-voice` chạy lại khi `prayers.ts` đổi; vòng 17 đã tạo đủ 37 bài.
- QA vòng 17: UAT 19/19, 920 lượt chụp 0 vấn đề, crawler 37 màn 0 lỗi JS, Android và iOS đạt.

## Nút Quay lại (vòng 18)

- Xử lý chung ở `src/backPress.ts`: chạm 1 lần về màn trước (tab về tab vừa xem); màn mở từ thông báo về Hôm nay; ở màn chính chạm 2 lần trong 2 giây mới thoát, lần đầu nhắc.
- Cần `predictiveBackGestureEnabled: false` (bật thì mọi lần chạm đều thoát). Emulator thử 10 bước, đạt 10/10 (run 43541205490). Chạy riêng: Actions → Thành Tâm QA → only=back.

## Thư viện thêm ở vòng 11 (giá dung lượng)

- `react-native-webview` (trình phát YouTube nhúng), `expo-sharing` (gửi tệp): mã Java, không thêm thư viện máy.
- Giọng đọc mẫu không nằm trong bản cài (≈ 7–10 MB cho cả 23 bài), tải theo bài khi người dùng chọn.

## Đã tối ưu (vòng 10)

- Bỏ `expo-dev-client` khỏi app: nó kéo máy quét QR ML Kit (`libbarhopper` ≈5 MB mỗi chip) vào bản phát hành.
- Biểu tượng Feather và 4 độ đậm phông nhập theo đường dẫn con: bỏ ≈ 8 MB phông thừa.
- R8 thu gọn mã và tài nguyên; APK tách theo chip, bỏ x86_64 khỏi bản cho người dùng.

## Việc còn dở

| Hạng mục | Trạng thái | Cần gì |
| --- | --- | --- |
| Mua gói Tâm An | Ẩn (`TAM_AN_READY=false`), chưa nối cửa hàng | Tài khoản Google Play, App Store; nối `provider` trong `@nam/core/purchases` |
| Giọng đọc mẫu | Có (vòng 11): tạo trên CI bằng Piper, tải theo bài từ Releases `thanh-tam-voice` | Thử tay nghe thật; giọng người thật khi có bản thu được phép |
| Sổ giỗ chung cả nhà | Có (vòng 11) dạng gửi tệp, nhập gộp, hỏi khi trùng; không tự đồng bộ | Máy chủ đồng bộ (Supabase/Firebase) nếu cần tự đồng bộ |
| Hỏi Thành Tâm | Có (vòng 11) trên máy: câu hỏi thường gặp, lịch, sổ giỗ | AI qua máy chủ nếu cần trả lời tự do |
| Đo sự kiện (`track`) | Chưa có nơi nhận ở bản phát hành | Chọn dịch vụ đo, nối `sink` |
| Bản iPhone | Để sau (người dùng chọn) | Tài khoản Apple Developer, khóa API App Store Connect |
| Lên Google Play | APK ký bằng khóa thử (debug) | Khóa ký thật, AAB, trang cửa hàng |
| Thử tay trên máy thật | Chưa | Tiếng mõ, chuông, giọng mẫu (cả 14 bài khấn mới), giọng máy; hình hướng dẫn ở chữ 200 %; thông báo gửi thử; video YouTube trong app (ảnh emulator vòng 16 chỉ thấy khung đen lúc mới mở, chưa xác nhận phát); gửi, nhận sổ giỗ qua Gmail, Zalo; TalkBack, VoiceOver |
| Công tắc cao 20 px | Đã nới vùng chạm `Toggle` lên 44×52 (vòng 10), chờ QA xác nhận | |
