import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { router, Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppShell } from '@nam/ui';
import { useVi } from '../src/store';
import { useTxVersion } from '../src/db';
import { LockGate } from '../src/ui';
import { checkBudgets, syncFundReminder } from '../src/alerts';
import { refreshListenerState, startListening } from '../src/listener';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

function Effects() {
  useEffect(() => {
    const stop = startListening();
    refreshListenerState();
    const app = AppState.addEventListener('change', (s) => { if (s === 'active') refreshListenerState(); });
    // Kiểm tra ngân sách sau mỗi lần dữ liệu đổi (gộp lại 1,5 giây).
    let t: ReturnType<typeof setTimeout> | null = null;
    const unsub = useTxVersion.subscribe(() => { if (t) clearTimeout(t); t = setTimeout(() => checkBudgets().catch(() => {}), 1500); });
    const tap = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    });
    syncFundReminder();
    const unsubFunds = useVi.subscribe((st, prev) => { if (st.funds !== prev.funds || st.monthStartDay !== prev.monthStartDay) syncFundReminder(); });
    return () => { stop(); app.remove(); unsub(); unsubFunds(); tap.remove(); if (t) clearTimeout(t); };
  }, []);
  return null;
}

export default function RootLayout() {
  const hydrated = useVi((s) => s.hydrated);
  const theme = useVi((s) => s.theme);
  return (
    <AppShell app="vi" pref={theme} ready={hydrated}>
      <LockGate>
        <Effects />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="pending" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ask" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="import" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </LockGate>
    </AppShell>
  );
}
