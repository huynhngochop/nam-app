import React, { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppShell } from '@nam/ui';
import { useLenBand } from '../src/store';
import { refreshErrors, refreshTopics } from '../src/sync';
import '../src/notify';

export default function RootLayout() {
  const hydrated = useLenBand((s) => s.hydrated);
  const theme = useLenBand((s) => s.theme);
  useEffect(() => {
    // Bấm thông báo nhắc học → mở màn Hôm nay
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.push('/(tabs)/today'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    // Tải sổ lỗi sau khi màn đầu đã hiện (docs/lean-app.md: việc nặng để sau)
    const task = InteractionManager.runAfterInteractions(() => {
      void refreshTopics();
      void refreshErrors();
    });
    return () => task.cancel();
  }, [hydrated]);
  return (
    <AppShell app="lenband" pref={theme} ready={hydrated} canGoBack={router.canGoBack}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="part2" options={{ animation: 'fade' }} />
        <Stack.Screen name="feedback" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </AppShell>
  );
}

export { ErrorBoundary } from '@nam/ui';
