import React from 'react';
import { Stack } from 'expo-router';
import { AppShell } from '@nam/ui';
import { useHen } from '../src/store';

export default function RootLayout() {
  const hydrated = useHen((s) => s.hydrated);
  const theme = useHen((s) => s.theme);
  return (
    <AppShell app="hen" pref={theme} ready={hydrated}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="campaign" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
    </AppShell>
  );
}
