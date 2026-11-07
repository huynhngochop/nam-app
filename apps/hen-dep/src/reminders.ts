import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { hhmm, shortDate } from '@nam/core';
import { useHen } from './store';

/**
 * Nhắc lịch trên máy (cài đặt "Nhắc khách trước 24 giờ / 2 giờ"): báo cho chủ tiệm đúng lúc cần nhắc,
 * bấm vào mở lịch hẹn để gửi tin nhắc khách bằng một chạm. Không cần máy chủ.
 *
 * Mỗi lần đồng bộ: hủy các nhắc cũ của app rồi đặt lại cho lịch hẹn trong 7 ngày tới — đơn giản và đúng
 * khi lịch bị dời / hủy. iOS giữ tối đa 64 thông báo hẹn giờ nên giới hạn 60.
 */
const KIND = 'hd-remind';
const MAX = 60;
const HORIZON = 7 * 86400000;

let channelReady = false;
async function ensureChannel() {
  if (channelReady || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Nhắc lịch hẹn',
    importance: Notifications.AndroidImportance.HIGH,
  });
  channelReady = true;
}

// Thông báo nhắc vẫn hiện khi đang mở app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Hỏi quyền thông báo khi người dùng vừa thao tác (tạo lịch, bật nhắc), không hỏi lúc mở app. */
async function canNotify(ask: boolean) {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return true;
  if (!ask || !p.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function syncReminders({ ask = false, now = Date.now() } = {}) {
  if (Platform.OS === 'web') return;
  const s = useHen.getState();
  const { remind24h, remind2h } = s.shop.settings;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (!remind24h && !remind2h) return;

  const offsets = [remind24h ? 24 : 0, remind2h ? 2 : 0].filter(Boolean);
  const jobs: { at: number; bookingId: string; title: string; body: string }[] = [];
  for (const b of s.bookings) {
    if (b.status !== 'confirmed' || b.startAt <= now || b.startAt > now + HORIZON) continue;
    const cust = s.customers.find((x) => x.id === b.customerId);
    if (!cust?.phone) continue;
    for (const h of offsets) {
      const at = b.startAt - h * 3600000;
      if (at <= now + 60000) continue;
      jobs.push({
        at,
        bookingId: b.id,
        title: `Nhắc ${cust.name} · ${h === 24 ? 'ngày mai' : 'sau 2 giờ'}`,
        body: `Hẹn ${hhmm(new Date(b.startAt))} ${shortDate(new Date(b.startAt))}. Bấm để gửi tin nhắc khách.`,
      });
    }
  }
  if (!jobs.length || !(await canNotify(ask))) return;
  await ensureChannel();
  jobs.sort((a, b) => a.at - b.at);
  for (const j of jobs.slice(0, MAX)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: j.title, body: j.body, data: { kind: KIND, bookingId: j.bookingId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(j.at), channelId: 'reminders' },
    });
  }
}

/** Đồng bộ lại (gộp 2 giây) khi lịch hẹn, khách hay cài đặt nhắc đổi. Trả về hàm hủy. */
export function watchReminders() {
  let t: ReturnType<typeof setTimeout> | null = null;
  const run = (ask: boolean) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => syncReminders({ ask }).catch(() => {}), 2000);
  };
  run(false);
  const unsub = useHen.subscribe((st, prev) => {
    if (st.bookings !== prev.bookings || st.customers !== prev.customers || st.shop.settings !== prev.shop.settings)
      run(true);
  });
  return () => {
    if (t) clearTimeout(t);
    unsub();
  };
}

/** Bấm vào thông báo nhắc → mở lịch hẹn. */
export function onReminderTap(open: (bookingId: string) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const d = r.notification.request.content.data as { kind?: string; bookingId?: string } | undefined;
    if (d?.kind === KIND && d.bookingId) open(d.bookingId);
  });
  return () => sub.remove();
}
