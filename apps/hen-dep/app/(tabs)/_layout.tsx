import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, useAdaptiveTabOptions } from '@nam/ui';
import { useHen } from '../../src/store';

/** Nhân viên chỉ thấy Lịch và Khách. */
export default function TabsLayout() {
  const opts = useAdaptiveTabOptions();
  const isStaff = useHen((s) => s.auth?.role === 'staff');
  return (
    <Tabs screenOptions={opts}>
      <Tabs.Screen name="calendar" options={{ title: 'Lịch', tabBarIcon: ({ color }) => <Icon name="calendar" color={color} size={22} /> }} />
      <Tabs.Screen name="customers" options={{ title: 'Khách', tabBarIcon: ({ color }) => <Icon name="users" color={color} size={22} /> }} />
      <Tabs.Screen name="revenue" options={{ title: 'Doanh thu', href: isStaff ? null : undefined, tabBarIcon: ({ color }) => <Icon name="bar-chart-2" color={color} size={22} /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Tiệm', href: isStaff ? null : undefined, tabBarIcon: ({ color }) => <Icon name="shopping-bag" color={color} size={22} /> }} />
    </Tabs>
  );
}
