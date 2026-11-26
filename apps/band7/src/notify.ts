import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DAILY_ID = 'band7-daily';

/**
 * "Giám khảo gọi bạn": nhắc học mỗi ngày bằng thông báo cục bộ (không cần máy chủ).
 * Bấm vào mở thẳng màn Hôm nay.
 */
export async function scheduleDaily(hour: number): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  if (hour < 0) return true;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Nhắc học',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'Emma đang chờ bạn',
      body: 'Giám khảo có vài câu hỏi cho hôm nay, trong đó có lỗi bạn từng sai. Thử xem bạn đã sửa dứt chưa?',
      data: { url: '/(tabs)/today' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: 'daily' },
  });
  return true;
}
