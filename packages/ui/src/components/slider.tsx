import React, { useRef, useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';
import { useTheme } from '../theme';

/** Thanh trượt nhẹ (không cần thư viện ngoài). Hỗ trợ kéo, chạm, và đọc màn hình (tăng/giảm 10%). */
export function Slider({ value, onChange, label, step = 0.05 }: { value: number; onChange: (v: number) => void; label: string; step?: number }) {
  const { c } = useTheme();
  const [w, setW] = useState(0);
  const last = useRef(value);
  const set = (x: number) => {
    if (!w) return;
    const v = Math.max(0, Math.min(1, Math.round(x / w / step) * step));
    if (v !== last.current) { last.current = v; onChange(v); }
  };
  const onEv = (e: GestureResponderEvent) => set(e.nativeEvent.locationX);
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(0, Math.min(1, value + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1))))}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onEv}
      onResponderMove={onEv}
      hitSlop={{ top: 12, bottom: 12 }}
      style={{ height: 24, justifyContent: 'center' }}
    >
      <View pointerEvents="none" style={{ height: 6, borderRadius: 3, backgroundColor: c.surface2 }}>
        <View style={{ width: `${value * 100}%`, height: 6, borderRadius: 3, backgroundColor: c.a }} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: Math.max(0, value * w - 11), width: 22, height: 22, borderRadius: 11, backgroundColor: c.surface, borderWidth: 2, borderColor: c.a }} />
    </View>
  );
}
