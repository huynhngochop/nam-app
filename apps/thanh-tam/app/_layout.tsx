import React from 'react';
import { Stack } from 'expo-router';
import { AppShell } from '@nam/ui';
import { useTT } from '../src/store';
import { useNotifications } from '../src/notify';

function Routes() {
  useNotifications();
  const modal = { presentation: 'modal' as const, animation: 'slide_from_bottom' as const };
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="paywall" options={modal} />
      <Stack.Screen name="anniversaries/edit" options={modal} />
      <Stack.Screen name="people/edit" options={modal} />
      <Stack.Screen
        name="ritual/[id]/pray"
        options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="face/step/[n]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const hydrated = useTT((s) => s.hydrated);
  const theme = useTT((s) => s.theme);
  return (
    <AppShell app="tt" pref={theme} ready={hydrated}>
      <Routes />
    </AppShell>
  );
}
