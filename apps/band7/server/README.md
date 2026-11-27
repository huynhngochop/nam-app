# Band7 · Máy chủ Supabase (bản free)

Nằm trong `apps/band7/server`. Mọi lệnh bên dưới chạy trong thư mục này (`cd apps/band7/server`).

Backend cho app luyện nói IELTS 1:1 với AI. Điểm mạnh cốt lõi là **"Lỗi nào sửa dứt lỗi đó"**: AI bắt lỗi, người học sửa ngay, rồi giám khảo gài lại lỗi đó trong hội thoại sau 1, 3, 7 và 14 ngày cho đến khi người học hết mắc.

## Có gì trong này

| Phần | File | Việc nó làm |
|---|---|---|
| Schema | `supabase/migrations/…_core.sql` | Hồ sơ, lộ trình, buổi nói, quota, sổ lỗi, RLS và state machine của vòng sửa lỗi |
| Kho lỗi người Việt | `…_seed_error_codes.sql` | 21 mã lỗi (VN-01…VN-33), mỗi mã có giải thích so với tiếng Việt và gợi ý câu hỏi để gài lại |
| `/talk` | `functions/talk` | Mỗi lượt nói: Whisper nghe → giám khảo trả lời → lưu lỗi → chấm lần gài trước → chọn lỗi để gài tiếp |
| `/repair` | `functions/repair` | Bước "Sửa ngay": so câu người học nói lại với câu đúng. **Không gọi LLM** |
| `/grade` | `functions/grade` | Cuối buổi chấm 4 tiêu chí bằng model mạnh hơn (1 lần/buổi, chấm rồi thì không chấm lại) |
| Test | `test/` | Test SQL cho vòng sửa lỗi + RLS, test Node cho phần so khớp và parser |

## Vòng đời một lỗi

```
bắt lỗi ──► repairing ──(nói lại đúng 2 lần)──► recalling ──(đúng 3 lần liên tiếp khi bị gài)──► closed
   ▲            ▲                                  │  gài lại sau 1 → 3 → 7 ngày                    │
   │            └──────── mắc lại lỗi này ─────────┴────────────────────────────────────────────────┘
   │                                               sai khi bị gài → quay về mốc 1 ngày
   └ đóng rồi vẫn kiểm tra giữ lâu ở mốc 14 ngày
```

- `catch_error()`: thêm lỗi mới. Nếu đã có lỗi trùng (cùng mã, hoặc cùng câu đúng khi không có mã) thì cộng số lần lặp và đưa về bước Sửa ngay.
- `apply_error_event()`: nhận một trong `repair_ok`, `repair_fail`, `recall_ok`, `recall_fail` và chuyển trạng thái lỗi.
- `due_recalls()`: lấy các lỗi đến hạn gài lại.
- `consume_turn()`: trừ lượt nói theo ngày (giờ VN), có cộng lượt thưởng từ quảng cáo.

Các hàm ghi chỉ cho `service_role` (tức Edge Function) gọi. App chỉ được **đọc** dữ liệu của chính mình qua RLS. Người dùng không tự nâng gói `pro` được vì có trigger chặn.

## Cách gài lại lỗi

Mỗi lượt, `/talk` gửi cho giám khảo tối đa 3 lỗi đến hạn, kèm `elicit_hint`, ví dụ VN-07: *"Ask how something has changed in recent years"*. Giám khảo đặt câu hỏi sao cho câu trả lời tự nhiên phải dùng cấu trúc đó, và không được nhắc trước. Ở lượt kế tiếp, giám khảo đánh giá `correct | wrong | not_attempted`, rồi server gọi `apply_error_event`. Mỗi lỗi chỉ bị gài 1 lần trong một buổi.

## Kết nối Supabase với GitHub (tự deploy)

1. Trong Supabase, mở Project Settings › Integrations › GitHub, chọn repo `nam-app`. Đặt **Working directory** là `apps/band7/server`, nhánh production là `main`. Mỗi lần merge vào `main`, Supabase sẽ tự chạy migration và deploy 3 function khai báo trong `supabase/config.toml`.
2. Mở Edge Functions › Secrets, thêm `GROQ_API_KEY` và `GEMINI_API_KEY`.
3. Mở Authentication › Sign In / Providers, bật **Allow anonymous sign-ins** (dùng cho nút "Dùng thử không cần tài khoản").
4. Trong GitHub, mở Settings › Secrets and variables › Actions › **Variables**, thêm:
   - `BAND7_SUPABASE_URL`, ví dụ `https://xxxx.supabase.co`
   - `BAND7_SUPABASE_ANON_KEY`, là khoá anon/publishable (công khai, được phép nằm trong app)

   CI sẽ build APK có kết nối máy chủ, và workflow `band7-server.yml` sẽ thử project đang chạy.

