import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Badge,
  Card,
  Chip,
  ListItem,
  Row,
  Screen,
  Segmented,
  Sheet,
  T,
  Thumb,
  useTheme,
  useToast,
} from '@nam/ui';
import { dateKey, minutesLabel, restorePurchases } from '@nam/core';
import { useNhip } from '../../src/store';

/** Tôi. */
export default function Me() {
  const { c } = useTheme();
  const toast = useToast();
  const state = useNhip();
  const [goalOpen, setGoalOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const exportCsv = () => {
    if (!state.isPro) {
      router.push('/paywall');
      return;
    }
    const rows = [
      'ngay,phut,viec,trang_thai,danh_gia',
      ...state.logs.map(
        (l) =>
          `${dateKey(new Date(l.at))},${l.minutes},"${(state.tasks.find((t) => t.id === l.taskId)?.title ?? '').replace(/"/g, '""')}",${l.status},${l.rating ?? ''}`,
      ),
    ];
    Share.share({ message: rows.join('\n'), title: 'nhip.csv' });
  };
  return (
    <Screen scroll>
      <Row gap={12} style={{ paddingTop: 12 }}>
        <Avatar name={state.name || 'Bạn'} size={64} />
        <View style={{ flex: 1 }}>
          <T v="title">{state.name || 'Bạn'}</T>
          <T v="caption" muted>{`Mục tiêu ${minutesLabel(state.goalMin)}/ngày`}</T>
        </View>
      </Row>
      <Card variant="accent" onPress={() => router.push('/paywall')}>
        <Row between>
          <T v="headline" color={c.onAccent}>
            Nhịp Pro
          </T>
          {state.isPro ? <Badge label="Đang dùng" /> : <Badge label="Dùng thử" />}
        </Row>
        <T v="caption" color={c.onAccent}>
          Mọi gói âm thanh, thống kê theo việc, thói quen không giới hạn.
        </T>
      </Card>
      <View>
        <ListItem
          left={<Thumb icon="target" />}
          title="Mục tiêu hằng ngày"
          subtitle={`${minutesLabel(state.goalMin)} · ${Math.round(state.goalMin / state.settings.focusMin)} phiên`}
          chevron
          onPress={() => setGoalOpen(true)}
        />
        <ListItem
          left={<Thumb icon="clock" />}
          title="Cài đặt hẹn giờ"
          subtitle={`${state.settings.focusMin} / ${state.settings.shortMin} / ${state.settings.longMin}`}
          chevron
          onPress={() => router.push('/timer-settings')}
        />
        <ListItem left={<Thumb icon="list" />} title="Việc cần làm" chevron onPress={() => router.push('/tasks')} />
        <ListItem
          left={<Thumb icon="check-circle" />}
          title="Thói quen"
          chevron
          onPress={() => router.push('/habits')}
        />
        <ListItem
          left={<Thumb icon="moon" />}
          title="Giao diện"
          subtitle={{ system: 'Hệ thống', light: 'Sáng', dark: 'Tối' }[state.theme]}
          chevron
          onPress={() => setThemeOpen(true)}
        />
        <ListItem
          left={<Thumb icon="shopping-bag" />}
          title="Cửa hàng âm thanh"
          chevron
          onPress={() => router.push('/store')}
        />
        <ListItem
          left={<Thumb icon="download" />}
          title="Xuất dữ liệu (CSV)"
          subtitle={state.isPro ? undefined : 'Pro'}
          chevron
          onPress={exportCsv}
        />
        <ListItem
          left={<Thumb icon="refresh-cw" />}
          title="Khôi phục giao dịch"
          chevron
          divider={false}
          onPress={async () => {
            const ids = await restorePurchases();
            toast(ids.length ? 'Đã khôi phục' : 'Không tìm thấy giao dịch cũ');
          }}
        />
      </View>
      <Sheet visible={goalOpen} onClose={() => setGoalOpen(false)} title="Mục tiêu hằng ngày">
        <Row wrap>
          {[60, 90, 120, 180, 240].map((m) => (
            <Chip
              key={m}
              label={minutesLabel(m)}
              selected={state.goalMin === m}
              onPress={() => {
                state.set({ goalMin: m });
                setGoalOpen(false);
              }}
            />
          ))}
        </Row>
      </Sheet>
      <Sheet visible={themeOpen} onClose={() => setThemeOpen(false)} title="Giao diện">
        <Segmented
          value={state.theme}
          onChange={(v) => {
            state.set({ theme: v });
            setThemeOpen(false);
          }}
          options={[
            { key: 'system', label: 'Hệ thống' },
            { key: 'light', label: 'Sáng' },
            { key: 'dark', label: 'Tối' },
          ]}
        />
      </Sheet>
    </Screen>
  );
}
