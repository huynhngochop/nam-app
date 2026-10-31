import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Row,
  Sheet,
  T,
  TextField,
  useTheme,
  useToast,
} from '@nam/ui';
import { hhmm, shortDate, track, vnd } from '@nam/core';
import { Booking, SOURCE_LABEL, STATUS_LABEL } from './types';
import { customerStats, priceOf, svcOf, useHen } from './store';

const NEXT: Partial<Record<Booking['status'], { label: string; to: Booking['status'] }>> = {
  confirmed: { label: 'Khách đã đến', to: 'checked_in' },
  checked_in: { label: 'Bắt đầu làm', to: 'in_service' },
};

/** HD-C06 · Chi tiết lịch hẹn (dùng cho trang riêng và cột chi tiết trên tablet). */
export function BookingDetail({ booking, onClose }: { booking: Booking; onClose?: () => void }) {
  const { c } = useTheme();
  const toast = useToast();
  const s = useHen();
  const [pay, setPay] = useState(false);
  const [amount, setAmount] = useState(String(priceOf(booking, s.services)));
  const [method, setMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [cancelAsk, setCancelAsk] = useState(false);
  const cust = s.customers.find((x) => x.id === booking.customerId);
  const staff = s.staff.find((x) => x.id === booking.staffId);
  const stats = customerStats(booking.customerId, s.bookings, s.services);
  const svcs = svcOf(booking.serviceIds, s.services);
  const late = Date.now() > booking.startAt + 10 * 60000;
  const next = NEXT[booking.status];
  const steps: Booking['status'][] = ['checked_in', 'in_service', 'completed'];
  const stepIdx = steps.indexOf(booking.status);

  const setStatus = (to: Booking['status']) => {
    s.updateBooking(booking.id, { status: to });
    track(`booking_${to}`);
  };
  const finish = () => {
    const n = Number(amount.replace(/\D/g, '')) || 0;
    s.updateBooking(booking.id, { status: 'completed', payment: { amount: n, method, paidAt: Date.now() } });
    setPay(false);
    toast(`Đã thu ${vnd(n)}`, { tone: 'success' });
    track('booking_completed', { amount: n, method });
  };

  return (
    <View style={{ gap: 12 }}>
      <Row between>
        {onClose ? <IconButton icon="chevron-left" label="Quay lại" onPress={onClose} /> : <View />}
        <T v="headline">{`Lịch hẹn #${booking.code}`}</T>
        {booking.status === 'confirmed' ? (
          <IconButton icon="x-circle" label="Hủy lịch" onPress={() => setCancelAsk(true)} />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </Row>
      <Row gap={12}>
        <Avatar name={cust?.name ?? 'Khách'} />
        <View style={{ flex: 1 }}>
          <T v="headline" onPress={() => cust && router.push(`/customer/${cust.id}`)}>
            {cust?.name ?? 'Khách lẻ'}
          </T>
          <T v="caption" muted>{`${cust?.phone ?? 'Không có SĐT'} · lần thứ ${stats.visits + 1}`}</T>
        </View>
        {cust?.phone ? (
          <IconButton
            icon="phone"
            label="Gọi"
            color={c.a}
            bg={c.at}
            onPress={() => Linking.openURL(`tel:${cust.phone}`)}
          />
        ) : null}
        {cust?.phone ? (
          <IconButton
            icon="message-square"
            label="Nhắn Zalo"
            color={c.a}
            bg={c.at}
            onPress={() => Linking.openURL(`https://zalo.me/${cust.phone}`)}
          />
        ) : null}
      </Row>
      <Card>
        {[
          ['Dịch vụ', svcs.map((x) => x.name).join(', ')],
          [
            'Thời gian',
            `${hhmm(new Date(booking.startAt))} – ${hhmm(new Date(booking.endAt))} · ${shortDate(new Date(booking.startAt))}`,
          ],
          ['Thợ', staff?.name ?? '—'],
          ['Nguồn', SOURCE_LABEL[booking.source]],
          ['Tạm tính', vnd(priceOf(booking, s.services))],
        ].map(([k, v]) => (
          <Row key={k} between>
            <T v="caption" muted>
              {k}
            </T>
            <T v="headline" style={{ flexShrink: 1, textAlign: 'right' }}>
              {v}
            </T>
          </Row>
        ))}
      </Card>
      {booking.customerNote ? (
        <Card variant="tint">
          <T v="micro" accent>
            Ghi chú của khách
          </T>
          <T v="body">{booking.customerNote}</T>
        </Card>
      ) : null}
      {['cancelled', 'no_show', 'completed'].includes(booking.status) ? (
        <Badge label={STATUS_LABEL[booking.status]} tone={booking.status === 'completed' ? 'positive' : 'negative'} />
      ) : (
        <Row wrap>
          {steps.map((st, i) => (
            <Badge
              key={st}
              label={`${i + 1} ${STATUS_LABEL[st]}`}
              tone={i < stepIdx ? 'positive' : i === stepIdx ? 'accent' : 'neutral'}
            />
          ))}
        </Row>
      )}
      {booking.status === 'confirmed' && late ? (
        <Button
          title="Khách không đến"
          variant="danger"
          onPress={() => {
            setStatus('no_show');
            toast('Đã đánh dấu không đến');
          }}
        />
      ) : null}
      {next ? <Button title={next.label} onPress={() => setStatus(next.to)} /> : null}
      {booking.status === 'in_service' ? (
        <Button title="Hoàn thành & thu tiền" icon="check" onPress={() => setPay(true)} />
      ) : null}
      {booking.payment ? (
        <T
          v="caption"
          muted
        >{`Đã thu ${vnd(booking.payment.amount)} · ${{ cash: 'Tiền mặt', transfer: 'Chuyển khoản', card: 'Thẻ' }[booking.payment.method]}`}</T>
      ) : null}

      <Sheet
        visible={pay}
        onClose={() => setPay(false)}
        title="Thu tiền"
        footer={<Button title="Xác nhận" onPress={finish} />}
      >
        <TextField
          label="Tổng tiền"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
          right={<T v="headline">đ</T>}
        />
        <Row wrap>
          {(['cash', 'transfer', 'card'] as const).map((m) => (
            <Chip
              key={m}
              label={{ cash: 'Tiền mặt', transfer: 'Chuyển khoản', card: 'Thẻ' }[m]}
              selected={method === m}
              onPress={() => setMethod(m)}
            />
          ))}
        </Row>
        {method === 'transfer' ? (
          <T v="caption" muted>
            Mã VietQR của tiệm hiện ở đây khi đã khai báo tài khoản nhận tiền.
          </T>
        ) : null}
      </Sheet>
      <Dialog
        visible={cancelAsk}
        destructive
        title="Hủy lịch hẹn?"
        body="Khách sẽ nhận tin báo hủy kèm link đặt lại."
        confirm="Hủy lịch"
        cancel="Giữ lịch"
        onCancel={() => setCancelAsk(false)}
        onConfirm={() => {
          setStatus('cancelled');
          setCancelAsk(false);
          toast('Đã hủy lịch');
          onClose?.();
        }}
      />
    </View>
  );
}
