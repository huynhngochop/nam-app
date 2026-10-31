import React from 'react';
import { router } from 'expo-router';
import { Badge, Card, Grid, ListItem, Row, Screen, SectionHeader, T, Thumb, useTheme } from '@nam/ui';
import { getLimit } from '@nam/core';
import { useHen } from '../../src/store';

const PLAN_LABEL = { trial: 'Dùng thử', basic: 'Cơ bản', standard: 'Tiêu chuẩn', chain: 'Chuỗi' } as const;

/** Tab Tiệm · menu quản lý. Tablet: các nhóm xếp 2 cột. */
export default function ShopTab() {
  const { c } = useTheme();
  const s = useHen();
  const trialDays = Math.max(0, Math.ceil((s.plan.trialEndsAt - Date.now()) / 86400000));
  const quota = getLimit(
    s.plan.code === 'chain' ? 'AI_QUOTA_CHAIN' : s.plan.code === 'standard' ? 'AI_QUOTA_STANDARD' : 'AI_QUOTA_BASIC',
    10,
  );
  const month = new Date().toISOString().slice(0, 7);
  const used = s.aiUsed.month === month ? s.aiUsed.count : 0;

  return (
    <Screen scroll>
      <T v="caption" muted>
        {s.shop.type}
      </T>
      <T v="display" accessibilityRole="header">
        {s.shop.name}
      </T>
      <Card variant="tint" onPress={() => router.push('/billing')} accessibilityLabel="Gói dịch vụ">
        <Row between>
          <T v="headline">{`Gói ${PLAN_LABEL[s.plan.code]}`}</T>
          {s.plan.code === 'trial' ? (
            <Badge label={`Còn ${trialDays} ngày`} tone={trialDays <= 5 ? 'warning' : 'accent'} />
          ) : null}
        </Row>
        <T v="caption">{`Lượt AI tháng này: ${used}/${quota}`}</T>
      </Card>
      <Grid min={1} gap={12}>
        <Card>
          <SectionHeader title="Khách đặt lịch" />
          <ListItem
            left={<Thumb icon="link" color={c.a} bg={c.at} />}
            title="Link & mã QR đặt lịch"
            subtitle={`hendep.app/${s.shop.slug}`}
            chevron
            onPress={() => router.push('/link')}
          />
          <ListItem
            left={<Thumb icon="send" color={c.a} bg={c.at} />}
            title="Gửi ưu đãi"
            subtitle={`${s.campaigns.length} chiến dịch đã gửi`}
            chevron
            onPress={() => router.push('/campaign')}
            divider={false}
          />
        </Card>
        <Card>
          <SectionHeader title="Quản lý" />
          <ListItem
            left={<Thumb icon="scissors" color={c.a} bg={c.at} />}
            title="Dịch vụ & bảng giá"
            subtitle={`${s.services.length} dịch vụ`}
            chevron
            onPress={() => router.push('/services')}
          />
          <ListItem
            left={<Thumb icon="users" color={c.a} bg={c.at} />}
            title="Nhân viên"
            subtitle={`${s.staff.length} người`}
            chevron
            onPress={() => router.push('/staff')}
          />
          <ListItem
            left={<Thumb icon="settings" color={c.a} bg={c.at} />}
            title="Cài đặt tiệm"
            subtitle="Giờ mở cửa, nhắc lịch, chống bỏ hẹn"
            chevron
            onPress={() => router.push('/settings')}
            divider={false}
          />
        </Card>
      </Grid>
    </Screen>
  );
}
