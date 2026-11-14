import React, { useEffect } from 'react';
import { router, Stack, useSegments } from 'expo-router';
import { AppShell } from '@nam/ui';
import { useHen } from '../src/store';
import { redirectFor } from '../src/access';
import { onReminderTap, watchReminders } from '../src/reminders';

/** Nhắc lịch trên máy: đặt lại khi lịch hẹn đổi; bấm thông báo mở lịch hẹn. Chỉ chạy khi đã đăng nhập. */
function Reminders() {
  const signedIn = useHen((s) => !!s.auth && s.hydrated);
  useEffect(() => {
    if (!signedIn) return;
    const stop = watchReminders();
    const off = onReminderTap((id) => router.push(`/booking/${id}` as never));
    return () => {
      stop();
      off();
    };
  }, [signedIn]);
  return null;
}

/** Chặn route theo vai trò: chưa đăng nhập → màn đăng nhập; nhân viên → không vào màn của chủ tiệm (W3). */
function RouteGuard() {
  const segments = useSegments();
  const role = useHen((s) => s.auth?.role ?? null);
  const target = redirectFor(segments, role);
  useEffect(() => {
    if (target) router.replace(target as never);
  }, [target]);
  return null;
}

export default function RootLayout() {
  const hydrated = useHen((s) => s.hydrated);
  const theme = useHen((s) => s.theme);
  return (
    <AppShell app="hen" pref={theme} ready={hydrated} canGoBack={router.canGoBack}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="campaign" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
      {/* Sau Stack: effect chạy khi navigator đã mount, tránh lỗi điều hướng trước khi root layout sẵn sàng. */}
      <RouteGuard />
      <Reminders />
    </AppShell>
  );
}

export { ErrorBoundary } from '@nam/ui';
