import React from 'react';
import { router } from 'expo-router';
import { AppBar, Card, Screen, SectionHeader, T } from '@nam/ui';
import { NavRow, Sources } from '../../src/components';
import { KINH, NGHI_THUC, chantMinutes } from '../../src/data/kinh';
import { SRC } from '../../src/data/sources';
import { useTT } from '../../src/store';

const KIND_LABEL = { kinh: 'Kinh', chu: 'Chú', ke: 'Kệ', niem: 'Niệm' } as const;

/** TT-30 · Thư viện kinh: nghi thức tụng theo lễ, và từng bài kinh lẻ. */
export default function ChantLibrary() {
  const bpm = useTT((s) => s.chant.bpm);
  return (
    <Screen scroll>
      <AppBar title="Tụng kinh" onBack={() => router.back()} />
      <T v="body" muted>
        Chữ kinh âm Hán Việt, có tiếng mõ giữ nhịp và chuông chuyển bài. Tụng theo mõ, hoặc bật giọng máy đọc cùng.
      </T>
      <SectionHeader title="Nghi thức theo lễ" />
      <Card style={{ paddingVertical: 4 }}>
        {NGHI_THUC.map((n) => (
          <NavRow
            key={n.id}
            icon="book-open"
            title={n.title}
            subtitle={`Gọn khoảng ${chantMinutes(n.short, bpm)} phút · đầy đủ khoảng ${chantMinutes(n.full, bpm)} phút`}
            href={`/chant/${n.id}`}
          />
        ))}
      </Card>
      <SectionHeader title="Từng bài" />
      <Card style={{ paddingVertical: 4 }}>
        {KINH.map((k) => (
          <NavRow
            key={k.id}
            icon="bookmark"
            title={k.title}
            subtitle={`${KIND_LABEL[k.kind]} · ${k.about}`}
            href={`/chant/${k.id}`}
          />
        ))}
      </Card>
      <Sources sources={[SRC.kinhNhatTung]} />
      <T v="caption" muted>
        Thời lượng ước tính theo nhịp mõ đang chọn. Nhà có thầy hướng dẫn thì theo nghi thức của chùa mình.
      </T>
    </Screen>
  );
}
