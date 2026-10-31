import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Card, Grid, ListItem, PricePlaceholder, Row, Screen, T, Thumb } from '@nam/ui';
import { getPrice } from '@nam/core';
import { CATEGORIES } from '../../src/data/tips';
import { useMeo } from '../../src/store';

/** MN-14 · Tôi. */
export default function Me() {
  const s = useMeo();
  const stats = [
    { v: Object.keys(s.doneTips).length, l: 'Đã làm' },
    { v: s.savedTips.length, l: 'Đã lưu' },
    { v: s.streak.days, l: 'Chuỗi ngày', accent: true },
  ];
  return (
    <Screen scroll>
      <Row gap={12} style={{ paddingTop: 12 }}>
        <Avatar name={s.name || 'Bạn'} size={64} />
        <View style={{ flex: 1 }}>
          <T v="title">{s.name || 'Khách'}</T>
          <T v="caption" muted>
            {s.name ? 'Dữ liệu lưu trên máy này' : 'Đăng nhập để đồng bộ (sắp có)'}
          </T>
        </View>
      </Row>
      <Grid min={3} gap={8}>
        {stats.map((x) => (
          <Card key={x.l} style={{ alignItems: 'center' }}>
            <T v="title" accent={x.accent}>
              {String(x.v)}
            </T>
            <T v="caption" muted>
              {x.l}
            </T>
          </Card>
        ))}
      </Grid>
      {!s.noAds ? (
        <Card variant="tint" onPress={() => router.push('/paywall')}>
          <Row between>
            <T v="headline">Bỏ quảng cáo</T>
            <PricePlaceholder priceKey="PRICE_NOADS_ONCE" price={getPrice('PRICE_NOADS_ONCE')} />
          </Row>
          <T v="caption">Đọc mẹo không bị gián đoạn, ủng hộ Mẹo Nhà.</T>
        </Card>
      ) : null}
      <View>
        <ListItem
          left={<Thumb icon="target" />}
          title="Mối quan tâm"
          subtitle={s.interests.map((i) => CATEGORIES.find((c) => c.id === i)?.name).join(', ') || 'Chưa chọn'}
          chevron
          onPress={() => router.push({ pathname: '/onboarding/interests', params: { edit: '1' } })}
        />
        <ListItem
          left={<Thumb icon="bell" />}
          title="Thông báo"
          subtitle={s.dailyTipOn ? `${s.notifyTime} mỗi ngày` : 'Đang tắt'}
          chevron
          onPress={() => router.push('/settings')}
        />
        <ListItem
          left={<Thumb icon="message-circle" />}
          title="Hỏi Mẹo Nhà"
          chevron
          onPress={() => router.push('/ask')}
        />
        <ListItem
          left={<Thumb icon="edit-2" />}
          title="Gửi mẹo của bạn"
          chevron
          onPress={() => router.push('/submit')}
        />
        <ListItem
          left={<Thumb icon="settings" />}
          title="Cài đặt"
          chevron
          divider={false}
          onPress={() => router.push('/settings')}
        />
      </View>
    </Screen>
  );
}
