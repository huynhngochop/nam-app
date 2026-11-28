# Thành Tâm: ngân sách, hiện trạng, việc còn dở

Hướng dẫn cúng lễ: văn khấn, lễ vật, lịch âm, sổ giỗ, tụng kinh, Tuổi & năm, nhân tướng. Gói Tâm An 199.000đ/năm (chưa mở bán).
Quy tắc chung ở `/CLAUDE.md`. Tệp này giữ con số cụ thể của app; cập nhật sau mỗi vòng QA.

## Ngân sách hiệu năng

| Chỉ số | Ngân sách | Đo gần nhất | Đo ở đâu |
| --- | --- | --- | --- |
| APK arm64 | ≤ 45 MB (nâng từ 40 cho giọng AI đóng sẵn ≤ 11 MB) | 33,5 MB (có AdMob, +3,9 MB; trước đó 29,6 MB; vòng 9 là 97 MB gộp 3 chip) | job `apk`, `tt-apk-size.mjs` (chặn CI) |
| APK arm32 | ≤ 40 MB | 27,3 MB (có AdMob) | job `apk` |
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

## Quảng cáo

- Google AdMob qua `@nam/ads` (`react-native-google-mobile-ads`): thẻ "Tài trợ" ở Bài cúng (sau nhóm "Hay cúng nhất" và nhóm thứ hai) và Tra cứu; dải dưới cùng ở Bài cúng, Lịch, Tra cứu, Tụng kinh.
  Không có ở Hôm nay, chi tiết lễ, màn khấn, màn tụng, hướng dẫn. Nội dung quảng cáo giới hạn mức G. Có gói Tâm An thì ẩn hết.
- Mã thật: biến Actions `ADMOB_THANH_TAM_ANDROID_APP_ID`, `ADMOB_THANH_TAM_ANDROID_BANNER`, `ADMOB_THANH_TAM_ANDROID_NATIVE`; chưa đặt thì là quảng cáo thử.
- iPhone không xin quyền theo dõi, chỉ quảng cáo không cá nhân hóa. Chính sách riêng tư và mô tả cửa hàng đã ghi có quảng cáo.
- Emulator (run 44469131227): dải quảng cáo thử hiện ở Bài cúng, Tra cứu, Lịch; thẻ "Tài trợ" nằm dưới màn đầu nên chưa thấy trong ảnh, cần thử tay. 0 lỗi JS, 0 sập.

## Thư viện thêm ở vòng 11 (giá dung lượng)

- `react-native-webview` (trình phát YouTube nhúng), `expo-sharing` (gửi tệp): mã Java, không thêm thư viện máy.
- Giọng đọc mẫu cũ (Piper) không nằm trong bản cài, tải theo bài khi người dùng chọn.

## Giọng đọc AI (vòng 19)

- Máy chủ: Supabase nam-core, hàm `voice-tts` (mã ở `server/supabase/functions/voice-tts`, SQL ở `server/supabase/migrations`).
  Gemini TTS gói miễn phí, giọng Charon; văn khấn đọc trầm, chậm như chủ lễ, kinh đọc đều như tụng theo mõ.
  pg_cron gọi 5 phút/lần, mỗi lần một đoạn ≤ 700 ký tự; hết lượt thì dừng tới khi Google cấp lượt mới (≈ 15:05 giờ VN).
  Đổi mô hình, giọng: sửa `voice.state` khóa `config` (không cần triển khai lại). Xem tiến độ: `<kho>/voice/thanh-tam/jobs.json`.
- Danh sách đoạn: `scripts/voice_ai.py jobs`, workflow `thanh-tam-voice` đăng `ai-jobs.json` ở Releases; máy chủ nạp lại mỗi 6 giờ.
- Đóng gói: job `apk` và emulator chạy `.github/scripts/tt-voice-bundle.sh` trước prebuild. Căn mốc câu theo chỗ ngừng,
  chèn 2,4 giây ở chỗ tự đọc tên, AAC 24 kbps. Văn khấn rồi kinh ngắn vào app tới 11 MB (`src/data/voiceBundle.ts` sinh lúc build,
  bản trong git để trống); bài còn lại đăng Releases để tải. Bài chưa đọc xong vẫn dùng giọng Piper tải về.
- Mẫu đầu (Gia tiên, phần 1): 410 ký tự → 96 giây âm, đọc mất 22 giây với gemini-3.8-flash-tts.

## Gửi câu hỏi + hỏi đáp mới (vòng 20, nam-cloud)

