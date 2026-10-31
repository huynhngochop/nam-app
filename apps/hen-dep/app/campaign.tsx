import React, { useEffect, useMemo, useState } from 'react';
import { Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppBar,
  Avatar,
  Button,
  Card,
  Chip,
  Chips,
  Dialog,
  ListItem,
  Row,
  Screen,
  SearchField,
  SectionHeader,
  T,
  TextField,
  useTheme,
  useToast,
} from '@nam/ui';
import { fold, getConfig, relativeTime, track, useOnline } from '@nam/core';
import { customerIndex, useHen } from '../src/store';
import { templateVariants } from '../src/promo';

/** Danh sách tự chọn chỉ vẽ chừng này dòng; tìm tên/SĐT để thấy khách khác (IT2). */
const PICK_LIMIT = 100;

type Aud = 'lapsed' | 'vip' | 'custom';

/** HD-C11 · Gửi ưu đãi. Chỉ gửi cho khách đã đồng ý nhận tin. Gửi thật đi qua máy chủ (Zalo ZNS) — ngoại tuyến thì xếp hàng. */
export default function Campaign() {
  const { c } = useTheme();
  const toast = useToast();
  const online = useOnline();
  const p = useLocalSearchParams<{ window?: string; message?: string }>();
  const s = useHen();
  const link = `hendep.app/${s.shop.slug}`;
  const [aud, setAud] = useState<Aud>('lapsed');
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState(
    p.message ??
      templateVariants({
        shopName: s.shop.name,
        link,
        goal: p.window ? 'lunch' : 'lapsed',
        tone: 'friendly',
        offerPct: 10,
        window: p.window,
      })[0],
  );
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (p.message) setMsg(p.message);
  }, [p.message]);

  const index = useMemo(() => customerIndex(s.bookings, s.services), [s.bookings, s.services]);
  const people = useMemo(() => {
    const now = Date.now();
    return s.customers
      .filter((cu) => cu.marketingConsent && cu.phone)
      .map((cu) => ({ cu, st: index.get(cu.id) }))
      .filter(({ cu, st }) =>
        aud === 'custom'
          ? true
          : aud === 'vip'
            ? st.visits >= s.shop.settings.vipVisits || st.spend >= s.shop.settings.vipSpend
            : st.lastAt
              ? now - st.lastAt > 45 * 86400000
              : now - cu.createdAt > 45 * 86400000,
      );
  }, [s.customers, index, aud, s.shop.settings]);
  const pickedSet = useMemo(() => new Set(picked), [picked]);
  const targets = aud === 'custom' ? people.filter((x) => pickedSet.has(x.cu.id)) : people;
  const shown = useMemo(() => {
    if (aud !== 'custom') return [];
    const fq = fold(q.trim());
    const digits = q.replace(/\D/g, '');
    const hit = fq
      ? people.filter(
          ({ cu }) => fold(cu.name).includes(fq) || (digits.length >= 3 && (cu.phone ?? '').includes(digits)),
        )
      : people;
    // Khách đã chọn luôn hiện trước, rồi tới khách đến gần đây nhất.
    return [...hit].sort(
      (a, b) =>
        Number(pickedSet.has(b.cu.id)) - Number(pickedSet.has(a.cu.id)) || (b.st.lastAt ?? 0) - (a.st.lastAt ?? 0),
    );
  }, [aud, people, q, pickedSet]);
  const noConsent = s.customers.filter((x) => !x.marketingConsent).length;
  const missingLink = !msg.includes(link);

  // H5: chưa có máy chủ thì không có gì gửi đi được — không báo "đang gửi", chỉ cho chia sẻ để tự gửi.
  const canSend = !!getConfig().apiBaseUrl;
  const send = () => {
    setConfirm(false);
    s.addCampaign({ audience: aud, count: targets.length, message: msg });
    track('campaign_sent', { audience: aud, count: targets.length });
    toast(
      online ? `Đang gửi cho ${targets.length} khách` : `Ngoại tuyến — sẽ gửi cho ${targets.length} khách khi có mạng`,
      { tone: 'success' },
    );
    router.back();
  };

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <View style={{ gap: 8 }}>
          {canSend ? (
            <>
              <Button
                title={`Gửi cho ${targets.length} khách`}
                disabled={!targets.length || msg.trim().length < 10}
                onPress={() => setConfirm(true)}
              />
              <Button
                title="Chia sẻ qua ứng dụng khác"
                variant="text"
                size="sm"
                icon="share-2"
                onPress={() => Share.share({ message: msg }).catch(() => {})}
              />
            </>
          ) : (
            <Button
              title="Chia sẻ tin để tự gửi"
              icon="share-2"
              disabled={msg.trim().length < 10}
              onPress={() => {
                track('campaign_shared_manually', { audience: aud });
                Share.share({ message: msg }).catch(() => {});
              }}
            />
          )}
        </View>
      }
    >
      <AppBar title="Gửi ưu đãi" onBack={() => router.back()} />
      {!canSend ? (
        <Card variant="tint">
          <T v="body">Bản này chưa gửi tin tự động qua Zalo. Chia sẻ nội dung để tự gửi cho khách bên dưới.</T>
        </Card>
      ) : null}
      {p.window ? (
        <Card variant="tint">
          <T v="body">{`Lấp khung trống ${p.window} hôm nay`}</T>
        </Card>
      ) : null}
      <SectionHeader title="Gửi cho ai" />
      <Chips>
        <Chip label="Lâu chưa quay lại (45 ngày)" selected={aud === 'lapsed'} onPress={() => setAud('lapsed')} />
        <Chip label="Khách VIP" selected={aud === 'vip'} onPress={() => setAud('vip')} />
        <Chip label="Tự chọn" selected={aud === 'custom'} onPress={() => setAud('custom')} />
      </Chips>
      {aud === 'custom' ? <SearchField value={q} onChangeText={setQ} placeholder="Tìm tên hoặc SĐT" /> : null}
      {aud === 'custom' ? (
        shown.slice(0, PICK_LIMIT).map(({ cu, st }) => (
          <ListItem
            key={cu.id}
            left={<Avatar name={cu.name} soft size={36} />}
            title={cu.name}
            subtitle={st.lastAt ? `Lần cuối ${relativeTime(st.lastAt)}` : 'Chưa đến lần nào'}
            right={
              <T v="headline" color={pickedSet.has(cu.id) ? c.a : c.inkMuted}>
                {pickedSet.has(cu.id) ? '✓' : '+'}
              </T>
            }
            onPress={() => setPicked((x) => (x.includes(cu.id) ? x.filter((y) => y !== cu.id) : [...x, cu.id]))}
          />
        ))
      ) : (
        <T v="caption" muted>{`${targets.length} khách phù hợp`}</T>
      )}
      {aud === 'custom' && shown.length > PICK_LIMIT ? (
        <T v="caption" muted>{`Đang hiện ${PICK_LIMIT}/${shown.length} khách. Tìm tên hoặc SĐT để thấy khách khác.`}</T>
      ) : null}
      {noConsent ? <T v="caption" muted>{`${noConsent} khách chưa đồng ý nhận tin — không gửi.`}</T> : null}
      <Row between>
        <T v="headline">Nội dung</T>
        <Button
          title="AI soạn giúp"
          size="sm"
          variant="text"
          icon="zap"
          onPress={() => router.push({ pathname: '/campaign-ai', params: { window: p.window ?? '' } })}
        />
      </Row>
      <TextField
        value={msg}
        onChangeText={setMsg}
        multiline
        maxLength={300}
        style={{ minHeight: 110 }}
        error={missingLink ? 'Nên có link đặt lịch để khách đặt ngay' : undefined}
      />
      <T v="caption" muted>{`${msg.length}/300 ký tự`}</T>
      {s.campaigns.length ? (
        <>
          <SectionHeader title="Đã gửi" />
          {s.campaigns.slice(0, 5).map((x) => (
            <ListItem key={x.id} title={x.message} subtitle={`${x.count} khách · ${relativeTime(x.sentAt)}`} />
          ))}
        </>
      ) : null}
      <Dialog
        visible={confirm}
        title={`Gửi cho ${targets.length} khách?`}
        body="Tin ưu đãi gửi qua Zalo cho khách đã đồng ý nhận tin."
        confirm="Gửi"
        onCancel={() => setConfirm(false)}
        onConfirm={send}
      />
    </Screen>
  );
}
