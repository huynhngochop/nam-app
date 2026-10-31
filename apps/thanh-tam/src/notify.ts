import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { RITUALS } from './data/rituals';
import { planNotifications } from './lib/schedule';
import { useTT } from './store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function requestNotify(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}
export async function notifyDenied(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  return !cur.granted && !cur.canAskAgain;
}

const PREFIX = 'tt-';
/** Lên lịch lại toàn bộ nhắc lịch (tối đa 50, iOS chỉ giữ 64). Gọi khi mở app, đổi cài đặt, sửa giỗ, đổi múi giờ. */
export async function rescheduleAll() {
  const s = useTT.getState();
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lich', { name: 'Nhắc lịch cúng', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing.filter((n: { identifier: string }) => n.identifier.startsWith(PREFIX)).map((n: { identifier: string }) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  const plan = planNotifications(new Date(), { ...s.remind, mung10: s.remind.mung10 && s.household.altars.includes('than-tai') }, RITUALS, s.anniversaries);
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${n.id}`,
      content: { title: n.title, body: n.body, data: { url: n.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: 'lich' },
    });
  }
}

/** Nhắc hạ lễ sau n phút (TT-12). Không tính vào trần 50 của nhắc lịch. */
export async function remindTakedown(minutes: number) {
  if (!(await requestNotify())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: 'takedown',
    content: { title: 'Hương đã cháy gần hết', body: 'Có thể vái xin hạ lễ.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutes * 60, channelId: 'lich' },
  });
  return true;
}

export function useNotifications() {
  const remind = useTT((s) => s.remind);
  const anniversaries = useTT((s) => s.anniversaries);
  const altars = useTT((s) => s.household.altars);
  useEffect(() => { rescheduleAll().catch(() => {}); }, [remind, anniversaries, altars]);
  useEffect(() => {
    // mở lại app (có thể đã đổi ngày, đổi múi giờ) → lên lịch lại
    let tz = new Date().getTimezoneOffset();
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      const now = new Date().getTimezoneOffset();
      if (now !== tz) tz = now;
      rescheduleAll().catch(() => {});
    });
    const tap = Notifications.addNotificationResponseReceivedListener((r: { notification: { request: { content: { data?: { url?: unknown } } } } }) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    });
    return () => { sub.remove(); tap.remove(); };
  }, []);
}