## Cài đặt thủ công bằng CLI

```bash
supabase init                       # nếu chưa có supabase/config.toml
supabase link --project-ref <ref>
supabase db push                    # chạy 2 migration
supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...
supabase functions deploy talk repair grade
```

Biến tuỳ chọn (có giá trị mặc định):

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `STT_MODELS` | `whisper-large-v3-turbo,whisper-large-v3` | Groq, model bị gỡ thì thử model sau |
| `CHAT_CHAIN` | `groq:openai/gpt-oss-20b,gemini:gemini-3.5-flash-lite,gemini:gemini-3.5-flash,groq:openai/gpt-oss-120b` | Hội thoại từng lượt, thử lần lượt |
| `GRADE_CHAIN` | `gemini:gemini-3.5-flash,groq:openai/gpt-oss-120b,gemini:gemini-3.5-flash-lite` | Chấm cuối buổi |
| `FREE_DAILY_TURNS` | `30` | |
| `PRO_DAILY_TURNS` | `400` | Chặn lạm dụng |

Tên model thay đổi theo thời gian (ví dụ Groq đã gỡ llama-3.3-70b-versatile, Google không cho tài khoản mới dùng gemini-2.5-flash). Khi một model bị gỡ, function tự thử model kế tiếp và ghi `ai_try_failed` vào Logs; đổi danh sách bằng Edge Functions › Secrets, không cần sửa code.

## API cho app (Expo)

Mọi request gửi kèm `Authorization: Bearer <access_token của Supabase Auth>`.

**Bắt đầu buổi:** `POST /talk`, form `kind=part1|part2|part3|mock|free`, `mode=practice|exam`, `topic_id?` → `{session_id, reply, topic}`. Bước này không gọi AI.

**Mỗi lượt:** `POST /talk`, form `session_id` + `audio` (m4a mono 16 kHz, ≤ 2 MB) → kết quả:
```json
{ "transcript": "...", "reply": "câu hỏi tiếp", "corrections": [{ "id": "...", "wrong": "...", "right": "...", "band7": "...", "explain_vi": "..." }],
  "hint_vi": "...", "recall": { "error_id": "...", "result": "correct", "streak": 2, "status": "recalling" }, "turns_left": 24 }
```
App đọc `reply` bằng `expo-speech`. Khi `recall.result = "correct"` thì hiện "Bạn tự dùng đúng · 2/3". Chế độ `exam` ẩn `corrections` cho tới cuối buổi.

**Sửa ngay:** `POST /repair`, form `error_id`, `audio`, `target=band7?` → `{ok, similarity, missed, key_phrase, status, message_vi}`. Qua bước khi khớp ≥ 0.8 **và** nói đúng cụm then chốt (ví dụ "has changed").

**Cuối buổi:** `POST /grade`, JSON `{session_id}` → `{fc, lr, gra, p, overall, strengths_vi, priorities_vi}`.

Mã lỗi trả về: `429 quota` (hết lượt hôm nay), `503 busy` (nhà cung cấp AI bị giới hạn, app nên thử lại sau 3–5 giây), `422 empty` (không nghe được gì).

## Giới hạn của bản free

- Model hội thoại 8B trên Groq free có giới hạn token theo phút khá thấp. Mỗi lượt tốn khoảng 1.000 token, nên chỉ chịu được vài lượt mỗi phút cho **toàn bộ** người dùng. Khi Groq báo 429, request tự chuyển sang Gemini. Khi có khoảng vài chục người dùng thật, nên bật Groq Developer tier (trả theo mức dùng).
- Dữ liệu gửi tới Gemini bản free có thể được Google dùng để cải thiện sản phẩm. Cần ghi rõ điều này trong Chính sách quyền riêng tư.
- Điểm phát âm chỉ là ước lượng (dựa trên những từ Whisper nghe sai).

## Chạy test

```bash
bash test/run.sh     # cần Postgres local, xem biến PGHOST/PGPORT trong file
node --experimental-strip-types --test test/shared.test.ts
```
