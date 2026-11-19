import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  Card,
  Chip,
  Chips,
  Icon,
  IconButton,
  PricePlaceholder,
  Row,
  Screen,
  Sheet,
  Slider,
  T,
  TextField,
  Thumb,
  useTheme,
} from '@nam/ui';
import { AdBanner } from '@nam/ads';
import { getPrice, track } from '@nam/core';
import { PACKS, SOUNDS, soundById } from '../../src/data';
import { useNhip } from '../../src/store';
import { features } from '../../src/features';
import { syncMix } from '../../src/audio';

/** Trộn âm thanh. */
export default function Sounds() {
  const { c } = useTheme();
  const state = useNhip();
  const [preview, setPreview] = useState(false);
  const [add, setAdd] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const mix = state.mixes.find((m) => m.id === state.mixId);
  const owned = (packId?: string) => !packId || state.isPro || state.ownedPacks.includes(packId);

  useEffect(() => {
    syncMix(mix?.layers ?? [], preview).catch(() => {});
  }, [mix, preview]);
  useEffect(
    () => () => {
      if (!useNhip.getState().session) syncMix([], false).catch(() => {});
    },
    [],
  );
  const promo = PACKS.find((p) => !owned(p.id));

  return (
    <Screen scroll>
      <Row between style={{ paddingTop: 8 }}>
        <T v="display" accessibilityRole="header">
          Trộn âm thanh
        </T>
        <IconButton
          icon={preview ? 'pause' : 'play'}
          label={preview ? 'Dừng nghe thử' : 'Nghe thử'}
          color={c.a}
          bg={c.at}
          onPress={() => setPreview((p) => !p)}
        />
      </Row>
      <Chips scroll>
        {state.mixes.map((m) => (
          <Chip key={m.id} label={m.name} selected={m.id === state.mixId} onPress={() => state.set({ mixId: m.id })} />
        ))}
        <Chip label="Lưu" icon="plus" onPress={() => setSaveOpen(true)} />
      </Chips>
      {(mix?.layers ?? []).map((l) => {
        const snd = soundById(l.id);
        return (
          <Card key={l.id}>
            <Row gap={12}>
              <Thumb icon={snd.icon} size={36} />
              <View style={{ flex: 1, gap: 8 }}>
                <Row between>
                  <T v="headline">{snd.name}</T>
                  <T v="caption" muted>{`${Math.round(l.vol * 100)}%`}</T>
                </Row>
                <Slider value={l.vol} onChange={(v) => state.setLayer(l.id, v)} label={`Âm lượng ${snd.name}`} />
              </View>
              <IconButton soft={false} icon="x" label={`Bỏ ${snd.name}`} onPress={() => state.setLayer(l.id, null)} />
            </Row>
          </Card>
        );
      })}
      {!mix?.layers.length ? (
        <T v="caption" muted>
          Bản phối đang trống. Thêm âm thanh bên dưới.
        </T>
      ) : null}
      <Button title="Thêm âm thanh" icon="plus" variant="secondary" size="md" onPress={() => setAdd(true)} />
      {promo && features.soundStore() ? (
        <Card variant="tint" onPress={() => router.push(`/pack/${promo.id}`)}>
          <Row between>
            <T v="micro" accent>
              Gói mới
            </T>
            <PricePlaceholder priceKey={promo.priceKey} price={getPrice(promo.priceKey)} />
          </Row>
          <T v="headline">{promo.name}</T>
          <T v="caption">{promo.description}</T>
        </Card>
      ) : null}
      {features.soundStore() ? (
        <Button title="Cửa hàng âm thanh" variant="text" icon="shopping-bag" onPress={() => router.push('/store')} />
      ) : null}

      <Sheet visible={add} onClose={() => setAdd(false)} title="Thêm âm thanh">
        {SOUNDS.map((x) => {
          const ok = owned(x.packId) && !!x.file;
          const inMix = !!mix?.layers.find((l) => l.id === x.id);
          return (
            <Pressable
              key={x.id}
              onPress={() => {
                if (ok) {
                  state.setLayer(x.id, 0.6);
                  track('layer_added', { soundId: x.id });
                  setAdd(false);
                } else {
                  setAdd(false);
                  router.push(`/pack/${x.packId}`);
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, opacity: inMix ? 0.4 : 1 }}
              disabled={inMix}
            >
              <Thumb icon={x.icon} size={36} />
              <T v="body" style={{ flex: 1 }}>
                {x.name}
              </T>
              {!ok ? <Icon name="lock" color={c.inkMuted} size={18} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
      <Sheet
        visible={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Lưu bản phối"
        footer={
          <Button
            title="Lưu"
            disabled={!name.trim()}
            onPress={() => {
              state.saveMix(name);
              track('mix_saved');
              setName('');
              setSaveOpen(false);
            }}
          />
        }
      >
        <TextField
          label="Tên bản phối"
          value={name}
          onChangeText={setName}
          maxLength={30}
          autoFocus
          placeholder="Ví dụ: Mưa đêm"
        />
      </Sheet>
      <AdBanner />
    </Screen>
  );
}
