import React, { useState } from 'react';
import { Share } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  AppBar,
  Badge,
  Button,
  Card,
  Dialog,
  ListItem,
  Row,
  Screen,
  SectionHeader,
  T,
  TextField,
  Toggle,
  useToast,
} from '@nam/ui';
import { CloudError, fold, hasCloud, track } from '@nam/core';
import { useHen, useOutbox } from '../src/store';
import { bookingUrl, createInvite, enableCloud, joinShop, pull, pushPending, setBookingPage } from '../src/cloudSync';

const ROLE = { owner: 'Chủ tiệm', admin: 'Quản lý', member: 'Thợ / máy phụ' } as const;
const slugOf = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'tiem';
const errText = (e: unknown) => {
  const m = e instanceof CloudError ? e.message : String(e);
  if (/invalid_code/.test(m)) return 'Mã mời sai hoặc đã hết hạn';
  if (/group_full/.test(m)) return 'Tiệm đã đủ số máy';
  if (/slug_taken/.test(m)) return 'Tên link đã có tiệm khác dùng — chọn tên khác';
  if (/Anonymous sign-ins are disabled/i.test(m)) return 'Máy chủ chưa bật đăng nhập cho app — báo nhà phát triển';
  return 'Không kết nối được máy chủ. Thử lại sau.';
};

/** Đồng bộ nhiều máy + trang đặt lịch online (nam-cloud). Chủ tiệm bật; thợ / máy khác vào bằng mã mời. */
export default function Team() {
  const toast = useToast();
  const cloud = useHen((s) => s.cloud);
  const shop = useHen((s) => s.shop);
  const pending = useOutbox((o) => o.items.length);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null);
  const [askJoin, setAskJoin] = useState(false);
  const [slug, setSlug] = useState(cloud?.slug ?? slugOf(shop.name));

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast(ok, { tone: 'success' });
    } catch (e) {
      toast(errText(e));
    } finally {
      setBusy(false);
    }
  };

  if (!hasCloud())
    return (
      <Screen scroll edges={['top', 'bottom']}>
        <AppBar title="Đồng bộ nhiều máy" onBack={() => router.back()} />
        <Card variant="tint">
          <T v="body">Bản cài này chưa kết nối máy chủ. Dữ liệu tiệm nằm trên máy này.</T>
        </Card>
      </Screen>
    );

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title="Đồng bộ nhiều máy" onBack={() => router.back()} />
      {!cloud ? (
        <>
          <Card variant="tint">
            <T v="headline">Dùng chung lịch hẹn trên nhiều điện thoại</T>
            <T v="body">
              Chủ tiệm và thợ cùng thấy lịch, khách, doanh thu. Mất mạng vẫn dùng được, có mạng lại thì tự đồng bộ.
            </T>
            <Button
              title="Bật đồng bộ cho tiệm này"
              icon="refresh-cw"
              loading={busy}
              onPress={() =>
                run(async () => {
                  await enableCloud();
                  track('cloud_enabled');
                }, 'Đã bật đồng bộ')
              }
            />
          </Card>
          <SectionHeader title="Máy của thợ / máy thứ hai" />
          <TextField
            label="Mã mời từ chủ tiệm"
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            autoCapitalize="characters"
            maxLength={8}
            placeholder="Ví dụ: K7M2PQ4X"
          />
          <Button
            title="Vào tiệm"
            variant="secondary"
            disabled={code.trim().length < 6}
            onPress={() => setAskJoin(true)}
          />
          <Dialog
            visible={askJoin}
            title="Vào tiệm bằng mã mời?"
            body="Dữ liệu đang có trên máy này sẽ được thay bằng dữ liệu của tiệm."
            confirm="Vào tiệm"
            cancel="Thôi"
            destructive
            onCancel={() => setAskJoin(false)}
            onConfirm={() => {
              setAskJoin(false);
              run(async () => {
                await joinShop(code.trim());
                track('cloud_joined');
                router.replace('/');
              }, 'Đã vào tiệm');
            }}
          />
        </>
      ) : (
        <>
          <Card>
            <Row between>
              <T v="headline">Đang đồng bộ</T>
              <Badge label={ROLE[cloud.role]} tone="positive" />
            </Row>
            <T v="caption" muted>
              {pending ? `${pending} thay đổi chờ gửi` : 'Mọi thay đổi đã gửi'}
            </T>
            <Button
              title="Đồng bộ ngay"
              size="sm"
              variant="secondary"
              icon="refresh-cw"
              loading={busy}
              onPress={() => run(async () => (await pushPending(), await pull()), 'Đã đồng bộ')}
            />
          </Card>

          {cloud.role !== 'member' ? (
            <>
              <SectionHeader title="Mời thợ / thêm máy" />
              <Card>
                {invite ? (
                  <>
                    <T v="caption" muted>
                      Mã mời (dùng trong 7 ngày)
                    </T>
                    <T v="title" selectable>
                      {invite.code}
                    </T>
                    <Row>
                      <Button
                        title="Sao chép"
                        size="sm"
                        variant="secondary"
                        icon="copy"
                        onPress={async () => {
                          await Clipboard.setStringAsync(invite.code);
                          toast('Đã sao chép mã');
                        }}
                      />
                      <Button
                        title="Gửi cho thợ"
                        size="sm"
                        variant="secondary"
                        icon="share-2"
                        onPress={() =>
                          Share.share({
                            message: `Mã vào tiệm ${shop.name} trên Hẹn Đẹp: ${invite.code} (mở app → Cài đặt → Đồng bộ nhiều máy → Vào tiệm)`,
                          }).catch(() => {})
                        }
                      />
                    </Row>
                  </>
                ) : (
                  <T v="body">Thợ cài Hẹn Đẹp, chọn “Vào tiệm” và nhập mã mời.</T>
                )}
                <Button
                  title={invite ? 'Tạo mã mới' : 'Tạo mã mời'}
                  size="sm"
                  icon="user-plus"
                  loading={busy}
                  onPress={() => run(async () => setInvite(await createInvite()))}
                />
              </Card>

              <SectionHeader title="Trang đặt lịch online" />
              <Card>
                <ListItem
                  title="Khách tự đặt lịch qua link"
                  subtitle={cloud.slug ? bookingUrl(cloud.slug).replace('https://', '') : 'Đang tắt'}
                  divider={false}
                  right={
                    <Toggle
                      label="Trang đặt lịch"
                      value={!!cloud.slug}
                      onChange={(on) =>
                        run(
                          async () => {
                            if (on && !shop.settings.selfBooking)
                              useHen.getState().setShop({ settings: { ...shop.settings, selfBooking: true } });
                            await setBookingPage(slugOf(slug), on);
                            track(on ? 'booking_page_on' : 'booking_page_off');
                          },
                          on ? 'Đã mở trang đặt lịch' : 'Đã tắt trang đặt lịch',
                        )
                      }
                    />
                  }
                />
                {!cloud.slug ? (
                  <TextField
                    label="Tên link (chữ không dấu, gạch nối)"
                    value={slug}
                    onChangeText={(v) => setSlug(v.toLowerCase())}
                    autoCapitalize="none"
                    maxLength={40}
                  />
                ) : (
                  <Button
                    title="Link & mã QR"
                    size="sm"
                    variant="secondary"
                    icon="link-2"
                    onPress={() => router.push('/link')}
                  />
                )}
                <T v="caption" muted>
                  Khách chọn dịch vụ, giờ trống và để lại tên, số điện thoại. Lịch hiện ngay trong app (kèm thông báo);
                  tiệm gọi hoặc nhắn xác nhận như bình thường.
                </T>
              </Card>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
