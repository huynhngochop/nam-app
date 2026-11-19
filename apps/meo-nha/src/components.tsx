import React, { memo, useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Check,
  Chip,
  Chips,
  Icon,
  IconButton,
  ListItem,
  Row,
  Sheet,
  T,
  Thumb,
  useTheme,
  useToast,
} from '@nam/ui';
import { track } from '@nam/core';
import { categoryOf, Tip } from './data/tips';
import { useMeo } from './store';

export const TipRow = memo(function TipRow({
  tip,
  onPress,
  showSave = true,
  meta,
}: {
  tip: Tip;
  onPress?: () => void;
  showSave?: boolean;
  meta?: string;
}) {
  const { c } = useTheme();
  const saved = useMeo((s) => s.savedTips.includes(tip.id));
  const toggle = useMeo((s) => s.toggleSaveTip);
  const toast = useToast();
  const cat = categoryOf(tip.categoryId);
  return (
    <ListItem
      left={<Thumb icon={cat.icon} color={tip.categoryId === 'plants' ? c.a2 : undefined} />}
      title={tip.title}
      subtitle={meta ?? `${tip.rating.toString().replace('.', ',')} ★ · ${tip.minutes} phút · ${cat.name}`}
      onPress={onPress ?? (() => router.push(`/tip/${tip.id}`))}
      right={
        showSave ? (
          <IconButton
            soft={false}
            icon="bookmark"
            color={saved ? c.a : c.inkMuted}
            label={saved ? 'Bỏ lưu' : 'Lưu'}
            onPress={() => {
              const on = toggle(tip.id);
              toast(on ? 'Đã lưu' : 'Đã bỏ lưu', { action: { label: 'Hoàn tác', onPress: () => toggle(tip.id) } });
              track('tip_saved', { tipId: tip.id, on });
            }}
          />
        ) : undefined
      }
    />
  );
});

/** Chi tiết mẹo. Dùng cho trang riêng và cột chi tiết trên tablet. */
export function TipDetail({ tip, onClose }: { tip: Tip; onClose?: () => void }) {
  const { c } = useTheme();
  const state = useMeo();
  const toast = useToast();
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [stepsDone, setStepsDone] = useState<number[]>([]);
  const cat = categoryOf(tip.categoryId);
  const needAck = !!tip.safety && !state.safetyAck.includes(tip.id);
  const saved = state.savedTips.includes(tip.id);
  const done = !!state.doneTips[tip.id];
  return (
    <View style={{ gap: 12 }}>
      <Row between>
        {onClose ? <IconButton icon="chevron-left" label="Quay lại" onPress={onClose} /> : <View />}
        <Row>
          <IconButton
            icon="share-2"
            label="Chia sẻ"
            onPress={() => {
              track('tip_shared', { tipId: tip.id });
              Share.share({ message: `${tip.title} — Mẹo Nhà\nhttps://meonha.app/tip/${tip.id}` });
            }}
          />
          <IconButton
            icon="bookmark"
            label={saved ? 'Bỏ lưu' : 'Lưu'}
            color={saved ? c.a : undefined}
            bg={saved ? c.at : undefined}
            onPress={() => state.toggleSaveTip(tip.id)}
          />
        </Row>
      </Row>
      <T
        v="micro"
        accent
      >{`${cat.name} · ${tip.minutes} phút · ${tip.rating.toString().replace('.', ',')} ★ (${(tip.ratingCount / 1000).toFixed(1).replace('.', ',')}k)`}</T>
      <T v="title" accessibilityRole="header">
        {tip.title}
      </T>
      {tip.safety ? (
        <Card variant="danger">
          <Row>
            <Icon name="alert-circle" color={c.negative} />
            <T v="headline" color={c.negative}>
              An toàn trước khi làm
            </T>
          </Row>
          {tip.safety.map((r, i) => (
            <T key={i} v="body">
              {r}
            </T>
          ))}
          <Row style={{ marginTop: 4 }}>
            <Chip
              label={needAck ? 'Tôi đã đọc lưu ý' : 'Đã đọc lưu ý'}
              selected={!needAck}
              icon={needAck ? 'square' : 'check-square'}
              onPress={() => {
                if (needAck) {
                  state.set({ safetyAck: [...state.safetyAck, tip.id] });
                  track('safety_acknowledged', { tipId: tip.id });
                }
              }}
            />
          </Row>
        </Card>
      ) : null}
      <View style={{ opacity: needAck ? 0.4 : 1 }} pointerEvents={needAck ? 'none' : 'auto'}>
        {tip.steps.map((st, i) => (
          <ListItem
            key={i}
            strong={false}
            divider={i < tip.steps.length - 1}
            left={<Badge label={String(i + 1)} tone="accent" />}
            title={stepsDone.includes(i) ? `✓ ${st}` : st}
            onPress={() => setStepsDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))}
          />
        ))}
      </View>
      {tip.caution ? (
        <Card variant="tint">
          <Row style={{ alignItems: 'flex-start' }}>
            <Icon name="info" color={c.a} size={18} />
            <T v="caption" style={{ flex: 1 }}>
              {tip.caution}
            </T>
          </Row>
        </Card>
      ) : null}
      <Button
        title={done ? 'Đã làm ✓' : 'Đã làm xong'}
        icon={done ? undefined : 'check'}
        variant={done ? 'secondary' : 'primary'}
        onPress={() => setRateOpen(true)}
      />
      <Button
        title="Báo mẹo sai hoặc nguy hiểm"
        variant="text"
        icon="flag"
        size="sm"
        onPress={() => router.push({ pathname: '/report', params: { tipId: tip.id } })}
      />
      <Sheet
        visible={rateOpen}
        onClose={() => setRateOpen(false)}
        title="Mẹo có hiệu quả không?"
        footer={
          <Button
            title="Gửi"
            disabled={!rating}
            onPress={() => {
              state.markDone(tip.id);
              setRateOpen(false);
              toast('Cảm ơn bạn!', { tone: 'success' });
              track('tip_done', { tipId: tip.id, rating });
            }}
          />
        }
      >
        <Row gap={6} style={{ justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <IconButton
              key={n}
              soft={false}
              icon="star"
              label={`${n} sao`}
              color={n <= rating ? c.a2 : c.line}
              onPress={() => setRating(n)}
            />
          ))}
        </Row>
      </Sheet>
    </View>
  );
}

export function IngredientChecklist({ items }: { items: { id: string; name: string; qty: string; have: boolean }[] }) {
  const { c } = useTheme();
  const toggle = useMeo((s) => s.togglePantry);
  return (
    <View>
      {items.map((it, i) => (
        <ListItem
          key={it.id}
          strong={false}
          divider={i < items.length - 1}
          left={<Check on={it.have} />}
          title={it.name}
          right={
            <T v="caption" color={it.have ? c.inkMuted : c.warning}>
              {it.have ? it.qty : `Thiếu · ${it.qty}`}
            </T>
          }
          onPress={() => toggle(it.id)}
        />
      ))}
    </View>
  );
}

export { Chips };
