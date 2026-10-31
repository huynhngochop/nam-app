import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  Card,
  Check,
  Chip,
  Chips,
  EmptyState,
  IconButton,
  ListItem,
  Radio,
  Row,
  Screen,
  StepBar,
  T,
  TextField,
  Toggle,
  useTheme,
} from '@nam/ui';
import { fold, track, vnd } from '@nam/core';
import { useHen } from '../src/store';
import { Hours } from '../src/types';

const TYPES = ['Salon tóc', 'Nail', 'Spa', 'Barber', 'Studio', 'Khác'];
const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const SUGGEST: Record<string, { name: string; durationMin: number; price: number; group: string }[]> = {
  'Salon tóc': [
    { name: 'Cắt + gội + sấy', durationMin: 45, price: 180000, group: 'Tóc' },
    { name: 'Cắt nam', durationMin: 30, price: 120000, group: 'Tóc' },
    { name: 'Nhuộm', durationMin: 120, price: 600000, group: 'Tóc' },
    { name: 'Uốn', durationMin: 150, price: 800000, group: 'Tóc' },
    { name: 'Gội dưỡng sinh', durationMin: 60, price: 150000, group: 'Gội dưỡng' },
  ],
  Nail: [
    { name: 'Sơn gel', durationMin: 60, price: 200000, group: 'Nail' },
    { name: 'Đắp bột', durationMin: 90, price: 350000, group: 'Nail' },
    { name: 'Vẽ móng', durationMin: 30, price: 100000, group: 'Nail' },
  ],
  Spa: [
    { name: 'Chăm sóc da cơ bản', durationMin: 60, price: 300000, group: 'Spa' },
    { name: 'Massage body', durationMin: 90, price: 450000, group: 'Spa' },
  ],
  Barber: [
    { name: 'Cắt tóc nam', durationMin: 30, price: 100000, group: 'Tóc' },
    { name: 'Cạo mặt', durationMin: 20, price: 50000, group: 'Tóc' },
  ],
};
const slug = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** HD-C02 · Thiết lập tiệm (4 bước). Bước 3 ưu tiên "Chụp bảng giá" (HD-C17). */
export default function Setup() {
  const { c } = useTheme();
  const s = useHen();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(s.shop.name === 'Salon Mây' ? '' : s.shop.name);
  const [type, setType] = useState(s.shop.type);
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState<Hours>(s.shop.hours);
  const [same, setSame] = useState(true);
  const [picked, setPicked] = useState<number[]>([]);
  const [solo, setSolo] = useState(true);
  const [staffName, setStaffName] = useState('');
  const [staffList, setStaffList] = useState<string[]>([]);
  const sugg = SUGGEST[type] ?? [];

  const next = () => {
    track('setup_step_completed', { step });
    if (step === 0) s.setShop({ name: name.trim(), type, address: address.trim(), slug: slug(name) || 'tiem-cua-toi' });
    if (step === 1) s.setShop({ hours });
    if (step === 2 && picked.length) s.addServices(picked.map((i) => ({ ...sugg[i], staffIds: [], visible: true })));
    if (step === 3) {
      const names = solo ? ['Tôi'] : staffList;
      names.forEach((n) =>
        s.upsertStaff({
          name: n,
          role: solo ? 'owner' : 'stylist',
          shiftFrom: '08:00',
          shiftTo: '20:00',
          onlineToday: true,
          commissionPct: 0,
        }),
      );
      const ids = useHen.getState().staff.map((x) => x.id);
      useHen.setState((st) => ({
        services: st.services.map((x) => (x.staffIds.length ? x : { ...x, staffIds: ids })),
      }));
    }
    if (step < 4) setStep(step + 1);
  };
  const setDay = (d: number, p: Partial<Hours[number]>) =>
    setHours((h) =>
      h.map((x) => (x.day === d || (same && d === 1 && x.open && (p.from || p.to)) ? { ...x, ...p } : x)),
    );

  if (step === 4) {
    return (
      <Screen
        scroll
        edges={['top', 'bottom']}
        footer={
          <>
            <Button
              title="Chia sẻ link đặt lịch"
              icon="share-2"
              onPress={() => {
                s.set({ setupDone: true });
                track('setup_finished');
                router.replace('/link');
              }}
            />
            <Button
              title="Vào lịch"
              variant="secondary"
              onPress={() => {
                s.set({ setupDone: true });
                router.replace('/(tabs)/calendar');
              }}
            />
          </>
        }
      >
        <EmptyState
          icon="check-circle"
          title="Tiệm đã sẵn sàng"
          body={`Khách đặt lịch tại hendep.app/${useHen.getState().shop.slug}`}
        />
        <Card variant="tint">
          <T v="body">Muốn xem thử với dữ liệu mẫu (thợ, khách, lịch hẹn)?</T>
          <Button
            title="Nạp dữ liệu mẫu"
            size="sm"
            variant="secondary"
            onPress={() => {
              s.loadDemo();
              s.set({ setupDone: true });
              router.replace('/(tabs)/calendar');
            }}
          />
        </Card>
      </Screen>
    );
  }
  const canNext = step === 0 ? name.trim().length >= 2 : step === 3 ? solo || staffList.length > 0 : true;
  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <>
          <Button title="Tiếp tục" disabled={!canNext} onPress={next} />
          {step >= 2 ? <Button title="Làm sau" variant="text" onPress={() => setStep(step + 1)} /> : null}
        </>
      }
    >
      <Row style={{ minHeight: 48 }}>
        {step > 0 ? <IconButton icon="chevron-left" label="Quay lại" onPress={() => setStep(step - 1)} /> : null}
        <StepBar count={4} index={step} />
        <T v="caption" muted>{`${step + 1}/4`}</T>
      </Row>
      {step === 0 ? (
        <>
          <T v="title">Tiệm của bạn</T>
          <TextField
            label="Tên tiệm"
            value={name}
            onChangeText={setName}
            maxLength={60}
            placeholder="Ví dụ: Salon Mây"
          />
          <T v="caption" muted weight="semibold">
            Loại hình
          </T>
          <Chips>
            {TYPES.map((t) => (
              <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
            ))}
          </Chips>
          <TextField
            label="Địa chỉ"
            value={address}
            onChangeText={setAddress}
            placeholder="Số nhà, đường, quận"
            icon="map-pin"
          />
          {name ? <T v="caption" muted>{`Link đặt lịch: hendep.app/${slug(name)}`}</T> : null}
        </>
      ) : step === 1 ? (
        <>
          <T v="title">Giờ mở cửa</T>
          <T v="caption" muted>
            Khách chỉ đặt được trong giờ này.
          </T>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const h = hours.find((x) => x.day === d)!;
            return (
              <ListItem
                key={d}
                strong={false}
                title={DAYS[d]}
                left={<Toggle label={`Mở cửa ${DAYS[d]}`} value={h.open} onChange={(v) => setDay(d, { open: v })} />}
                right={
                  h.open ? (
                    <Row gap={4}>
                      <Chip
                        label={h.from}
                        onPress={() =>
                          setDay(d, { from: h.from === '08:00' ? '09:00' : h.from === '09:00' ? '07:00' : '08:00' })
                        }
                      />
                      <T v="caption">–</T>
                      <Chip
                        label={h.to}
                        onPress={() =>
                          setDay(d, { to: h.to === '20:00' ? '21:00' : h.to === '21:00' ? '19:00' : '20:00' })
                        }
                      />
                    </Row>
                  ) : (
                    <T v="caption" muted>
                      Nghỉ
                    </T>
                  )
                }
              />
            );
          })}
          <Pressable
            onPress={() => {
              setSame((x) => !x);
              if (!same) {
                const mon = hours.find((x) => x.day === 1)!;
                setHours((hs) => hs.map((x) => (x.open ? { ...x, from: mon.from, to: mon.to } : x)));
              }
            }}
          >
            <Row>
              <Check on={same} />
              <T v="body">Áp dụng giờ Thứ 2 cho các ngày khác</T>
            </Row>
          </Pressable>
        </>
      ) : step === 2 ? (
        <>
          <T v="title">Dịch vụ chính</T>
          <Card variant="tint" onPress={() => router.push('/scan')} accessibilityLabel="Chụp bảng giá">
            <Row>
              <IconButton
                icon="camera"
                label="Chụp bảng giá"
                color={c.a}
                bg={c.surface}
                onPress={() => router.push('/scan')}
              />
              <View style={{ flex: 1 }}>
                <T v="headline">Chụp bảng giá</T>
                <T v="caption">AI đọc tên, giá, thời lượng — bạn kiểm tra trước khi lưu.</T>
              </View>
            </Row>
          </Card>
          <T v="caption" muted weight="semibold">
            Hoặc chọn nhanh
          </T>
          {sugg.map((x, i) => (
            <ListItem
              key={x.name}
              left={<Check on={picked.includes(i)} />}
              title={x.name}
              subtitle={`${x.durationMin} phút`}
              right={<T v="headline">{vnd(x.price)}</T>}
              onPress={() => setPicked((p) => (p.includes(i) ? p.filter((y) => y !== i) : [...p, i]))}
            />
          ))}
          <T v="caption" muted>
            Giá và thời lượng sửa được sau trong Dịch vụ.
          </T>
        </>
      ) : (
        <>
          <T v="title">Ai làm ở tiệm?</T>
          <Card variant={solo ? 'outlineAccent' : 'default'} onPress={() => setSolo(true)}>
            <Row>
              <Radio on={solo} />
              <T v="headline">Chỉ mình tôi</T>
            </Row>
          </Card>
          <Card variant={!solo ? 'outlineAccent' : 'default'} onPress={() => setSolo(false)}>
            <Row>
              <Radio on={!solo} />
              <T v="headline">Có thợ / nhân viên</T>
            </Row>
          </Card>
          {!solo ? (
            <>
              <Row>
                <View style={{ flex: 1 }}>
                  <TextField
                    value={staffName}
                    onChangeText={setStaffName}
                    placeholder="Tên thợ"
                    onSubmitEditing={() => {
                      if (staffName.trim()) {
                        setStaffList((l) => [...l, staffName.trim()]);
                        setStaffName('');
                      }
                    }}
                  />
                </View>
                <IconButton
                  icon="plus"
                  label="Thêm thợ"
                  onPress={() => {
                    if (staffName.trim()) {
                      setStaffList((l) => [...l, staffName.trim()]);
                      setStaffName('');
                    }
                  }}
                />
              </Row>
              <Chips>
                {staffList.map((n) => (
                  <Chip key={n} label={n} onRemove={() => setStaffList((l) => l.filter((x) => x !== n))} />
                ))}
              </Chips>
              <T v="caption" muted>
                Mời thợ dùng app bằng mã mời trong mục Nhân viên.
              </T>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
