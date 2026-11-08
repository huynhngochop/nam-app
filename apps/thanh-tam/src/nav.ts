import { router } from 'expo-router';

/**
 * Quay lại an toàn. Màn mở thẳng từ thông báo hay đường dẫn không có màn trước,
 * `router.back()` khi đó không làm gì và người dùng bị kẹt (QA vòng 9: 30 nút "Quay lại" không phản hồi).
 * Không có màn trước thì về Hôm nay (hoặc màn `fallback`). Dùng được trực tiếp làm `onPress` (tham số sự kiện bị bỏ qua).
 */
export function goBack(fallback?: unknown) {
  if (router.canGoBack()) router.back();
  else router.replace((typeof fallback === 'string' ? fallback : '/(tabs)/today') as never);
}
