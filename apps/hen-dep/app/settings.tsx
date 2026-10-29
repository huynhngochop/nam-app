import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Button, Card, Chip, Chips, Dialog, ListItem, Row, Screen, SectionHeader, Segmented, Stepper, T, TextField, Toggle, useToast } from '@nam/ui';
import { shortMoney } from '@nam/core';
import { useHen, useOutbox } from '../src/store';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const FROM = ['07:00', '08:00', '09:00', '10:00'];
const TO = ['18:00', '19:00', '20:00', '21:00', '22:00'];

/** HD-C13 · Cài đặt tiệm: thông tin, giờ mở cửa, quy tắc đặt lịch, nhắc lịch, chống bỏ hẹn, giao diện, dữ liệu. */
export default function Settings() {
  const toast = useToast();
  const s = useHen();
  const pending = useOutbox((o) => o.items.length);
  const st = s.shop.settings;
  const [name, setName] = useState(s.shop.name);
  const [address, setAddress] = useState(s.shop.address);
  const [phone, setPhone] = useState(s.shop.phone);
  const [ask, setAsk] = useState<null | 'clear' | 'logout' | 'demo'>(null);
  const setSt = (p: Partial<typeof st>) => s.setShop({ settings: { ...st, ...p } });
  const dirty = name !== s.shop.name || address !== s.shop.address || phone !== s.shop.phone;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title="Cài đặt tiệm" onBack={() => router.back()} />
      <SectionHeader title="Thông tin tiệm" />
      <TextField label="Tên tiệm" value={name} onChangeText={setName} maxLength={60} />
      <TextField label="Địa chỉ" value={address} onChangeText={setAddress} icon="map-pin" />
      <TextField label="SĐT tiệm" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {dirty ? <Button title="Lưu thông tin" size="md" disabled={name.trim().length < 2} onPress={() => { s.setShop({ name: name.trim(), address: address.trim(), phone: phone.trim() }); toast('Đã lưu', { tone: 'success' }); }} /> : null}

      <SectionHeader title="Giờ mở cửa" />
      {s.shop.hours.map((h) => (
        <Card key={h.day} variant="fill">
          <Row between>
            <T v="headline">{DAYS[h.day]}</T>
            <Toggle label={`Mở cửa ${DAYS[h.day]}`} value={h.open} onChange={(v) => s.setShop({ hours: s.shop.hours.map((x) => (x.day === h.day ? { ...x, open: v } : x)) })} />
          </Row>
          {h.open ? (
            <>
              <Chips scroll>{FROM.map((t) => <Chip key={t} label={`Mở ${t}`} selected={h.from === t} onPress={() => s.setShop({ hours: s.shop.hours.map((x) => (x.day === h.day ? { ...x, from: t } : x)) })} />)}</Chips>
              <Chips scroll>{TO.map((t) => <Chip key={t} label={`Đóng ${t}`} selected={h.to === t} onPress={() => s.setShop({ hours: s.shop.hours.map((x) => (x.day === h.day ? { ...x, to: t } : x)) })} />)}</Chips>
            </>
          ) : null}
        </Card>
      ))}

      <SectionHeader title="Khách tự đặt lịch" />
      <ListItem title="Cho khách tự đặt qua link" right={<Toggle label="Khách tự đặt" value={st.selfBooking} onChange={(v) => setSt({ selfBooking: v })} />} />
      <Row between><T v="body" style={{ flex: 1 }}>Đặt trước ít nhất</T><Stepper value={st.minLeadMin} min={0} max={1440} step={30} onChange={(n) => setSt({ minLeadMin: n })} format={(n) => (n >= 60 ? `${n / 60} giờ` : `${n} phút`)} /></Row>
      <Row between><T v="body" style={{ flex: 1 }}>Hủy trước</T><Stepper value={st.cancelBeforeH} min={0} max={48} onChange={(n) => setSt({ cancelBeforeH: n })} format={(n) => `${n} giờ`} /></Row>
      <Row between><T v="body" style={{ flex: 1 }}>Nghỉ giữa 2 khách</T><Stepper value={st.bufferMin} min={0} max={60} step={5} onChange={(n) => setSt({ bufferMin: n })} format={(n) => `${n} phút`} /></Row>
      <Row between><T v="body" style={{ flex: 1 }}>Bước giờ đặt</T><Segmented options={[{ key: '15', label: '15p' }, { key: '30', label: '30p' }]} value={String(st.slotStepMin) as '15' | '30'} onChange={(k) => setSt({ slotStepMin: Number(k) })} /></Row>

      <SectionHeader title="Nhắc lịch & đánh giá" />
      <ListItem title="Nhắc khách trước 24 giờ" right={<Toggle label="Nhắc 24 giờ" value={st.remind24h} onChange={(v) => setSt({ remind24h: v })} />} />
      <ListItem title="Nhắc khách trước 2 giờ" right={<Toggle label="Nhắc 2 giờ" value={st.remind2h} onChange={(v) => setSt({ remind2h: v })} />} />
      <ListItem title="Xin đánh giá sau khi xong" right={<Toggle label="Xin đánh giá" value={st.askReview} onChange={(v) => setSt({ askReview: v })} />} />
      <ListItem title="Yêu cầu cọc với khách từng bỏ hẹn" subtitle="Khách bỏ hẹn ≥ 2 lần phải cọc khi đặt qua link" right={<Toggle label="Cọc chống bỏ hẹn" value={st.depositForNoShow} onChange={(v) => setSt({ depositForNoShow: v })} />} />

      <SectionHeader title="Khách VIP" />
      <Row between><T v="body" style={{ flex: 1 }}>Từ số lần</T><Stepper value={st.vipVisits} min={1} max={50} onChange={(n) => setSt({ vipVisits: n })} /></Row>
      <Row between><T v="body" style={{ flex: 1 }}>Hoặc đã chi từ</T><Stepper value={st.vipSpend} min={500000} max={20000000} step={500000} onChange={(n) => setSt({ vipSpend: n })} format={shortMoney} /></Row>

      <SectionHeader title="Giao diện" />
      <Segmented options={[{ key: 'system', label: 'Theo máy' }, { key: 'light', label: 'Sáng' }, { key: 'dark', label: 'Tối' }]} value={s.theme} onChange={(k) => s.set({ theme: k })} />

      <SectionHeader title="Dữ liệu" />
      {pending ? <T v="caption" muted>{`${pending} thay đổi chưa gửi lên máy chủ`}</T> : null}
      <View style={{ gap: 8 }}>
        <Button title="Nạp dữ liệu mẫu" variant="secondary" size="md" onPress={() => setAsk('demo')} />
        <Button title="Xóa toàn bộ dữ liệu tiệm" variant="danger" size="md" onPress={() => setAsk('clear')} />
        <Button title="Đăng xuất" variant="text" size="md" onPress={() => setAsk('logout')} />
      </View>
      <T v="caption" muted center>Hẹn Đẹp 0.1.0</T>

      <Dialog visible={ask === 'demo'} title="Nạp dữ liệu mẫu?" body="Thay thợ, dịch vụ, khách và lịch hẹn hiện có bằng dữ liệu mẫu." confirm="Nạp" onCancel={() => setAsk(null)}
        onConfirm={() => { s.loadDemo(); setAsk(null); toast('Đã nạp dữ liệu mẫu'); }} />
      <Dialog visible={ask === 'clear'} title="Xóa toàn bộ dữ liệu?" body="Thợ, dịch vụ, khách, lịch hẹn và chiến dịch trên máy này sẽ bị xóa. Không hoàn tác được." confirm="Xóa hết" destructive onCancel={() => setAsk(null)}
        onConfirm={() => { s.clearAll(); setAsk(null); toast('Đã xóa dữ liệu'); }} />
      <Dialog visible={ask === 'logout'} title="Đăng xuất?" body={pending ? `Còn ${pending} thay đổi chưa gửi. Đăng xuất bây giờ sẽ mất các thay đổi này.` : 'Dữ liệu vẫn giữ trên máy chủ.'} confirm="Đăng xuất" destructive={!!pending}
        onCancel={() => setAsk(null)} onConfirm={() => { setAsk(null); s.set({ auth: null }); router.replace('/auth'); }} />
    </Screen>
  );
}
