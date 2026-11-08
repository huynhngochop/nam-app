# Quy tắc app gọn nhẹ và nhanh

Áp dụng cho **mọi app** trong repo, kể cả app thêm sau này. Mục tiêu: APK nhỏ, mở nhanh, cuộn mượt, tốn ít pin và bộ nhớ.

## Phần máy tự kiểm (CI đỏ nếu sai)

| Kiểm tra | Ở đâu |
| --- | --- |
| APK release arm64 không vượt ngân sách | `.github/apk-budget.json`, bước "Ngân sách dung lượng" trong `android-native.yml` (chạy với mọi PR đụng `apps/**`, `packages/**`) |
| Không import gói gốc kéo cả bộ tài nguyên (`@expo/vector-icons`, `@expo-google-fonts/<họ>`, `lodash`, `moment`) | `no-restricted-imports` trong `eslint.config.js` |
| Mọi màn hình mở được, không văng | `smoke-apk.sh` trên máy ảo |
| Nội dung có sẵn hợp lệ (ví dụ kho mẹo Mẹo Nhà) | `validateTips` + test |

Số đo APK release arm64, 11/2026:

| App | Trước | Sau |
| --- | --- | --- |
| Ví Gọn | 35,3 MB | 24,1 MB |
| Hẹn Đẹp | 35,8 MB | 24,8 MB |
| Nhịp | 39,2 MB | 25,7 MB |
| Mẹo Nhà | 35,0 MB | 24,2 MB |

Trước đây APK cài thử gộp hai loại chip nên nặng 52–56 MB.

Khoảng 15 MB là lõi React Native, Hermes và Expo, phần này không giảm được nếu vẫn dùng React Native. Phần còn lại là mã và tài nguyên của app: tối ưu ở đó.

Muốn nâng ngân sách: ghi lý do trong PR (tính năng gì, nặng bao nhiêu, đã thử cách nhẹ hơn chưa) rồi mới sửa `apk-budget.json`.

## Dung lượng

1. **Mọi app dùng plugin chung** `../../packages/core/plugins/with-android-release` trong `app.json`.
   - Bật R8 rút gọn mã và bỏ tài nguyên không dùng.
   - Chỉ đóng gói arm64-v8a và armeabi-v7a.
   - Chỉ giữ chuỗi giao diện `vi` và `en`.
   - APK cài thử tách theo loại chip (`-Pnam.abiSplits=true`). Bản Google Play là AAB, Play tự tách theo máy.
2. **Không đưa công cụ dev vào bản phát hành.**
   - Không cài `expo-dev-client`: nó kéo bộ quét mã vạch ML Kit (~8 MB) vào cả bản release.
   - Hồ sơ `development` trong `eas.json` build bản debug, chạy cùng `npx expo start`.
3. **Mỗi thư viện mới phải đáng giá.**
   - Trước khi thêm, xem nó nặng bao nhiêu (native `.so`, model, phông) và có cách làm bằng API sẵn có không.
   - Ưu tiên module Expo đã có trong dự án.
   - Ưu tiên thư viện dùng Google Play services "unbundled" (tải model khi cần) thay vì bản nhúng model vào APK.
4. **Icon:** chỉ nhập đúng một bộ, `import Feather from '@expo/vector-icons/Feather'`.
5. **Phông chữ:** chỉ nhập các kiểu chữ dùng thật, theo từng file `.ttf` (xem `packages/ui/src/fonts.ts`). Tối đa 4 kiểu chữ.
6. **Ảnh:**
   - Dùng WebP hoặc PNG đã nén, đúng kích thước hiển thị (tối đa @3x).
   - Ảnh lớn hoặc nhiều ảnh thì tải từ máy chủ và lưu bộ nhớ đệm, không nhúng vào APK.
   - Icon minh họa ưu tiên vector (SVG hoặc Feather).
7. **Âm thanh:** AAC `.m4a` (64 kbps mono cho tiếng nền), không dùng `.wav`.
   - Đổi bằng `ffmpeg -i in.wav -c:a aac -b:a 64k -ac 1 out.m4a`.
   - Gói âm thanh dài thì tải về khi người dùng chọn.
8. **Nội dung lớn** (kho mẹo, công thức…) viết dạng văn bản gọn, đọc khi mở app (xem `apps/meo-nha/src/data/tips.ts`), không viết mảng object TS dài.
9. **Không để file thừa trong `assets/`.** Metro đóng gói mọi file được `require`. Xóa file không còn dùng.

## Tốc độ và mượt

1. **Danh sách dài dùng `FlashList`**, có `keyExtractor` ổn định, item bọc `React.memo`. Không dùng `ScrollView` + `.map` cho danh sách hơn ~30 dòng.
2. **Tính một lần, dùng nhiều lần.**
   - Chỉ mục tìm kiếm, chữ bỏ dấu, tổng hợp số liệu: cache theo dữ liệu (`WeakMap`, `useMemo`).
   - Không tính lại ở mỗi lần gõ phím hoặc mỗi lần render.
3. **Việc nặng lúc mở app để sau.** Chạy bằng `InteractionManager.runAfterInteractions` (ví dụ `warmSearchIndex`). Màn đầu chỉ làm việc tối thiểu để hiện ra.
4. **Lưu dữ liệu:**
   - zustand persist qua `debouncedStorage` (gộp nhiều lần ghi).
   - Chọn từng phần state bằng selector, không lấy cả store.
   - Không ghi trong vòng lặp.
5. **Hiệu ứng** chạy trên luồng native (`useNativeDriver: true`). Không đặt `setInterval` ngắn hơn 1 giây trên màn hình không cần.
6. **Không gọi mạng chặn giao diện.** Mọi tính năng chạy được khi không có mạng. Máy chủ chỉ là phần thêm, qua `outbox`.
7. **Dọn dẹp:** hủy timer, listener và subscription khi rời màn hình (giá trị trả về của `useEffect`).

## Checklist khi thêm app mới

- [ ] `app.json` có plugin `with-android-release`.
- [ ] Không có `expo-dev-client`. Chỉ có thư viện thật sự dùng.
- [ ] Icon và phông nhập theo mục 4–5 (ESLint tự chặn sai).
- [ ] Thêm app vào ma trận của `android-native.yml` và `apk-build.yml`.
- [ ] Thêm ngân sách cho app vào `.github/apk-budget.json` nếu khác mức mặc định.
- [ ] `root/_layout.tsx` export `ErrorBoundary` từ `@nam/ui`, tab layout gọi `useExitOnBack`.
