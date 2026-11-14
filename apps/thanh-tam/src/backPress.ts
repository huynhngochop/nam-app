import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useToast } from '@nam/ui';
import { decideBack } from './lib/backPress';

/**
 * Nút Quay lại trên Android, dùng một lần ở gốc app (cần nằm trong ToastProvider):
 * chạm một lần về màn trước; ở màn chính chạm hai lần liền nhau (trong 2 giây) mới thoát, lần đầu có nhắc.
 * Không phụ thuộc thứ tự đăng ký với bộ điều hướng: còn màn trước thì trả `false` để điều hướng tự xử lý.
 * iOS không có nút này; Apple không cho app tự thoát.
 */
export function useAndroidBack() {
  const path = usePathname();
  const pathRef = useRef(path);
  pathRef.current = path;
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const lastWarn = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const now = Date.now();
      const a = decideBack({ canGoBack: router.canGoBack(), path: pathRef.current, now, lastWarn: lastWarn.current });
      switch (a) {
        case 'nav':
          return false;
        case 'home':
          router.replace('/(tabs)/today' as never);
          return true;
        case 'warn':
          lastWarn.current = now;
          try {
            toastRef.current('Chạm Quay lại lần nữa để thoát');
          } catch {
            // không có toast thì vẫn chờ lần chạm thứ hai
          }
          return true;
        default:
          lastWarn.current = 0;
          BackHandler.exitApp();
          return true;
      }
    });
    return () => sub.remove();
  }, []);
}
