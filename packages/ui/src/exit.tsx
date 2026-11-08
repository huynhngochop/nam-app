import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Feather } from '@expo/vector-icons';
import { Dialog, useToast } from './components/overlay';
import { ListItem, Thumb } from './components/base';
import { useTheme } from './theme';

/**
 * Android: ở màn gốc (không còn trang để lùi), bấm Quay lại lần 1 hiện nhắc, lần 2 trong 2 giây thì thoát app.
 * `canGoBack` lấy từ router của app (còn trang để lùi thì để điều hướng tự xử lý).
 */
export function useExitOnBack(canGoBack: () => boolean) {
  const toast = useToast();
  const last = useRef(0);
  const check = useRef(canGoBack);
  check.current = canGoBack;
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (check.current()) return false;
      const now = Date.now();
      if (now - last.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      last.current = now;
      toast('Bấm Quay lại lần nữa để thoát');
      return true;
    });
    return () => sub.remove();
  }, [toast]);
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
