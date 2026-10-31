import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  AppBar,
  Badge,
  Button,
  Dialog,
  ListItem,
  Screen,
  SectionHeader,
  Segmented,
  Stepper,
  T,
  Thumb,
  Toggle,
  useTheme,
  useToast,
} from '@nam/ui';
import { relativeTime, track } from '@nam/core';
import { allTx, wipeTx } from '../src/db';
import { listenerSupported, openPermissionSettings } from '../src/listener';
import { catOf, useVi } from '../src/store';
import { canUseBiometric } from '../src/ui';

/** VG-15 · Cài đặt: tự ghi, bảo mật, thông báo, dữ liệu (sao lưu mã hóa, xuất CSV – Pro), giao diện. */
export default function Settings() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useVi();
  const [wipe, setWipe] = useState(false);

  const toggleLock = async (v: boolean) => {
    if (v && !(await canUseBiometric())) {
      toast('Máy chưa cài Face ID / vân tay / mật mã màn hình');
      return;
    }
    s.set({ lockEnabled: v });
  };
  const askNotify = async () => {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) {
      toast('Thông báo đã bật');
      return;
    }
    if (!cur.canAskAgain) {
      toast('Hãy bật thông báo cho Ví Gọn trong Cài đặt máy');
      return;
    }
    const r = await Notifications.requestPermissionsAsync();
    toast(r.granted ? 'Đã bật thông báo' : 'Chưa bật thông báo');
  };
  const exportCsv = async () => {
    if (!s.isPro) {
      router.push('/paywall');
      return;
    }
    try {
      const rows = allTx().filter((t) => t.status === 'confirmed');
      const esc = (x: string) => `"${x.replace(/"/g, '""')}"`;
      const csv = ['Ngày,Giờ,Loại,Số tiền,Danh mục,Nơi chi,Ghi chú,Tài khoản']
        .concat(
          rows.map((t) => {
            const d = new Date(t.at);
            return [
              d.toLocaleDateString('vi-VN'),
              d.toTimeString().slice(0, 5),
              t.kind === 'income' ? 'Thu' : t.kind === 'expense' ? 'Chi' : 'Chuyển',
              String(t.amount),
              esc(catOf(t.categoryId, s.categories).name),
              esc(t.merchant),
              esc(t.note),
              t.account ? `*${t.account}` : '',
            ].join(',');
          }),
        )
        .join('\n');
      const f = new File(Paths.cache, 'ViGon-giaodich.csv');
      if (f.exists) f.delete();
      f.create();
      f.write(`﻿${csv}`);
      await Sharing.shareAsync(f.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Xuất giao dịch',
        UTI: 'public.comma-separated-values-text',
      });
      track('csv_exported', { rows: rows.length });
    } catch {
      toast('Không xuất được tệp. Thử lại.');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title="Cài đặt" onBack={() => router.back()} />
      <SectionHeader title="Tự ghi nhận" />
      {Platform.OS === 'android' && listenerSupported() ? (
        <ListItem
          left={<Thumb icon="bell" color={c.a} bg={c.at} />}
          title="Quyền đọc thông báo"
          subtitle={s.listenerState === 'granted' ? 'Đang bật' : 'Đang tắt — chạm để bật'}
          chevron
          onPress={openPermissionSettings}
        />
      ) : (
        <ListItem
          left={<Thumb icon="bell" color={c.a} bg={c.at} />}
          title={Platform.OS === 'ios' ? 'Tự ghi bằng Phím tắt' : 'Ghi nhanh bằng dán tin'}
          subtitle="Xem hướng dẫn"
          chevron
          onPress={() => router.push('/onboarding/permission')}
        />
      )}
      {Platform.OS === 'android' ? (
        <ListItem
          left={<Thumb icon="filter" color={c.a} bg={c.at} />}
          title="App được đọc"
          subtitle={s.allowedApps.length ? `${s.allowedApps.length} app` : 'Mọi thông báo có số tiền'}
          chevron
          onPress={() => router.push('/onboarding/permission')}
        />
      ) : null}
      <ListItem
        title="Hỏi trước khi lưu"
        subtitle="Tắt = tự lưu những giao dịch đã có quy tắc"
        right={
          <Toggle label="Hỏi trước khi lưu" value={s.askBeforeSave} onChange={(v) => s.set({ askBeforeSave: v })} />
        }
      />
      <ListItem
        left={<Thumb icon="tag" color={c.a} bg={c.at} />}
        title="Danh mục & quy tắc"
        chevron
        onPress={() => router.push('/categories')}
      />
      <ListItem
        title="Ngày bắt đầu tháng"
        subtitle="Ví dụ ngày nhận lương"
        right={<Stepper value={s.monthStartDay} min={1} max={28} onChange={(n) => s.set({ monthStartDay: n })} />}
      />

      <SectionHeader title="Bảo mật & riêng tư" />
      <ListItem
        title="Khóa bằng Face ID / vân tay"
        right={<Toggle label="Khóa ứng dụng" value={s.lockEnabled} onChange={toggleLock} />}
      />
      <ListItem
        title="Ẩn số tiền ở màn chính"
        right={<Toggle label="Ẩn số tiền" value={s.hideAmounts} onChange={(v) => s.set({ hideAmounts: v })} />}
      />
      <ListItem
        title="AI viết nhận xét tổng kết tháng"
        subtitle="Chỉ gửi số tổng theo danh mục, không gửi giao dịch"
        right={<Toggle label="AI nhận xét" value={s.aiSummary} onChange={(v) => s.set({ aiSummary: v })} />}
      />

      <SectionHeader title="Thông báo" />
      <ListItem
        left={<Thumb icon="alert-circle" color={c.a} bg={c.at} />}
        title="Cảnh báo ngân sách & nhắc góp quỹ"
        subtitle="Cần quyền thông báo"
        chevron
        onPress={askNotify}
      />

      <SectionHeader title="Dữ liệu" />
      <ListItem
        left={<Thumb icon="download-cloud" color={c.a} bg={c.at} />}
        title="Sao lưu mã hóa"
        subtitle={s.lastBackupAt ? `Lần cuối ${relativeTime(s.lastBackupAt)}` : 'Chưa sao lưu'}
        chevron
        onPress={() => router.push('/backup')}
      />
      <ListItem
        left={<Thumb icon="upload-cloud" color={c.a} bg={c.at} />}
        title="Khôi phục từ bản sao lưu"
        chevron
        onPress={() => router.push('/restore')}
      />
      <ListItem
        left={<Thumb icon="file-text" color={c.a} bg={c.at} />}
        title="Xuất Excel / CSV"
        right={!s.isPro ? <Badge label="Pro" tone="pro" /> : undefined}
        chevron
        onPress={exportCsv}
      />

      <SectionHeader title="Giao diện" />
      <Segmented
        options={[
          { key: 'system', label: 'Theo máy' },
          { key: 'light', label: 'Sáng' },
          { key: 'dark', label: 'Tối' },
        ]}
        value={s.theme}
        onChange={(k) => s.set({ theme: k })}
      />

      <SectionHeader title="Tài khoản" />
      {!s.isPro ? (
        <Button title="Nâng cấp Ví Gọn Pro" variant="secondary" onPress={() => router.push('/paywall')} />
      ) : (
        <T v="body">Bạn đang dùng Ví Gọn Pro.</T>
      )}
      <View style={{ height: 8 }} />
      <Button title="Xóa toàn bộ dữ liệu trên máy" variant="danger" size="md" onPress={() => setWipe(true)} />
      <T v="caption" muted center>
        Ví Gọn 0.1.0 · dữ liệu chỉ nằm trên máy này
      </T>

      <Dialog
        visible={wipe}
        title="Xóa toàn bộ dữ liệu?"
        body="Mọi giao dịch, quỹ, ngân sách trên máy sẽ bị xóa. Nếu chưa sao lưu sẽ không khôi phục được."
        confirm="Xóa hết"
        destructive
        onCancel={() => setWipe(false)}
        onConfirm={() => {
          wipeTx();
          s.set({ funds: [], budgets: {}, rules: [], unparsed: [], monthlyBudget: 0, onboarded: false, alerted: [] });
          setWipe(false);
          router.replace('/welcome');
        }}
      />
    </Screen>
  );
}
