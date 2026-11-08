import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppBar, Badge, Button, Card, Row, Screen, SectionHeader, T, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { goBack } from '../src/nav';
import { useTT } from '../src/store';
import {
  VOICE_CREDIT,
  bytesToDownload,
  downloadVoices,
  formatMB,
  getManifest,
  removeVoice,
  voiceCatalog,
  voiceState,
  type Manifest,
  VOICE_UNAVAILABLE,
} from '../src/sampleVoice';

/** TT-37 · Giọng đọc mẫu: xem bài nào đã tải, tải tất cả hoặc từng bài, xóa để lấy lại chỗ trống. */
export default function Voices() {
  const toast = useToast();
  const voices = useTT((s) => s.voices);
  const [m, setM] = useState<Manifest | null>(null);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  useEffect(() => {
    getManifest(true)
      .then(setM)
      .catch(() => setErr(true));
  }, []);
  const items = useMemo(() => [...voiceCatalog().values()], []);
  const ids = items.map((x) => x.id);
  const used = Object.values(voices).reduce((a, v) => a + v.bytes, 0);
  const all = m ? bytesToDownload(m, ids) : 0;

  const get = async (list: string[], key: string) => {
    setBusy(key);
    try {
      const r = await downloadVoices(list, (a, b) => setProgress(`${a}/${b}`));
      track('voice_downloaded', { count: r.done, missing: r.missing, from: 'voices' });
      toast(r.missing ? 'Có bài đang được cập nhật, thử lại sau ít phút' : 'Đã tải xong');
    } catch {
      toast('Tải chưa được. Kiểm tra mạng rồi thử lại.', { tone: 'error' });
    }
    setBusy(null);
    setProgress('');
  };

  const row = (it: (typeof items)[number]) => {
    const st = voiceState(it.id);
    const mi = m?.items[it.id];
    const avail = !!mi && mi.hash === it.hash;
    return (
      <Row key={it.id} between gap={10} style={{ minHeight: 56, paddingVertical: 6 }}>
        <View style={{ flex: 1 }}>
          <T v="body" numberOfLines={2}>
            {it.title}
          </T>
          <T v="caption" muted>
            {st === 'san-sang'
              ? `Đã tải · ${formatMB(voices[it.id]?.bytes ?? 0)}`
              : avail
                ? `${formatMB(mi!.bytes)} · khoảng ${Math.max(1, Math.round(mi!.ms / 60000))} phút`
                : m
                  ? 'Đang được cập nhật'
                  : ''}
          </T>
        </View>
        {st === 'san-sang' ? (
          <Button title="Xóa" variant="text" size="sm" full={false} onPress={() => removeVoice(it.id)} />
        ) : avail ? (
          <Button
            title={st === 'can-tai-lai' ? 'Tải lại' : 'Tải'}
            variant="secondary"
            size="sm"
            full={false}
            loading={busy === it.id}
            disabled={!!busy}
            onPress={() => get([it.id], it.id)}
          />
        ) : null}
      </Row>
    );
  };

  return (
    <Screen scroll>
      <AppBar title="Giọng đọc mẫu" onBack={goBack} />
      <T v="body" muted>
        Giọng đọc văn khấn và kinh để nghe, đọc theo. Không cần máy có giọng tiếng Việt. Tải một lần, nghe không cần
        mạng.
      </T>
      {err && !m ? (
        <Card variant="tint">
          <T v="body">{VOICE_UNAVAILABLE}</T>
        </Card>
      ) : null}
      <Card>
        <Row between>
          <T v="body">Đã tải</T>
          <Badge label={formatMB(used)} />
        </Row>
        {all ? (
          <Button
            title={busy === 'all' ? `Đang tải ${progress}` : `Tải tất cả (${formatMB(all)})`}
            icon="download"
            size="md"
            loading={busy === 'all'}
            disabled={!!busy}
            onPress={() => get(ids, 'all')}
          />
        ) : null}
      </Card>
      <SectionHeader title="Kinh" />
      <Card style={{ paddingVertical: 4 }}>{items.filter((x) => x.kind === 'kinh').map(row)}</Card>
      <SectionHeader title="Văn khấn" />
      <Card style={{ paddingVertical: 4 }}>{items.filter((x) => x.kind === 'khan').map(row)}</Card>
      <T v="caption" muted>
        {VOICE_CREDIT} Giọng máy đọc nên có chỗ chưa tròn tiếng; nếu có bản thu của chùa nhà mình, thêm ở màn tụng kinh.
      </T>
    </Screen>
  );
}
