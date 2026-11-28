import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Card, Grid, ListItem, PricePlaceholder, Row, Screen, T, Thumb } from '@nam/ui';
import { getPrice } from '@nam/core';
import { CATEGORIES } from '../../src/data/tips';
import { useMeo } from '../../src/store';
import { hasCloud } from '../../src/lib/cloud';

/** Tab Tôi: hồ sơ, mối quan tâm, mẹo đã gửi, lối vào Cài đặt. */
export default function Me() {
  const state = useMeo();
  const stats = [
    { v: Object.keys(state.doneTips).length, l: 'Đã làm' },
    { v: state.savedTips.length, l: 'Đã lưu' },
    { v: state.streak.days, l: 'Chuỗi ngày', accent: true },
  ];
  return (
    <Screen scroll>
      <Row gap={12} style={{ paddingTop: 12 }}>
        <Avatar name={state.name || 'Bạn'} size={64} />
        <View style={{ flex: 1 }}>
          <T v="title">{state.name || 'Khách'}</T>
          <T v="caption" muted>
            Dữ liệu lưu trên máy này
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
      {!state.noAds ? (
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
          subtitle={state.interests.map((i) => CATEGORIES.find((c) => c.id === i)?.name).join(', ') || 'Chưa chọn'}
          chevron
          onPress={() => router.push({ pathname: '/onboarding/interests', params: { edit: '1' } })}
        />
        <ListItem
          left={<Thumb icon="bell" />}
          title="Thông báo"
          subtitle={state.dailyTipOn ? `${state.notifyTime} mỗi ngày` : 'Đang tắt'}
          chevron
          onPress={() => router.push('/settings')}
        />
        <ListItem
          left={<Thumb icon="message-circle" />}
          title="Hỏi Mẹo Nhà"
          chevron
          onPress={() => router.push('/ask')}
        />
        {hasCloud() ? (
          <ListItem
            left={<Thumb icon="inbox" />}
            title="Câu hỏi đã gửi"
            chevron
            onPress={() => router.push('/questions')}
          />
        ) : null}
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
