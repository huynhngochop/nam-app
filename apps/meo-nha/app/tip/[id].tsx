import React, { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState, Screen } from '@nam/ui';
import { track } from '@nam/core';
import { tipById } from '../../src/data/tips';
import { TipDetail } from '../../src/components';

/** Trang chi tiết một mẹo (nội dung dùng chung với cột chi tiết trên tablet, xem TipDetail). */
export default function TipScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tip = tipById(String(id));
  useEffect(() => {
    if (tip) track('tip_viewed', { tipId: tip.id });
  }, [tip]);
  if (!tip)
    return (
      <Screen>
        <EmptyState
          icon="alert-circle"
          title="Không tìm thấy mẹo"
          body="Mẹo có thể đã bị gỡ."
          action="Về Khám phá"
          onAction={() => router.replace('/(tabs)/explore')}
        />
      </Screen>
    );
  return (
    <Screen scroll>
      <TipDetail tip={tip} onClose={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/explore'))} />
    </Screen>
  );
}
