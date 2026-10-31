import React from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppBar, Avatar, Card, Row, Screen, SectionHeader, T } from '@nam/ui';
import { useTT } from '../src/store';
import { NavRow } from '../src/components';
import { RITUALS, ritualById } from '../src/data/rituals';
import { prayerById } from '../src/data/prayers';
import { signById, tipById } from '../src/data/signs';
import { TAM_AN_READY } from '../src/config';

/** TT-21 · Tôi: người trong nhà, đã lưu, lịch sử khấn, cài đặt. */
export default function Me() {
  const tinChu = useTT((s) => s.household.tinChu);
  const people = useTT((s) => s.people);
  const saves = useTT((s) => s.saves);
  const logs = useTT((s) => s.prayLogs);
  const tamAn = useTT((s) => s.tamAn);
  const savedItems = saves.map((k) => {
    const [type, id] = k.split(':');
    if (type === 'ritual') { const r = ritualById(id); return r && { k, icon: r.icon, title: r.title, href: `/ritual/${id}` }; }
    if (type === 'prayer') { const p = prayerById(id); const r = RITUALS.find((x) => x.prayers.includes(id)); return p && r && { k, icon: 'book-open' as const, title: p.title, href: `/ritual/${r.id}/prayer?prayerId=${id}` }; }
    if (type === 'sign') { const s = signById(id); return s && { k, icon: 'sun' as const, title: s.title, href: `/sign/${id}` }; }
    const t = tipById(id); return t && { k, icon: 'zap' as const, title: t.title, href: `/tip/${id}` };
  }).filter((x): x is NonNullable<typeof x> => !!x);
  const thisMonth = logs.filter((l) => Date.now() - l.at < 30 * 86400000).length;

  return (
    <Screen scroll>
      <AppBar onBack={() => router.back()} title="Tôi" />
      <Card>
        <Row gap={12}>
          <Avatar name={tinChu || 'T T'} size={52} soft />
          <View style={{ flex: 1 }}>
            <T v="title">{tinChu || 'Gia chủ'}</T>
            <T v="caption" muted>{thisMonth ? `Đã khấn ${thisMonth} lần trong 30 ngày qua` : 'Chưa có lần khấn nào'}{tamAn ? ' · Tâm An' : ''}</T>
          </View>
        </Row>
      </Card>
      <SectionHeader title="Người trong nhà" action="Thêm" onAction={() => router.push('/people/edit')} />
      <Card style={{ paddingVertical: 4 }}>
        {people.length ? people.map((p) => <NavRow key={p.id} icon="user" title={p.name} subtitle={`${p.relation}${p.isHouseOwner ? ' · chủ nhà' : ''}`} href={`/age?personId=${p.id}`} />)
          : <NavRow icon="user-plus" title="Thêm người trong nhà" subtitle="Để xem Tuổi & năm cho từng người" href="/people/edit" />}
      </Card>
      {savedItems.length ? (
        <>
          <SectionHeader title={`Đã lưu (${savedItems.length})`} />
          <Card style={{ paddingVertical: 4 }}>{savedItems.slice(0, 12).map((x) => <NavRow key={x.k} icon={x.icon} title={x.title} href={x.href} />)}</Card>
        </>
      ) : null}
      <SectionHeader title="Khác" />
      <Card style={{ paddingVertical: 4 }}>
        <NavRow icon="book" title="Sổ giỗ" href="/anniversaries" />
        <NavRow icon="smile" title="Nhân tướng" href="/face" />
        {TAM_AN_READY && !tamAn ? <NavRow icon="heart" title="Gói Tâm An" subtitle="199.000đ một năm" href="/paywall" /> : null}
        <NavRow icon="settings" title="Cài đặt" href="/settings" />
        <NavRow icon="info" title="Nguồn tham khảo" href="/about/sources" />
      </Card>
    </Screen>
  );
}
