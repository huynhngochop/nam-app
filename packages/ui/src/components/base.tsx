import React, { memo, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { fonts, proAmber, radius, type as typeScale, TypeVariant } from '../tokens';
import { useLayout } from '../layout';

export type IconName = React.ComponentProps<typeof Feather>['name'];

/* ------------------------------------------------------------------ Text */
type TProps = TextProps & {
  v?: TypeVariant;
  color?: string;
  muted?: boolean;
  accent?: boolean;
  center?: boolean;
  weight?: keyof typeof fonts;
};
/**
 * Màu chữ mặc định khi nằm trên nền màu nhấn (Card variant="fill"). Không có giá trị = nền thường.
 * Lỗi W1: chữ màu ink/accent trên nền màu nhấn gần như không đọc được, nhất là ở giao diện tối.
 */
const OnFillCtx = React.createContext<string | null>(null);
/** Màu chữ cần dùng khi đang nằm trong thẻ nền màu nhấn, hoặc null. */
export function useOnFill() {
  return React.useContext(OnFillCtx);
}

export function T({ v = 'body', color, muted, accent, center, weight, style, ...rest }: TProps) {
  const { c } = useTheme();
  const onFill = useOnFill();
  // Trên nền màu nhấn: mọi biến thể (thường / muted / accent) dùng màu onAccent; muted giảm độ đậm.
  const col = color ?? onFill ?? (accent ? c.a : muted ? c.inkMuted : c.ink);
  const fade = onFill && !color && muted ? { opacity: 0.8 } : null;
  return (
    <Text
      maxFontSizeMultiplier={v === 'numeral' || v === 'display' ? 1.3 : 2}
      style={[
        typeScale[v] as TextStyle,
        { color: col },
        fade,
        center && { textAlign: 'center' },
        weight && { fontFamily: fonts[weight] },
        style,
      ]}
      {...rest}
    />
  );
}

export function Icon({
  name,
  size = 20,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { c } = useTheme();
  return <Feather aria-hidden importantForAccessibility="no" name={name} size={size} color={color ?? c.ink} style={style} />;
}

/* ------------------------------------------------------------------ Screen */
type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  bg?: string;
  /** Giữ cột nội dung ở độ rộng dễ đọc trên tablet/máy gập. */
  readable?: boolean;
  padded?: boolean;
  footer?: ReactNode;
  /** Lớp nổi cố định trên nội dung (ví dụ FAB) — không cuộn theo danh sách. */
  overlay?: ReactNode;
  scrollProps?: ScrollViewProps;
  contentStyle?: StyleProp<ViewStyle>;
};
export function Screen({
  children,
  scroll,
  edges = ['top'],
  bg,
  readable = true,
  padded = true,
  footer,
  overlay,
  scrollProps,
  contentStyle,
}: ScreenProps) {
  const { c } = useTheme();
  const L = useLayout();
  const inner: ViewStyle = {
    width: '100%',
    maxWidth: readable ? L.readableWidth : undefined,
    alignSelf: 'center',
    paddingHorizontal: padded ? L.gutter : 0,
    gap: 12,
  };
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg ?? c.bg }}>
      <View style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[{ paddingBottom: overlay ? 96 : 24 }, contentStyle]}
            {...scrollProps}
          >
            <View style={inner}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, inner, contentStyle]}>{children}</View>
        )}
        {overlay}
      </View>
      {footer ? (
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: bg ?? c.bg }}>
          <View style={{ ...inner, paddingVertical: 12 }}>{footer}</View>
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ AppBar */
export function AppBar({
  title,
  onBack,
  backIcon = 'chevron-left',
  right,
  large,
}: {
  title?: string;
  onBack?: () => void;
  backIcon?: IconName;
  right?: ReactNode;
  large?: boolean;
}) {
  return (
    <View style={{ gap: 6, paddingTop: 4 }}>
      <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {onBack ? <IconButton icon={backIcon} onPress={onBack} label="Quay lại" /> : <View style={{ width: 40 }} />}
        {!large && title ? (
          <T v="headline" numberOfLines={1} style={{ flex: 1, textAlign: 'center', marginHorizontal: 8 }}>
            {title}
          </T>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={{ flexDirection: 'row', gap: 8, minWidth: 40, justifyContent: 'flex-end' }}>{right}</View>
      </View>
      {large && title ? (
        <T v="display" accessibilityRole="header">
          {title}
        </T>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Buttons */
type BtnProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'lg' | 'md' | 'sm';
  icon?: IconName;
  loading?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  color?: string;
  textColor?: string;
};
export const Button = memo(function Button({
  title,
  variant = 'primary',
  size = 'lg',
  icon,
  loading,
  disabled,
  full,
  style,
  color,
  textColor,
  ...rest
}: BtnProps) {
  const { c } = useTheme();
  const h = size === 'lg' ? 52 : size === 'md' ? 44 : 36;
  const bg = variant === 'primary' ? (color ?? c.a) : variant === 'secondary' ? c.surface2 : 'transparent';
  const fg =
    textColor ??
    (variant === 'primary' ? c.onAccent : variant === 'text' ? c.a : variant === 'danger' ? c.negative : c.ink);
  const isFull = full ?? size !== 'sm';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: h,
          minWidth: 44,
          paddingHorizontal: size === 'sm' ? 14 : 18,
          borderRadius: size === 'sm' ? radius.sm : radius.md,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          alignSelf: isFull ? 'stretch' : 'flex-start',
          flexGrow: isFull ? 1 : 0,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Feather aria-hidden importantForAccessibility="no" name={icon} size={size === 'sm' ? 16 : 20} color={fg} /> : null}
          <T v="headline" color={fg} numberOfLines={1} style={size === 'sm' ? { fontSize: 13 } : undefined}>
            {title}
          </T>
        </>
      )}
    </Pressable>
  );
});

export function IconButton({
  icon,
  onPress,
  label,
  soft = true,
  color,
  bg,
  badge,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  soft?: boolean;
  color?: string;
  bg?: string;
  badge?: boolean;
}) {
  const { c } = useTheme();
  const box = {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: bg ?? (soft ? c.surface2 : 'transparent'),
  };
  const inner = (
    <>
      <Feather aria-hidden importantForAccessibility="no" name={icon} size={20} color={color ?? c.ink} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: 7,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: c.negative,
          }}
        />
      ) : null}
    </>
  );
  // Chỉ là biểu tượng (nằm trong thẻ bấm được): không chiếm cú chạm, để thẻ cha nhận (IT7).
  // Pressable không có onPress vẫn nuốt cú chạm nên bấm vào biểu tượng không làm gì.
  if (!onPress)
    return (
      <View
        style={box}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {inner}
      </View>
    );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({ ...box, opacity: pressed ? 0.7 : 1 })}
    >
      {inner}
    </Pressable>
  );
}

