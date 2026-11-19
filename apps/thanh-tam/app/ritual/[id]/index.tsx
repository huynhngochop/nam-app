import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RitualDetail } from '../../../src/screens/RitualDetail';

/** Chi tiết lễ (trang riêng). Deep link thanhtam://ritual/{id}. */
export default function RitualScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RitualDetail id={id} />;
}
