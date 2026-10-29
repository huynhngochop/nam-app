import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Screen } from '@nam/ui';
import { CustomerDetail } from '../../src/CustomerDetail';

/** HD-C09 trên điện thoại. /customer/new = thêm khách. */
export default function CustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title={id === 'new' ? '' : 'Hồ sơ khách'} onBack={() => router.back()} />
      <CustomerDetail id={id} />
    </Screen>
  );
}
