import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Card, EmptyState, Screen, SectionHeader, T } from '@nam/ui';
import { tipById } from '../../src/data/signs';
import { ritualById } from '../../src/data/rituals';
import { NavRow, SafetyCard, Sources } from '../../src/components';

/** TT-19 · Mẹo khi cúng. */
export default function TipScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = tipById(id);
  if (!t) return <Screen><AppBar onBack={() => router.back()} /><EmptyState icon="zap" title="Không tìm thấy mẹo này" /></Screen>;
  return (
    <Screen scroll>
      <AppBar onBack={() => router.back()} />
      <T v="display" accessibilityRole="header">{t.title}</T>
      <T v="headline" muted>{t.summary}</T>
      <Card>{t.body.map((p) => <T key={p} v="body">{p}</T>)}</Card>
      {t.fire ? <SafetyCard text={t.fire} /> : null}
      {t.usedIn.length ? (
        <>
          <SectionHeader title="Dùng trong lễ" />
          <Card style={{ paddingVertical: 4 }}>
            {t.usedIn.map((rid) => { const r = ritualById(rid); return r ? <NavRow key={rid} icon={r.icon} title={r.title} href={`/ritual/${rid}`} /> : null; })}
          </Card>
        </>
      ) : null}
      <Sources sources={t.sources} />
    </Screen>
  );
}
