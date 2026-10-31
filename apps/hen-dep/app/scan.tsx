import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  AppBar,
  Banner,
  Button,
  Card,
  Check,
  EmptyState,
  ListItem,
  Row,
  Screen,
  Sheet,
  Stepper,
  T,
  TextField,
  useTheme,
  useToast,
} from '@nam/ui';
import { AiQuotaError, getLimit, track, vnd } from '@nam/core';
import { useHen } from '../src/store';
import { ParsedService, parseLocally, parsePrice, parsePriceBoard } from '../src/priceBoard';

const SAMPLE =
  'BẢNG GIÁ\nCắt + gội + sấy ........ 180K\nCắt nam 120.000\nNhuộm thời trang 650k\nUốn lạnh 800K 150 phút\nGội dưỡng sinh 150k';

/**
 * HD-C17 Chụp bảng giá → HD-C18 Kiểm tra kết quả.
 * Bản này: chọn ảnh để đối chiếu + dán chữ trên bảng giá (OCR trên máy sẽ nối vào sau: ML Kit / Vision).
 * Có cổng AI → AI tách; không có → bộ tách trên máy. Luôn cho kiểm tra trước khi lưu.
 */
export default function Scan() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useHen();
  const [uri, setUri] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<(ParsedService & { keep: boolean })[] | null>(null);
  const [viaAi, setViaAi] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [priceText, setPriceText] = useState('');

  const pick = async (camera: boolean) => {
    try {
      const perm = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast(camera ? 'Cần quyền máy ảnh. Mở Cài đặt để cấp quyền.' : 'Cần quyền truy cập ảnh.');
        return;
      }
      const r = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (!r.canceled && r.assets[0]) setUri(r.assets[0].uri);
    } catch {
      toast('Không mở được máy ảnh');
    }
  };

  const quota = getLimit(
    s.plan.code === 'chain' ? 'AI_QUOTA_CHAIN' : s.plan.code === 'standard' ? 'AI_QUOTA_STANDARD' : 'AI_QUOTA_BASIC',
    10,
  );
  const month = new Date().toISOString().slice(0, 7);
  const used = s.aiUsed.month === month ? s.aiUsed.count : 0;

  const run = async () => {
    setBusy(true);
    try {
      const r = used < quota ? await parsePriceBoard(text) : { services: parseLocally(text), viaAi: false };
      if (r.viaAi) s.consumeAi();
      setViaAi(r.viaAi);
      setRows(r.services.map((x) => ({ ...x, keep: true })));
      track('price_board_parsed', { count: r.services.length, viaAi: r.viaAi });
    } catch (e) {
      toast(
        e instanceof AiQuotaError
          ? 'Hết lượt AI tháng này — đã dùng bộ đọc trên máy.'
          : 'Không đọc được. Kiểm tra lại chữ đã dán.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (rows) {
    const keep = rows.filter((r) => r.keep && r.price != null);
    const missing = rows.filter((r) => r.keep && r.price == null).length;
    return (
      <Screen
        scroll
        edges={['top', 'bottom']}
        footer={
          <Button
            title={`Lưu ${keep.length} dịch vụ`}
            disabled={!keep.length}
            onPress={() => {
              s.addServices(
                keep.map((r) => ({
                  name: r.name,
                  price: r.price!,
                  durationMin: r.durationMin,
                  group: r.group,
                  staffIds: s.staff.map((x) => x.id),
                  visible: true,
                })),
              );
              track('price_board_saved', { count: keep.length });
              toast(`Đã thêm ${keep.length} dịch vụ`, { tone: 'success' });
              router.back();
            }}
          />
        }
      >
        <AppBar title="Kiểm tra kết quả" onBack={() => setRows(null)} />
        <Banner
          tone="ok"
          icon={viaAi ? 'zap' : 'cpu'}
          text={
            viaAi
              ? 'AI đã đọc bảng giá. Kiểm tra giá và thời lượng trước khi lưu.'
              : 'Đọc trên máy. Thời lượng có dấu * là ước đoán.'
          }
        />
        {missing ? <Banner tone="warning" text={`${missing} dòng chưa có giá — chạm để sửa, hoặc bỏ chọn.`} /> : null}
        {!rows.length ? (
          <EmptyState
            icon="file-text"
            title="Không tìm thấy dịch vụ nào"
            body="Mỗi dòng nên có tên và giá, ví dụ “Cắt nam 120k”."
          />
        ) : null}
        {rows.map((r, i) => (
          <ListItem
            key={i}
            left={<Check on={r.keep} />}
            title={r.name}
            subtitle={`${r.group} · ${r.durationMin} phút${r.durationGuessed ? '*' : ''}`}
            right={
              <T v="headline" color={r.price == null ? c.negative : undefined}>
                {r.price == null ? 'Thiếu giá' : vnd(r.price)}
              </T>
            }
            onPress={() => {
              setEditing(i);
              setPriceText(r.price != null ? String(r.price) : '');
            }}
            onLongPress={() => setRows(rows.map((x, j) => (j === i ? { ...x, keep: !x.keep } : x)))}
          />
        ))}
        <T v="caption" muted>
          Chạm để sửa · nhấn giữ để bỏ chọn.
        </T>
        <Sheet
          visible={editing != null}
          onClose={() => setEditing(null)}
          title="Sửa dòng"
          footer={
            <Button
              title="Xong"
              onPress={() => {
                const p = parsePrice(priceText) ?? (/^\d+$/.test(priceText) ? Number(priceText) : null);
                setRows(rows.map((x, j) => (j === editing ? { ...x, price: p } : x)));
                setEditing(null);
              }}
            />
          }
        >
          {editing != null ? (
            <View style={{ gap: 12 }}>
              <TextField
                label="Tên"
                value={rows[editing].name}
                onChangeText={(t) => setRows(rows.map((x, j) => (j === editing ? { ...x, name: t } : x)))}
              />
              <TextField label="Giá" value={priceText} onChangeText={setPriceText} placeholder="180k" />
              <Row between>
                <T v="body">Thời lượng</T>
                <Stepper
                  value={rows[editing].durationMin}
                  min={10}
                  max={480}
                  step={5}
                  format={(n) => `${n} phút`}
                  onChange={(n) =>
                    setRows(rows.map((x, j) => (j === editing ? { ...x, durationMin: n, durationGuessed: false } : x)))
                  }
                />
              </Row>
              <Button
                title={rows[editing].keep ? 'Bỏ dòng này' : 'Giữ dòng này'}
                variant="text"
                onPress={() => setRows(rows.map((x, j) => (j === editing ? { ...x, keep: !x.keep } : x)))}
              />
            </View>
          ) : null}
        </Sheet>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={<Button title="Đọc bảng giá" loading={busy} disabled={text.trim().length < 5} onPress={run} />}
    >
      <AppBar title="Chụp bảng giá" onBack={() => router.back()} />
      <T v="body">
        Chụp hoặc chọn ảnh bảng giá để đối chiếu, rồi dán chữ trên bảng giá vào ô bên dưới (mỗi dịch vụ một dòng).
      </T>
      <Row>
        <Button title="Chụp ảnh" icon="camera" size="md" variant="secondary" onPress={() => pick(true)} />
        <Button title="Chọn ảnh" icon="image" size="md" variant="secondary" onPress={() => pick(false)} />
      </Row>
      {uri ? (
        <Card>
          <Image
            source={{ uri }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 12 }}
            resizeMode="contain"
            accessibilityLabel="Ảnh bảng giá"
          />
        </Card>
      ) : null}
      <TextField
        label="Chữ trên bảng giá"
        value={text}
        onChangeText={setText}
        multiline
        placeholder={'Cắt nam 120k\nNhuộm 650.000'}
        style={{ minHeight: 160 }}
      />
      {!text ? <Button title="Dùng ví dụ" size="sm" variant="text" onPress={() => setText(SAMPLE)} /> : null}
      <T v="caption" muted>
        {used < quota
          ? `Có AI hỗ trợ · còn ${quota - used} lượt tháng này`
          : 'Hết lượt AI tháng này — dùng bộ đọc trên máy'}
      </T>
    </Screen>
  );
}
