import * as Notifications from 'expo-notifications';
import { vnd } from '@nam/core';
import { byCategory, totals } from './db';
import { catOf, periodOf, useVi } from './store';

/**
 * Cảnh báo ngân sách trên máy: 80% và 100% cho tổng & từng danh mục, mỗi mức chỉ báo một lần mỗi kỳ.
 * Nội dung thông báo không ghi số tiền chi tiết của giao dịch, chỉ tỉ lệ ngân sách.
 */
export async function checkBudgets() {
  const s = useVi.getState();
  const p = periodOf(s.monthStartDay);
  const items: { key: string; limit: number; spent: number; name: string }[] = [];
  if (s.monthlyBudget) items.push({ key: 'total', limit: s.monthlyBudget, spent: totals(p.from, p.to).expense, name: 'tháng' });
  const cats = byCategory(p.from, p.to);
  for (const [id, limit] of Object.entries(s.budgets)) if (limit) items.push({ key: id, limit, spent: cats.find((x) => x.categoryId === id)?.total ?? 0, name: catOf(id, s.categories).name });

  const fresh: string[] = [];
  for (const it of items) {
    const pct = it.spent / it.limit;
    const level = pct >= 1 ? 100 : pct >= 0.8 ? 80 : 0;
    if (!level) continue;
    const k = `${p.from}:${it.key}:${level}`;
    if (s.alerted.includes(k)) continue;
    fresh.push(k);
    try {
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: level === 100 ? `Đã vượt ngân sách ${it.name}` : `Đã dùng 80% ngân sách ${it.name}`,
          body: level === 100 ? `Vượt ${vnd(it.spent - it.limit)}. Mở Ví Gọn để xem lại.` : `Còn ${vnd(it.limit - it.spent)} đến hết kỳ.`,
          data: { url: '/budgets' },
        },
        trigger: null,
      });
    } catch {
      /* thông báo là phụ — không chặn luồng chính */
    }
  }
  if (fresh.length) s.set({ alerted: [...s.alerted.filter((k) => k.startsWith(String(p.from))), ...fresh] });
}

/** Nhắc góp quỹ vào ngày bắt đầu tháng (ngày lương), 9:05 sáng. Gộp mọi quỹ bật nhắc vào một thông báo. */
export async function syncFundReminder() {
  const s = useVi.getState();
  const names = s.funds.filter((f) => f.remindPayday && f.saved < f.goal).map((f) => f.name);
  await Notifications.cancelScheduledNotificationAsync('fund-payday').catch(() => {});
  if (!names.length) return;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await Notifications.scheduleNotificationAsync({
      identifier: 'fund-payday',
      content: { title: 'Đến ngày góp quỹ', body: names.length === 1 ? `Góp cho quỹ ${names[0]} để kịp mục tiêu.` : `Góp cho ${names.length} quỹ: ${names.slice(0, 3).join(', ')}.`, data: { url: '/(tabs)/funds' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: s.monthStartDay, hour: 9, minute: 5 },
    });
  } catch {
    /* không chặn luồng chính */
  }
}
