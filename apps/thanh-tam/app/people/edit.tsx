import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Button, Card, Chip, Chips, ListItem, Screen, Segmented, T, TextField, Toggle, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { useTT } from '../../src/store';
import { DateInput, DateValue, resolveDate } from '../../src/DateInput';
import { canChiYear } from '../../src/calendar/lunar';
import type { Sex } from '../../src/age';

const RELATIONS = ['Tôi', 'Vợ', 'Chồng', 'Bố', 'Mẹ', 'Con', 'Anh', 'Chị', 'Em'];

/** TT-30 · Người trong nhà (modal). Ngày sinh ghi rõ lịch dương/âm; chỉ biết năm cũng được. */
export default function EditPerson() {
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useTT((s) => s.people.find((p) => p.id === id));
  const hasOwner = useTT((s) => s.people.some((p) => p.isHouseOwner && p.id !== id));
  const upsert = useTT((s) => s.upsertPerson);
  const remove = useTT((s) => s.removePerson);
  const [name, setName] = useState(existing?.name ?? '');
  const [relation, setRelation] = useState(existing?.relation ?? '');
  const [sex, setSex] = useState<Sex>(existing?.sex ?? 'nu');
  const [birth, setBirth] = useState<DateValue>(() => existing
    ? { calendar: existing.birth.calendar, day: existing.birth.day ? String(existing.birth.day) : '', month: existing.birth.month ? String(existing.birth.month) : '', year: String(existing.birth.year), leap: existing.birth.leap }
    : { calendar: 'duong', day: '', month: '', year: '' });
  const [beforeTet, setBeforeTet] = useState<boolean | null>(null);
  const [owner, setOwner] = useState(existing?.isHouseOwner ?? !hasOwner);

  const resolved = resolveDate(birth);
  const yearOnly = birth.year.length === 4 && !birth.day && !birth.month;
  const y = Number(birth.year);
  // Chỉ biết năm dương: sinh tháng 1–2 dương có thể thuộc năm âm trước → hỏi trước/sau Tết.
  const lunarYear = resolved && 'solar' in resolved ? resolved.lunar.year
    : yearOnly ? (birth.calendar === 'am' ? y : beforeTet === null ? null : beforeTet ? y - 1 : y) : null;
  const needTet = yearOnly && birth.calendar === 'duong';
  const valid = name.trim() && lunarYear && lunarYear >= 1900 && lunarYear <= 2099;

  const save = () => {
    if (!valid || !lunarYear) return;
    const words = name.trim().split(/\s+/);
    upsert({
      id: existing?.id, name: name.trim(), short: relation === 'Tôi' ? 'Tôi' : words[words.length - 1], relation: relation || 'Người nhà', sex,
      birthLunarYear: lunarYear,
      birth: { calendar: birth.calendar, day: Number(birth.day) || 0, month: Number(birth.month) || 0, year: y, leap: birth.leap },
      isHouseOwner: owner,
    });
    track('person_saved', { edit: !!existing, yearOnly });
    router.back();
  };

  return (
    <Screen scroll edges={['top', 'bottom']} footer={<>
      <Button title={existing ? 'Lưu' : 'Thêm người'} disabled={!valid} onPress={save} />
      {existing ? <Button title="Xóa người này" variant="danger" size="sm" onPress={() => { remove(existing.id); toast('Đã xóa'); router.back(); }} style={{ alignSelf: 'center' }} /> : null}
    </>}>
      <AppBar onBack={() => router.back()} backIcon="x" title={existing ? 'Sửa thông tin' : 'Người trong nhà'} />
      <TextField label="Họ tên" value={name} onChangeText={setName} placeholder="Ví dụ: Trần Văn Minh" autoCapitalize="words" />
      <Chips scroll>{RELATIONS.map((r) => <Chip key={r} label={r} selected={relation === r} onPress={() => setRelation(r)} />)}</Chips>
      <T v="caption" muted weight="semibold">Giới tính (sao, hạn, cung phi tính khác nhau cho nam và nữ)</T>
      <Segmented options={[{ key: 'nu', label: 'Nữ' }, { key: 'nam', label: 'Nam' }]} value={sex} onChange={(k) => setSex(k as Sex)} />
      <DateInput label="Ngày sinh" value={birth} onChange={(v) => { setBirth(v); setBeforeTet(null); }} allowYearOnly />
      {needTet ? (
        <Card>
          <T v="body">Sinh trước hay sau Tết năm {y}?</T>
          <Chips>
            <Chip label={`Trước Tết (tuổi ${canChiYear(y - 1)})`} selected={beforeTet === true} onPress={() => setBeforeTet(true)} />
            <Chip label={`Sau Tết (tuổi ${canChiYear(y)})`} selected={beforeTet === false} onPress={() => setBeforeTet(false)} />
          </Chips>
        </Card>
      ) : null}
      {lunarYear ? <Card variant="tint"><T v="body">Tuổi {canChiYear(lunarYear)} (năm âm {lunarYear})</T></Card> : null}
      <ListItem title="Là chủ nhà" subtitle="Người được xem tuổi khi làm nhà, sửa nhà" divider={false} right={<Toggle label="Là chủ nhà" value={owner} onChange={setOwner} />} />
      <T v="caption" muted>Chỉ lưu trên máy này. Không gửi ngày sinh đi đâu.</T>
    </Screen>
  );
}