export function FAB({ icon = 'plus', onPress, label }: { icon?: IconName; onPress: () => void; label: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          position: 'absolute',
          right: 16,
          bottom: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.a,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        },
        styles.shadow,
      ]}
    >
      <Feather aria-hidden importantForAccessibility="no" name={icon} size={24} color={c.onAccent} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ Chip, Badge */
export const Chip = memo(function Chip({
  label,
  selected,
  onPress,
  icon,
  onRemove,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const fg = selected ? c.a : c.ink;
  return (
    <Pressable
      onPress={onRemove ?? onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => ({
        minHeight: 34,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: selected ? c.at : c.surface2,
        borderWidth: 1.5,
        borderColor: selected ? c.a : 'transparent',
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Feather aria-hidden importantForAccessibility="no" name={icon} size={15} color={fg} /> : null}
      <T v="caption" color={fg} weight={selected ? 'semibold' : 'medium'}>
        {label}
      </T>
      {onRemove ? <Feather aria-hidden importantForAccessibility="no" name="x" size={14} color={fg} /> : null}
    </Pressable>
  );
});

export function Chips({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  if (scroll)
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {children}
      </ScrollView>
    );
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'pro' | 'positive' | 'negative' | 'warning';
}) {
  const { c } = useTheme();
  const map = {
    neutral: [c.surface2, c.inkMuted],
    accent: [c.at, c.a],
    pro: [proAmber, '#1c1a17'],
    positive: [c.surface2, c.positive],
    negative: [c.surface2, c.negative],
    warning: [c.surface2, c.warning],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        minHeight: 20,
        paddingHorizontal: 7,
        borderRadius: radius.pill,
        backgroundColor: bg,
        justifyContent: 'center',
      }}
    >
      <T v="micro" color={fg}>
        {label}
      </T>
    </View>
  );
}

