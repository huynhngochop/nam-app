import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppBar, Banner, Button, Card, Chip, Chips, Screen, SectionHeader, Stepper, Row, T, useToast } from '@nam/ui';
import { AiQuotaError, getLimit, track } from '@nam/core';
import { useHen } from '../src/store';
import { generatePromo, GOAL_LABEL, PromoGoal, PromoTone, templateVariants, TONE_LABEL } from '../src/promo';

/** HD-C19 · AI soạn tin ưu đãi. Hết lượt / không có mạng → mẫu soạn sẵn trên máy. */
export default function CampaignAi() {
  const toast = useToast();
  const p = useLocalSearchParams<{ window?: string }>();
  const s = useHen();
  const [goal, setGoal] = useState<PromoGoal>(p.window ? 'lunch' : 'lapsed');
  const [tone, setTone] = useState<PromoTone>('friendly');
  const [offer, setOffer] = useState(10);
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<string[] | null>(null);
  const [viaAi, setViaAi] = useState(false);
  const quota = getLimit(s.plan.code === 'chain' ? 'AI_QUOTA_CHAIN' : s.plan.code === 'standard' ? 'AI_QUOTA_STANDARD' : 'AI_QUOTA_BASIC', 10);
  const month = new Date().toISOString().slice(0, 7);
  const used = s.aiUsed.month === month ? s.aiUsed.count : 0;
  const input = { shopName: s.shop.name, link: `hendep.app/${s.shop.slug}`, goal, tone, offerPct: offer, window: p.window || undefined };

  const run = async () => {
    setBusy(true);
    try {
      if (used >= quota) { setVariants(templateVariants(input)); setViaAi(false); return; }
      const r = await generatePromo(input);
      if (r.viaAi) s.consumeAi();
      setVariants(r.variants); setViaAi(r.viaAi);
      track('promo_generated', { goal, tone, viaAi: r.viaAi });
    } catch (e) {
      setVariants(templateVariants(input)); setViaAi(false);
      if (e instanceof AiQuotaError) toast('Máy chủ AI đang hết lượt — dùng mẫu soạn sẵn.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} footer={<Button title={variants ? 'Soạn lại' : 'Soạn tin'} loading={busy} onPress={run} />}>
      <AppBar title="AI soạn tin ưu đãi" onBack={() => router.back()} />
      <SectionHeader title="Mục đích" />
      <Chips>{(Object.keys(GOAL_LABEL) as PromoGoal[]).map((g) => <Chip key={g} label={GOAL_LABEL[g]} selected={goal === g} onPress={() => setGoal(g)} />)}</Chips>
      <SectionHeader title="Giọng văn" />
      <Chips>{(Object.keys(TONE_LABEL) as PromoTone[]).map((t) => <Chip key={t} label={TONE_LABEL[t]} selected={tone === t} onPress={() => setTone(t)} />)}</Chips>
      <Row between><T v="headline">Mức giảm</T><Stepper value={offer} min={5} max={50} step={5} onChange={setOffer} format={(n) => `${n}%`} /></Row>
      <T v="caption" muted>{used < quota ? `Còn ${quota - used} lượt AI tháng này` : 'Hết lượt AI tháng này — dùng mẫu soạn sẵn'}</T>
      {variants ? (
        <>
          <Banner tone="ok" icon={viaAi ? 'zap' : 'file-text'} text={viaAi ? 'AI soạn — kiểm tra trước khi gửi.' : 'Mẫu soạn sẵn (không dùng lượt AI).'} />
          {variants.map((v, i) => (
            <Card key={i} onPress={() => router.dismissTo({ pathname: '/campaign', params: { message: v, window: p.window ?? '' } })} accessibilityLabel={`Chọn mẫu ${i + 1}`}>
              <T v="body">{v}</T>
              <T v="caption" muted>Chạm để dùng</T>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
