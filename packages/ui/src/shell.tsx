import React, { ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemePref, ThemeProvider, useTheme } from './theme';
import { AppId } from './tokens';
import { ToastProvider } from './components/overlay';
import { useAppFonts } from './fonts';
import { BackExit } from './exit';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Inner({ children, canGoBack }: { children: ReactNode; canGoBack?: () => boolean }) {
  const { scheme, c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <BackExit canGoBack={canGoBack} />
        {children}
      </ToastProvider>
    </View>
  );
}

/**
 * Khung gốc dùng chung cho mọi app: phông, splash (tối đa đến khi phông + dữ liệu sẵn sàng), theme sáng/tối, toast.
 * `ready` = dữ liệu bắt buộc đã nạp (ví dụ store đã hydrate).
 */
export function AppShell({
  app,
  pref,
  ready = true,
  canGoBack,
  children,
}: {
  app: AppId;
  pref?: ThemePref;
  ready?: boolean;
  /** router.canGoBack của app: bật Quay lại 1 lần = về trước, 2 lần liền = thoát (Android). */
  canGoBack?: () => boolean;
  children: ReactNode;
}) {
  const fontsReady = useAppFonts();
  const ok = fontsReady && ready;
  useEffect(() => {
    if (ok) SplashScreen.hideAsync().catch(() => {});
  }, [ok]);
  return (
    <SafeAreaProvider>
      <ThemeProvider app={app} pref={pref}>
        {ok ? <Inner canGoBack={canGoBack}>{children}</Inner> : null}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
