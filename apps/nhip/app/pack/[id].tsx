import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  IconButton,
  ListItem,
  PricePlaceholder,
  ProgressBar,
  Row,
  Screen,
  T,
  Thumb,
  Toggle,
  useLayout,
  useTheme,
  useToast,
} from '@nam/ui';
import { buy, getPrice, PURCHASE_MESSAGES, track } from '@nam/core';
import { PACKS, SOUNDS } from '../../src/data';
import { useNhip } from '../../src/store';
import { DOWNLOAD_ERROR_TEXT, downloadPack, PackDownloadError } from '../../src/packs';

/** NH-11 Chi tiết gói · NH-19 Tải gói · NH-20 (lỗi mua). */
export default function PackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const L = useLayout();
  const toast = useToast();
  const s = useNhip();
  const pack = PACKS.find((p) => p.id === id);
  const [busy, setBusy] = useState(false);
  const [buyErr, setBuyErr] = useState<string | null>(null);
  const [dl, setDl] = useState<{ pct: number; err?: string } | null>(null);
  const [wifiOnly, setWifiOnly] = useState(true);
  if (!pack)
    return (
      <Screen>
        <EmptyState icon="alert-circle" title="Không tìm thấy gói" action="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  const owned = s.isPro || s.ownedPacks.includes(pack.id);
  const sounds = SOUNDS.filter((x) => x.packId === pack.id);

  const startDownload = async () => {
    setDl({ pct: 0 });
    try {
      await downloadPack(pack.id, (pct) => setDl({ pct }));
      setDl(null);
      toast('Đã tải xong gói', { tone: 'success' });
    } catch (e) {
      setDl({
        pct: 0,
        err: e instanceof PackDownloadError ? DOWNLOAD_ERROR_TEXT[e.code] : DOWNLOAD_ERROR_TEXT.NETWORK,
      });
      track('pack_download_failed', { reason: e instanceof PackDownloadError ? e.code : 'unknown' });
    }
  };
  const purchase = async () => {
    setBusy(true);
    setBuyErr(null);
    track('purchase_started', { productId: pack.productId });
    const r = await buy(pack.productId);
    setBusy(false);
    if (r.status === 'success') {
      s.set({ ownedPacks: [...s.ownedPacks, pack.id] });
      track('purchase_completed', { productId: pack.productId });
      startDownload();
    } else if (r.status !== 'cancelled') setBuyErr(PURCHASE_MESSAGES[r.status]);
  };

  return (
    <Screen
      scroll
      footer={
        owned ? (
          <Button title="Dùng ngay" variant="secondary" onPress={() => router.replace('/(tabs)/sounds')} />
        ) : (
          <View style={{ gap: 8 }}>
            <Row between>
              <T v="body">Giá gói</T>
              <PricePlaceholder priceKey={pack.priceKey} price={getPrice(pack.priceKey)} />
            </Row>
            <Button title="Mua gói" loading={busy} onPress={purchase} />
            <Button
              title="Đã có trong Nhịp Pro"
              variant="text"
              size="sm"
              onPress={() => router.push('/paywall')}
              style={{ alignSelf: 'center' }}
            />
          </View>
        )
      }
    >
      <View style={{ height: 140, marginHorizontal: -L.gutter, backgroundColor: c.surface2 }}>
        <View style={{ position: 'absolute', top: 12, left: L.gutter }}>
          <IconButton icon="chevron-left" label="Quay lại" bg={c.surface} onPress={() => router.back()} />
        </View>
      </View>
      <T v="title">{pack.name}</T>
      <T v="caption" muted>
        {pack.description}
      </T>
      {buyErr ? (
        <Card variant="danger">
          <Row>
            <Icon name="alert-circle" color={c.negative} />
            <T v="headline">Giao dịch chưa hoàn tất</T>
          </Row>
          <T v="body">{buyErr}</T>
        </Card>
      ) : null}
      {dl ? (
        dl.err ? (
          <Card variant="danger">
            <Row between>
              <Row>
                <Icon name="wifi-off" color={c.negative} />
                <T v="headline">Chưa tải được</T>
              </Row>
              <Button title="Thử lại" size="sm" onPress={startDownload} />
            </Row>
            <T v="caption">{dl.err}</T>
          </Card>
        ) : (
          <Card>
            <Row between>
              <T v="headline">{`Đang tải gói · ${Math.round(dl.pct * 100)}%`}</T>
              <T v="caption" muted>{`${Math.round(dl.pct * pack.sizeMb)}/${pack.sizeMb} MB`}</T>
            </Row>
            <ProgressBar value={dl.pct} />
            <T v="caption" muted>
              Tải tiếp tục kể cả khi bạn rời app.
            </T>
          </Card>
        )
      ) : null}
      {owned ? (
        <ListItem
          title="Chỉ tải qua Wi-Fi"
          strong={false}
          right={<Toggle label="Chỉ tải qua Wi-Fi" value={wifiOnly} onChange={setWifiOnly} />}
        />
      ) : null}
      {sounds.map((x, i) => (
        <ListItem
          key={x.id}
          left={<Thumb icon={x.icon} size={36} />}
          title={x.name}
          subtitle="Vòng lặp liền mạch"
          right={
            owned ? (
              <Badge label="Đã có" tone="accent" />
            ) : i === 0 ? (
              <Badge label="Nghe thử" tone="accent" />
            ) : (
              <Icon name="lock" size={16} color={c.inkMuted} />
            )
          }
        />
      ))}
    </Screen>
  );
}
