import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';

/** Tải phông Be Vietnam Pro (hỗ trợ đủ dấu tiếng Việt). Trả về true khi sẵn sàng hoặc khi lỗi (dùng phông hệ thống). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  return loaded || !!error;
}