- Hỏi Thành Tâm: câu "chưa có" → nút "Gửi câu hỏi này cho Thành Tâm" (chỉ đúng câu chữ, không kèm sổ giỗ). Màn "Câu hỏi đã gửi" ở Tôi.
  Sự kiện: `question_sent`. Mã: `src/lib/cloud.ts` (nạp, tải gói), `src/lib/cloudFaq.ts` (đổi sang FAQ, có kiểm thử), `@nam/core/cloud`.
- Máy chủ (repo nam-cloud): gom câu giống nhau mỗi 6 giờ, AI soạn theo prompt `thanhtam_answer` (không văn khấn/kinh, không phán vận hạn),
  **chờ duyệt tay**: Supabase → Table Editor → schema `content` → `items`, lọc `status = draft`, đổi `approved` hoặc `rejected`.
  Xuất bản 4 giờ sáng; app tải gói ≤ 2 lần/ngày; bản cài đóng sẵn qua `.github/scripts/pull-cloud-content.mjs` → `src/data/cloud.json`.
- Giá: không thêm thư viện; ≈ 8 KB mã; `cloud.json` lớn dần theo số câu trả lời (vài KB mỗi chục câu).

## Đã tối ưu (vòng 10)

- Bỏ `expo-dev-client` khỏi app: nó kéo máy quét QR ML Kit (`libbarhopper` ≈5 MB mỗi chip) vào bản phát hành.
- Biểu tượng Feather và 4 độ đậm phông nhập theo đường dẫn con: bỏ ≈ 8 MB phông thừa.
- R8 thu gọn mã và tài nguyên; APK tách theo chip, bỏ x86_64 khỏi bản cho người dùng.

## Việc còn dở

| Hạng mục | Trạng thái | Cần gì |
| --- | --- | --- |
| Mua gói Tâm An | Ẩn (`TAM_AN_READY=false`), chưa nối cửa hàng | Tài khoản Google Play, App Store; nối `provider` trong `@nam/core/purchases` |
| Giọng đọc mẫu | Giọng AI (vòng 19) đang đọc dần trên máy chủ, bản cài tự kèm bài đã xong; bài chưa xong dùng Piper tải về | Thử tay nghe thật, nhất là chỗ ngắt câu và tô sáng; giọng người thật khi có bản thu được phép |
| Sổ giỗ chung cả nhà | Có (vòng 11) dạng gửi tệp, nhập gộp, hỏi khi trùng; không tự đồng bộ | Máy chủ đồng bộ (Supabase/Firebase) nếu cần tự đồng bộ |
| Hỏi Thành Tâm | Có trên máy (vòng 11) + gửi câu chưa có lên máy chủ, câu trả lời đã duyệt về app (vòng 20) | Chủ app duyệt câu trả lời AI mỗi tuần; cập nhật Data safety trên Google Play (câu hỏi người dùng gửi) |
| Đo sự kiện (`track`) | Chưa có nơi nhận ở bản phát hành | Chọn dịch vụ đo, nối `sink` |
| Bản iPhone | Để sau (người dùng chọn). Đã khai tệp quyền riêng tư iOS (`ios.privacyManifests`) và không dùng mã hóa riêng | Tài khoản Apple Developer, khóa API App Store Connect |
| Lên Google Play | Đã có: trang cửa hàng (`store/android/vi-VN`: tên, mô tả, ảnh, biểu tượng, ảnh bìa), chính sách riêng tư, job AAB ký khóa tải lên và đẩy lên Play; quyền máy thừa đã chặn (CI kiểm). APK ở Releases vẫn ký khóa thử | Chủ app: tài khoản Play Console, tạo app, thêm secret khóa ký và tài khoản dịch vụ, điền Data safety, xếp hạng nội dung, thử kín 12 người 14 ngày nếu là tài khoản cá nhân mới |
| Thử tay trên máy thật | Chưa | Tiếng mõ, chuông, giọng mẫu (cả 14 bài khấn mới), giọng máy; hình hướng dẫn ở chữ 200 %; thông báo gửi thử; video YouTube trong app (ảnh emulator vòng 16 chỉ thấy khung đen lúc mới mở, chưa xác nhận phát); gửi, nhận sổ giỗ qua Gmail, Zalo; gửi câu hỏi khi có / mất mạng rồi có lại (câu chờ tự gửi); TalkBack, VoiceOver |
| Công tắc cao 20 px | Đã nới vùng chạm `Toggle` lên 44×52 (vòng 10), chờ QA xác nhận | |
