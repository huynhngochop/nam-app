import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PHASE_ID = 'phase-end';

export async function notifyStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const p = await Notifications.getPermissionsAsync();
  return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
}
export async function requestNotify(): Promise<boolean> {
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

/** Thông báo cục bộ lúc hết phiên/hết nghỉ — hệ điều hành báo đúng giờ kể cả khi Nhịp bị tắt. */
export async function schedulePhaseEnd(endAt: number, title: string, body: string) {
  await cancelPhaseEnd();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('timer', {
      name: 'Hẹn giờ',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
    });
  }
  const seconds = Math.max(1, Math.round((endAt - Date.now()) / 1000));
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: PHASE_ID,
      content: { title, body, data: { url: '/session' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: 'timer' },
    });
  } catch {
    /* chưa có quyền: vẫn đếm trong app (NH-18) */
  }
}
export async function cancelPhaseEnd() {
  await Notifications.cancelScheduledNotificationAsync(PHASE_ID).catch(() => {});
}
