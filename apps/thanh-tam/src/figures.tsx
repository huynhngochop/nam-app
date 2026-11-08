import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fonts, useTheme } from '@nam/ui';
import type { FigureId } from './data/types';

/**
 * Hình minh họa tự vẽ (không dùng ảnh): vài KB mã, nét ở mọi cỡ màn, đổi màu theo nền sáng/tối.
 * Trên hình chỉ có số; chú thích viết bên ngoài (màn hướng dẫn) để phóng theo cỡ chữ hệ thống và đọc được bằng TalkBack.
 */
type Pal = { ink: string; muted: string; fill: string; tint: string; a: string; gold: string; on: string; bg: string };

const SW = 3;

function Num({ x, y, n, p }: { x: number; y: number; n: number; p: Pal }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={10} fill={p.a} stroke={p.bg} strokeWidth={2} />
      <SvgText x={x} y={y + 4} textAnchor="middle" fontSize={12} fontFamily={fonts.bold} fill={p.on}>
        {n}
      </SvgText>
    </G>
  );
}

/** Nén hương: thân, đầu đỏ, khói. */
function Stick({ x, y0, y1, p, tilt = 0 }: { x: number; y0: number; y1: number; p: Pal; tilt?: number }) {
  return (
    <G>
      <Line x1={x} y1={y0} x2={x + tilt} y2={y1} stroke={p.gold} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={x + tilt} cy={y1} r={2.6} fill={p.a} />
      <Path
        d={`M${x + tilt} ${y1 - 4} q -4 -6 0 -12 q 4 -6 0 -12`}
        stroke={p.muted}
        strokeWidth={1.4}
        fill="none"
        opacity={0.6}
      />
    </G>
  );
}

/** Bát hương nhìn ngang. */
function Bowl({ cx, y, w, p }: { cx: number; y: number; w: number; p: Pal }) {
  const h = w * 0.55;
  return (
    <G>
      <Path
        d={`M${cx - w / 2} ${y} h ${w} q 0 ${h} ${-w / 2} ${h} q ${-w / 2} 0 ${-w / 2} ${-h} z`}
        fill={p.tint}
        stroke={p.ink}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <Rect x={cx - w * 0.22} y={y + h} width={w * 0.44} height={5} rx={2} fill={p.ink} />
    </G>
  );
}

