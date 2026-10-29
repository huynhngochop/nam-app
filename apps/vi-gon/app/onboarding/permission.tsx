import React, { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Banner, Button, Card, Chip, Chips, ListItem, Row, Screen, StepDots, T, TextField, useTheme, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { checkPermission, listenerSupported, openPermissionSettings, refreshListenerState } from '../../src/listener';
import { useVi } from '../../src/store';

const BANK_APPS = [
  { id: 'com.VCB', name: 'Vietcombank' }, { id: 'com.vietinbank.ipay', name: 'VietinBank' }, { id: 'com.techcombank.bb.app', name: 'Techcombank' },
  { id: 'com.mbmobile', name: 'MB Bank' }, { id: 'vn.com.vng.zalopay', name: 'ZaloPay' }, { id: 'com.mservice.momotransfer', name: 'MoMo' },
  { id: 'com.android.mms', name: 'Tin nhắn SMS' }, { id: 'com.google.android.apps.messaging', name: 'Google Tin nhắn' },
];
const SHORTCUT_URL = 'vigon://import?text=';

/** VG-03 · Quyền đọc thông báo (2/3). Android: NotificationListener. iPhone: Phím tắt. Không có cả hai: nhập nhanh / dán tin. */
export default function Permission() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useVi();
  const [granted, setGranted] = useState(false);
  const supported = listenerSupported();

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (st) => {
      if (st === 'active') { const p = await checkPermission(); setGranted(p === 'granted'); refreshListenerState(); }
    });
    checkPermission().then((p) => setGranted(p === 'granted'));
    return () => sub.remove();
  }, []);
  const next = () => { track('notif_access_step', { granted, platform: Platform.OS }); router.push('/onboarding/budget'); };

  return (
    <Screen scroll edges={['top', 'bottom']} footer={<View style={{ gap: 8 }}>
      {Platform.OS === 'android' && supported && !granted ? <Button title="Mở cài đặt" onPress={openPermissionSettings} /> : <Button title="Tiếp tục" onPress={next} />}
      {Platform.OS === 'android' && supported && !granted ? <Button title="Để sau" variant="text" onPress={next} /> : null}
    </View>}>
      <Row between style={{ minHeight: 48 }}>
        <StepDots count={3} index={1} />
        <Button title="Bỏ qua" variant="text" size="sm" onPress={next} />
      </Row>
      {Platform.OS === 'ios' ? (
        <>
          <T v="title" accessibilityRole="header">Tự ghi trên iPhone bằng Phím tắt</T>
          <T v="caption" muted>iPhone không cho app đọc thông báo của app khác. Dùng Tự động hóa trong app Phím tắt để chuyển tin nhắn ngân hàng sang Ví Gọn.</T>
          <Card>
            <ListItem left={<T v="headline">1</T>} title="Mở Phím tắt → Tự động hóa → Tin nhắn" subtitle="Chọn “Tin nhắn chứa” và nhập “VND”" strong={false} />
            <ListItem left={<T v="headline">2</T>} title="Thêm tác vụ “Mở URL”" subtitle="Dán đường dẫn bên dưới rồi chèn biến “Nội dung tin nhắn” vào cuối" strong={false} />
            <ListItem left={<T v="headline">3</T>} title="Chọn “Chạy ngay”" subtitle="Tin mới sẽ mở Ví Gọn để bạn xác nhận" strong={false} divider={false} />
          </Card>
          <TextField value={SHORTCUT_URL} editable={false} right={<Button title="Chép" size="sm" variant="text" onPress={async () => { await Clipboard.setStringAsync(SHORTCUT_URL); toast('Đã chép đường dẫn'); }} />} />
          <T v="caption" muted>Không muốn cài? Bạn vẫn có thể dán tin nhắn hoặc nhập nhanh bằng nút + ở màn chính.</T>
        </>
      ) : !supported ? (
        <>
          <T v="title" accessibilityRole="header">Ghi chi tiêu nhanh</T>
          <Banner tone="warning" text="Bản này chưa có bộ đọc thông báo. Bạn có thể dán thông báo / SMS ngân hàng để Ví Gọn tự đọc, hoặc nhập nhanh bằng bàn phím số." />
          <Card variant="tint"><T v="body">Mẹo: nhấn giữ thông báo ngân hàng → Sao chép → mở Ví Gọn → “Dán tin ngân hàng”.</T></Card>
        </>
      ) : (
        <>
          <T v="title" accessibilityRole="header">Cho phép đọc thông báo ngân hàng</T>
          <T v="caption" muted>Để tự ghi chi tiêu mỗi khi có biến động số dư.</T>
          {granted ? <Banner tone="ok" icon="check-circle" text="Đã bật. Ví Gọn sẽ tự ghi các giao dịch mới." /> : (
            <Card>
              <ListItem left={<T v="headline">1</T>} title="Nhấn “Mở cài đặt”" strong={false} />
              <ListItem left={<T v="headline">2</T>} title="Tìm Ví Gọn trong “Truy cập thông báo”" strong={false} />
              <ListItem left={<T v="headline">3</T>} title="Bật công tắc, rồi quay lại đây" strong={false} divider={false} />
            </Card>
          )}
          <Card variant="tint">
            <T v="headline">Chỉ đọc app ngân hàng bạn chọn</T>
            <Chips>{BANK_APPS.map((a) => <Chip key={a.id} label={a.name} selected={s.allowedApps.includes(a.id)}
              onPress={() => s.set({ allowedApps: s.allowedApps.includes(a.id) ? s.allowedApps.filter((x) => x !== a.id) : [...s.allowedApps, a.id] })} />)}</Chips>
            <T v="caption" muted>{s.allowedApps.length ? `${s.allowedApps.length} app được đọc` : 'Chưa chọn = đọc mọi thông báo có số tiền'}</T>
          </Card>
        </>
      )}
      <T v="caption" color={c.inkMuted}>Bạn đổi lựa chọn này bất cứ lúc nào trong Cài đặt.</T>
    </Screen>
  );
}
