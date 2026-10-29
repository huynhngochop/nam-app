import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Screen } from '@nam/ui';
import { TxDetail } from '../../src/TxDetail';

/** VG-09 trên điện thoại. */
export default function TxScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title="Chi tiết" onBack={() => router.back()} />
      <TxDetail id={id} />
    </Screen>
  );
}