function Cup({ cx, y, p, fill = 0.66 }: { cx: number; y: number; p: Pal; fill?: number }) {
  const w = 16;
  const h = 13;
  return (
    <G>
      <Path
        d={`M${cx - w / 2} ${y} h ${w} l -3 ${h} h ${-(w - 6)} z`}
        fill={p.fill}
        stroke={p.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {fill > 0 ? (
        <Path
          d={`M${cx - w / 2 + 3 * (1 - fill)} ${y + h * (1 - fill)} h ${w - 6 * (1 - fill)} l ${-3 * fill} ${h * fill} h ${-(w - 6)} z`}
          fill={p.gold}
          opacity={0.75}
        />
      ) : null}
    </G>
  );
}

function Candle({ cx, y, p }: { cx: number; y: number; p: Pal }) {
  return (
    <G>
      <Ellipse cx={cx} cy={y - 8} rx={4} ry={7} fill={p.gold} />
      <Ellipse cx={cx} cy={y - 7} rx={1.8} ry={3.5} fill={p.a} />
      <Rect x={cx - 5} y={y} width={10} height={36} rx={2} fill={p.fill} stroke={p.ink} strokeWidth={2} />
      <Rect x={cx - 10} y={y + 36} width={20} height={5} rx={2} fill={p.ink} />
    </G>
  );
}

/** Người nhìn nghiêng (quay sang phải, phía bàn thờ). Mỗi tư thế là một bộ điểm. */
type Pose = {
  head: [number, number];
  path: string;
  hands?: [number, number];
};
function Person({ pose, p, ox }: { pose: Pose; p: Pal; ox: number }) {
  return (
    <G transform={`translate(${ox} 0)`}>
      <Path d={pose.path} stroke={p.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={12} fill={p.fill} stroke={p.ink} strokeWidth={SW} />
      {pose.hands ? <Circle cx={pose.hands[0]} cy={pose.hands[1]} r={5} fill={p.a} /> : null}
    </G>
  );
}
const STAND_CHEST: Pose = {
  head: [48, 40],
  path: 'M48 54 L48 122 L44 184 M48 122 L56 184 M48 64 L62 86 L70 74',
  hands: [70, 74],
};
const STAND_FOREHEAD: Pose = {
  head: [48, 40],
  path: 'M48 54 L48 122 L44 184 M48 122 L56 184 M48 64 L66 60 L70 40',
  hands: [70, 40],
};
const BOW: Pose = {
  head: [90, 62],
  path: 'M38 122 L80 72 M38 122 L36 184 M38 122 L46 184 M76 78 L84 100 L92 108',
  hands: [92, 108],
};
const KNEEL: Pose = {
  head: [52, 64],
  path: 'M52 78 L52 136 L64 182 L28 184 M58 88 L70 82 L74 62',
  hands: [74, 62],
};
const PROSTRATE: Pose = {
  head: [92, 168],
  path: 'M42 156 L80 162 M42 156 L60 182 L26 184 M78 164 L96 182 L106 183',
  hands: [104, 182],
};

function Ground({ w, p }: { w: number; p: Pal }) {
  return <Line x1={4} y1={187} x2={w - 4} y2={187} stroke={p.muted} strokeWidth={2} strokeDasharray="6 5" />;
}

/* ---------- Mâm cỗ nhìn từ trên xuống ---------- */
type Dish = 'bowl' | 'plate' | 'chicken' | 'slices' | 'rolls' | 'mound' | 'small';
function DishShape({ kind, x, y, p }: { kind: Dish; x: number; y: number; p: Pal }) {
  const ring = (r: number) => <Circle cx={x} cy={y} r={r} fill={p.bg} stroke={p.ink} strokeWidth={2} />;
  switch (kind) {
    case 'bowl':
      return (
        <G>
          {ring(19)}
          <Circle cx={x} cy={y} r={13} fill={p.gold} opacity={0.55} />
        </G>
      );
    case 'small':
      return (
        <G>
          {ring(14)}
          <Circle cx={x} cy={y} r={9} fill={p.a} opacity={0.35} />
        </G>
      );
    case 'chicken':
      return (
        <G>
          {ring(22)}
          <Ellipse cx={x - 2} cy={y + 2} rx={13} ry={10} fill={p.gold} />
          <Circle cx={x + 11} cy={y - 8} r={5} fill={p.gold} />
          <Path d={`M${x + 15} ${y - 9} l 5 1`} stroke={p.a} strokeWidth={2} />
        </G>
      );
    case 'slices':
      return (
        <G>
          {ring(22)}
          {[-9, 0, 9].map((d) => (
            <Circle key={d} cx={x + d} cy={y} r={6} fill={p.fill} stroke={p.ink} strokeWidth={1} />
          ))}
        </G>
      );
    case 'rolls':
      return (
        <G>
          {ring(22)}
          {[-8, 0, 8].map((d) => (
            <Rect key={d} x={x - 12} y={y + d - 3} width={24} height={6} rx={3} fill={p.gold} />
          ))}
        </G>
      );
    case 'mound':
      return (
        <G>
          {ring(22)}
          <Circle cx={x} cy={y} r={14} fill={p.a} opacity={0.45} />
        </G>
      );
    default:
      return (
        <G>
          {ring(22)}
          <Rect x={x - 11} y={y - 7} width={22} height={14} rx={3} fill={p.tint} stroke={p.ink} strokeWidth={1} />
        </G>
      );
  }
}
const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => [
  cx + r * Math.cos((deg * Math.PI) / 180),
  cy + r * Math.sin((deg * Math.PI) / 180),
];
function Tray({ items, p }: { items: { at: [number, number]; kind: Dish }[]; p: Pal }) {
  return (
    <G>
      <Circle cx={160} cy={110} r={104} fill={p.tint} stroke={p.ink} strokeWidth={SW} />
      <Circle cx={160} cy={110} r={96} fill="none" stroke={p.muted} strokeWidth={1} strokeDasharray="4 4" />
      {items.map((it, i) => (
        <G key={i}>
          <DishShape kind={it.kind} x={it.at[0]} y={it.at[1]} p={p} />
          <Num x={it.at[0] + 15} y={it.at[1] - 15} n={i + 1} p={p} />
        </G>
      ))}
    </G>
  );
}

/* ---------- Từng hình ---------- */
const VB: Record<FigureId, [number, number]> = {
  'ban-tho': [320, 200],
  'mam-bac': [320, 220],
  'mam-nam': [320, 220],
  'mam-chay': [320, 220],
  vai: [330, 195],
  lay: [420, 195],
  'ba-tuan': [330, 180],
  'cham-tra': [330, 170],
  'thap-huong': [330, 170],
  'nhieu-ban-tho': [330, 196],
};

function Draw({ id, p }: { id: FigureId; p: Pal }) {
  switch (id) {
    case 'ban-tho':
      return (
        <G>
          {/* ảnh thờ */}
          <Rect x={136} y={14} width={48} height={60} rx={4} fill={p.fill} stroke={p.ink} strokeWidth={SW} />
          <Circle cx={160} cy={38} r={9} fill={p.muted} opacity={0.5} />
          <Path d="M146 64 q14 -16 28 0" fill={p.muted} opacity={0.5} />
          {/* bàn */}
          <Rect x={18} y={150} width={284} height={10} rx={3} fill={p.ink} />
          <Rect x={30} y={160} width={8} height={30} fill={p.ink} />
          <Rect x={282} y={160} width={8} height={30} fill={p.ink} />
          {/* bát hương + 3 nén */}
          <Stick x={152} y0={110} y1={80} p={p} tilt={-4} />
          <Stick x={160} y0={110} y1={76} p={p} />
          <Stick x={168} y0={110} y1={80} p={p} tilt={4} />
          <Bowl cx={160} y={106} w={44} p={p} />
          {/* đèn nến */}
          <Candle cx={104} y={109} p={p} />
          <Candle cx={216} y={109} p={p} />
          {/* ba chén */}
          <Cup cx={138} y={137} p={p} />
          <Cup cx={160} y={137} p={p} fill={0.5} />
          <Cup cx={182} y={137} p={p} />
          {/* lọ hoa (bên phải người nhìn) */}
          <Path d="M252 150 q-12 -22 0 -44 h16 q12 22 0 44 z" fill={p.fill} stroke={p.ink} strokeWidth={SW} />
          <Line x1={260} y1={106} x2={252} y2={76} stroke={p.ink} strokeWidth={2} />
          <Line x1={260} y1={106} x2={268} y2={74} stroke={p.ink} strokeWidth={2} />
          <Line x1={260} y1={106} x2={260} y2={70} stroke={p.ink} strokeWidth={2} />
          <Circle cx={252} cy={74} r={7} fill={p.a} />
          <Circle cx={268} cy={72} r={7} fill={p.gold} />
          <Circle cx={260} cy={66} r={7} fill={p.a} />
          {/* đĩa quả (bên trái người nhìn) */}
          <Path d="M36 146 h56 l-8 4 h-40 z" fill={p.ink} />
          <Circle cx={52} cy={134} r={11} fill={p.gold} />
          <Circle cx={74} cy={134} r={11} fill={p.a} opacity={0.8} />
          <Circle cx={63} cy={117} r={11} fill={p.gold} opacity={0.85} />
          {/* bàn phụ, mâm cơm */}
          <Ellipse cx={160} cy={180} rx={60} ry={8} fill={p.tint} stroke={p.ink} strokeWidth={2} />
          <Ellipse cx={134} cy={176} rx={12} ry={5} fill={p.gold} />
          <Ellipse cx={160} cy={175} rx={12} ry={5} fill={p.a} opacity={0.6} />
          <Ellipse cx={186} cy={176} rx={12} ry={5} fill={p.gold} />
          <Num x={196} y={24} n={1} p={p} />
          <Num x={190} y={100} n={2} p={p} />
          <Num x={88} y={96} n={3} p={p} />
          <Num x={204} y={140} n={4} p={p} />
          <Num x={284} y={92} n={5} p={p} />
          <Num x={36} y={112} n={6} p={p} />
          <Num x={232} y={176} n={7} p={p} />
        </G>
      );
    case 'mam-bac': {
      const bowls = [0, 90, 180, 270].map((d) => ({ at: polar(160, 110, 40, d - 45), kind: 'bowl' as Dish }));
      const plates: Dish[] = ['chicken', 'slices', 'rolls', 'mound', 'plate', 'small'];
      return (
        <Tray
          p={p}
          items={[...bowls, ...plates.map((k, i) => ({ at: polar(160, 110, 76, i * 60 - 15), kind: k }))]}
        />
      );
    }
    case 'mam-nam': {
      const ring: Dish[] = ['bowl', 'slices', 'small', 'chicken', 'rolls', 'mound'];
      return (
        <Tray
          p={p}
          items={[
            { at: [160, 110], kind: 'bowl' },
            ...ring.map((k, i) => ({ at: polar(160, 110, 68, i * 60 - 90), kind: k })),
          ]}
        />
      );
    }
    case 'mam-chay': {
      const ring: Dish[] = ['mound', 'small', 'bowl', 'plate', 'slices'];
      return <Tray p={p} items={ring.map((k, i) => ({ at: polar(160, 110, 58, i * 72 - 90), kind: k }))} />;
    }
    case 'vai':
      return (
        <G>
          <Ground w={330} p={p} />
          <Person pose={STAND_CHEST} p={p} ox={0} />
          <Person pose={STAND_FOREHEAD} p={p} ox={110} />
          <Person pose={BOW} p={p} ox={210} />
          <Num x={20} y={20} n={1} p={p} />
          <Num x={130} y={20} n={2} p={p} />
          <Num x={230} y={20} n={3} p={p} />
        </G>
      );
    case 'lay':
      return (
        <G>
          <Ground w={420} p={p} />
          <Person pose={STAND_FOREHEAD} p={p} ox={0} />
          <Person pose={KNEEL} p={p} ox={110} />
          <Person pose={PROSTRATE} p={p} ox={215} />
          <Person pose={STAND_CHEST} p={p} ox={320} />
          <Num x={20} y={20} n={1} p={p} />
          <Num x={130} y={20} n={2} p={p} />
          <Num x={240} y={20} n={3} p={p} />
          <Num x={340} y={20} n={4} p={p} />
        </G>
      );
    case 'ba-tuan':
      return (
        <G>
          {[
            { x: 55, top: 30 },
            { x: 165, top: 82 },
            { x: 275, top: 124 },
          ].map((s, i) => (
            <G key={i}>
              <Line x1={s.x} y1={135} x2={s.x} y2={30} stroke={p.muted} strokeWidth={2} strokeDasharray="3 4" opacity={0.5} />
              <Stick x={s.x} y0={140} y1={s.top} p={p} />
              <Bowl cx={s.x} y={136} w={40} p={p} />
              <Cup cx={s.x + 38} y={150} p={p} fill={0.3 + i * 0.25} />
              <Num x={s.x - 30} y={40} n={i + 1} p={p} />
            </G>
          ))}
        </G>
      );
    case 'cham-tra':
      return (
        <G>
          {/* 1: ấm, nước sôi */}
          <Ellipse cx={55} cy={112} rx={34} ry={26} fill={p.tint} stroke={p.ink} strokeWidth={SW} />
          <Rect x={43} y={80} width={24} height={8} rx={4} fill={p.ink} />
          <Path d="M88 106 q14 -4 18 -22" stroke={p.ink} strokeWidth={SW} fill="none" strokeLinecap="round" />
          <Path d="M22 100 q-16 12 0 26" stroke={p.ink} strokeWidth={SW} fill="none" />
          <Path d="M50 70 q-5 -8 0 -16 M62 70 q-5 -8 0 -16" stroke={p.muted} strokeWidth={2} fill="none" />
          {/* 2: rót */}
          <G transform="rotate(28 175 90)">
            <Ellipse cx={170} cy={90} rx={30} ry={22} fill={p.tint} stroke={p.ink} strokeWidth={SW} />
            <Path d="M199 86 q12 -3 16 -18" stroke={p.ink} strokeWidth={SW} fill="none" strokeLinecap="round" />
          </G>
          <Path d="M212 104 q2 18 0 30" stroke={p.gold} strokeWidth={3} fill="none" />
          <Cup cx={212} y={138} p={p} fill={0.4} />
          {/* 3: ba chén đầy hai phần ba */}
          <Cup cx={262} y={130} p={p} />
          <Cup cx={286} y={130} p={p} />
          <Cup cx={310} y={130} p={p} />
          <Num x={20} y={60} n={1} p={p} />
          <Num x={140} y={40} n={2} p={p} />
          <Num x={286} y={108} n={3} p={p} />
        </G>
      );
    case 'thap-huong':
      return (
        <G>
          {[
            { cx: 55, xs: [0] },
            { cx: 165, xs: [-10, 0, 10] },
            { cx: 275, xs: [-16, -8, 0, 8, 16] },
          ].map((b, i) => (
            <G key={i}>
              {b.xs.map((d) => (
                <Stick key={d} x={b.cx + d} y0={118} y1={40 + Math.abs(d) * 0.6} p={p} tilt={d * 0.25} />
              ))}
              <Bowl cx={b.cx} y={114} w={58} p={p} />
              <Num x={b.cx - 38} y={30} n={i + 1} p={p} />
            </G>
          ))}
        </G>
      );
    case 'nhieu-ban-tho': {
      // Ban cao trước, ban thấp sau: Phật, thần linh, gia tiên, Thần tài (sát đất).
      const alt = [
        { x: 14, y: 26 },
        { x: 94, y: 56 },
        { x: 174, y: 86 },
        { x: 254, y: 118 },
      ];
      return (
        <G>
          <Line x1={4} y1={190} x2={326} y2={190} stroke={p.muted} strokeWidth={2} strokeDasharray="6 5" />
          {alt.map((a, i) => (
            <G key={i}>
              <Rect x={a.x} y={a.y + 24} width={62} height={8} rx={2} fill={p.ink} />
              <Stick x={a.x + 31} y0={a.y + 8} y1={a.y - 14} p={p} />
              <Bowl cx={a.x + 31} y={a.y + 6} w={26} p={p} />
              {i < 3 ? (
                <Path
                  d={`M${a.x + 64} ${a.y + 28} L${alt[i + 1].x - 4} ${alt[i + 1].y + 22} m -8 -6 l 8 6 l -9 3`}
                  stroke={p.a}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              <Num x={a.x + 31} y={a.y + 48} n={i + 1} p={p} />
            </G>
          ))}
        </G>
      );
    }
  }
}

/** Hình minh họa theo id. `label` đọc cho TalkBack/VoiceOver. */
export const Figure = memo(function Figure({ id, label }: { id: FigureId; label: string }) {
  const { c } = useTheme();
  const p: Pal = {
    ink: c.ink,
    muted: c.inkMuted,
    fill: c.surface,
    tint: c.surface2,
    a: c.a,
    gold: c.a2,
    on: c.onAccent,
    bg: c.surface,
  };
  const [w, h] = VB[id];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ width: '100%', maxWidth: 520, aspectRatio: w / h, alignSelf: 'center' }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        <Draw id={id} p={p} />
      </Svg>
    </View>
  );
});

export const FIGURE_IDS = Object.keys(VB) as FigureId[];
