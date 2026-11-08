import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Card, EmptyState, Row, Screen, SectionHeader, T, useLayout, useTheme } from '@nam/ui';
import { GUIDES, guideById } from '../../src/data/guides';
import { RITUALS } from '../../src/data/rituals';
import { Figure } from '../../src/figures';
import { NavRow, Sources } from '../../src/components';
import { goBack } from '../../src/nav';

/** Hướng dẫn chi tiết có hình (bày bàn thờ, mâm cỗ, vái lạy, trà rượu, thắp hương). */
export default function GuideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const g = guideById(id);
  const { c } = useTheme();
  const { twoPane } = useLayout();
  if (!g)
    return (
      <Screen>
        <AppBar onBack={goBack} />
        <EmptyState icon="book-open" title="Không tìm thấy hướng dẫn này" />
      </Screen>
    );
  const usedIn = RITUALS.filter((r) => r.guides.includes(g.id));
  const others = GUIDES.filter((x) => x.id !== g.id);
  const wide = twoPane;
  return (
    <Screen scroll>
      <AppBar onBack={goBack} />
      <T v="display" accessibilityRole="header">
        {g.title}
      </T>
      <T v="headline" muted>
        {g.summary}
      </T>
      {g.sections.map((s) => (
        <Card key={s.h}>
          <T v="title" accessibilityRole="header">
            {s.h}
          </T>
          <View style={wide && s.fig ? { flexDirection: 'row', gap: 20, alignItems: 'flex-start' } : { gap: 12 }}>
            {s.fig ? (
              <View style={wide ? { flex: 1 } : undefined}>
                <Figure id={s.fig} label={`${s.figLabel ?? s.h}. ${(s.legend ?? []).join(' ')}`} />
                {s.figLabel ? (
                  <T v="caption" muted style={{ textAlign: 'center' }}>
                    {s.figLabel}
                  </T>
                ) : null}
              </View>
            ) : null}
            {s.legend?.length ? (
              <View style={[{ gap: 8 }, wide ? { flex: 1 } : null]}>
                {s.legend.map((l, i) => (
                  <Row key={l} gap={10} style={{ alignItems: 'flex-start' }}>
                    <View
                      importantForAccessibility="no-hide-descendants"
                      style={{
                        minWidth: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: c.a,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <T v="caption" weight="bold" color={c.onAccent} maxFontSizeMultiplier={1.3}>
                        {i + 1}
                      </T>
                    </View>
                    <T v="body" style={{ flex: 1 }}>
                      {l}
                    </T>
                  </Row>
                ))}
              </View>
            ) : null}
          </View>
          {s.p.map((x) => (
            <T key={x} v="body" muted={!!s.legend?.length}>
              {x}
            </T>
          ))}
        </Card>
      ))}
      <T v="caption" muted>
        Tục lệ mỗi miền, mỗi nhà một khác. Theo nếp nhà mình nếu đã có.
      </T>
      {usedIn.length ? (
        <>
          <SectionHeader title="Dùng trong lễ" />
          <Card style={{ paddingVertical: 4 }}>
            {usedIn.slice(0, 8).map((r) => (
              <NavRow key={r.id} icon={r.icon} title={r.title} href={`/ritual/${r.id}`} />
            ))}
          </Card>
        </>
      ) : null}
      <SectionHeader title="Hướng dẫn khác" />
      <Card style={{ paddingVertical: 4 }}>
        {others.map((x) => (
          <NavRow key={x.id} icon={x.icon} title={x.title} subtitle={x.summary} onPress={() => router.replace(`/guide/${x.id}`)} />
        ))}
      </Card>
      <Sources sources={g.sources} />
    </Screen>
  );
}
