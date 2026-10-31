import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  AppBar,
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Chips,
  Dialog,
  EmptyState,
  FAB,
  ListItem,
  Row,
  Screen,
  Sheet,
  Stepper,
  T,
  TextField,
  Toggle,
  useToast,
} from '@nam/ui';
import { useHen } from '../src/store';
import { ROLE_LABEL, Role, Staff } from '../src/types';

const ROLES: Role[] = ['stylist', 'assistant', 'manager', 'owner'];
const SHIFT = ['07:00', '08:00', '09:00', '10:00', '12:00', '13:00', '14:00'];
const SHIFT_END = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

/** HD-C04 · Nhân viên: ca làm, hoa hồng, nghỉ hôm nay, mã mời. */
export default function StaffScreen() {
  const toast = useToast();
  const s = useHen();
  const [edit, setEdit] = useState<Partial<Staff> | null>(null);
  const [del, setDel] = useState<Staff | null>(null);
  const valid = !!edit && (edit.name ?? '').trim().length >= 1;
  const upcoming = (id: string) =>
    s.bookings.filter((b) => b.staffId === id && b.startAt > Date.now() && b.status === 'confirmed').length;

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      overlay={
        <FAB
          label="Thêm nhân viên"
          onPress={() =>
            setEdit({
              role: 'stylist',
              shiftFrom: '08:00',
              shiftTo: '20:00',
              onlineToday: true,
              commissionPct: 0,
              name: '',
            })
          }
        />
      }
    >
      <AppBar title="Nhân viên" onBack={() => router.back()} />
      {!s.staff.length ? (
        <EmptyState
          icon="users"
          title="Chưa có nhân viên"
          action="Thêm nhân viên"
          onAction={() =>
            setEdit({
              role: 'stylist',
              shiftFrom: '08:00',
              shiftTo: '20:00',
              onlineToday: true,
              commissionPct: 0,
              name: '',
            })
          }
        />
      ) : null}
      {s.staff.map((st) => (
        <ListItem
          key={st.id}
          left={<Avatar name={st.name} soft />}
          title={st.name}
          subtitle={`${ROLE_LABEL[st.role]} · ${st.shiftFrom}–${st.shiftTo} · HH ${st.commissionPct}%`}
          right={
            st.onlineToday ? <Badge label="Đi làm" tone="positive" /> : <Badge label="Nghỉ hôm nay" tone="warning" />
          }
          onPress={() => setEdit(st)}
        />
      ))}
      <Card variant="tint">
        <T v="headline">Mời thợ dùng app</T>
        <T v="caption">Thợ đăng nhập bằng SĐT và mã mời — chỉ thấy lịch của mình và khách, không thấy doanh thu.</T>
        <Row>
          <T
            v="title"
            style={{ letterSpacing: 4 }}
          >{`${s.shop.slug.slice(0, 3).toUpperCase()}-${String(s.staff.length * 137 + 4021).slice(-4)}`}</T>
          <Button
            title="Sao chép"
            size="sm"
            variant="secondary"
            icon="copy"
            onPress={async () => {
              await Clipboard.setStringAsync(
                `${s.shop.slug.slice(0, 3).toUpperCase()}-${String(s.staff.length * 137 + 4021).slice(-4)}`,
              );
              toast('Đã sao chép mã mời');
            }}
          />
        </Row>
      </Card>

      <Sheet
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Sửa nhân viên' : 'Thêm nhân viên'}
        footer={
          <View style={{ gap: 8 }}>
            <Button
              title="Lưu"
              disabled={!valid}
              onPress={() => {
                s.upsertStaff({
                  id: edit!.id,
                  name: edit!.name!.trim(),
                  phone: edit!.phone,
                  role: edit!.role!,
                  shiftFrom: edit!.shiftFrom!,
                  shiftTo: edit!.shiftTo!,
                  onlineToday: edit!.onlineToday ?? true,
                  commissionPct: edit!.commissionPct ?? 0,
                });
                if (!edit!.id)
                  useHen.setState((x) => ({
                    services: x.services.map((sv) => ({
                      ...sv,
                      staffIds: [...sv.staffIds, x.staff[x.staff.length - 1].id],
                    })),
                  }));
                toast('Đã lưu', { tone: 'success' });
                setEdit(null);
              }}
            />
            {edit?.id ? (
              <Button
                title="Xóa nhân viên"
                variant="danger"
                size="md"
                onPress={() => {
                  setDel(edit as Staff);
                  setEdit(null);
                }}
              />
            ) : null}
          </View>
        }
      >
        {edit ? (
          <View style={{ gap: 12 }}>
            <TextField
              label="Tên"
              value={edit.name}
              onChangeText={(t) => setEdit({ ...edit, name: t })}
              maxLength={40}
            />
            <TextField
              label="SĐT (để đăng nhập)"
              value={edit.phone ?? ''}
              onChangeText={(t) => setEdit({ ...edit, phone: t.replace(/\s/g, '') })}
              keyboardType="phone-pad"
            />
            <T v="caption" muted weight="semibold">
              Vai trò
            </T>
            <Chips>
              {ROLES.map((r) => (
                <Chip
                  key={r}
                  label={ROLE_LABEL[r]}
                  selected={edit.role === r}
                  onPress={() => setEdit({ ...edit, role: r })}
                />
              ))}
            </Chips>
            <T v="caption" muted weight="semibold">
              Bắt đầu ca
            </T>
            <Chips scroll>
              {SHIFT.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={edit.shiftFrom === t}
                  onPress={() => setEdit({ ...edit, shiftFrom: t })}
                />
              ))}
            </Chips>
            <T v="caption" muted weight="semibold">
              Hết ca
            </T>
            <Chips scroll>
              {SHIFT_END.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={edit.shiftTo === t}
                  onPress={() => setEdit({ ...edit, shiftTo: t })}
                />
              ))}
            </Chips>
            <Row between>
              <T v="body">Hoa hồng</T>
              <Stepper
                value={edit.commissionPct ?? 0}
                min={0}
                max={60}
                onChange={(n) => setEdit({ ...edit, commissionPct: n })}
                format={(n) => `${n}%`}
              />
            </Row>
            <Row between>
              <T v="body">Đi làm hôm nay</T>
              <Toggle
                label="Đi làm hôm nay"
                value={edit.onlineToday ?? true}
                onChange={(v) => setEdit({ ...edit, onlineToday: v })}
              />
            </Row>
            {edit.id && !edit.onlineToday && upcoming(edit.id) ? (
              <T v="caption">{`Còn ${upcoming(edit.id)} lịch sắp tới của thợ này — nhớ chuyển sang thợ khác.`}</T>
            ) : null}
          </View>
        ) : null}
      </Sheet>
      <Dialog
        visible={!!del}
        title={`Xóa ${del?.name}?`}
        body={
          del && upcoming(del.id)
            ? `Thợ còn ${upcoming(del.id)} lịch sắp tới. Chuyển lịch trước khi xóa.`
            : 'Lịch hẹn cũ vẫn giữ trong báo cáo.'
        }
        confirm="Xóa"
        destructive
        onCancel={() => setDel(null)}
        onConfirm={() => {
          if (del && upcoming(del.id)) {
            toast('Hãy chuyển các lịch sắp tới trước');
            setDel(null);
            return;
          }
          useHen.setState((x) => ({
            services: x.services.map((sv) => ({ ...sv, staffIds: sv.staffIds.filter((i) => i !== del!.id) })),
          }));
          s.removeStaff(del!.id);
          setDel(null);
          toast('Đã xóa');
        }}
      />
    </Screen>
  );
}
