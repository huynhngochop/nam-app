import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, useAdaptiveTabOptions } from '@nam/ui';

export default function TabsLayout() {
  const opts = useAdaptiveTabOptions();
  return (
    <Tabs screenOptions={opts}>
      <Tabs.Screen name="home" options={{ title: 'Tổng quan', tabBarIcon: ({ color }) => <Icon name="pie-chart" color={color} size={22} /> }} />
      <Tabs.Screen name="transactions" options={{ title: 'Giao dịch', tabBarIcon: ({ color }) => <Icon name="list" color={color} size={22} /> }} />
      <Tabs.Screen name="analysis" options={{ title: 'Phân tích', tabBarIcon: ({ color }) => <Icon name="bar-chart-2" color={color} size={22} /> }} />
      <Tabs.Screen name="funds" options={{ title: 'Quỹ', tabBarIcon: ({ color }) => <Icon name="target" color={color} size={22} /> }} />
    </Tabs>
  );
}
