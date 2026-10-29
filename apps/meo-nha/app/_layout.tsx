import React from 'react';
import { Stack } from 'expo-router';
import { AppShell } from '@nam/ui';
import { useMeo } from '../src/store';
import { useDailyTipNotification } from '../src/lib/notify';

function Routes() {
  useDailyTipNotification();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ask" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="cook/[id]" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const hydrated = useMeo((s) => s.hydrated);
  const theme = useMeo((s) => s.theme);
  return (
    <AppShell app="meo" pref={theme} ready={hydrated}>
      <Routes />
    </AppShell>
  );
}
