import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AppBar, Card, EmptyState, Screen, SectionHeader, T } from '@nam/ui';
import { tipById } from '../../src/data/signs';
import { ritualById } from '../../src/data/rituals';
import { NavRow, SafetyCard, Sources } from '../../src/components';
import { goBack } from '../../src/nav';

/** Mẹo khi cúng. */
export default function TipScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tip = tipById(id);
  if (!tip)
    return (
      <Screen>
        <AppBar onBack={goBack} />
        <EmptyState icon="zap" title="Không tìm thấy mẹo này" />
      </Screen>
    );
  return (
    <Screen scroll>
      <AppBar onBack={goBack} />
      <T v="display" accessibilityRole="header">
        {tip.title}
      </T>
      <T v="headline" muted>
        {tip.summary}
      </T>
      <Card>
        {tip.body.map((p) => (
          <T key={p} v="body">
            {p}
          </T>
        ))}
      </Card>
      {tip.fire ? <SafetyCard text={tip.fire} /> : null}
      {tip.usedIn.length ? (
        <>
          <SectionHeader title="Dùng trong lễ" />
          <Card style={{ paddingVertical: 4 }}>
            {tip.usedIn.map((rid) => {
              const ritual = ritualById(rid);
              return ritual ? (
                <NavRow key={rid} icon={ritual.icon} title={ritual.title} href={`/ritual/${rid}`} />
              ) : null;
            })}
          </Card>
        </>
      ) : null}
      <Sources sources={tip.sources} />
    </Screen>
  );
}
