import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, useAdaptiveTabOptions } from '@nam/ui';

/** Tab dưới trên điện thoại; thanh dọc bên trái trên tablet ngang / máy gập mở ngang. */
export default function TabsLayout() {
  const opts = useAdaptiveTabOptions();
  return (
    <Tabs screenOptions={opts}>
      <Tabs.Screen
        name="explore"
        options={{ title: 'Khám phá', tabBarIcon: ({ color }) => <Icon name="home" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="fridge"
        options={{ title: 'Tủ lạnh', tabBarIcon: ({ color }) => <Icon name="archive" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="saved"
        options={{ title: 'Đã lưu', tabBarIcon: ({ color }) => <Icon name="bookmark" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: 'Tôi', tabBarIcon: ({ color }) => <Icon name="user" color={color} size={22} /> }}
      />
    </Tabs>
  );
}
