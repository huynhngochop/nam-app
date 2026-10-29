import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Button, Icon, ListItem, T, Thumb, useTheme } from '@nam/ui';
import { hhmm, vnd } from '@nam/core';
import { catOf, useVi } from './store';
import { Tx } from './types';

/** Số tiền có dấu & màu; tôn trọng "Ẩn số tiền" khi masked. */
export function Money({ amount, kind, v = 'headline', masked, plain }: { amount: number; kind?: Tx['kind']; v?: 'display' | 'title' | 'headline' | 'body' | 'caption'; masked?: boolean; plain?: boolean }) {
  const { c } = useTheme();
  const hide = useVi((s) => s.hideAmounts) && masked;
  const sign = plain || !kind || kind === 'transfer' ? '' : kind === 'income' ? '+' : '−';
  const color = plain || !kind ? undefined : kind === 'income' ? c.positive : kind === 'transfer' ? c.inkMuted : c.ink;
  return <T v={v} color={color} accessibilityLabel={hide ? 'Số tiền đã ẩn' : undefined}>{hide ? '•••••• đ' : `${sign}${vnd(amount)}`}</T>;
}

export const TxRow = React.memo(function TxRow({ tx, onPress, selected }: { tx: Tx; onPress: () => void; selected?: boolean }) {
  const { c } = useTheme();
  const cats = useVi((s) => s.categories);
  const cat = catOf(tx.categoryId, cats);
  return (
    <ListItem
      left={<Thumb icon={tx.kind === 'transfer' ? 'repeat' : cat.icon} color={c.a} bg={c.at} />}
      title={tx.merchant || cat.name}
      titleColor={selected ? c.a : undefined}
      subtitle={`${tx.kind === 'transfer' ? 'Chuyển nội bộ' : cat.name} · ${hhmm(new Date(tx.at))}${tx.status === 'pending' ? ' · chờ xác nhận' : ''}${tx.flag === 'dup' ? ' · nghi trùng' : ''}`}
      right={<Money amount={tx.amount} kind={tx.kind} />}
      onPress={onPress}
    />
  );
});

/**
 * Khóa ứng dụng (VG-15). Khóa khi mở app và khi quay lại sau > 30 giây.
 * Cho phép mật mã máy làm phương án dự phòng, nên người dùng không bao giờ bị khóa ngoài vĩnh viễn.
 */
export function LockGate({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const enabled = useVi((s) => s.lockEnabled);
  const hydrated = useVi((s) => s.hydrated);
  const [locked, setLocked] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const bgAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    setErr(null);
    try {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Mở khóa Ví Gọn', cancelLabel: 'Hủy', disableDeviceFallback: false });
      if (r.success) setLocked(false);
      else if (r.error !== 'user_cancel' && r.error !== 'system_cancel') setErr('Chưa xác thực được. Thử lại hoặc dùng mật mã máy.');
    } catch {
      setErr('Máy không hỗ trợ xác thực. Tắt khóa trong Cài đặt máy nếu cần.');
    }
  }, []);

  useEffect(() => { if (hydrated && enabled && locked) unlock(); if (hydrated && !enabled) setLocked(false); }, [hydrated, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background') bgAt.current = Date.now();
      if (st === 'active' && enabled && bgAt.current && Date.now() - bgAt.current > 30000) { setLocked(true); unlock(); }
    });
    return () => sub.remove();
  }, [enabled, unlock]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {enabled && locked ? (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }} accessibilityViewIsModal>
          <Icon name="lock" size={40} color={c.a} />
          <T v="title" center>Ví Gọn đang khóa</T>
          {err ? <T v="caption" center color={c.negative}>{err}</T> : null}
          <Button title="Mở khóa" icon="unlock" onPress={unlock} />
        </View>
      ) : null}
    </View>
  );
}

export async function canUseBiometric() {
  const [hw, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
  const level = await LocalAuthentication.getEnrolledLevelAsync().catch(() => 0);
  return hw && enrolled ? true : level > 0;
}
