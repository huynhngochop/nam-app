import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Screen, T, useTheme } from '@nam/ui';
import { track } from '@nam/core';

/** VG-01 · Chào mừng. */
export default function Welcome() {
  const { c } = useTheme();
  return (
    <Screen edges={['top', 'bottom']} bg={c.a} footer={<View style={{ gap: 8 }}>
      <Button title="Bắt đầu" color={c.onAccent} textColor={c.a} onPress={() => { track('onboarding_started'); router.push('/onboarding/privacy'); }} />
      <Button title="Khôi phục từ bản sao lưu" variant="text" textColor={c.onAccent} onPress={() => router.push('/restore')} />
    </View>}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: c.onAccent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="credit-card" size={36} color={c.a} />
        </View>
        <T v="display" color={c.onAccent} style={{ fontSize: 30, lineHeight: 36 }}>Chi tiêu tự ghi, tiền tự rõ</T>
        <T v="body" color={c.onAccent}>Ví Gọn đọc thông báo ngân hàng ngay trên máy, xếp vào danh mục, nhắc khi sắp vượt ngân sách.</T>
      </View>
    </Screen>
  );
}