/* ------------------------------------------------------------------ Card, List */
export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  /** fill = nền trung tính đậm hơn thẻ thường · accent = nền màu nhấn, chữ bên trong tự đổi sang onAccent. */
  variant?: 'default' | 'tint' | 'fill' | 'accent' | 'outlineAccent' | 'danger';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const s: ViewStyle = {
    backgroundColor:
      variant === 'tint' ? c.at : variant === 'fill' ? c.surface2 : variant === 'accent' ? c.a : c.surface,
    borderWidth: variant === 'outlineAccent' ? 2 : variant === 'danger' ? 1.5 : 1,
    borderColor:
      variant === 'outlineAccent'
        ? c.a
        : variant === 'danger'
          ? c.negative
          : variant === 'default'
            ? c.line
            : 'transparent',
    borderRadius: radius.md,
    padding: 16,
    gap: 8,
  };
  const body = variant === 'accent' ? <OnFillCtx.Provider value={c.onAccent}>{children}</OnFillCtx.Provider> : children;
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [s, { opacity: pressed ? 0.85 : 1 }, style]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={[s, style]}>{body}</View>;
}

export function Thumb({ icon, color, bg, size = 40 }: { icon: IconName; color?: string; bg?: string; size?: number }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.sm,
        backgroundColor: bg ?? c.at,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather aria-hidden importantForAccessibility="no" name={icon} size={size * 0.48} color={color ?? c.a} />
    </View>
  );
}

export const ListItem = memo(function ListItem({
  left,
  title,
  subtitle,
  right,
  onPress,
  onLongPress,
  chevron,
  divider = true,
  strong = true,
  titleColor,
}: {
  left?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
  strong?: boolean;
  titleColor?: string;
}) {
  const { c } = useTheme();
  const base = {
    minHeight: 56,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
    borderColor: c.line,
  };
  const body = (
    <>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <T v={strong ? 'headline' : 'body'} color={titleColor}>
          {title}
        </T>
        {subtitle ? (
          <T v="caption" muted>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right}
      {chevron ? <Feather aria-hidden importantForAccessibility="no" name="chevron-right" size={18} color={c.inkMuted} /> : null}
    </>
  );
  // Dòng không bấm được (thường chứa công tắc / nút +/−): dùng View. Pressable bị tắt đánh dấu cả dòng là
  // "vô hiệu" và gộp phần tử con, nên trình đọc màn hình đọc sai công tắc bên trong (IT5).
  if (!onPress && !onLongPress) return <View style={base}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ ...base, opacity: pressed ? 0.7 : 1 })}
    >
      {body}
    </Pressable>
  );
});

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View
      style={{
        minHeight: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
      }}
    >
      <T v="micro" muted accessibilityRole="header">
        {title}
      </T>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <T v="caption" accent weight="semibold">
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Row({
  children,
  gap = 8,
  between,
  style,
  wrap,
}: {
  children: ReactNode;
  gap?: number;
  between?: boolean;
  style?: StyleProp<ViewStyle>;
  wrap?: boolean;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap,
          justifyContent: between ? 'space-between' : 'flex-start',
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Lưới thích ứng: số cột tăng theo cỡ màn (điện thoại → máy gập → tablet). */
export function Grid({ children, min = 1, gap = 12 }: { children: ReactNode; min?: number; gap?: number }) {
  const L = useLayout();
  const cols = L.columns(min);
  const items = React.Children.toArray(children);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2 }}>
      {items.map((ch, i) => (
        <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: gap / 2, paddingBottom: gap }}>
          {ch}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ Inputs */
export function ProgressBar({
  value,
  color,
  height = 6,
  track,
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  const { c } = useTheme();
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(v * 100), min: 0, max: 100 }}
      style={{ height, borderRadius: radius.pill, backgroundColor: track ?? c.surface2, overflow: 'hidden' }}
    >
      <View
        style={{ width: `${v * 100}%`, height: '100%', backgroundColor: color ?? c.a, borderRadius: radius.pill }}
      />
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onChange}
      trackColor={{ true: c.a, false: c.line }}
      thumbColor="#ffffff"
      ios_backgroundColor={c.line}
    />
  );
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  const { c } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: c.surface2, borderRadius: radius.sm, padding: 3, gap: 3 }}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[
              {
                flex: 1,
                minHeight: 34,
                borderRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              },
              on && { backgroundColor: c.surface },
              on && styles.shadow,
            ]}
          >
            <T v="caption" weight="semibold" color={on ? c.ink : c.inkMuted} numberOfLines={1}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

type FieldProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: IconName;
  right?: ReactNode;
  multiline?: boolean;
};
export const TextField = React.forwardRef<TextInput, FieldProps>(function TextField(
  { label, error, icon, right, multiline, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { c } = useTheme();
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <T v="caption" muted weight="semibold">
          {label}
        </T>
      ) : null}
      <View
        style={{
          minHeight: multiline ? 88 : 48,
          borderRadius: radius.sm,
          backgroundColor: focus ? c.surface : c.surface2,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: 8,
          paddingHorizontal: 12,
          borderWidth: 2,
          borderColor: error ? c.negative : focus ? c.a : 'transparent',
        }}
      >
        {icon ? (
          <Feather aria-hidden importantForAccessibility="no" name={icon} size={18} color={c.inkMuted} style={multiline ? { marginTop: 12 } : undefined} />
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={c.inkMuted}
          multiline={multiline}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              minWidth: 0,
              color: c.ink,
              fontFamily: fonts.regular,
              fontSize: 15,
              paddingVertical: 12,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            style,
          ]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <T v="caption" color={c.negative}>
          {error}
        </T>
      ) : null}
    </View>
  );
});

export function SearchField({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  onPress,
  autoFocus,
  right,
}: {
  value?: string;
  onChangeText?: (s: string) => void;
  placeholder: string;
  onSubmit?: () => void;
  onPress?: () => void;
  autoFocus?: boolean;
  right?: ReactNode;
}) {
  const { c } = useTheme();
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="search"
        style={{
          minHeight: 44,
          borderRadius: radius.md,
          backgroundColor: c.surface2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
        }}
      >
        <Feather aria-hidden importantForAccessibility="no" name="search" size={18} color={c.inkMuted} />
        <T v="body" muted numberOfLines={1} style={{ flex: 1 }}>
          {placeholder}
        </T>
        {right}
      </Pressable>
    );
  }
  return (
    <TextField
      icon="search"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      returnKeyType="search"
      onSubmitEditing={onSubmit}
      autoFocus={autoFocus}
      autoCorrect={false}
      right={
        value ? (
          <Pressable hitSlop={8} accessibilityLabel="Xóa" onPress={() => onChangeText?.('')}>
            <Feather aria-hidden importantForAccessibility="no" name="x" size={18} color={c.inkMuted} />
          </Pressable>
        ) : (
          right
        )
      }
    />
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  format,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (n: number) => string;
}) {
  const { c } = useTheme();
  const btn = (icon: IconName, delta: number, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={value + delta < min || value + delta > max}
      onPress={() => onChange(value + delta)}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: c.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: value + delta < min || value + delta > max ? 0.3 : pressed ? 0.7 : 1,
      })}
    >
      <Feather aria-hidden importantForAccessibility="no" name={icon} size={18} color={c.ink} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {btn('minus', -step, 'Giảm')}
      <T v="headline" style={{ minWidth: 56, textAlign: 'center' }}>
        {format ? format(value) : String(value)}
      </T>
      {btn('plus', step, 'Tăng')}
    </View>
  );
}

