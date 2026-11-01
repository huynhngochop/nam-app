import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, Chips, EmptyState, FAB, IconButton, Row, T, TwoPane, useLayout, useTheme } from '@nam/ui';
import { addDays, hhmm, shortDate, weekdayLong } from '@nam/core';
import { findGap, isActive, useHen } from '../../src/store';
import { Timeline } from '../../src/Timeline';
import { BookingDetail } from '../../src/BookingDetail';
import { SyncBar } from '../../src/sync';
import { Booking } from '../../src/types';

/** HD-C05 Lịch hôm nay (+ HD-C15/16). Tablet ngang: lịch bên trái, chi tiết lịch hẹn bên phải. */
export default function Calendar() {
  const { c } = useTheme();
  const L = useLayout();
  const s = useHen();
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<'day' | 'staff'>('day');
  const [staffFocus, setStaffFocus] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const day = addDays(new Date(), offset);
  const myStaffId = s.auth?.role === 'staff' ? s.auth.staffId : undefined;

  const dayBookings = useMemo(
    () => s.bookings.filter((b) => new Date(b.startAt).toDateString() === day.toDateString()),
    [s.bookings, day],
  );
  const staff = useMemo(
    () =>
      s.staff.filter((x) =>
        myStaffId ? x.id === myStaffId : view === 'staff' && staffFocus ? x.id === staffFocus : true,
      ),
    [s.staff, myStaffId, view, staffFocus],
  );
  const hours = s.shop.hours.find((h) => h.day === day.getDay());
  const openFrom = Number((hours?.from ?? '08:00').slice(0, 2));
  const openTo = Number((hours?.to ?? '20:00').slice(0, 2)) + 1;
  const gap = offset === 0 ? findGap(s.staff, s.bookings, Date.now(), s.shop.hours) : null;
  const open = (b: Booking) => (L.twoPane ? setSel(b.id) : router.push(`/booking/${b.id}`));
  const selected = s.bookings.find((b) => b.id === sel);

  const main = (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: L.gutter, gap: 10, paddingTop: 8 }}>
        <Row between>
          <View style={{ flex: 1 }}>
            <T
              v="caption"
              muted
            >{`${weekdayLong(day)}, ${shortDate(day).split(', ')[1]} · ${dayBookings.filter(isActive).length} lịch hẹn`}</T>
            <T v="display" accessibilityRole="header">
              {offset === 0 ? 'Lịch hôm nay' : `Lịch ${shortDate(day)}`}
            </T>
          </View>
          <IconButton icon="chevron-left" label="Ngày trước" onPress={() => setOffset((o) => o - 1)} />
          <IconButton icon="chevron-right" label="Ngày sau" onPress={() => setOffset((o) => o + 1)} />
        </Row>
        {!myStaffId ? (
          <Chips scroll>
            <Chip
              label="Ngày"
              selected={view === 'day'}
              onPress={() => {
                setView('day');
                setStaffFocus(null);
              }}
            />
            {offset !== 0 ? <Chip label="Hôm nay" onPress={() => setOffset(0)} /> : null}
            {s.staff.map((st) => (
              <Chip
                key={st.id}
                label={st.name}
                selected={view === 'staff' && staffFocus === st.id}
                onPress={() => {
                  setView('staff');
                  setStaffFocus(st.id);
                }}
              />
            ))}
          </Chips>
        ) : null}
        {gap ? (
          <Card variant="tint">
            <Row between>
              <T
                v="headline"
                style={{ flex: 1 }}
              >{`Trống ${hhmm(new Date(gap.from))}–${hhmm(new Date(gap.to))} · ${s.staff.find((x) => x.id === gap.staffId)?.name}`}</T>
              <Button
                title="Gửi ưu đãi"
                size="sm"
                onPress={() =>
                  router.push({
                    pathname: '/campaign',
                    params: { window: `${hhmm(new Date(gap.from))}–${hhmm(new Date(gap.to))}` },
                  })
                }
              />
            </Row>
            <T v="caption">Gợi ý: nhắn khách quen lâu chưa quay lại</T>
          </Card>
        ) : null}
      </View>
      {!s.staff.length ? (
        <ScrollView>
          <EmptyState
            icon="users"
            title="Chưa có thợ"
            body="Thêm thợ để bắt đầu nhận lịch."
            action="Thêm thợ"
            onAction={() => router.push('/staff')}
          />
        </ScrollView>
      ) : !hours?.open ? (
        <EmptyState icon="moon" title="Tiệm nghỉ ngày này" body="Đổi giờ mở cửa trong Cài đặt tiệm." />
      ) : (
        <View style={{ flex: 1, paddingHorizontal: L.gutter - 4, paddingTop: 8 }}>
          <Timeline
            day={day}
            staff={staff}
            bookings={dayBookings}
            services={s.services}
            customers={s.customers}
            openFrom={openFrom}
            openTo={openTo}
            selectedId={sel}
            onOpen={open}
            onEmpty={(staffId, at) => router.push({ pathname: '/booking/new', params: { staffId, at: String(at) } })}
          />
        </View>
      )}
      <FAB
        label="Tạo lịch hẹn"
        onPress={() => router.push({ pathname: '/booking/new', params: { at: String(Date.now()) } })}
      />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <SyncBar />
      <TwoPane
        listWidth={0.6}
        list={main}
        detail={
          selected ? (
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <BookingDetail booking={selected} onClose={() => setSel(null)} />
            </ScrollView>
          ) : undefined
        }
        emptyDetail={<EmptyState icon="calendar" title="Chọn một lịch hẹn" body="Chi tiết sẽ hiện ở đây." />}
      />
    </SafeAreaView>
  );
}
