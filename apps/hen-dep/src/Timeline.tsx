import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { T, useLayout, useTheme } from '@nam/ui';
import { hhmm } from '@nam/core';
import { Booking, Customer, Service, Staff } from './types';
import { svcOf } from './store';

const HOUR = 64;
const TIME_COL = 40;

/** Lịch theo thợ (HD-C05). Cột co giãn theo bề ngang; nhiều thợ trên màn hẹp thì cuộn ngang. */
export const Timeline = memo(function Timeline({
  day,
  staff,
  bookings,
  services,
  customers,
  openFrom,
  openTo,
  onOpen,
  onEmpty,
  selectedId,
}: {
  day: Date;
  staff: Staff[];
  bookings: Booking[];
  services: Service[];
  customers: Customer[];
  openFrom: number;
  openTo: number;
  onOpen: (b: Booking) => void;
  onEmpty: (staffId: string, at: number) => void;
  selectedId?: string | null;
}) {
  const { c } = useTheme();
  const L = useLayout();
  const scroll = useRef<ScrollView>(null);
  const hours = Array.from({ length: Math.max(1, openTo - openFrom) }, (_, i) => openFrom + i);
  const minCol = L.isCompact ? 104 : 140;
  const base = useMemo(() => {
    const d = new Date(day);
    d.setHours(openFrom, 0, 0, 0);
    return d.getTime();
  }, [day, openFrom]);
  const isToday = new Date().toDateString() === day.toDateString();
  const nowY = ((Date.now() - base) / 3600000) * HOUR;

  useEffect(() => {
    if (isToday) setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, nowY - 120), animated: false }), 50);
  }, [isToday, nowY]);

  const grid = (
    <View style={{ flexDirection: 'row', minWidth: '100%' }}>
      <View style={{ width: TIME_COL, paddingTop: 30 }}>
        {hours.map((h) => (
          <T key={h} v="caption" muted style={{ height: HOUR }}>{`${h}h`}</T>
        ))}
      </View>
      {staff.map((st) => (
        <View key={st.id} style={{ flex: 1, minWidth: minCol, paddingHorizontal: 3 }}>
          <T v="headline" center numberOfLines={1} style={{ height: 30 }}>
            {st.name}
          </T>
          <Pressable
            accessibilityLabel={`Tạo lịch cho ${st.name}`}
            onPress={(e) => {
              const y = e.nativeEvent.locationY;
              const at = base + Math.floor((y / HOUR) * 4) * 900000;
              onEmpty(st.id, at);
            }}
            style={{ height: hours.length * HOUR, backgroundColor: c.bg, borderRadius: 8 }}
          >
            {hours.map((h, i) => (
              <View
                key={h}
                style={{ position: 'absolute', top: i * HOUR, left: 0, right: 0, height: 1, backgroundColor: c.line }}
              />
            ))}
            {bookings
              .filter((b) => b.staffId === st.id && b.status !== 'cancelled')
              .map((b) => {
                const top = ((b.startAt - base) / 3600000) * HOUR;
                const h = Math.max(28, ((b.endAt - b.startAt) / 3600000) * HOUR - 2);
                const strong = b.status === 'in_service';
                const faded = b.status === 'completed';
                const cust = customers.find((x) => x.id === b.customerId);
                const sel = selectedId === b.id;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => onOpen(b)}
                    accessibilityLabel={`${cust?.name ?? 'Khách'}, ${hhmm(new Date(b.startAt))}`}
                    style={{
                      position: 'absolute',
                      top,
                      left: 2,
                      right: 2,
                      height: h,
                      borderRadius: 8,
                      padding: 6,
                      overflow: 'hidden',
                      backgroundColor: b.status === 'no_show' ? c.surface2 : strong ? c.a : c.at,
                      opacity: faded ? 0.55 : 1,
                      borderWidth: !b.synced ? 1.5 : sel ? 2 : 0,
                      borderStyle: !b.synced ? 'dashed' : 'solid',
                      borderColor: !b.synced ? c.warning : c.ink,
                    }}
                  >
                    <T
                      v="caption"
                      weight="bold"
                      color={strong ? c.onAccent : c.ink}
                      numberOfLines={1}
                    >{`${cust?.name ?? 'Khách lẻ'}${b.synced ? '' : ' ⟳'}`}</T>
                    <T v="caption" color={strong ? c.onAccent : c.inkMuted} numberOfLines={1}>
                      {b.status === 'no_show'
                        ? 'Không đến'
                        : svcOf(b.serviceIds, services)
                            .map((s) => s.name)
                            .join(', ')}
                    </T>
                  </Pressable>
                );
              })}
            {isToday && nowY > 0 && nowY < hours.length * HOUR ? (
              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: nowY, left: 0, right: 0, height: 2, backgroundColor: c.negative }}
              />
            ) : null}
          </Pressable>
        </View>
      ))}
    </View>
  );
  const needsH = staff.length * minCol + TIME_COL > L.width - 32;
  return (
    <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 96 }}>
      {needsH ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {grid}
        </ScrollView>
      ) : (
        grid
      )}
    </ScrollView>
  );
});
