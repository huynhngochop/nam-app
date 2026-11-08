import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AppBar, Button, Check, Row, Screen, T, useTheme, useToast } from '@nam/ui';
import type { Anniversary } from '../../src/lib/schedule';
import { track } from '@nam/core';
import { useTT } from '../../src/store';
import { goBack } from '../../src/nav';
import { shareJson } from '../../src/fileShare';
import { buildSoGio, transferFileName } from '../../src/lib/transfer';
import { lunarDayWords, monthName } from '../../src/calendar/lunar';

/** TT-34 · Gửi sổ giỗ: chọn ngày giỗ, gửi tệp qua mail, Zalo, Drive. Người nhận mở tệp trong Thành Tâm. */
export default function ShareGio() {
  const { c } = useTheme();
  const toast = useToast();
  const list = useTT((s) => s.anniversaries);
  const from = useTT((s) => s.household.tinChu);
  const sorted = useMemo(() => [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi')), [list]);
  const [off, setOff] = useState<Set<string>>(new Set());
  const chosen = sorted.filter((a) => !off.has(a.id));
  const toggle = useCallback(
    (id: string) =>
      setOff((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    [],
  );

  const send = async () => {
    try {
      const ok = await shareJson(transferFileName('so-gio'), buildSoGio(chosen, from), 'Gửi sổ giỗ Thành Tâm');
      if (ok) {
        track('so_gio_shared', { count: chosen.length });
        goBack('/anniversaries');
      } else toast('Máy này chưa chia sẻ được tệp', { tone: 'error' });
    } catch {
      toast('Chưa gửi được, thử lại sau', { tone: 'error' });
    }
  };

  const header = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <AppBar title="Gửi sổ giỗ" onBack={() => goBack('/anniversaries')} />
      <T v="body" muted>
        Thành Tâm tạo một tệp nhỏ. Chọn Gmail, Zalo hay Drive để gửi. Người nhận mở Thành Tâm, vào Sao lưu và chia sẻ,
        chọn Nhận sổ giỗ.
      </T>
      <Row between>
        <T v="caption" muted>
          Đã chọn {chosen.length}/{sorted.length}
        </T>
        <Button
          title={off.size ? 'Chọn tất cả' : 'Bỏ chọn tất cả'}
          variant="text"
          size="sm"
          full={false}
          onPress={() => setOff(off.size ? new Set() : new Set(sorted.map((a) => a.id)))}
        />
      </Row>
    </View>
  );

  return (
    <Screen
      footer={
        <Button
          title={chosen.length ? `Gửi ${chosen.length} ngày giỗ` : 'Chọn ít nhất một ngày giỗ'}
          icon="send"
          disabled={!chosen.length}
          onPress={send}
        />
      }
    >
      <FlashList
        data={sorted}
        extraData={off}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => <GioRow a={item} on={!off.has(item.id)} line={c.line} onToggle={toggle} />}
      />
    </Screen>
  );
}

const GioRow = memo(function GioRow({
  a,
  on,
  line,
  onToggle,
}: {
  a: Anniversary;
  on: boolean;
  line: string;
  onToggle: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggle(a.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${a.relation} ${a.name}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 60,
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderColor: line,
      }}
    >
      <Check on={on} />
      <View style={{ flex: 1 }}>
        <T v="headline" numberOfLines={2}>
          {a.relation ? `${a.relation} ` : ''}
          {a.name}
        </T>
        <T v="caption" muted>
          Ngày {lunarDayWords(a.lunar.day)} tháng {monthName(a.lunar.month, a.lunar.leap)} âm lịch
        </T>
      </View>
    </Pressable>
  );
});
