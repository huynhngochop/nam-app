import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  AppBar,
  Chip,
  Dialog,
  ListItem,
  Row,
  Screen,
  SectionHeader,
  Segmented,
  Sheet,
  T,
  Thumb,
  Toggle,
  useTheme,
  useToast,
} from '@nam/ui';
import { restorePurchases, track } from '@nam/core';
import Constants from 'expo-constants';
import { useMeo } from '../src/store';
import { requestNotify } from '../src/lib/notify';

const TIMES = ['06:00', '06:30', '07:00', '07:30', '08:00', '12:00', '19:00', '21:00'];

/** MN-15 · Cài đặt. */
export default function Settings() {
  const { c } = useTheme();
  const s = useMeo();
  const toast = useToast();
  const [pick, setPick] = useState(false);
  const [del, setDel] = useState(false);
  return (
    <Screen scroll>
      <AppBar title="Cài đặt" onBack={() => router.back()} />
      <SectionHeader title="Thông báo" />
      <ListItem
        left={<Thumb icon="bell" bg={c.surface2} color={c.ink} size={32} />}
        title="Mẹo mỗi sáng"
        subtitle={s.notifyTime}
        onPress={() => setPick(true)}
        right={
          <Toggle
            label="Mẹo mỗi sáng"
            value={s.dailyTipOn}
            onChange={async (v) => {
              if (v && !(await requestNotify())) {
                toast('Thông báo đang tắt trong Cài đặt của máy', { tone: 'error' });
                return;
              }
              s.set({ dailyTipOn: v });
              track('setting_changed', { key: 'dailyTip', value: v });
            }}
          />
        }
      />
      <ListItem
        left={<Thumb icon="calendar" bg={c.surface2} color={c.ink} size={32} />}
        title="Nhắc theo mùa"
        subtitle="Nồm ẩm, dọn Tết…"
        right={<Toggle label="Nhắc theo mùa" value={s.seasonalOn} onChange={(v) => s.set({ seasonalOn: v })} />}
      />
      <SectionHeader title="Hiển thị" />
      <Segmented
        value={s.theme}
        onChange={(v) => s.set({ theme: v })}
        options={[
          { key: 'system', label: 'Hệ thống' },
          { key: 'light', label: 'Sáng' },
          { key: 'dark', label: 'Tối' },
        ]}
      />
      <T v="caption" muted>
        Cỡ chữ theo cài đặt của máy.
      </T>
      <SectionHeader title="Tài khoản & quyền riêng tư" />
      <ListItem
        left={<Thumb icon="eye" bg={c.surface2} color={c.ink} size={32} />}
        title="Quảng cáo cá nhân hóa"
        right={
          <Toggle label="Quảng cáo cá nhân hóa" value={s.personalAds} onChange={(v) => s.set({ personalAds: v })} />
        }
      />
      <ListItem
        left={<Thumb icon="refresh-cw" bg={c.surface2} color={c.ink} size={32} />}
        title="Khôi phục giao dịch"
        chevron
        onPress={async () => {
          const ids = await restorePurchases();
          toast(ids.length ? 'Đã khôi phục' : 'Không tìm thấy giao dịch cũ');
        }}
      />
      <ListItem
        left={<Thumb icon="trash-2" bg={c.surface2} color={c.negative} size={32} />}
        title="Xóa toàn bộ dữ liệu"
        titleColor={c.negative}
        chevron
        divider={false}
        onPress={() => setDel(true)}
      />
      <T
        v="caption"
        muted
        center
        style={{ marginTop: 12 }}
      >{`Phiên bản ${Constants.expoConfig?.version ?? ''} · Điều khoản · Quyền riêng tư`}</T>
      <Sheet visible={pick} onClose={() => setPick(false)} title="Giờ nhận mẹo">
        <Row wrap>
          {TIMES.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={t === s.notifyTime}
              onPress={() => {
                s.set({ notifyTime: t });
                setPick(false);
              }}
            />
          ))}
        </Row>
      </Sheet>
      <Dialog
        visible={del}
        destructive
        title="Xóa toàn bộ dữ liệu?"
        body="Mẹo đã lưu, bộ sưu tập và cài đặt trên máy này sẽ bị xóa. Không thể hoàn tác."
        confirm="Xóa"
        cancel="Hủy"
        onCancel={() => setDel(false)}
        onConfirm={() => {
          useMeo.persist.clearStorage();
          s.set({ onboarded: false, savedTips: [], doneTips: {}, collections: [], recentSearches: [], askHistory: [] });
          setDel(false);
          track('account_deleted');
          router.replace('/');
        }}
      />
    </Screen>
  );
}
