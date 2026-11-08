import { useFonts } from 'expo-font';

// Nhập từng file phông theo đường dẫn: nhập từ gói gốc kéo cả 18 kiểu chữ (~2,4 MB) vào APK dù chỉ dùng 4.
const BeVietnamPro_400Regular = require('@expo-google-fonts/be-vietnam-pro/400Regular/BeVietnamPro_400Regular.ttf');
const BeVietnamPro_500Medium = require('@expo-google-fonts/be-vietnam-pro/500Medium/BeVietnamPro_500Medium.ttf');
const BeVietnamPro_600SemiBold = require('@expo-google-fonts/be-vietnam-pro/600SemiBold/BeVietnamPro_600SemiBold.ttf');
const BeVietnamPro_700Bold = require('@expo-google-fonts/be-vietnam-pro/700Bold/BeVietnamPro_700Bold.ttf');

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
