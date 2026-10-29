import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Button, Chip, Chips, Dialog, EmptyState, IconButton, ListItem, Screen, SectionHeader, Segmented, Sheet, T, TextField, Thumb, useLayout, useTheme, useToast } from '@nam/ui';
import { IconName } from '@nam/ui';
import { catOf, useVi } from '../src/store';

const ICONS: IconName[] = ['coffee', 'home', 'shopping-bag', 'navigation', 'heart', 'book-open', 'users', 'film', 'smartphone', 'gift', 'scissors', 'tool', 'briefcase', 'award', 'music', 'sun'];

/** VG-12 · Danh mục & quy tắc tự xếp. Lưới danh mục tự tăng số cột trên tablet. */
export default function Categories() {
  const { c } = useTheme();
  const L = useLayout();
  const toast = useToast();
  const s = useVi();
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [edit, setEdit] = useState<{ id?: string; name: string; icon: IconName } | null>(null);
  const [rule, setRule] = useState<{ keyword: string; categoryId: string } | null>(null);
  const [delCat, setDelCat] = useState<string | null>(null);
  const list = s.categories.filter((x) => x.kind === kind);
  const cols = L.columns(4);
  const nE = s.categories.filter((x) => x.kind === 'expense').length;
  const nI = s.categories.length - nE;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <AppBar title="Danh mục" onBack={() => router.back()} right={<IconButton icon="plus" label="Thêm danh mục" onPress={() => setEdit({ name: '', icon: 'tag' })} />} />
      <Segmented options={[{ key: 'expense', label: `Chi (${nE})` }, { key: 'income', label: `Thu (${nI})` }]} value={kind} onChange={setKind} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {list.map((x) => (
          <Pressable key={x.id} accessibilityRole="button" accessibilityLabel={x.name} onPress={() => setEdit({ id: x.id, name: x.name, icon: x.icon })} onLongPress={() => !x.builtin && setDelCat(x.id)}
            style={{ width: `${100 / cols}%`, alignItems: 'center', gap: 4, paddingVertical: 8 }}>
            <Thumb icon={x.icon} color={c.a} bg={c.at} size={48} />
            <T v="caption" center numberOfLines={2}>{x.name}</T>
          </Pressable>
        ))}
      </View>
      <SectionHeader title="Quy tắc tự xếp" action="+ Thêm" onAction={() => setRule({ keyword: '', categoryId: 'food' })} />
      {!s.rules.length ? <EmptyState icon="zap" title="Chưa có quy tắc" body="Khi bạn đổi danh mục một giao dịch, Ví Gọn gợi ý tạo quy tắc." /> : s.rules.map((r) => (
        <ListItem key={r.id} title={`Nội dung có “${r.keyword}”`} right={<Chip label={catOf(r.categoryId, s.categories).name} />} onPress={() => setRule(r)}
          onLongPress={() => { s.removeRule(r.id); toast('Đã xóa quy tắc', { action: { label: 'Hoàn tác', onPress: () => s.addRule(r.keyword, r.categoryId) } }); }} />
      ))}
      {s.rules.length ? <T v="caption" muted>Nhấn giữ quy tắc để xóa.</T> : null}

      <Sheet visible={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Sửa danh mục' : 'Danh mục mới'} footer={<Button title="Lưu" disabled={!edit || edit.name.trim().length < 2} onPress={() => {
        s.upsertCategory({ id: edit!.id, name: edit!.name.trim(), icon: edit!.icon, kind: edit!.id ? catOf(edit!.id, s.categories).kind : kind, builtin: edit!.id ? catOf(edit!.id, s.categories).builtin : false });
        setEdit(null);
      }} />}>
        {edit ? (
          <View style={{ gap: 12 }}>
            <TextField label="Tên" value={edit.name} onChangeText={(t) => setEdit({ ...edit, name: t })} maxLength={30} />
            <Chips>{ICONS.map((i) => <Chip key={i} label="" icon={i} selected={edit.icon === i} onPress={() => setEdit({ ...edit, icon: i })} />)}</Chips>
          </View>
        ) : null}
      </Sheet>
      <Sheet visible={!!rule} onClose={() => setRule(null)} title="Quy tắc tự xếp" footer={<Button title="Lưu" disabled={!rule || rule.keyword.trim().length < 2} onPress={() => { s.addRule(rule!.keyword, rule!.categoryId); setRule(null); toast('Đã lưu quy tắc'); }} />}>
        {rule ? (
          <View style={{ gap: 12 }}>
            <TextField label="Nội dung thông báo có chứa" value={rule.keyword} onChangeText={(t) => setRule({ ...rule, keyword: t })} autoCapitalize="characters" placeholder="Ví dụ: GRAB" />
            <Chips>{s.categories.map((x) => <Chip key={x.id} label={x.name} selected={rule.categoryId === x.id} onPress={() => setRule({ ...rule, categoryId: x.id })} />)}</Chips>
          </View>
        ) : null}
      </Sheet>
      <Dialog visible={!!delCat} title="Xóa danh mục này?" body="Giao dịch cũ sẽ chuyển về “Khác”. Quy tắc dùng danh mục này cũng bị xóa." confirm="Xóa" destructive
        onCancel={() => setDelCat(null)} onConfirm={() => { s.removeCategory(delCat!); setDelCat(null); }} />
    </Screen>
  );
}
