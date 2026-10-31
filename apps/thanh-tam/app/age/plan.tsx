import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Badge, Card, Chip, Chips, EmptyState, Row, Screen, SectionHeader, Segmented, T } from '@nam/ui';
import { useTT } from '../../src/store';
import { defaultAgeYear } from '../../src/hooks';
import { ageYear, HOANG_OC_CAN_THAN, KIM_LAU_LABEL } from '../../src/age';
import { canChiYear } from '../../src/calendar/lunar';
import { MoreLink } from '../../src/components';

type Kind = 'lam-nha' | 'cuoi';

/** TT-31 · Xem tuổi làm việc lớn: kim lâu, hoang ốc, tam tai, Thái Tuế; 6 năm tới. */
export default function Plan() {
  const p = useLocalSearchParams<{ personId?: string; year?: string; kind?: Kind }>();
  const people = useTT((s) => s.people);
  const [kind, setKind] = useState<Kind>(p.kind ?? 'lam-nha');
  const [pid, setPid] = useState(p.personId ?? people.find((x) => x.isHouseOwner)?.id ?? people[0]?.id);
  const start = Number(p.year) || defaultAgeYear();
  const person = people.find((x) => x.id === pid);
  const rows = useMemo(() => person ? Array.from({ length: 6 }, (_, i) => {
    const year = start + i;
    const a = ageYear(person.birthLunarYear, person.sex, year);
    const notes: { label: string; careful: boolean; term?: string }[] = [];
    if (a.kimLau) notes.push({ label: KIM_LAU_LABEL[a.kimLau], careful: true, term: 'kim-lau' });
    if (kind === 'lam-nha') notes.push({ label: `Hoang ốc: ${a.hoangOc}`, careful: HOANG_OC_CAN_THAN.has(a.hoangOc), term: 'hoang-oc' });
    if (a.tamTai) notes.push({ label: `Tam tai năm thứ ${a.tamTai}`, careful: true, term: 'tam-tai' });
    if (a.thaiTue) notes.push({ label: a.thaiTue === 'nam-tuoi' ? 'Năm tuổi' : 'Xung Thái Tuế', careful: true, term: a.thaiTue });
    return { year, a, notes, clear: notes.every((n) => !n.careful) };
  }) : [], [person, start, kind]);

  if (!person) return <Screen><AppBar onBack={() => router.back()} /><EmptyState icon="users" title="Chưa có người trong nhà" action="Thêm người" onAction={() => router.replace('/people/edit')} /></Screen>;
  return (
    <Screen scroll>
      <AppBar onBack={() => router.back()} title="Xem tuổi làm việc lớn" />
      <Segmented options={[{ key: 'lam-nha', label: 'Làm nhà, sửa nhà' }, { key: 'cuoi', label: 'Cưới hỏi' }]} value={kind} onChange={(k) => setKind(k as Kind)} />
      <Chips scroll>{people.map((x) => <Chip key={x.id} label={`${x.short || x.name}${x.isHouseOwner ? ' · chủ nhà' : ''}`} selected={x.id === person.id} onPress={() => setPid(x.id)} />)}</Chips>
      <T v="micro" muted>Theo lịch dân gian · để tham khảo</T>
      {rows.map((r) => (
        <Card key={r.year}>
          <Row between>
            <T v="headline">Năm {canChiYear(r.year)} ({r.year})</T>
            <Badge label={r.clear ? 'Được coi là thuận' : 'Dân gian khuyên cân nhắc'} tone={r.clear ? 'positive' : 'warning'} />
          </Row>
          <T v="caption" muted>{r.a.tuoiMu} tuổi mụ</T>
          {r.notes.map((n) => <T key={n.label} v="body" muted={!n.careful}>• {n.label}</T>)}
        </Card>
      ))}
      <SectionHeader title="Hiểu thế nào" />
      <Card>
        <T v="body">Kim lâu, hoang ốc, tam tai là quy ước tính theo tuổi. Nhiều nhà vẫn làm việc lớn bình thường; nếu muốn theo tục, có thể mượn tuổi người hợp để đứng làm lễ.</T>
        <MoreLink href="/age/term/kim-lau" label="Kim lâu là gì" />
        <MoreLink href="/age/term/hoang-oc" label="Hoang ốc là gì" />
        <MoreLink href="/age/term/muon-tuoi" label="Mượn tuổi làm nhà" />
      </Card>
      <View style={{ height: 8 }} />
    </Screen>
  );
}
