import React from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { AppBar, Badge, Card, Row, Screen, SectionHeader, T } from '@nam/ui';
import { MAIN_SOURCES, SOURCE_KIND_LABEL } from '../../src/data/sources';

/** TT-24 · Nguồn tham khảo và cách biên soạn. Không có dòng cố vấn vì chưa có cố vấn tôn giáo. */
export default function SourcesScreen() {
  return (
    <Screen scroll>
      <AppBar onBack={() => router.back()} title="Nguồn tham khảo" />
      <Card>
        <T v="headline">Cách biên soạn</T>
        <T v="body">Mỗi mục được một biên tập viên soạn và một người khác đối chiếu với ít nhất hai nguồn. Văn khấn biên soạn lại theo khuôn cổ truyền. Nội dung chưa qua thẩm định của chức sắc tôn giáo.</T>
        <T v="body">Tục lệ khác nhau theo miền, theo nhà. Theo nếp nhà mình nếu đã có.</T>
      </Card>
      <SectionHeader title="Nguồn chính" />
      {MAIN_SOURCES.map((s) => (
        <Card key={s.title} onPress={s.url ? () => Linking.openURL(s.url!) : undefined} accessibilityLabel={s.title}>
          <Row gap={8}><Badge label={SOURCE_KIND_LABEL[s.kind]} tone="accent" /></Row>
          <T v="body">{s.title}</T>
          {s.url ? <T v="caption" accent weight="semibold">Mở bài gốc</T> : null}
        </Card>
      ))}
      <T v="caption" muted>Thấy chỗ chưa đúng? Gửi góp ý ở cuối mỗi bài để biên tập viên xem lại.</T>
    </Screen>
  );
}
