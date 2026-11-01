import React from 'react';
import { Pressable, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Button, Card, Check, IconButton, ProgressBar, Row, Screen, Segmented, T, useTheme } from '@nam/ui';
import { offeringsFor, ritualById } from '../../../src/data/rituals';
import { useTT } from '../../../src/store';

const REGION = { bac: 'miền Bắc', trung: 'miền Trung', nam: 'miền Nam' } as const;
/** Mảng rỗng dùng chung: selector zustand trả mảng mới mỗi lần sẽ vẽ lại vô hạn (lỗi React #185, vòng UAT 3). */
const NO_CHECKS: string[] = [];

/** TT-08 · Chuẩn bị lễ vật: danh sách đánh dấu, lưu trên máy. */
export default function Offerings() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = ritualById(id);
  const hh = useTT((s) => s.household);
  const level = useTT((s) => s.levelByRitual[id] ?? 'day-du');
  const levelBy = useTT((s) => s.levelByRitual);
  const checks = useTT((s) => s.offeringChecks[id] ?? NO_CHECKS);
  const set = useTT((s) => s.set);
  const toggle = useTT((s) => s.toggleOffering);
  const reset = useTT((s) => s.resetOfferings);
  if (!r) return null;
  const items = offeringsFor(r, hh.region, hh.diet, level === 'gian-di');
  const need = items.filter((o) => !o.avoid);
  const done = need.filter((o) => checks.includes(o.name)).length;
  const shareList = () =>
    Share.share({
      message: `Lễ vật ${r.title}:\n${need.map((o) => `- ${o.name}${o.note ? ` (${o.note})` : ''}`).join('\n')}`,
    }).catch(() => {});

  return (
    <Screen
      scroll
      footer={
        <Button title="Xong, mở văn khấn" icon="book-open" onPress={() => router.push(`/ritual/${r.id}/prayer`)} />
      }
    >
      <AppBar
        onBack={() => router.back()}
        title="Chuẩn bị lễ vật"
        right={<IconButton icon="share" label="Gửi danh sách" onPress={shareList} />}
      />
      <T v="title">{r.title}</T>
      <T v="caption" muted>
        Theo nếp {REGION[hh.region]}
        {hh.diet === 'chay' ? ', cúng chay' : ''}. Đổi ở Cài đặt › Nếp nhà mình.
      </T>
      <Segmented
        options={[
          { key: 'day-du', label: 'Lễ đầy đủ' },
          { key: 'gian-di', label: 'Lễ giản dị' },
        ]}
        value={level}
        onChange={(k) => set({ levelByRitual: { ...levelBy, [r.id]: k as 'day-du' | 'gian-di' } })}
      />
      <Row between>
        <T v="caption" muted>
          Đã có {done}/{need.length} món
        </T>
        {done ? (
          <T v="caption" accent weight="semibold" onPress={() => reset(r.id)}>
            Bỏ đánh dấu
          </T>
        ) : null}
      </Row>
      <ProgressBar value={need.length ? done / need.length : 0} />
      <Card style={{ paddingVertical: 4 }}>
        {items.map((o, i) => {
          const on = checks.includes(o.name);
          if (o.avoid) {
            return (
              <View
                key={o.name}
                style={{ paddingVertical: 12, gap: 2, borderTopWidth: i ? 0.5 : 0, borderColor: c.line }}
              >
                <T v="body" muted style={{ textDecorationLine: 'line-through' }}>
                  {o.name}
                </T>
                {o.note ? (
                  <T v="caption" muted>
                    {o.note}
                  </T>
                ) : null}
              </View>
            );
          }
          return (
            <Pressable
              key={o.name}
              onPress={() => toggle(r.id, o.name)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 56,
                paddingVertical: 8,
                borderTopWidth: i ? 0.5 : 0,
                borderColor: c.line,
              }}
            >
              <Check on={on} />
              <View style={{ flex: 1 }}>
                <T v="body" color={on ? c.inkMuted : undefined}>
                  {o.name}
                  {o.optional ? ' (nếu có)' : ''}
                </T>
                {o.note ? (
                  <T v="caption" muted>
                    {o.note}
                  </T>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </Card>
      {r.variantNote ? (
        <T v="caption" muted>
          {r.variantNote}
        </T>
      ) : null}
      <T v="caption" muted>
        Thiếu món nào cũng không sao. Lễ vật là tấm lòng, không phải điều kiện.
      </T>
    </Screen>
  );
}
