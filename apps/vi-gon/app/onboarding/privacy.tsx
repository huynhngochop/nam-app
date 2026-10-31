import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Row, Screen, StepDots, T, Thumb, useTheme , IconName } from '@nam/ui';

const PROMISES: { icon: IconName; t: string; s: string }[] = [
  { icon: 'smartphone', t: 'Xử lý trên điện thoại', s: 'Nội dung thông báo không gửi lên máy chủ.' },
  { icon: 'lock', t: 'Khóa bằng Face ID / vân tay', s: 'Không ai mở được Ví Gọn ngoài bạn.' },
  { icon: 'eye-off', t: 'Không cần mật khẩu ngân hàng', s: 'Ví Gọn không kết nối hay đăng nhập ngân hàng.' },
];

/** VG-02 · Cam kết riêng tư (1/3). */
export default function Privacy() {
  const { c } = useTheme();
  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={<Button title="Tiếp tục" onPress={() => router.push('/onboarding/permission')} />}
    >
      <Row between style={{ minHeight: 48 }}>
        <StepDots count={3} index={0} />
        <Button title="Bỏ qua" variant="text" size="sm" onPress={() => router.push('/onboarding/budget')} />
      </Row>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: c.at,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="shield" size={40} color={c.a} />
      </View>
      <T v="display" accessibilityRole="header">
        Dữ liệu của bạn ở lại trên máy
      </T>
      {PROMISES.map((p) => (
        <Row key={p.t} gap={12} style={{ alignItems: 'flex-start' }}>
          <Thumb icon={p.icon} color={c.a} bg={c.at} />
          <View style={{ flex: 1 }}>
            <T v="headline">{p.t}</T>
            <T v="caption" muted>
              {p.s}
            </T>
          </View>
        </Row>
      ))}
    </Screen>
  );
}
