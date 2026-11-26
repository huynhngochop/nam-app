# Band7 · Luyện nói IELTS 1:1 với AI

App giúp người Việt luyện nói IELTS mỗi ngày với giám khảo AI. Lộ trình và giáo án tự tính theo trình độ hiện tại, ngày thi và band muốn đạt.

**Điểm mạnh cốt lõi: "Lỗi nào sửa dứt lỗi đó".**

1. AI bắt lỗi trong câu người học vừa nói.
2. Người học sửa ngay bằng cách nói lại câu đúng 2 lần.
3. Sau 1, 3 và 7 ngày, giám khảo lén gài lại đúng cấu trúc đó vào câu hỏi.
4. Người học tự dùng đúng 3 lần liên tiếp thì lỗi được đóng. Ở mốc 14 ngày, giám khảo kiểm tra lại một lần nữa.

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `app/` | Các màn hình (expo-router) |
| `src/plan.ts` | Bộ máy lộ trình: giờ cần, độ khả thi, 4 giai đoạn, band theo tuần, giáo án mỗi ngày, tự điều chỉnh |
| `src/topics.ts` | Đề có sẵn trong máy (Part 1, 2, 3), dùng được khi không có mạng |
| `src/drills.ts` | Bài ngắn chạy ngoại tuyến: khởi động phát âm, ngữ pháp/từ vựng mini, nói nhại |
| `src/api.ts` | Kết nối Supabase bằng `fetch` thuần, không dùng `@supabase/supabase-js` (tiết kiệm khoảng 100 KB) |
| `src/recorder.ts` | Ghi âm m4a mono 16 kHz 32 kbps (≈ 4 KB/giây) cho Whisper |
| `server/` | Máy chủ Supabase: schema, kho lỗi người Việt, Edge Function `/talk`, `/repair`, `/grade`. Xem `server/README.md` |

Danh sách màn hình:

- Mở đầu: Chào mừng → Trình độ hiện tại → Mục tiêu.
- 5 tab: Hôm nay, Lộ trình, Luyện nói, Sổ tay, Tiến độ.
- Các màn khác: Buổi nói, Part 2, Chấm band, Sửa ngay, Hồ sơ lỗi, Bài ngắn, Cài đặt, Pro.

## Chạy

```bash
cp .env.example .env      # điền URL và anon key của project Supabase (bỏ trống = chế độ ngoại tuyến)
npx expo run:android
```

Nếu không có máy chủ, app vẫn chạy được: lộ trình, giáo án, đề, bài ngắn, ghi âm và nghe lại giọng mình. Phần nói với giám khảo AI (chấm điểm, bắt lỗi, gài lại) cần máy chủ và đăng nhập.

## Chưa làm

- **Giọng đọc của giám khảo.** Hiện giám khảo hỏi bằng chữ. Để đọc thành tiếng bằng giọng có sẵn trong máy, chạy `npx expo install expo-speech` rồi gọi `setVoice()` (xem `src/voice.ts`).
- **Đăng nhập Google.** Hiện có đăng nhập bằng email (mã 6 số) và dùng thử không cần tài khoản.
- **Bật Pro trên máy chủ sau khi mua.** Cần thêm webhook từ cửa hàng để đổi cột `profiles.plan`.
