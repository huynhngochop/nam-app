import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppShell } from '@nam/ui';
import { useNhip } from '../src/store';

export default function RootLayout() {
  const hydrated = useNhip((s) => s.hydrated);
  const theme = useNhip((s) => s.theme);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => { if (useNhip.getState().session) router.push('/session'); });
    return () => sub.remove();
  }, []);
  return (
    <AppShell app="nhip" pref={theme} ready={hydrated}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="done" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </AppShell>
  );
}
