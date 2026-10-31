import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { radius } from '../tokens';
import { useLayout } from '../layout';
import { Button, T } from './base';

/** Bottom sheet. Trên tablet/máy gập mở: hiện giữa màn với độ rộng giới hạn. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { c } = useTheme();
  const L = useLayout();
  const insets = useSafeAreaInsets();
  const centered = !L.isCompact;
  return (
    <Modal
      visible={visible}
      transparent
      animationType={centered ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable
          accessibilityLabel="Đóng"
          onPress={onClose}
          style={{
            flex: 1,
            backgroundColor: c.scrim,
            justifyContent: centered ? 'center' : 'flex-end',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              width: '100%',
              maxWidth: centered ? 520 : undefined,
              maxHeight: '88%',
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              borderRadius: centered ? radius.lg : undefined,
              paddingTop: 10,
              paddingBottom: centered ? 16 : insets.bottom + 12,
            }}
          >
            {!centered ? (
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: c.line,
                  alignSelf: 'center',
                  marginBottom: 8,
                }}
              />
            ) : null}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 8 }}
            >
              {title ? (
                <T v="title" accessibilityRole="header">
                  {title}
                </T>
              ) : null}
              {children}
            </ScrollView>
            {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 8 }}>{footer}</View> : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Dialog({
  visible,
  title,
  body,
  children,
  confirm,
  cancel,
  onConfirm,
  onCancel,
  destructive,
  dismissable = true,
}: {
  visible: boolean;
  title: string;
  body?: string;
  children?: ReactNode;
  confirm: string;
  cancel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
  dismissable?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => dismissable && onCancel?.()}
      statusBarTranslucent
    >
      <Pressable
        onPress={() => dismissable && onCancel?.()}
        style={{ flex: 1, backgroundColor: c.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <Pressable
          onPress={() => {}}
          accessibilityRole="alert"
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: c.surface,
            borderRadius: radius.lg,
            padding: 20,
            gap: 12,
          }}
        >
          <T v="title">{title}</T>
          {body ? <T v="body">{body}</T> : null}
          {children}
          <Button title={confirm} onPress={onConfirm} color={destructive ? c.negative : undefined} />
          {cancel ? <Button title={cancel} variant="secondary" onPress={onCancel} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Toast */
type ToastMsg = {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'error';
  action?: { label: string; onPress: () => void };
};
const ToastCtx = createContext<(text: string, opts?: { tone?: ToastMsg['tone']; action?: ToastMsg['action'] }) => void>(
  () => {},
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, opts?: { tone?: ToastMsg['tone']; action?: ToastMsg['action'] }) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg({ id: Date.now(), text, tone: opts?.tone ?? 'info', action: opts?.action });
    timer.current = setTimeout(() => setMsg(null), opts?.action ? 5000 : 3000);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg ? <ToastView msg={msg} onDone={() => setMsg(null)} /> : null}
    </ToastCtx.Provider>
  );
}

function ToastView({ msg, onDone }: { msg: ToastMsg; onDone: () => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  }, [msg.id, op]);
  const dot = msg.tone === 'error' ? c.negative : msg.tone === 'success' ? c.positive : c.a;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 72,
        alignItems: 'center',
        opacity: op,
      }}
    >
      {/* W2: thân toast không nhận chạm, để nút bên dưới vẫn bấm được; chỉ nút hành động (Hoàn tác…) nhận chạm. */}
      <View
        pointerEvents="box-none"
        style={{
          maxWidth: 520,
          width: '100%',
          minHeight: 48,
          borderRadius: radius.md,
          backgroundColor: c.ink,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <View pointerEvents="none" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
          <T v="caption" color={c.surface} style={{ flex: 1 }}>
            {msg.text}
          </T>
        </View>
        {msg.action ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              msg.action?.onPress();
              onDone();
            }}
          >
            <T v="caption" weight="bold" color={c.surface}>
              {msg.action.label}
            </T>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

/* ------------------------------------------------------------------ Two pane */
/**
 * Danh sách + chi tiết. Màn rộng (tablet ngang, máy gập mở ngang): hai cột cạnh nhau.
 * Màn hẹp: chỉ hiện danh sách; chạm mục thì màn gọi sẽ điều hướng sang trang chi tiết.
 */
export function TwoPane({
  list,
  detail,
  listWidth = 0.42,
  emptyDetail,
}: {
  list: ReactNode;
  detail?: ReactNode;
  listWidth?: number;
  emptyDetail?: ReactNode;
}) {
  const { c } = useTheme();
  const L = useLayout();
  if (!L.twoPane) return <>{list}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ width: `${listWidth * 100}%`, borderRightWidth: 1, borderColor: c.line }}>{list}</View>
      <View style={{ flex: 1 }}>{detail ?? emptyDetail ?? null}</View>
    </View>
  );
}

/* ------------------------------------------------------------------ Tabs */
/**
 * Tùy chọn cho expo-router <Tabs>: tab dưới trên điện thoại; thanh dọc bên trái
 * (navigation rail) khi màn rộng ≥ 840 dp.
 */
export function useAdaptiveTabOptions() {
  const { c } = useTheme();
  const L = useLayout();
  return useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: c.a,
      tabBarInactiveTintColor: c.inkMuted,
      tabBarPosition: (L.rail ? 'left' : 'bottom') as 'left' | 'bottom',
      tabBarVariant: (L.rail ? 'material' : 'uikit') as 'material' | 'uikit',
      tabBarLabelPosition: (L.rail ? 'below-icon' : undefined) as 'below-icon' | undefined,
      tabBarStyle: { backgroundColor: c.surface, borderColor: c.line, minWidth: L.rail ? 88 : undefined },
      tabBarLabelStyle: { fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 11 },
      sceneStyle: { backgroundColor: c.bg },
    }),
    [c, L.rail],
  );
}
