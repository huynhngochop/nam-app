// Nhập từng độ đậm theo đường dẫn con: nhập từ gốc gói kéo theo cả 18 tệp phông (≈2,5 MB) dù chỉ dùng 4.
import { useFonts } from 'expo-font';
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';

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
