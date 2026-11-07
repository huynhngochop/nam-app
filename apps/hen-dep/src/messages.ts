import { Linking, Platform } from 'react-native';
import { getConfig, hhmm, shortDate } from '@nam/core';
import { Booking, Customer, Service, Shop } from './types';
import { svcOf } from './store';

/** Có máy chủ Hẹn Đẹp (trang đặt lịch, gửi Zalo tự động, cọc). Chưa có thì app chạy hoàn toàn trên máy. */
export const hasServer = () => !!getConfig().apiBaseUrl;

/** Cách khách đặt lịch, ghi trong tin nhắn: link web khi có máy chủ, không thì số điện thoại của tiệm. */
export function bookingContact(shop: Shop) {
  if (hasServer()) return `hendep.app/${shop.slug}`;
  return shop.phone ? `gọi/nhắn ${shop.phone}` : shop.name;
}

const when = (b: Booking) => `${hhmm(new Date(b.startAt))} ${shortDate(new Date(b.startAt))}`;

export function confirmText(shop: Shop, cust: Customer, b: Booking, services: Service[]) {
  const svc = svcOf(b.serviceIds, services)
    .map((x) => x.name)
    .join(', ');
  const call = shop.phone ? ` Đổi / hủy lịch: ${shop.phone}.` : '';
  return `${shop.name} xác nhận lịch hẹn của ${cust.name}: ${svc}, ${when(b)}. Mã ${b.code}.${call}`;
}

export function reminderText(shop: Shop, cust: Customer, b: Booking) {
  const addr = shop.address ? ` tại ${shop.address}` : '';
  return `${shop.name} nhắc ${cust.name}: bạn có lịch hẹn ${when(b)}${addr}. Hẹn gặp bạn!`;
}

/**
 * Mở app Tin nhắn với nội dung soạn sẵn (người dùng bấm gửi). Không cần máy chủ, không tốn phí ZNS.
 * iOS dùng "&body=", Android dùng "?body=".
 */
export async function openSms(phone: string, body: string) {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${phone.replace(/[^\d+]/g, '')}${sep}body=${encodeURIComponent(body)}`;
  await Linking.openURL(url);
}

export function thanksText(shop: Shop, cust: Customer) {
  return `Cảm ơn ${cust.name} đã ghé ${shop.name} hôm nay! Bạn thấy dịch vụ thế nào? Trả lời tin này để góp ý giúp tiệm nhé.`;
}
