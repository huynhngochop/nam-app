import React, { memo, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { useTheme } from './theme';
import { fonts } from './tokens';
import { T } from './components/base';

/** Biểu đồ cột tự co giãn theo độ rộng khung (điện thoại, máy gập, tablet). */
export const BarChart = memo(function BarChart({
  data,
  height = 110,
  highlight,
  color,
  soft,
  onSelect,
  format,
}: {
  data: { label: string; value: number }[];
  height?: number;
  highlight?: number;
  color?: string;
  soft?: string;
  onSelect?: (i: number) => void;
  format?: (v: number) => string;
}) {
  const { c } = useTheme();
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: 6 }}>
      {sel != null && format ? (
        <T v="caption" muted>
          {data[sel].label}: {format(data[sel].value)}
        </T>
      ) : null}
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        {data.map((d, i) => (
          <Pressable
            key={i}
            accessibilityLabel={`${d.label}: ${format ? format(d.value) : d.value}`}
            onPress={() => {
              setSel(i);
              onSelect?.(i);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}
          >
            <View
              style={{
                width: '100%',
                height: Math.max(4, (d.value / max) * (height - 20)),
                borderRadius: 6,
                backgroundColor: i === (sel ?? highlight) ? (color ?? c.a) : (soft ?? c.at),
              }}
            />
            <T v="caption" muted numberOfLines={1} style={{ fontSize: 11 }}>
              {d.label}
            </T>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

export function LineChart({
  series,
  height = 90,
}: {
  series: { values: number[]; color: string; dashed?: boolean }[];
  height?: number;
}) {
  const [w, setW] = useState(0);
  const all = series.flatMap((s) => s.values);
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  return (
    <View onLayout={onLayout} style={{ height }}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          {series.map((s, k) => {
            const n = Math.max(1, s.values.length - 1);
            const pts = s.values
              .map((v, i) => `${(i / n) * (w - 8) + 4},${height - 6 - ((v - min) / (max - min || 1)) * (height - 12)}`)
              .join(' ');
            return (
              <Polyline
                key={k}
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeDasharray={s.dashed ? '5 5' : undefined}
                strokeLinejoin="round"
              />
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

/** Vòng tiến độ (Nhịp, ngân sách Ví Gọn). */
export function Ring({
  size = 220,
  stroke = 12,
  progress,
  color,
  track,
  label,
  sub,
  labelColor,
  subColor,
}: {
  size?: number;
  stroke?: number;
  progress: number;
  color?: string;
  track?: string;
  label: string;
  sub?: string;
  labelColor?: string;
  subColor?: string;
}) {
  const { c } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={`${label}${sub ? ', ' + sub : ''}`}
      style={{ width: size, height: size, alignSelf: 'center' }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? c.surface2} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? c.a}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <SvgText
          x={size / 2}
          y={size / 2 + size * 0.06}
          textAnchor="middle"
          fill={labelColor ?? c.ink}
          fontSize={size * 0.2}
          fontFamily={fonts.bold}
        >
          {label}
        </SvgText>
        {sub ? (
          <SvgText
            x={size / 2}
            y={size / 2 + size * 0.18}
            textAnchor="middle"
            fill={subColor ?? c.inkMuted}
            fontSize={Math.max(11, size * 0.055)}
            fontFamily={fonts.medium}
          >
            {sub}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}
