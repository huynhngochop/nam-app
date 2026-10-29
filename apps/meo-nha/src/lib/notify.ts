import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useMeo } from '../store';
import { dailyTip } from './search';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function requestNotify(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

/** Lên lịch "Mẹo hôm nay" theo giờ người dùng chọn; mở mẹo khi chạm (MN-03, MN-15). */
export async function scheduleDailyTip(time: string, enabled: boolean, title: string) {
  await Notifications.cancelScheduledNotificationAsync('daily-tip').catch(() => {});
  if (!enabled) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', { name: 'Mẹo hôm nay', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const [hour, minute] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-tip',
    content: { title: 'Mẹo hôm nay', body: title, data: { url: '/(tabs)/explore' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'daily' },
  });
}

export function useDailyTipNotification() {
  const notifyTime = useMeo((s) => s.notifyTime);
  const dailyTipOn = useMeo((s) => s.dailyTipOn);
  const interests = useMeo((s) => s.interests);
  useEffect(() => {
    scheduleDailyTip(notifyTime, dailyTipOn, dailyTip(interests).title).catch(() => {});
  }, [notifyTime, dailyTipOn, interests]);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    });
    return () => sub.remove();
  }, []);
}
