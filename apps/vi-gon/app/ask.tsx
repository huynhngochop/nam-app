import React, { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar, BarChart, Button, Card, Chip, Chips, Icon, IconButton, ListItem, Row, Sheet, T, TextField, Thumb, useLayout, useTheme } from '@nam/ui';
import { getLimit, quotaLeft, quotaUse, shortMoney, track, useOnline } from '@nam/core';
import { Intent, intentViaAi, parseIntent, PERIOD_LABEL, PeriodKey, SUGGESTED } from '../src/ask';
import { Answer, computeAnswer } from '../src/answer';
import { catOf, useVi } from '../src/store';

type Turn = { q: string; intent: Intent | null; answer: Answer | null; viaAi: boolean };
const PERIODS: PeriodKey[] = ['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'this_year'];

/** VG-21 Hỏi Ví Gọn · VG-22 Câu trả lời (số liệu tính trên máy, cho sửa cách hiểu). */
export default function Ask() {
  const { c } = useTheme();
  const L = useLayout();
  const online = useOnline();
  const s = useVi();
  const [q, setQ] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [fix, setFix] = useState<number | null>(null);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const limit = getLimit(s.isPro ? 'AI_FINANCE_DAILY_PRO' : 'AI_FINANCE_DAILY_FREE', 10);
  const left = quotaLeft(s.askUsed, limit);
  const ctx = { cats: s.categories, funds: s.funds, startDay: s.monthStartDay, monthlyBudget: s.monthlyBudget, budgets: s.budgets };

  const ask = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setQ('');
    let intent = parseIntent(question, s.categories, s.funds);
    let viaAi = false;
    if (!intent && online && left > 0) {
      setBusy(true);
      intent = await intentViaAi(question, s.categories, s.funds);
      setBusy(false);
      if (intent) { viaAi = true; s.set({ askUsed: quotaUse(s.askUsed) }); }
    }
    let answer: Answer | null = null;
    try { answer = intent ? computeAnswer(intent, ctx) : null; } catch { answer = null; }
    track('finance_ask', { understood: !!intent, viaAi });
    setTurns((t) => [...t, { q: question, intent, answer, viaAi }]);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };
  const reinterpret = (i: number, patch: Partial<Intent>) => setTurns((t) => t.map((x, j) => {
    if (j !== i || !x.intent) return x;
    const intent = { ...x.intent, ...patch };
    return { ...x, intent, answer: computeAnswer(intent, ctx) };
  }));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: L.gutter, width: '100%', maxWidth: L.readableWidth, alignSelf: 'center' }}>
        <AppBar title="Hỏi Ví Gọn" onBack={() => router.back()} backIcon="x" />
      </View>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: L.gutter, paddingBottom: 16, gap: 12, width: '100%', maxWidth: L.readableWidth, alignSelf: 'center' }}>
        {!turns.length ? (
          <>
            <Card variant="tint">
              <Row><Icon name="shield" color={c.a} /><T v="headline">Số liệu tính ngay trên máy</T></Row>
              <T v="caption">Câu hỏi đơn giản không cần mạng. Câu khó: chỉ câu hỏi được gửi đi để hiểu ý — không gửi số tiền, nơi chi hay tài khoản.</T>
            </Card>
            <T v="caption" muted weight="semibold">Thử hỏi</T>
            {SUGGESTED.map((x) => <ListItem key={x} left={<Thumb icon="message-circle" color={c.a} bg={c.at} size={32} />} title={x} chevron onPress={() => ask(x)} />)}
          </>
        ) : turns.map((t, i) => (
          <View key={i} style={{ gap: 8 }}>
            <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: c.a, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
              <T v="body" color={c.onAccent}>{t.q}</T>
            </View>
            {t.answer && t.intent ? (
              <Card>
                <Row><Icon name="cpu" size={16} color={c.a} /><T v="caption" color={c.a} weight="semibold">{t.viaAi ? 'Ví Gọn trả lời · AI hiểu câu hỏi' : 'Ví Gọn trả lời'}</T></Row>
                <T v="display" accessibilityLiveRegion="polite">{s.hideAmounts && /đ/.test(t.answer.headline) ? '•••••• đ' : t.answer.headline}</T>
                <T v="caption" muted>{t.answer.detail}</T>
                {t.answer.bars && t.answer.bars.some((b) => b.value) ? <BarChart data={t.answer.bars} height={80} highlight={t.answer.bars.length - 1} format={shortMoney} /> : null}
                <Card variant="fill" onPress={() => setFix(i)} accessibilityLabel="Sửa cách hiểu">
                  <T v="caption">{`Đã hiểu: ${t.intent.categoryId ? catOf(t.intent.categoryId, s.categories).name : t.intent.kind === 'income' ? 'tổng thu' : 'tổng chi'} · ${PERIOD_LABEL(t.intent.period)} · `}<T v="caption" color={c.a} weight="semibold">Sửa</T></T>
                </Card>
                {t.answer.txFilter ? <Button title="Xem giao dịch" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { from: String(t.answer!.txFilter!.from), to: String(t.answer!.txFilter!.to), categoryId: t.answer!.txFilter!.categoryId ?? '', kind: t.answer!.txFilter!.kind ?? '' } })} /> : null}
              </Card>
            ) : (
              <Card variant="fill">
                <T v="body">{!online && !t.intent ? 'Chưa hiểu câu này khi không có mạng. Thử hỏi theo mẫu: “Tháng này ăn uống hết bao nhiêu?”' : left <= 0 ? 'Hết lượt hỏi nâng cao hôm nay. Câu hỏi đơn giản vẫn trả lời được ngay trên máy.' : 'Ví Gọn chưa hiểu câu hỏi. Thử nêu rõ danh mục và thời gian, ví dụ “Tuần này đi lại hết bao nhiêu?”.'}</T>
              </Card>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: L.gutter, paddingVertical: 8, width: '100%', maxWidth: L.readableWidth, alignSelf: 'center', gap: 4 }}>
        <Row>
          <View style={{ flex: 1 }}><TextField ref={input} value={q} onChangeText={setQ} placeholder={turns.length ? 'Hỏi tiếp…' : 'Hỏi về chi tiêu của bạn…'} returnKeyType="send" onSubmitEditing={() => ask(q)} maxLength={200} /></View>
          <IconButton icon="send" label="Gửi" onPress={() => ask(q)} soft={false} color={c.onAccent} bg={c.a} />
        </Row>
        <T v="caption" muted>{busy ? 'Đang hiểu câu hỏi…' : `Câu khó còn ${left}/${limit} lượt hôm nay`}</T>
      </View>

      <Sheet visible={fix != null} onClose={() => setFix(null)} title="Sửa cách hiểu" footer={<Button title="Xong" onPress={() => setFix(null)} />}>
        {fix != null && turns[fix]?.intent ? (
          <View style={{ gap: 12 }}>
            <T v="caption" muted weight="semibold">Danh mục</T>
            <Chips>
              <Chip label="Tất cả" selected={!turns[fix].intent!.categoryId} onPress={() => reinterpret(fix, { categoryId: null })} />
              {s.categories.filter((x) => x.kind === turns[fix].intent!.kind).map((x) => <Chip key={x.id} label={x.name} selected={turns[fix].intent!.categoryId === x.id} onPress={() => reinterpret(fix, { categoryId: x.id })} />)}
            </Chips>
            <T v="caption" muted weight="semibold">Thời gian</T>
            <Chips>{PERIODS.map((p) => <Chip key={p} label={PERIOD_LABEL(p)} selected={turns[fix].intent!.period === p} onPress={() => reinterpret(fix, { period: p })} />)}</Chips>
            <T v="caption" muted weight="semibold">Loại</T>
            <Chips>
              <Chip label="Chi" selected={turns[fix].intent!.kind === 'expense'} onPress={() => reinterpret(fix, { kind: 'expense', categoryId: null })} />
              <Chip label="Thu" selected={turns[fix].intent!.kind === 'income'} onPress={() => reinterpret(fix, { kind: 'income', categoryId: null })} />
            </Chips>
          </View>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}
