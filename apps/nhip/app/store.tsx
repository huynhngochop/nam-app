import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Badge, Card, Grid, IconButton, PricePlaceholder, Screen, Segmented, T, useTheme, useToast } from '@nam/ui';
import { getPrice, restorePurchases, track } from '@nam/core';
import { PACKS } from '../src/data';
import { useNhip } from '../src/store';

/** NH-10 · Cửa hàng gói âm thanh. Giá chưa chốt → ô khóa giá. */
export default function Store() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useNhip();
  const [tab, setTab] = useState<'packs' | 'themes'>('packs');
  const featured = PACKS.find((p) => p.featured)!;
  const has = (id: string) => s.isPro || s.ownedPacks.includes(id);
  return (
    <Screen scroll>
      <AppBar title="Cửa hàng" onBack={() => router.back()}
        right={<IconButton icon="refresh-cw" label="Khôi phục giao dịch" onPress={async () => { const ids = await restorePurchases(); const packs = PACKS.filter((p) => ids.includes(p.productId)).map((p) => p.id); if (packs.length) s.set({ ownedPacks: Array.from(new Set([...s.ownedPacks, ...packs])) }); toast(packs.length ? 'Đã khôi phục' : 'Không tìm thấy giao dịch cũ'); }} />} />
      <Segmented value={tab} onChange={setTab} options={[{ key: 'packs', label: 'Gói âm thanh' }, { key: 'themes', label: 'Giao diện' }]} />
      {tab === 'packs' ? (
        <>
          <Card variant="fill" onPress={() => { track('pack_opened', { packId: featured.id }); router.push(`/pack/${featured.id}`); }}>
            <T v="micro" color={c.onAccent}>Nổi bật</T>
            <T v="title" color={c.onAccent}>{featured.name}</T>
            <T v="caption" color={c.onAccent}>{featured.description}</T>
          </Card>
          <Grid min={2} gap={10}>
            {PACKS.filter((p) => !p.featured).map((p) => (
              <Card key={p.id} onPress={() => router.push(`/pack/${p.id}`)} style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
                <View style={{ height: 72, backgroundColor: c.at }} />
                <View style={{ padding: 12, gap: 6 }}>
                  <T v="headline" numberOfLines={2}>{p.name}</T>
                  {has(p.id) ? <Badge label="Đã có" tone="accent" /> : <PricePlaceholder priceKey={p.priceKey} price={getPrice(p.priceKey)} />}
                </View>
              </Card>
            ))}
          </Grid>
        </>
      ) : (
        <Card><T v="body">Giao diện vòng hẹn giờ sẽ có ở bản sau.</T></Card>
      )}
    </Screen>
  );
}
