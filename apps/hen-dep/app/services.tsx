import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  AppBar,
  Button,
  Chip,
  Chips,
  Dialog,
  EmptyState,
  FAB,
  ListItem,
  Row,
  Screen,
  SectionHeader,
  Sheet,
  Stepper,
  T,
  TextField,
  Toggle,
  useTheme,
  useToast,
} from '@nam/ui';
import { vnd } from '@nam/core';
import { useHen } from '../src/store';
import { parsePrice } from '../src/priceBoard';
import { Service } from '../src/types';

const GROUPS = ['Tóc', 'Gội dưỡng', 'Nail', 'Spa', 'Trang điểm', 'Khác'];

/** HD-C03 · Dịch vụ & bảng giá. Sửa trong sheet (tablet: sheet nằm giữa màn hình). */
export default function Services() {
  const { c } = useTheme();
  const toast = useToast();
  const s = useHen();
  const [edit, setEdit] = useState<Partial<Service> | null>(null);
  const [priceText, setPriceText] = useState('');
  const [del, setDel] = useState<Service | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, Service[]>();
    [...s.services].sort((a, b) => a.order - b.order).forEach((x) => m.set(x.group, [...(m.get(x.group) ?? []), x]));
    return [...m.entries()];
  }, [s.services]);

  const openEdit = (sv?: Service) => {
    setEdit(
      sv ?? { name: '', group: 'Tóc', durationMin: 45, price: 0, staffIds: s.staff.map((x) => x.id), visible: true },
    );
    setPriceText(sv ? String(sv.price) : '');
  };
  const price = parsePrice(priceText) ?? (/^\d+$/.test(priceText) ? Number(priceText) : null);
  const valid =
    !!edit && (edit.name ?? '').trim().length >= 2 && price != null && price >= 0 && (edit.staffIds?.length ?? 0) > 0;

  const save = () => {
    if (!edit || !valid) return;
    s.upsertService({
      id: edit.id,
      name: edit.name!.trim(),
      group: edit.group!,
      durationMin: edit.durationMin!,
      price: price!,
      staffIds: edit.staffIds!,
      visible: edit.visible ?? true,
    });
    toast('Đã lưu dịch vụ', { tone: 'success' });
    setEdit(null);
  };

  return (
    <Screen scroll edges={['top', 'bottom']} overlay={<FAB label="Thêm dịch vụ" onPress={() => openEdit()} />}>
      <AppBar
        title="Dịch vụ & bảng giá"
        onBack={() => router.back()}
        right={
          <Button title="Chụp bảng giá" size="sm" variant="text" icon="camera" onPress={() => router.push('/scan')} />
        }
      />
      {!s.services.length ? (
        <EmptyState
          icon="scissors"
          title="Chưa có dịch vụ"
          body="Chụp bảng giá để thêm nhanh, hoặc thêm từng dịch vụ."
          action="Thêm dịch vụ"
          onAction={() => openEdit()}
        />
      ) : (
        groups.map(([g, list]) => (
          <View key={g}>
            <SectionHeader title={g} />
            {list.map((sv) => (
              <ListItem
                key={sv.id}
                title={sv.name}
                titleColor={sv.visible ? undefined : c.inkMuted}
                subtitle={`${sv.durationMin} phút · ${sv.staffIds.length} thợ${sv.visible ? '' : ' · Ẩn với khách'}`}
                right={<T v="headline">{vnd(sv.price)}</T>}
                onPress={() => openEdit(sv)}
                onLongPress={() => setDel(sv)}
              />
            ))}
          </View>
        ))
      )}
      {s.services.length ? (
        <T v="caption" muted>
          Nhấn giữ để xóa dịch vụ.
        </T>
      ) : null}

      <Sheet
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
        footer={<Button title="Lưu" disabled={!valid} onPress={save} />}
      >
        {edit ? (
          <View style={{ gap: 12 }}>
            <TextField
              label="Tên dịch vụ"
              value={edit.name}
              onChangeText={(t) => setEdit({ ...edit, name: t })}
              maxLength={60}
            />
            <TextField
              label="Giá"
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="numbers-and-punctuation"
              placeholder="180k hoặc 180000"
              error={priceText && price == null ? 'Chưa đọc được giá' : undefined}
            />
            {price != null && priceText ? <T v="caption" muted>{`= ${vnd(price)}`}</T> : null}
            <Row between>
              <T v="body">Thời lượng</T>
              <Stepper
                value={edit.durationMin ?? 45}
                min={10}
                max={480}
                step={5}
                onChange={(n) => setEdit({ ...edit, durationMin: n })}
                format={(n) => `${n} phút`}
              />
            </Row>
            <T v="caption" muted weight="semibold">
              Nhóm
            </T>
            <Chips>
              {GROUPS.map((g) => (
                <Chip key={g} label={g} selected={edit.group === g} onPress={() => setEdit({ ...edit, group: g })} />
              ))}
            </Chips>
            <T v="caption" muted weight="semibold">
              Thợ làm được
            </T>
            <Chips>
              {s.staff.map((st) => (
                <Chip
                  key={st.id}
                  label={st.name}
                  selected={edit.staffIds?.includes(st.id)}
                  onPress={() =>
                    setEdit({
                      ...edit,
                      staffIds: edit.staffIds?.includes(st.id)
                        ? edit.staffIds.filter((x) => x !== st.id)
                        : [...(edit.staffIds ?? []), st.id],
                    })
                  }
                />
              ))}
            </Chips>
            {!s.staff.length ? (
              <T v="caption" color={c.negative}>
                Thêm thợ trước trong mục Nhân viên.
              </T>
            ) : null}
            <Row between>
              <T v="body">Hiện trên trang đặt lịch</T>
              <Toggle
                label="Hiện với khách"
                value={edit.visible ?? true}
                onChange={(v) => setEdit({ ...edit, visible: v })}
              />
            </Row>
          </View>
        ) : null}
      </Sheet>
      <Dialog
        visible={!!del}
        title={`Xóa “${del?.name}”?`}
        body="Lịch hẹn cũ có dịch vụ này vẫn được giữ."
        confirm="Xóa"
        destructive
        onCancel={() => setDel(null)}
        onConfirm={() => {
          s.removeService(del!.id);
          setDel(null);
          toast('Đã xóa');
        }}
      />
    </Screen>
  );
}
