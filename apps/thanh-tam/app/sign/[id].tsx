import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Badge, Card, EmptyState, IconButton, Screen, T, useTheme, useToast } from '@nam/ui';
import { signById, SIGN_AREAS } from '../../src/data/signs';
import { Layers, SafetyCard, Sources } from '../../src/components';
import { useTT } from '../../src/store';

/** TT-18 · Chi tiết dấu hiệu: ba lớp, an toàn trước, nhắc gặp bác sĩ/người thân khi cần. */
export default function SignScreen() {
  const { c } = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = signById(id);
  const saved = useTT((st) => st.saves.includes(`sign:${id}`));
  const toggleSave = useTT((st) => st.toggleSave);
  if (!s) return <Screen><AppBar onBack={() => router.back()} /><EmptyState icon="search" title="Không tìm thấy mục này" /></Screen>;
  return (
    <Screen scroll>
      <AppBar onBack={() => router.back()} right={<IconButton icon="bookmark" label={saved ? 'Bỏ lưu' : 'Lưu'} color={saved ? c.a : undefined} onPress={() => toast(toggleSave(`sign:${s.id}`) ? 'Đã lưu' : 'Đã bỏ lưu')} />} />
      <Badge label={SIGN_AREAS.find((a) => a.id === s.area)?.name ?? ''} tone="accent" />
      <T v="display" accessibilityRole="header">{s.title}</T>
      <T v="caption" muted>{s.sub}</T>
      <Layers folk={s.folk} practical={s.practical} advice={s.advice} safetyFirst={s.safetyFirst} />
      {s.fire && !s.safetyFirst ? <SafetyCard /> : null}
      {s.seekHelp ? (
        <Card>
          <T v="headline">{s.seekHelp === 'bac-si' ? 'Khi nào nên gặp bác sĩ' : 'Đừng giữ một mình'}</T>
          <T v="body">{s.seekHelp === 'bac-si' ? 'Nếu dấu hiệu kéo dài, lặp lại hoặc kèm đau, mệt, hãy đi khám. Sức khỏe cần bác sĩ, không cần giải điềm.' : 'Nếu thấy buồn, lo kéo dài, hãy nói chuyện với người thân hoặc người mình tin.'}</T>
        </Card>
      ) : null}
      {s.quote ? (
        <Card variant="tint">
          <T v="body" style={{ fontStyle: 'italic' }}>“{s.quote.text}”</T>
          <T v="caption" muted>{s.quote.by}</T>
        </Card>
      ) : null}
      <Sources sources={s.sources} />
    </Screen>
  );
}
