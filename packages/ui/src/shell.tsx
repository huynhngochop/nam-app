import React, { ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemePref, ThemeProvider, useTheme } from './theme';
import { AppId } from './tokens';
import { ToastProvider } from './components/overlay';
import { useAppFonts } from './fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Inner({ children }: { children: ReactNode }) {
  const { scheme, c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>{children}</ToastProvider>
    </View>
  );
}

/**
 * Khung gốc dùng chung cho mọi app: phông, splash (tối đa đến khi phông + dữ liệu sẵn sàng), theme sáng/tối, toast.
 * `ready` = dữ liệu bắt buộc đã nạp (ví dụ store đã hydrate).
 */
export function AppShell({ app, pref, ready = true, children }: { app: AppId; pref?: ThemePref; ready?: boolean; children: ReactNode }) {
  const fontsReady = useAppFonts();
  const ok = fontsReady && ready;
  useEffect(() => { if (ok) SplashScreen.hideAsync().catch(() => {}); }, [ok]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider app={app} pref={pref}>
          {ok ? <Inner>{children}</Inner> : null}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
