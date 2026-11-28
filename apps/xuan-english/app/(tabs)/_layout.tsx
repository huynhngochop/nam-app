import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, useAdaptiveTabOptions } from '@nam/ui';

export default function TabsLayout() {
  const opts = useAdaptiveTabOptions();
  return (
    <Tabs screenOptions={opts}>
      <Tabs.Screen
        name="today"
        options={{ title: 'Hôm nay', tabBarIcon: ({ color }) => <Icon name="home" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{ title: 'Lộ trình', tabBarIcon: ({ color }) => <Icon name="map" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="practice"
        options={{ title: 'Luyện nói', tabBarIcon: ({ color }) => <Icon name="mic" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="notebook"
        options={{ title: 'Sổ tay', tabBarIcon: ({ color }) => <Icon name="book" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Tiến độ', tabBarIcon: ({ color }) => <Icon name="bar-chart-2" color={color} size={22} /> }}
      />
    </Tabs>
  );
}