export function Keypad({ onKey }: { onKey: (k: string) => void }) {
  const { c } = useTheme();
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {keys.map((k) => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={k === '⌫' ? 'Xóa' : k}
          onPress={() => onKey(k)}
          style={({ pressed }) => ({
            width: '31.5%',
            flexGrow: 1,
            height: 52,
            borderRadius: radius.sm,
            backgroundColor: c.surface2,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          {k === '⌫' ? (
            <Feather aria-hidden importantForAccessibility="no" name="delete" size={22} color={c.ink} />
          ) : (
            <T v="title" weight="semibold">
              {k}
            </T>
          )}
        </Pressable>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ Feedback */
export function Banner({
  text,
  tone = 'warning',
  icon,
  onPress,
}: {
  text: string;
  tone?: 'warning' | 'negative' | 'ok';
  icon?: IconName;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const col = tone === 'negative' ? c.negative : tone === 'ok' ? c.positive : c.warning;
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole="alert"
      style={{
        minHeight: 36,
        backgroundColor: c.surface2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <Feather
        name={icon ?? (tone === 'ok' ? 'check-circle' : tone === 'negative' ? 'alert-circle' : 'wifi-off')}
        size={15}
        color={col}
      />
      <T v="caption" color={col} weight="semibold" style={{ flex: 1 }}>
        {text}
      </T>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 32, paddingHorizontal: 16 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: c.at,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather aria-hidden importantForAccessibility="no" name={icon} size={40} color={c.a} />
      </View>
      <T v="title" center>
        {title}
      </T>
      {body ? (
        <T v="body" muted center style={{ maxWidth: 360 }}>
          {body}
        </T>
      ) : null}
      {action ? (
        <Button
          title={action}
          size="md"
          full={false}
          onPress={onAction}
          style={{ alignSelf: 'center', marginTop: 4 }}
        />
      ) : null}
    </View>
  );
}

export function Skeleton({ w = '100%', h = 14, r = 6 }: { w?: number | `${number}%`; h?: number; r?: number }) {
  const { c } = useTheme();
  return <View style={{ width: w, height: h, borderRadius: r, backgroundColor: c.surface2 }} />;
}

export function Avatar({ name, size = 40, soft }: { name: string; size?: number; soft?: boolean }) {
  const { c } = useTheme();
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: soft ? c.at : c.a,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <T v="headline" color={soft ? c.a : c.onAccent} style={{ fontSize: size * 0.36 }}>
        {initials}
      </T>
    </View>
  );
}

/** Giá chưa chốt: hiện ô viền đứt với khóa giá. Khi có giá thật, truyền `price`. */
export function PricePlaceholder({ priceKey, price }: { priceKey: string; price?: string | null }) {
  const { c } = useTheme();
  if (price) return <T v="headline">{price}</T>;
  return (
    <View
      accessibilityLabel="Giá chưa có"
      style={{
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: c.warning,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <T v="micro" color={c.warning} style={{ textTransform: 'none' }}>
        {priceKey}
      </T>
    </View>
  );
}

export function StepDots({ count, index }: { count: number; index: number }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Bước ${index + 1} trên ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 18 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === index ? c.a : c.line,
          }}
        />
      ))}
    </View>
  );
}

export function StepBar({ count, index }: { count: number; index: number }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4, flex: 1 }} accessibilityLabel={`Bước ${index + 1} trên ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= index ? c.a : c.surface2 }} />
      ))}
    </View>
  );
}

export function Radio({ on }: { on: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{ width: 20, height: 20, borderRadius: 10, borderWidth: on ? 6 : 2, borderColor: on ? c.a : c.line }}
    />
  );
}

export function Check({ on }: { on: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: on ? c.a : 'transparent',
        borderWidth: on ? 0 : 2,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on ? <Feather aria-hidden importantForAccessibility="no" name="check" size={15} color={c.onAccent} /> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
