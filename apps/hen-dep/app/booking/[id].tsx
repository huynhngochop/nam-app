import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState, Screen } from '@nam/ui';
import { useHen } from '../../src/store';
import { BookingDetail } from '../../src/BookingDetail';

/** HD-C06 trên điện thoại / màn hẹp. */
export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = useHen((s) => s.bookings.find((x) => x.id === id));
  if (!b) return <Screen><EmptyState icon="alert-circle" title="Không tìm thấy lịch hẹn" action="Về lịch" onAction={() => router.replace('/(tabs)/calendar')} /></Screen>;
  return <Screen scroll><BookingDetail booking={b} onClose={() => router.back()} /></Screen>;
}
