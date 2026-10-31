import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppBar,
  Avatar,
  Button,
  Card,
  Check,
  Chip,
  Chips,
  ListItem,
  Row,
  Screen,
  SectionHeader,
  T,
  TextField,
  useTheme,
  useToast,
} from '@nam/ui';
import { addDays, fold, hhmm, shortDate, track, vnd } from '@nam/core';
import { durationOf, overlaps, useHen } from '../../src/store';

/** HD-C07 · Tạo lịch hẹn (khách gọi điện / vãng lai). Chạm ô trống trên lịch điền sẵn thợ + giờ. */
export default function NewBooking() {
  const { c } = useTheme();
  const toast = useToast();
  const p = useLocalSearchParams<{ staffId?: string; at?: string; customerId?: string }>();
  const s = useHen();
  const init = p.at
    ? new Date(Math.ceil(Number(p.at) / 900000) * 900000)
    : new Date(Math.ceil(Date.now() / 900000) * 900000);
  const [q, setQ] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(p.customerId ?? null);
  const [walkIn, setWalkIn] = useState(false);
  const [newName, setNewName] = useState('');
  const [svcIds, setSvcIds] = useState<string[]>(s.services.slice(0, 1).map((x) => x.id));
  const [staffId, setStaffId] = useState(p.staffId ?? s.staff[0]?.id);
  const [dayOff, setDayOff] = useState(
    Math.round((new Date(init).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000),
  );
  const [time, setTime] = useState(hhmm(init));
  const [notify, setNotify] = useState(true);

  const matches = useMemo(
    () =>
      q.length >= 2
        ? s.customers
            .filter((x) => fold(x.name).includes(fold(q)) || (x.phone ?? '').includes(q.replace(/\s/g, '')))
            .slice(0, 5)
        : [],
    [q, s.customers],
  );
  const cust = s.customers.find((x) => x.id === customerId);
  const dur = durationOf(svcIds, s.services) || 30;
  const day = addDays(new Date(), dayOff);
  const [hh, mm] = time.split(':').map(Number);
  const start = new Date(day);
  start.setHours(hh, mm, 0, 0);
  const end = start.getTime() + dur * 60000;
  const clash = staffId ? overlaps(s.bookings, staffId, start.getTime(), end) : undefined;
  const clashName = clash ? s.customers.find((x) => x.id === clash.customerId)?.name : null;
  const times = Array.from({ length: 4 * 13 }, (_, i) => {
    const m = 8 * 60 + i * 15;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  });
  const ok = (customerId || walkIn || newName.trim()) && svcIds.length && staffId;
  const eligibleStaff = s.staff.filter((st) =>
    svcIds.every((id) => {
      const sv = s.services.find((x) => x.id === id);
      return !sv?.staffIds.length || sv.staffIds.includes(st.id);
    }),
  );

  const create = () => {
    let cid = customerId;
    if (!cid)
      cid = s.upsertCustomer({
        name: walkIn ? 'Khách lẻ' : newName.trim(),
        phone: /^\d{9,11}$/.test(q.replace(/\s/g, '')) ? q.replace(/\s/g, '') : undefined,
        marketingConsent: false,
      });
    s.createBooking({
      customerId: cid,
      staffId: staffId!,
      serviceIds: svcIds,
      startAt: start.getTime(),
      endAt: end,
      source: 'manual',
    });
    track('manual_booking_created', { walkIn });
    toast(`Đã tạo lịch ${hhmm(start)}${notify && cust?.phone ? ' · đã gửi xác nhận' : ''}`, { tone: 'success' });
    router.back();
  };

  return (
    <Screen scroll edges={['top', 'bottom']} footer={<Button title="Tạo lịch hẹn" disabled={!ok} onPress={create} />}>
      <AppBar title="Tạo lịch hẹn" onBack={() => router.back()} backIcon="x" />
      {cust ? (
        <Card>
          <Row>
            <Avatar name={cust.name} soft />
            <View style={{ flex: 1 }}>
              <T v="headline">{cust.name}</T>
              <T v="caption" muted>
                {cust.phone ?? ''}
              </T>
            </View>
            <Button title="Đổi" size="sm" variant="text" onPress={() => setCustomerId(null)} />
          </Row>
        </Card>
      ) : (
        <>
          <TextField
            label="Khách"
            icon="search"
            value={q}
            onChangeText={(t) => {
              setQ(t);
              setWalkIn(false);
            }}
            placeholder="Tìm tên hoặc SĐT"
            autoFocus
          />
          {matches.map((m) => (
            <ListItem
              key={m.id}
              left={<Avatar name={m.name} soft size={36} />}
              title={m.name}
              subtitle={m.phone}
              onPress={() => setCustomerId(m.id)}
            />
          ))}
          {q.length >= 2 && !matches.length ? (
            <TextField label="Tên khách mới" value={newName} onChangeText={setNewName} placeholder="Họ tên" />
          ) : null}
          <Chip label="Khách vãng lai (không cần SĐT)" selected={walkIn} onPress={() => setWalkIn((w) => !w)} />
        </>
      )}
      <SectionHeader title="Dịch vụ" />
      <Chips>
        {s.services.map((sv) => (
          <Chip
            key={sv.id}
            label={`${sv.name} · ${vnd(sv.price)}`}
            selected={svcIds.includes(sv.id)}
            onPress={() => setSvcIds((x) => (x.includes(sv.id) ? x.filter((y) => y !== sv.id) : [...x, sv.id]))}
          />
        ))}
      </Chips>
      <SectionHeader title="Thợ" />
      <Chips>
        {eligibleStaff.map((st) => (
          <Chip key={st.id} label={st.name} selected={staffId === st.id} onPress={() => setStaffId(st.id)} />
        ))}
      </Chips>
      <SectionHeader title={`Ngày · ${shortDate(day)}`} />
      <Chips scroll>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <Chip
            key={d}
            label={d === 0 ? 'Hôm nay' : shortDate(addDays(new Date(), d))}
            selected={dayOff === d}
            onPress={() => setDayOff(d)}
          />
        ))}
      </Chips>
      <SectionHeader title={`Giờ · ${time} – ${hhmm(new Date(end))}`} />
      <Chips scroll>
        {times.map((t) => (
          <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />
        ))}
      </Chips>
      {clash ? (
        <Card variant="danger">
          <T v="body">{`Trùng với lịch ${clashName ?? 'khách'} ${hhmm(new Date(clash.startAt))}. Vẫn tạo được nếu bạn chắc chắn.`}</T>
        </Card>
      ) : null}
      {cust?.phone ? (
        <Pressable onPress={() => setNotify((n) => !n)}>
          <Row>
            <Check on={notify} />
            <T v="body">Gửi xác nhận cho khách qua Zalo</T>
          </Row>
        </Pressable>
      ) : null}
      <T v="caption" muted>{`Thời lượng ${dur} phút`}</T>
      <View style={{ height: 1, backgroundColor: c.line }} />
    </Screen>
  );
}
