import React, { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppBar,
  Banner,
  Button,
  Card,
  Chip,
  Chips,
  IconButton,
  Row,
  Screen,
  Sheet,
  T,
  TextField,
  useTheme,
  useToast,
} from '@nam/ui';
import { track } from '@nam/core';
import { prayerById } from '../../../src/data/prayers';
import { useTT } from '../../../src/store';
import { useSession } from '../../../src/session';
import { usePrayer } from '../../../src/usePrayer';
import { FIELD_LABEL, plainText } from '../../../src/lib/prayer';
import type { PrayerField } from '../../../src/data/types';
import { PrayerText, dmy } from '../../../src/components';
import { nextByRule } from '../../../src/lib/schedule';
import { lunarOf, lunarShort } from '../../../src/calendar/lunar';

const HOUSEHOLD_FIELDS: PrayerField[] = ['tinChu', 'diaChi', 'hoGiaTien'];
const DATE_FIELDS: PrayerField[] = ['ngayAm', 'thangAm', 'namCanChi'];
const SIZES = [1, 1.15, 1.3, 1.5];

/** TT-09 · Văn khấn + TT-11 · Điền vào bài khấn (sheet; trên màn rộng hiện giữa màn). */
export default function PrayerScreen() {
  const { c } = useTheme();
  const toast = useToast();
  const { id, prayerId, gioName, gioRelation } = useLocalSearchParams<{
    id: string;
    prayerId?: string;
    gioName?: string;
    gioRelation?: string;
  }>();
  const data = usePrayer(id, prayerId);
  const fontScale = useTT((s) => s.fontScale);
  const set = useTT((s) => s.set);
  const setHousehold = useTT((s) => s.setHousehold);
  const saved = useTT((s) => s.saves.includes(`prayer:${data?.p.id}`));
  const toggleSave = useTT((s) => s.toggleSave);
  const session = useSession();
  const [fillOpen, setFillOpen] = useState(false);

  useEffect(() => {
    // mở từ Sổ giỗ: điền sẵn tên người mất
    if (gioName) session.set({ extra: { ...session.extra, tenNguoiMat: gioName, quanHe: gioRelation ?? '' } });
    return () => session.set({ extra: {}, prayDate: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;
  const { r, p, paras, fields, missing, values, prayDate } = data;
  const size = Math.round(17 * fontScale);
  const others = r.prayers
    .filter((x) => x !== p.id)
    .map(prayerById)
    .filter((x): x is NonNullable<typeof x> => !!x);
  const next = r.when.rule ? nextByRule(r.when.rule, new Date()) : null;
  const editable = fields.filter((f) => !DATE_FIELDS.includes(f));

  return (
    <Screen
      scroll
      footer={
        <Row gap={8}>
          <Button
            title="Điền"
            variant="secondary"
            icon="edit-3"
            onPress={() => setFillOpen(true)}
            style={{ flexGrow: 0.6 }}
          />
          <Button
            title="Bắt đầu khấn"
            icon="play"
            onPress={() => {
              track('pray_started', { id: p.id });
              router.push(`/ritual/${r.id}/pray?prayerId=${p.id}`);
            }}
          />
        </Row>
      }
    >
      <AppBar
        onBack={() => router.back()}
        title="Văn khấn"
        right={
          <>
            <IconButton
              icon="type"
              label="Cỡ chữ"
              onPress={() => set({ fontScale: SIZES[(SIZES.indexOf(fontScale) + 1) % SIZES.length] ?? 1.15 })}
            />
            <IconButton
              icon="share"
              label="Chia sẻ"
              onPress={() =>
                Share.share({ message: `${p.title}\n\n${paras.map(plainText).join('\n\n')}` }).catch(() => {})
              }
            />
            <IconButton
              icon="bookmark"
              label={saved ? 'Bỏ lưu' : 'Lưu'}
              color={saved ? c.a : undefined}
              onPress={() => toast(toggleSave(`prayer:${p.id}`) ? 'Đã lưu bài khấn' : 'Đã bỏ lưu')}
            />
          </>
        }
      />
      <T v="display" accessibilityRole="header">
        {p.title}
      </T>
      <T v="caption" muted>
        Kính {p.deity} · khoảng {p.minutes} phút · ngày cúng {dmy(prayDate)} ({lunarShort(lunarOf(prayDate))})
      </T>
      {others.length ? (
        <Chips scroll>
          {[p, ...others].map((x) => (
            <Chip
              key={x.id}
              label={x.title}
              selected={x.id === p.id}
              onPress={() => router.setParams({ prayerId: x.id })}
            />
          ))}
        </Chips>
      ) : null}
      {missing.length ? (
        <Banner
          tone="warning"
          icon="edit-3"
          text={`Còn ${missing.length} chỗ trống: ${missing.map((f) => FIELD_LABEL[f].toLowerCase()).join(', ')}. Chạm để điền.`}
          onPress={() => setFillOpen(true)}
        />
      ) : null}
      <Card>
        <PrayerText paras={paras} size={size} onField={() => setFillOpen(true)} />
      </Card>
      <T v="caption" muted>
        Bài khấn biên soạn theo khuôn cổ truyền. Có thể khấn bằng lời của mình; tâm thành là chính.
      </T>

      <Sheet
        visible={fillOpen}
        onClose={() => setFillOpen(false)}
        title="Điền vào bài khấn"
        footer={<Button title="Xong" onPress={() => setFillOpen(false)} />}
      >
        <T v="caption" muted>
          Tên, địa chỉ lưu trên máy này cho lần sau. Tên người đã khuất chỉ dùng cho lần khấn này.
        </T>
        <T v="micro" muted>
          Ngày cúng
        </T>
        <Chips>
          <Chip
            label={`Hôm nay · ${lunarShort(lunarOf(new Date()))}`}
            selected={!session.prayDate}
            onPress={() => session.set({ prayDate: null })}
          />
          {next && next.toDateString() !== new Date().toDateString() ? (
            <Chip
              label={`Ngày lễ ${dmy(next)} · ${lunarShort(lunarOf(next))}`}
              selected={session.prayDate === next.getTime()}
              onPress={() => session.set({ prayDate: next.getTime() })}
            />
          ) : null}
        </Chips>
        {editable.map((f) => (
          <TextField
            key={f}
            label={FIELD_LABEL[f]}
            value={values[f] ?? ''}
            autoCapitalize={f === 'diaChi' ? 'sentences' : 'words'}
            onChangeText={(s) =>
              HOUSEHOLD_FIELDS.includes(f)
                ? setHousehold({ [f]: s })
                : session.set({ extra: { ...session.extra, [f]: s } })
            }
          />
        ))}
        <View style={{ height: 4 }} />
      </Sheet>
    </Screen>
  );
}
