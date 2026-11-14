import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
// Chỉ nhập bộ Feather: nhập từ '@expo/vector-icons' kéo mọi bộ icon (vài MB phông + bảng mã) vào APK.
import Feather from '@expo/vector-icons/Feather';
import { Dialog, useToast } from './components/overlay';
import { ListItem, Thumb } from './components/base';
import { useTheme } from './theme';

/** Hai lần bấm Quay lại cách nhau dưới mức này (ms) thì thoát app, ở bất kỳ màn hình nào. */
export const DOUBLE_BACK_MS = 500;
/** Ở màn gốc, sau lời nhắc "Bấm lần nữa để thoát", có thời gian này (ms) để bấm lần hai. */
export const ROOT_EXIT_MS = 2000;

/**
 * Quyết định cho một lần bấm Quay lại (tách riêng để dễ đọc và dễ kiểm).
 * - Bấm 1 lần: còn trang để lùi thì về trang trước; ở màn gốc thì nhắc "bấm lần nữa".
 * - Bấm 2 lần liền (< DOUBLE_BACK_MS), hoặc bấm lần hai trong ROOT_EXIT_MS sau lời nhắc: thoát app.
 */
export function backDecision(
  now: number,
  last: { at: number; prompted: boolean },
  canGoBack: boolean,
): 'exit' | 'back' | 'prompt' {
  if (now - last.at < (last.prompted ? ROOT_EXIT_MS : DOUBLE_BACK_MS)) return 'exit';
  return canGoBack ? 'back' : 'prompt';
}

/**
 * Android, dùng trong AppShell nên áp dụng cho mọi màn hình (kể cả giới thiệu, đăng nhập).
 * `canGoBack` lấy từ router của app.
 * Đăng ký sau khi điều hướng đã đăng ký (BackHandler gọi listener thêm sau cùng trước), nên app luôn thấy mọi lần bấm:
 * lần bấm "về trang trước" vẫn để điều hướng xử lý (trả false), chỉ ghi lại thời điểm để nhận ra lần bấm thứ hai.
 */
export function useExitOnBack(canGoBack?: () => boolean) {
  const toast = useToast();
  const last = useRef({ at: 0, prompted: false });
  const check = useRef(canGoBack);
  check.current = canGoBack;
  useEffect(() => {
    if (Platform.OS !== 'android' || !check.current) return;
    let sub: { remove(): void } | undefined;
    const t = setTimeout(() => {
      sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now();
        const can = !!check.current?.();
        const d = backDecision(now, last.current, can);
        // TẠM (chẩn đoán CI): xem listener có được gọi và quyết định gì.
        console.log(`[nam-back] can=${can} d=${d}`);
        last.current = { at: now, prompted: d === 'prompt' };
        if (d === 'exit') {
          BackHandler.exitApp();
          return true;
        }
        if (d === 'back') return false;
        toast('Bấm Quay lại lần nữa để thoát');
        return true;
      });
    }, 0);
    return () => {
      clearTimeout(t);
      sub?.remove();
    };
  }, [toast]);
}

/** Gắn trong AppShell (cần ToastProvider bao ngoài). */
export function BackExit({ canGoBack }: { canGoBack?: () => boolean }) {
  useExitOnBack(canGoBack);
  return null;
}

/** Dòng "Thoát ứng dụng" trong Cài đặt (chỉ Android — iOS không cho app tự thoát). Dữ liệu đã lưu sẵn trên máy. */
export function ExitAppItem() {
  const { c } = useTheme();
  const [ask, setAsk] = useState(false);
  if (Platform.OS !== 'android') return null;
  return (
    <>
      <ListItem
        left={<Thumb icon="log-out" color={c.negative} />}
        title="Thoát ứng dụng"
        subtitle="Dữ liệu đã được lưu trên máy"
        titleColor={c.negative}
        divider={false}
        onPress={() => setAsk(true)}
      />
      <Dialog
        visible={ask}
        title="Thoát ứng dụng?"
        confirm="Thoát"
        cancel="Ở lại"
        destructive
        onConfirm={() => {
          setAsk(false);
          BackHandler.exitApp();
        }}
        onCancel={() => setAsk(false)}
      />
    </>
  );
}

/**
 * Màn lỗi khi một màn hình gặp lỗi lúc hiển thị (thay cho việc app văng). expo-router gọi qua
 * `export { ErrorBoundary } from '@nam/ui'` ở app/_layout.tsx. Nằm ngoài AppShell nên tự chọn màu.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const dark = useColorScheme() === 'dark';
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    if (__DEV__) console.error(error);
  }, [error]);
  const ink = dark ? '#f2efe9' : '#1c1b19';
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: dark ? '#141311' : '#faf8f4',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 14,
      }}
    >
      <Feather name="alert-circle" size={40} color={ink} />
      <Text style={{ color: ink, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
        Có lỗi khi mở màn hình này
      </Text>
      <Text style={{ color: ink, opacity: 0.7, textAlign: 'center' }}>
        Dữ liệu của bạn vẫn an toàn. Thử lại, nếu vẫn lỗi hãy mở lại app.
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => retry().catch(() => {})}
          style={{ backgroundColor: ink, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: dark ? '#141311' : '#ffffff', fontWeight: '600' }}>Thử lại</Text>
        </Pressable>
        {Platform.OS === 'android' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => BackHandler.exitApp()}
            style={{ borderColor: ink, borderWidth: 1, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: ink, fontWeight: '600' }}>Thoát app</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
