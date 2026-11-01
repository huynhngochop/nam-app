import React, { useState } from 'react';
import { router } from 'expo-router';
import { Card, Chip, Chips, Grid, Icon, Row, Screen, SearchField, SectionHeader, T, useTheme } from '@nam/ui';
import { SIGNS, SIGN_AREAS, TIPS } from '../../src/data/signs';
import { NavRow } from '../../src/components';
import { useTT } from '../../src/store';
import { defaultAgeYear } from '../../src/hooks';
import { canChiYear } from '../../src/calendar/lunar';

/** TT-17 · Tra cứu: Tuổi & năm, Nhân tướng, dấu hiệu & điềm báo, mẹo khi cúng. */
export default function Explore() {
  const { c } = useTheme();
  const [area, setArea] = useState<string>('all');
  const people = useTT((s) => s.people.length);
  const signs = SIGNS.filter((s) => area === 'all' || s.area === area);
  const year = defaultAgeYear();
  return (
    <Screen scroll>
      <T v="display" accessibilityRole="header" style={{ marginTop: 8 }}>
        Tra cứu
      </T>
      <SearchField placeholder="Điềm báo, mẹo, sao, hạn…" onPress={() => router.push('/search')} />
      <Grid min={1} gap={12}>
        <Card variant="tint" onPress={() => router.push('/age')} accessibilityLabel="Tuổi và năm">
          <Row gap={10}>
            <Icon name="star" color={c.a} />
            <T v="headline" style={{ flex: 1 }}>
              Tuổi & năm {canChiYear(year)}
            </T>
            <Icon name="chevron-right" color={c.inkMuted} />
          </Row>
          <T v="caption" muted numberOfLines={3}>
            {people ? `Xem cho ${people} người trong nhà: ` : 'Xem cho từng người trong nhà: '}mệnh, sao chiếu mệnh, vận
            hạn, tam tai, hướng và màu hợp. Theo lịch dân gian, tính trên máy.
          </T>
        </Card>
        <Card onPress={() => router.push('/face')} accessibilityLabel="Nhân tướng">
          <Row gap={10}>
            <Icon name="smile" color={c.a} />
            <T v="headline" style={{ flex: 1 }}>
              Nhân tướng
            </T>
            <Icon name="chevron-right" color={c.inkMuted} />
          </Row>
          <T v="caption" muted numberOfLines={3}>
            Tự chọn nét mặt của mình qua 8 bước, đọc điểm mạnh theo nhân tướng học dân gian. Không cần ảnh.
          </T>
        </Card>
      </Grid>

      <SectionHeader title="Dấu hiệu & điềm báo" />
      <Chips scroll>
        <Chip label="Tất cả" selected={area === 'all'} onPress={() => setArea('all')} />
        {SIGN_AREAS.map((a) => (
          <Chip key={a.id} label={a.name} selected={area === a.id} onPress={() => setArea(a.id)} />
        ))}
      </Chips>
      <Card style={{ paddingVertical: 4 }}>
        {signs.map((s) => (
          <NavRow
            key={s.id}
            icon={
              s.area === 'giac-mo'
                ? 'cloud'
                : s.area === 'co-the'
                  ? 'activity'
                  : s.area === 'trong-nha'
                    ? 'home'
                    : 'sun'
            }
            title={s.title}
            subtitle={s.sub}
            href={`/sign/${s.id}`}
          />
        ))}
        {!signs.length ? (
          <T v="body" muted style={{ paddingVertical: 12 }}>
            Mục này đang được biên soạn.
          </T>
        ) : null}
      </Card>
      <T v="caption" muted>
        Mỗi dấu hiệu có ba phần: dân gian quan niệm, nhìn thực tế, nên làm. Không có điềm “dữ” nào cần lo sợ.
      </T>

      <SectionHeader title="Mẹo khi cúng" />
      <Card style={{ paddingVertical: 4 }}>
        {TIPS.map((t) => (
          <NavRow key={t.id} icon="zap" title={t.title} subtitle={t.summary} href={`/tip/${t.id}`} />
        ))}
      </Card>
    </Screen>
  );
}
