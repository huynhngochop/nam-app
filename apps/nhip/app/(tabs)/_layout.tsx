import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, useAdaptiveTabOptions } from '@nam/ui';

export default function TabsLayout() {
  const opts = useAdaptiveTabOptions();
  return (
    <Tabs screenOptions={opts}>
      <Tabs.Screen name="timer" options={{ title: 'Hẹn giờ', tabBarIcon: ({ color }) => <Icon name="clock" color={color} size={22} /> }} />
      <Tabs.Screen name="sounds" options={{ title: 'Âm thanh', tabBarIcon: ({ color }) => <Icon name="headphones" color={color} size={22} /> }} />
      <Tabs.Screen name="stats" options={{ title: 'Thống kê', tabBarIcon: ({ color }) => <Icon name="bar-chart-2" color={color} size={22} /> }} />
      <Tabs.Screen name="me" options={{ title: 'Tôi', tabBarIcon: ({ color }) => <Icon name="user" color={color} size={22} /> }} />
    </Tabs>
  );
}
