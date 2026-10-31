import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, useAdaptiveTabOptions } from '@nam/ui';

/** Tab dưới trên điện thoại và máy gập khi gập; thanh dọc bên trái khi màn rộng (tablet ngang, máy gập mở ngang). */
export default function TabsLayout() {
  const opts = useAdaptiveTabOptions();
  return (
    <Tabs screenOptions={opts}>
      <Tabs.Screen
        name="today"
        options={{
          title: 'Hôm nay',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="home" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="rituals"
        options={{
          title: 'Bài cúng',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="book-open" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Lịch',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="calendar" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Tra cứu',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="compass" color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
