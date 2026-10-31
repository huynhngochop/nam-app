import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { AppBar, Badge, Button, Card, Icon, PricePlaceholder, Radio, Row, Screen, T } from './base';

export type Plan = { id: string; label: string; priceKey: string; price?: string | null; sub?: string; tag?: string };

/** Màn trả phí dùng chung (MN-16, NH-16, VG-16). Giá chưa chốt → ô khóa giá. */
export function Paywall({
  title,
  reason,
  benefits,
  plans,
  ctaFor,
  onBuy,
  onRestore,
  onClose,
  error,
  busy,
}: {
  title: string;
  reason?: string;
  benefits: string[];
  plans: Plan[];
  ctaFor?: (p: Plan) => string;
  onBuy: (p: Plan) => void;
  onRestore: () => void;
  onClose: () => void;
  error?: string | null;
  busy?: boolean;
}) {
  const { c } = useTheme();
  const [sel, setSel] = useState(plans[0]);
  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <View style={{ gap: 8 }}>
          <Button title={ctaFor ? ctaFor(sel) : 'Tiếp tục'} loading={busy} onPress={() => onBuy(sel)} />
          <Button
            title="Khôi phục giao dịch · Điều khoản"
            variant="text"
            size="sm"
            onPress={onRestore}
            style={{ alignSelf: 'center' }}
          />
        </View>
      }
    >
      <AppBar onBack={onClose} backIcon="x" />
      <T v="display">{title}</T>
      {reason ? (
        <T v="caption" muted>
          {reason}
        </T>
      ) : null}
      {error ? (
        <Card variant="danger">
          <Row>
            <Icon name="alert-circle" color={c.negative} />
            <T v="body" style={{ flex: 1 }}>
              {error}
            </T>
          </Row>
        </Card>
      ) : null}
      <View>
        {benefits.map((b) => (
          <Row key={b} style={{ paddingVertical: 8 }} gap={10}>
            <Icon name="check" color={c.positive} />
            <T v="body" style={{ flex: 1 }}>
              {b}
            </T>
          </Row>
        ))}
      </View>
      {plans.map((p) => (
        <Card
          key={p.id}
          variant={sel.id === p.id ? 'outlineAccent' : 'default'}
          onPress={() => setSel(p)}
          accessibilityLabel={p.label}
        >
          <Row gap={10}>
            <Radio on={sel.id === p.id} />
            <T v="headline" style={{ flex: 1 }}>
              {p.label}
            </T>
            <PricePlaceholder priceKey={p.priceKey} price={p.price} />
          </Row>
          {p.sub ? (
            <T v="caption" muted>
              {p.sub}
            </T>
          ) : null}
          {p.tag ? <Badge label={p.tag} tone="accent" /> : null}
        </Card>
      ))}
    </Screen>
  );
}
