# Thành Tâm: ngân sách, hiện trạng, việc còn dở

Hướng dẫn cúng lễ: văn khấn, lễ vật, lịch âm, sổ giỗ, tụng kinh, Tuổi & năm, nhân tướng. Gói Tâm An 199.000đ/năm (chưa mở bán).
Quy tắc chung ở `/CLAUDE.md`. Tệp này giữ con số cụ thể của app; cập nhật sau mỗi vòng QA.

## Ngân sách hiệu năng

| Chỉ số | Ngân sách | Đo gần nhất | Đo ở đâu |
| --- | --- | --- | --- |
| APK arm64 | ≤ 40 MB (mục tiêu 30) | 97 MB gộp 3 chip, vòng 9 (trước khi tối ưu) | job `apk`, `tt-apk-size.mjs` (chặn CI) |
| APK arm32 | ≤ 35 MB | chưa đo | job `apk` |
| Mã JS (Hermes) | ≤ 4 MB | 3,5 MB | bảng dung lượng trong job `apk` |
| Khởi động lạnh | ≤ 1,5 s trên emulator | chưa đo đủ | `qa/native/android.sh` mục 6 |
| Bộ nhớ khi chạy | ≤ 200 MB PSS | 245 MB (emulator, 1.000 ngày giỗ) | `android.sh` mục 5, `meminfo.txt` |
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

## Đã tối ưu (vòng 10)

- Bỏ `expo-dev-client` khỏi app: nó kéo máy quét QR ML Kit (`libbarhopper` ≈5 MB mỗi chip) vào bản phát hành.
- Biểu tượng Feather và 4 độ đậm phông nhập theo đường dẫn con: bỏ ≈ 8 MB phông thừa.
- R8 thu gọn mã và tài nguyên; APK tách theo chip, bỏ x86_64 khỏi bản cho người dùng.

## Việc còn dở

| Hạng mục | Trạng thái | Cần gì |
| --- | --- | --- |
| Mua gói Tâm An | Ẩn (`TAM_AN_READY=false`), chưa nối cửa hàng | Tài khoản Google Play, App Store; nối `provider` trong `@nam/core/purchases` |
| Quyền lợi Tâm An: giọng đọc mẫu, sổ giỗ chung cả nhà, hỏi Thành Tâm | Chưa làm | Bản ghi có giấy phép; máy chủ đồng bộ; quyết định có dùng AI |
| Đo sự kiện (`track`) | Chưa có nơi nhận ở bản phát hành | Chọn dịch vụ đo, nối `sink` |
| Bản iPhone | Chưa phát hành | Tài khoản Apple Developer |
| Lên Google Play | APK ký bằng khóa thử (debug) | Khóa ký thật, AAB, trang cửa hàng |
| Thử tay trên máy thật | Chưa | Tiếng mõ, chuông, giọng máy; thông báo nhắc lễ; thêm bản ghi; TalkBack, VoiceOver |
| Công tắc cao 20 px | Đã nới vùng chạm `Toggle` lên 44×52 (vòng 10), chờ QA xác nhận | |
