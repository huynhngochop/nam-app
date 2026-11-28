import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  AppBar,
  Avatar,
  Button,
  Card,
  Chip,
  Chips,
  Dialog,
  ListItem,
  Row,
  Screen,
  SectionHeader,
  Segmented,
  T,
  TextField,
  Toggle,
  useToast,
} from '@nam/ui';
import { saveProfile, serverEnabled, signOut } from '../src/api';
import { scheduleDaily } from '../src/notify';
import { useLenBand, type Settings } from '../src/store';
import { voiceAvailable } from '../src/voice';

const HOURS = [7, 12, 18, 20, 21];

/** 12 · Cài đặt & gói. Đổi cài đặt giám khảo thì đồng bộ lên hồ sơ máy chủ để AI dùng đúng mức sửa lỗi. */
export default function SettingsScreen() {
  const toast = useToast();
  const s = useLenBand((x) => x.settings);
  const setSettings = useLenBand((x) => x.setSettings);
  const auth = useLenBand((x) => x.auth);
  const isPro = useLenBand((x) => x.isPro);
  const name = useLenBand((x) => x.name);
  const theme = useLenBand((x) => x.theme);
  const set = useLenBand((x) => x.set);
  const [confirmOut, setConfirmOut] = useState(false);

  const update = (p: Partial<Settings>) => {
    setSettings(p);
    const next = { ...s, ...p };
    if (serverEnabled() && auth)
      void saveProfile({
        id: auth.userId,
        accent: next.accent,
        speech_rate: next.speed,
        correction_level: next.correction,
      }).catch(() => {});
  };
  const setReminder = async (hour: number) => {
    const ok = await scheduleDaily(hour);
    if (!ok) return toast('Chưa có quyền thông báo. Bật trong Cài đặt máy nhé.', { tone: 'error' });
    update({ reminderHour: hour });
  };

  return (
    <Screen scroll>
      <AppBar onBack={() => router.back()} title="Cài đặt" />
      <Row gap={12}>
        <Avatar name={name || 'B'} />
        <T v="headline" style={{ flex: 1 }}>
          {name || (auth?.email ?? 'Khách')}
        </T>
        <T v="caption" muted>
          {isPro ? 'Pro' : 'Miễn phí'}
        </T>
      </Row>

      <TextField
        label="Tên gọi"
        value={name}
        onChangeText={(v) => set({ name: v.slice(0, 30) })}
        onBlur={() => {
          if (serverEnabled() && auth) void saveProfile({ id: auth.userId, display_name: name.trim() }).catch(() => {});
        }}
        placeholder="Giám khảo sẽ gọi bạn bằng tên này"
      />

      {!isPro ? (
        <Card variant="accent" onPress={() => router.push('/paywall')}>
          <T v="headline">Lên Band Pro</T>
          <T v="caption">Nói không giới hạn · thi thử mỗi ngày · không quảng cáo · huỷ bất cứ lúc nào</T>
        </Card>
      ) : null}

      <SectionHeader title="Giám khảo AI" />
      <T v="caption" muted>
        Giọng
      </T>
      <Segmented
        options={[
          { key: 'uk', label: 'Anh' },
          { key: 'us', label: 'Mỹ' },
          { key: 'au', label: 'Úc' },
        ]}
        value={s.accent}
        onChange={(accent) => update({ accent })}
      />
      {!voiceAvailable() ? (
        <T v="caption" muted>
          Bản này giám khảo hiện câu hỏi bằng chữ. Giọng đọc sẽ có ở bản cập nhật.
        </T>
      ) : null}
      <T v="caption" muted>
        Tốc độ nói
      </T>
      <Segmented
        options={[
          { key: 'slow', label: 'Chậm' },
          { key: 'exam', label: 'Chuẩn thi' },
        ]}
        value={s.speed}
        onChange={(speed) => update({ speed })}
      />
      <T v="caption" muted>
        Mức sửa lỗi mỗi câu
      </T>
      <Segmented
        options={[
          { key: 'light', label: 'Nhẹ · 1 lỗi' },
          { key: 'medium', label: 'Vừa · 2' },
          { key: 'strict', label: 'Kỹ · 3' },
        ]}
        value={s.correction}
        onChange={(correction) => update({ correction })}
      />

      <SectionHeader title="Nhắc học" />
      <ListItem
        title="Giám khảo “gọi” bạn mỗi ngày"
        subtitle={s.reminderHour >= 0 ? `Lúc ${s.reminderHour}:00` : 'Đang tắt'}
        right={
          <Toggle label="Nhắc học mỗi ngày" value={s.reminderHour >= 0} onChange={(v) => setReminder(v ? 20 : -1)} />
        }
      />
      {s.reminderHour >= 0 ? (
        <Chips>
          {HOURS.map((h) => (
            <Chip key={h} label={`${h}:00`} selected={s.reminderHour === h} onPress={() => setReminder(h)} />
          ))}
        </Chips>
      ) : null}

      <SectionHeader title="Giao diện" />
      <Segmented
        options={[
          { key: 'system', label: 'Theo máy' },
          { key: 'light', label: 'Sáng' },
          { key: 'dark', label: 'Tối' },
        ]}
        value={theme}
        onChange={(t) => set({ theme: t })}
      />

      <SectionHeader title="Học tập" />
      <ListItem title="Đổi mục tiêu và ngày thi" chevron onPress={() => router.push('/goals')} />
      <ListItem
        title="Nhập điểm IELTS thật"
        subtitle="Giúp app chấm sát hơn"
        chevron
        onPress={() => router.push('/placement')}
      />

      {auth ? (
        <>
          <SectionHeader title="Tài khoản" />
          <Button title="Đăng xuất" variant="secondary" onPress={() => setConfirmOut(true)} />
        </>
      ) : null}
      <Dialog
        visible={confirmOut}
        title="Đăng xuất?"
        body="Lộ trình và sổ tay đã lưu vẫn còn trên máy này."
        confirm="Đăng xuất"
        destructive
        onConfirm={() => {
          signOut();
          setConfirmOut(false);
          router.replace('/welcome');
        }}
        cancel="Huỷ"
        onCancel={() => setConfirmOut(false)}
      />
    </Screen>
  );
}
