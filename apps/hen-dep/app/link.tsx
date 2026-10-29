import React, { useRef } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import QRCode from 'react-native-qrcode-svg';
import { AppBar, Button, Card, Grid, ListItem, Row, Screen, SectionHeader, T, Thumb, useLayout, useTheme, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { useHen } from '../src/store';

const SOURCES = [
  { key: 'zalo', label: 'Zalo OA / tin nhắn', hint: 'Dán vào menu Zalo OA hoặc trả lời khách' },
  { key: 'facebook', label: 'Facebook / Instagram', hint: 'Nút “Đặt lịch” trên trang & bio' },
  { key: 'maps', label: 'Google Maps', hint: 'Mục “Đặt chỗ” trong hồ sơ doanh nghiệp' },
] as const;

/** HD-C12 · Link & mã QR đặt lịch. Mỗi kênh có tham số ?src= riêng để biết khách đến từ đâu. */
export default function LinkScreen() {
  const { c } = useTheme();
  const L = useLayout();
  const toast = useToast();
  const shop = useHen((s) => s.shop);
  const url = `https://hendep.app/${shop.slug}`;
  const qrRef = useRef<{ toDataURL: (cb: (d: string) => void) => void } | null>(null);

  const copy = async (u: string, src?: string) => { await Clipboard.setStringAsync(u); toast('Đã sao chép link'); track('booking_link_copied', { src }); };
  const shareQr = () => {
    if (!qrRef.current) return;
    qrRef.current.toDataURL(async (data) => {
      try {
        const f = new File(Paths.cache, `qr-${shop.slug}.png`);
        f.write(data, { encoding: 'base64' });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri, { mimeType: 'image/png', dialogTitle: 'Mã QR đặt lịch' });
        track('booking_qr_shared');
      } catch {
        Share.share({ message: url }).catch(() => {});
      }
    });
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title="Link đặt lịch" onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/calendar'))} />
      <Grid min={1}>
        <Card variant="tint" style={{ alignItems: 'center', gap: 12 }}>
          <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16 }}>
            <QRCode value={`${url}?src=qr`} size={L.isCompact ? 200 : 240} getRef={(r: unknown) => { qrRef.current = r as never; }} />
          </View>
          <T v="headline" center>{shop.name}</T>
          <T v="caption" center>Quét để đặt lịch · in dán ở quầy, gương, cửa</T>
          <Row>
            <Button title="Lưu / chia sẻ QR" size="md" icon="download" onPress={shareQr} />
          </Row>
        </Card>
        <View style={{ gap: 12 }}>
          <Card>
            <T v="caption" muted>Link của tiệm</T>
            <T v="headline" color={c.a} selectable>{url.replace('https://', '')}</T>
            <Row>
              <Button title="Sao chép" size="sm" variant="secondary" icon="copy" onPress={() => copy(url)} />
              <Button title="Chia sẻ" size="sm" variant="secondary" icon="share-2" onPress={() => Share.share({ message: `Đặt lịch ${shop.name}: ${url}` }).catch(() => {})} />
            </Row>
          </Card>
          <SectionHeader title="Link theo kênh" />
          {SOURCES.map((s) => (
            <ListItem key={s.key} left={<Thumb icon="link-2" color={c.a} bg={c.at} />} title={s.label} subtitle={s.hint}
              right={<Button title="Chép" size="sm" variant="text" onPress={() => copy(`${url}?src=${s.key}`, s.key)} />} />
          ))}
          <T v="caption" muted>Báo cáo Doanh thu sẽ cho biết kênh nào mang về nhiều khách nhất.</T>
        </View>
      </Grid>
    </Screen>
  );
}
