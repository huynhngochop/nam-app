import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Check,
  Dialog,
  EmptyState,
  Grid,
  ListItem,
  Row,
  SectionHeader,
  T,
  TextField,
  useTheme,
  useToast,
} from '@nam/ui';
import { shortDate, shortMoney, track } from '@nam/core';
import { customerStats, svcOf, useHen } from './store';
import { STATUS_LABEL } from './types';

/** HD-C09 · Hồ sơ khách. Dùng chung cho màn riêng (điện thoại) và cột phải (tablet). id = "new" để thêm khách. */
export function CustomerDetail({ id, embedded }: { id: string; embedded?: boolean }) {
  const { c } = useTheme();
  const toast = useToast();
  const s = useHen();
  const customer = s.customers.find((x) => x.id === id);
  const isNew = id === 'new';
  const [edit, setEdit] = useState(isNew);
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [birthday, setBirthday] = useState(customer?.birthday ?? '');
  const [note, setNote] = useState(customer?.note ?? '');
  const [consent, setConsent] = useState(customer?.marketingConsent ?? false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setName(customer?.name ?? '');
    setPhone(customer?.phone ?? '');
    setBirthday(customer?.birthday ?? '');
    setNote(customer?.note ?? '');
    setConsent(customer?.marketingConsent ?? false);
    setEdit(isNew);
    // Chỉ nạp lại ô nhập khi chuyển sang khách khác; dữ liệu khách đổi trong lúc đang sửa không được ghi đè chữ đang gõ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!customer && !isNew) return <EmptyState icon="user-x" title="Không tìm thấy khách" />;
  const phoneClean = phone.replace(/\s/g, '');
  const phoneError = phoneClean && !/^0\d{9,10}$/.test(phoneClean) ? 'SĐT gồm 10–11 số, bắt đầu bằng 0' : undefined;
  const birthdayError = birthday && !/^\d{1,2}\/\d{1,2}$/.test(birthday) ? 'Nhập dạng ngày/tháng, ví dụ 24/12' : undefined;
  const duplicate = phoneClean ? s.customers.find((x) => x.phone === phoneClean && x.id !== id) : undefined;

  const save = () => {
    const newId = s.upsertCustomer({
      id: isNew ? undefined : id,
      name: name.trim(),
      phone: phoneClean || undefined,
      birthday: birthday || undefined,
      note: note.trim() || undefined,
      marketingConsent: consent,
    });
    track(isNew ? 'customer_created' : 'customer_updated');
    toast('Đã lưu', { tone: 'success' });
    if (isNew) router.replace(`/customer/${newId}`);
    else setEdit(false);
  };

  if (edit) {
    return (
      <View style={{ gap: 12, padding: embedded ? 24 : 0 }}>
        <T v="title">{isNew ? 'Thêm khách' : 'Sửa thông tin'}</T>
        <TextField label="Họ tên" value={name} onChangeText={setName} maxLength={60} />
        <TextField
          label="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={phoneError ?? (duplicate ? `Trùng SĐT với ${duplicate.name}` : undefined)}
        />
        <TextField
          label="Sinh nhật (ngày/tháng)"
          value={birthday}
          onChangeText={setBirthday}
          placeholder="24/12"
          error={birthdayError}
        />
        <TextField
          label="Ghi chú"
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Ví dụ: da nhạy cảm, thích thợ Lan"
          maxLength={300}
        />
        <Row>
          <Check on={consent} />
          <T v="body" style={{ flex: 1 }} onPress={() => setConsent((x) => !x)}>
            Khách đồng ý nhận tin ưu đãi
          </T>
        </Row>
        <Button title="Lưu" disabled={name.trim().length < 2 || !!phoneError || !!birthdayError || !!duplicate} onPress={save} />
        <Button title="Hủy" variant="text" onPress={() => (isNew ? router.back() : setEdit(false))} />
      </View>
    );
  }

  // Chỉ còn lại trường hợp xem khách đã có (khách mới luôn ở chế độ sửa).
  if (!customer) return null;
  const stats = customerStats(customer.id, s.bookings, s.services);
  const vip = stats.visits >= s.shop.settings.vipVisits || stats.spend >= s.shop.settings.vipSpend;
  const content = (
    <View style={{ gap: 12 }}>
      <Row gap={12}>
        <Avatar name={customer.name} size={56} soft />
        <View style={{ flex: 1 }}>
          <T v="title">{customer.name}</T>
          <T v="caption" muted>
            {customer.phone ?? 'Chưa có SĐT'}
          </T>
        </View>
        {vip ? <Badge label="VIP" tone="pro" /> : null}
      </Row>
      <Grid min={3} gap={8}>
        <Card variant="fill">
          <T v="caption" muted>
            Số lần
          </T>
          <T v="title">{String(stats.visits)}</T>
        </Card>
        <Card variant="fill">
          <T v="caption" muted>
            Đã chi
          </T>
          <T v="title">{shortMoney(stats.spend)}</T>
        </Card>
        <Card variant="fill">
          <T v="caption" muted>
            Bỏ hẹn
          </T>
          <T v="title" color={stats.noShows ? c.negative : undefined}>
            {String(stats.noShows)}
          </T>
        </Card>
      </Grid>
      <Row wrap>
        <Button
          title="Đặt lịch"
          size="sm"
          icon="calendar"
          onPress={() => router.push({ pathname: '/booking/new', params: { customerId: customer.id } })}
        />
        {customer.phone ? (
          <Button
            title="Gọi"
            size="sm"
            variant="secondary"
            icon="phone"
            onPress={() => Linking.openURL(`tel:${customer.phone}`).catch(() => toast('Máy không gọi được'))}
          />
        ) : null}
        {customer.phone ? (
          <Button
            title="Zalo"
            size="sm"
            variant="secondary"
            icon="message-circle"
            onPress={() => Linking.openURL(`https://zalo.me/${customer.phone}`).catch(() => toast('Không mở được Zalo'))}
          />
        ) : null}
        <Button title="Sửa" size="sm" variant="text" icon="edit-2" onPress={() => setEdit(true)} />
      </Row>
      {customer.note ? (
        <Card variant="tint">
          <T v="caption" muted weight="semibold">
            Ghi chú
          </T>
          <T v="body">{customer.note}</T>
        </Card>
      ) : null}
      {customer.birthday ? <T v="caption" muted>{`Sinh nhật: ${customer.birthday}`}</T> : null}
      {!customer.marketingConsent ? (
        <T v="caption" muted>
          Khách chưa đồng ý nhận tin ưu đãi — không có trong chiến dịch.
        </T>
      ) : null}
      <SectionHeader title="Lịch sử" />
      {stats.history.length ? (
        stats.history.slice(0, 30).map((b) => (
          <ListItem
            key={b.id}
            title={
              svcOf(b.serviceIds, s.services)
                .map((x) => x.name)
                .join(', ') || 'Dịch vụ đã xóa'
            }
            subtitle={`${shortDate(new Date(b.startAt))} · ${s.staff.find((x) => x.id === b.staffId)?.name ?? ''}`}
            right={
              <T v="caption" color={b.status === 'no_show' || b.status === 'cancelled' ? c.negative : c.inkMuted}>
                {STATUS_LABEL[b.status]}
              </T>
            }
            onPress={() => router.push(`/booking/${b.id}`)}
          />
        ))
      ) : (
        <T v="caption" muted>
          Chưa có lịch hẹn.
        </T>
      )}
      <Button title="Xóa khách" variant="danger" size="sm" onPress={() => setConfirmDel(true)} />
      <Dialog
        visible={confirmDel}
        title="Xóa khách này?"
        body="Lịch hẹn cũ vẫn giữ trong báo cáo doanh thu."
        confirm="Xóa"
        destructive
        onCancel={() => setConfirmDel(false)}
        onConfirm={() => {
          setConfirmDel(false);
          s.removeCustomer(customer.id);
          toast('Đã xóa khách');
          if (!embedded) router.back();
        }}
      />
    </View>
  );
  return embedded ? <ScrollView contentContainerStyle={{ padding: 24 }}>{content}</ScrollView> : content;
}
