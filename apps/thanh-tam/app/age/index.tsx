import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppBar,
  Avatar,
  Button,
  Card,
  Chip,
  Chips,
  EmptyState,
  Grid,
  IconButton,
  Row,
  Screen,
  SectionHeader,
  T,
  useTheme,
} from '@nam/ui';
import { useTT } from '../../src/store';
import { defaultAgeYear } from '../../src/hooks';
import { ageYear, BAT_TRACH, GOOD_DIRECTION_MEANING, KIM_LAU_LABEL } from '../../src/age';
import { termById, YEAR_NOTES } from '../../src/data/ageContent';
import { canChiYear } from '../../src/calendar/lunar';
import { FactBlock, Swatches } from '../../src/components';
import { SRC } from '../../src/data/sources';

const GOOD_SAO = new Set(['Thái Dương', 'Thái Âm', 'Mộc Đức']);

/** TT-29 · Tuổi & năm. Tính trên máy, theo lịch dân gian. Không quảng cáo. */
export default function AgeScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ personId?: string; year?: string }>();
  const people = useTT((s) => s.people);
  const [pid, setPid] = useState(params.personId ?? people.find((p) => p.isHouseOwner)?.id ?? people[0]?.id);
  const [year, setYear] = useState(Number(params.year) || defaultAgeYear());
  const person = people.find((p) => p.id === pid) ?? people[0];
  const a = useMemo(() => (person ? ageYear(person.birthLunarYear, person.sex, year) : null), [person, year]);

  if (!person || !a) {
    return (
      <Screen scroll>
        <AppBar onBack={() => router.back()} title="Tuổi & năm" large />
        <EmptyState
          icon="users"
          title="Thêm người trong nhà"
          body="Nhập ngày sinh (lịch dương hoặc lịch âm) để xem mệnh, sao, vận hạn, tam tai, hướng và màu hợp từng năm. Mọi phép tính chạy trên máy, không gửi đi đâu."
          action="Thêm người"
          onAction={() => router.push('/people/edit')}
        />
      </Screen>
    );
  }
  const saoTerm = a.sao ? termById(`sao:${a.sao}`) : undefined;
  const hanTerm = a.vanHan ? termById(`han:${a.vanHan}`) : undefined;
  const tamTaiTerm = termById('tam-tai');
  const thaiTueTerm = a.thaiTue ? termById(a.thaiTue) : undefined;
  const menhTerm = termById(`menh:${a.hanh}`);
  const note = YEAR_NOTES[year]?.[a.chi];
  const anyCareful = !!(saoTerm?.careful || hanTerm?.careful || a.tamTai || a.thaiTue);
  const dirs = BAT_TRACH[a.cung];
  const nameOf = (p: typeof person) => p.short || p.name;

  return (
    <Screen scroll>
      <AppBar
        onBack={() => router.back()}
        title="Tuổi & năm"
        right={<IconButton icon="user-plus" label="Thêm người" onPress={() => router.push('/people/edit')} />}
      />
      <Chips scroll>
        {people.map((p) => (
          <Chip key={p.id} label={nameOf(p)} selected={p.id === person.id} onPress={() => setPid(p.id)} />
        ))}
      </Chips>
      <Row between>
        <IconButton icon="chevron-left" label="Năm trước" onPress={() => setYear((y) => y - 1)} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <T v="title">
            Năm {canChiYear(year)} ({year})
          </T>
          <T v="caption" muted>
            Năm âm lịch
          </T>
        </View>
        <IconButton icon="chevron-right" label="Năm sau" onPress={() => setYear((y) => y + 1)} />
      </Row>
      <Card variant="tint">
        <Row gap={12}>
          <Avatar name={person.name} soft />
          <View style={{ flex: 1 }}>
            <T v="headline">{person.name}</T>
            <T v="caption" muted>
              Tuổi {a.canChi} · {person.sex === 'nam' ? 'nam' : 'nữ'} · {a.tuoiMu} tuổi mụ
            </T>
          </View>
          <Button title="Sửa" variant="text" size="sm" onPress={() => router.push(`/people/edit?id=${person.id}`)} />
        </Row>
      </Card>
      <T v="micro" muted>
        Theo lịch dân gian · để tham khảo
      </T>

      <Grid min={1} gap={12}>
        <FactBlock
          label="Mệnh"
          value={`${a.napAm}`}
          brief={menhTerm?.summary}
          href={`/age/term/${encodeURIComponent(`menh:${a.hanh}`)}`}
        />
        {a.sao ? (
          <FactBlock
            label="Sao chiếu mệnh"
            value={`Sao ${a.sao}`}
            tone={saoTerm?.careful ? 'careful' : GOOD_SAO.has(a.sao) ? 'good' : undefined}
            brief={saoTerm?.summary}
            href={`/age/term/${encodeURIComponent(`sao:${a.sao}`)}`}
          />
        ) : null}
        {a.vanHan && hanTerm ? (
          <FactBlock
            label="Vận hạn"
            value={a.vanHan}
            tone={hanTerm.careful ? 'careful' : undefined}
            brief={hanTerm.summary}
            href={`/age/term/${encodeURIComponent(`han:${a.vanHan}`)}`}
          />
        ) : null}
        {a.tamTai && tamTaiTerm ? (
          <FactBlock
            label="Tam tai"
            value={`Năm thứ ${a.tamTai} của tam tai`}
            tone="careful"
            brief={tamTaiTerm.summary}
            href="/age/term/tam-tai"
          />
        ) : null}
        {a.thaiTue && thaiTueTerm ? (
          <FactBlock
            label="Thái Tuế"
            value={a.thaiTue === 'nam-tuoi' ? 'Năm tuổi' : 'Xung Thái Tuế'}
            tone="careful"
            brief={thaiTueTerm.summary}
            href={`/age/term/${a.thaiTue}`}
          />
        ) : null}
        {a.tamHop || a.lucHop ? (
          <FactBlock
            label="Hợp năm"
            value={a.tamHop ? 'Tam hợp với năm' : 'Lục hợp với năm'}
            tone="good"
            brief={`Tuổi ${a.chi} được coi là hợp với năm ${canChiYear(year)}: thuận để bắt đầu việc đã chuẩn bị kỹ.`}
          />
        ) : null}
        <Card>
          <T v="micro" muted>
            Cung phi · Bát trạch
          </T>
          <T v="title">Cung {a.cung}</T>
          {dirs.good.map((d, i) => (
            <Row key={d} between>
              <T v="body">{d}</T>
              <T v="caption" muted>
                {GOOD_DIRECTION_MEANING[i]}
              </T>
            </Row>
          ))}
          <T v="caption" muted>
            Hướng nên tránh: {dirs.avoid.join(', ')}. Dùng khi kê bàn làm việc, giường, bàn thờ nếu tiện; không cần sửa
            nhà vì hướng.
          </T>
        </Card>
        <Card>
          <T v="micro" muted>
            Màu hợp
          </T>
          <Swatches names={a.colors.hop} />
          <T v="micro" muted>
            Màu nên hạn chế
          </T>
          <Swatches names={a.colors.ky} />
        </Card>
      </Grid>

      {note ? (
        <>
          <SectionHeader title={`Lời khuyên năm ${canChiYear(year)}`} />
          <Card>
            <T v="body">{note}</T>
          </Card>
        </>
      ) : null}
      {anyCareful ? (
        <Card variant="tint">
          <T v="body">
            Đây là quan niệm dân gian, không phải điều chắc chắn sẽ xảy ra. Giáo hội Phật giáo Việt Nam cho biết dâng
            sao giải hạn không phải là nghi lễ của Phật giáo; ai muốn tâm an có thể đi lễ cầu an ở chùa.
          </T>
          <T v="caption" muted>
            {SRC.cv033.title}
          </T>
        </Card>
      ) : null}
      <Button
        title="Xem tuổi làm việc lớn"
        variant="secondary"
        icon="home"
        onPress={() => router.push(`/age/plan?personId=${person.id}&year=${year}`)}
      />
      {a.kimLau ? (
        <T v="caption" muted>
          Năm này tuổi {a.tuoiMu} phạm {KIM_LAU_LABEL[a.kimLau].toLowerCase()} khi tính cưới hỏi, làm nhà.
        </T>
      ) : null}
    </Screen>
  );
}
