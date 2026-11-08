import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppBar,
  Button,
  Card,
  EmptyState,
  Row,
  Screen,
  SectionHeader,
  Segmented,
  Stepper,
  T,
  Toggle,
  useTheme,
  useToast,
} from '@nam/ui';
import { track } from '@nam/core';
import { BPM_MAX, BPM_MIN, chantMinutes, chantPlan, kinhById, nghiThucById } from '../../../src/data/kinh';
import { videosFor } from '../../../src/data/videos';
import { kinhVoiceId } from '../../../src/lib/voiceCues';
import {
  bytesToDownload,
  downloadVoices,
  formatMB,
  getManifest,
  voiceState,
  VOICE_CREDIT,
} from '../../../src/sampleVoice';
import { NO_VOICE_HELP, openTtsSettings, ttsStatus } from '../../../src/voice';
import { ritualById } from '../../../src/data/rituals';
import { SRC } from '../../../src/data/sources';
import { NavRow, Sources } from '../../../src/components';
import { useTT } from '../../../src/store';
import { forgetRecording, pickRecording } from '../../../src/recordings';
import { goBack } from '../../../src/nav';

function SettingRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row between gap={12} style={{ minHeight: 52, paddingVertical: 6 }}>
      <View style={{ flex: 1 }}>
        <T v="headline">{label}</T>
        {sub ? (
          <T v="caption" muted>
            {sub}
          </T>
        ) : null}
      </View>
      <Toggle value={value} onChange={onChange} label={label} />
    </Row>
  );
}

/** TT-31 · Chuẩn bị tụng: bản gọn hay đầy đủ, cách đọc (tự tụng, giọng mẫu, giọng máy), nhịp mõ, video, bản ghi riêng. */
export default function ChantSetup() {
  const { c } = useTheme();
  const toast = useToast();
  const { id, ritual } = useLocalSearchParams<{ id: string; ritual?: string }>();
  const chant = useTT((s) => s.chant);
  const setChant = useTT((s) => s.setChant);
  const rec = useTT((s) => s.recordings[id]);
  const recordings = useTT((s) => s.recordings);
  const set = useTT((s) => s.set);
  const voices = useTT((s) => s.voices);
  const n = nghiThucById(id);
  const plan = chantPlan(id, chant.full);
  const [tts, setTts] = useState<boolean | null>(null);
  const [vs, setVs] = useState<{ size?: number; busy?: boolean; note?: string }>({});
  const ids = plan ? [...new Set(plan.steps.map((x) => kinhVoiceId(x.kinh)))] : [];
  const ready = ids.length > 0 && ids.every((x) => voiceState(x) === 'san-sang');
  const reader = chant.reader ?? (chant.voice ? 'may' : 'mo');
  useEffect(() => {
    ttsStatus()
      .then((t) => setTts(t.ok))
      .catch(() => setTts(false));
  }, []);
  useEffect(() => {
    if (reader !== 'mau' || ready) return;
    let on = true;
    getManifest()
      .then((m) => on && setVs({ size: bytesToDownload(m, ids) }))
      .catch(() => on && setVs({ note: 'Cần mạng để tải giọng đọc mẫu lần đầu.' }));
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reader, ready, chant.full, voices]);
  if (!plan) {
    return (
      <Screen>
        <AppBar onBack={goBack} />
        <EmptyState icon="book-open" title="Không tìm thấy bài tụng" />
      </Screen>
    );
  }
  const r = ritual ? ritualById(ritual) : undefined;
  const about = n ? n.about : kinhById(id)!.about;
  const q = ritual ? `?ritual=${ritual}` : '';

  const add = async () => {
    try {
      const x = await pickRecording(id);
      if (!x) return;
      if (rec) forgetRecording(rec);
      set({ recordings: { ...recordings, [id]: x } });
      track('chant_recording_added', { id });
      toast('Đã thêm bản ghi');
    } catch {
      toast('Không mở được tệp âm thanh này');
    }
  };
  const download = async () => {
    setVs((v) => ({ ...v, busy: true, note: 'Đang tải…' }));
    try {
      const r = await downloadVoices(ids, (a, b) => setVs((v) => ({ ...v, note: `Đang tải ${a}/${b} bài…` })));
      track('voice_downloaded', { id, count: r.done, missing: r.missing });
      setVs(r.missing ? { note: 'Có bài đang được cập nhật giọng mẫu, thử lại sau ít phút.' } : {});
    } catch {
      setVs({ note: 'Tải chưa được. Kiểm tra mạng rồi thử lại.' });
    }
  };
  const remove = () => {
    if (!rec) return;
    forgetRecording(rec);
    const { [id]: _drop, ...rest } = recordings;
    set({ recordings: rest });
    toast('Đã bỏ bản ghi');
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          title="Bắt đầu tụng"
          icon="play"
          onPress={() => {
            track('chant_start', { id, full: chant.full });
            router.push(`/chant/${id}/play${q}` as never);
          }}
        />
      }
    >
      <AppBar title={plan.title} onBack={goBack} />
      {r ? (
        <T v="caption" accent weight="semibold">
          Cho lễ {r.title.toLowerCase()}
        </T>
      ) : null}
      <T v="body" muted>
        {about}
      </T>
      {n ? (
        <Segmented
          options={[
            { key: 'gon', label: `Gọn · ${chantMinutes(n.short, chant.bpm)} phút` },
            { key: 'du', label: `Đầy đủ · ${chantMinutes(n.full, chant.bpm)} phút` },
          ]}
          value={chant.full ? 'du' : 'gon'}
          onChange={(k) => setChant({ full: k === 'du' })}
        />
      ) : (
        <T v="caption" muted>
          Khoảng {chantMinutes(plan.steps, chant.bpm)} phút
        </T>
      )}

      {!plan.single ? (
        <>
          <SectionHeader title="Thứ tự tụng" />
          <Card style={{ paddingVertical: 8, gap: 2 }}>
            {plan.steps.map((s, i) => {
              const k = kinhById(s.kinh)!;
              return (
                <Row key={`${s.kinh}-${i}`} gap={12} style={{ minHeight: 40 }}>
                  <T v="caption" muted style={{ width: 22, textAlign: 'right' }}>
                    {i + 1}
                  </T>
                  <T v="body" style={{ flex: 1 }}>
                    {k.title}
                  </T>
                  {s.times && s.times > 1 ? (
                    <T v="caption" accent weight="semibold">
                      {s.times} lần
                    </T>
                  ) : null}
                </Row>
              );
            })}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Cách đọc" />
      <Segmented
        value={reader}
        onChange={(k) => setChant({ reader: k, voice: k === 'may' })}
        options={[
          { key: 'mo', label: 'Tự tụng' },
          { key: 'mau', label: 'Giọng mẫu' },
          { key: 'may', label: 'Giọng máy' },
        ]}
      />
      <Card>
        {reader === 'mo' ? (
          <T v="body" muted>
            Bạn tự tụng theo chữ trên màn hình. Mõ gõ mỗi chữ một tiếng, chữ đã tụng đổi màu.
          </T>
        ) : reader === 'mau' ? (
          <>
            <T v="body" muted>
              Giọng đọc mẫu đọc từng câu, chữ sáng theo câu đang đọc, bạn tụng theo. Tải một lần, nghe không cần mạng.
            </T>
            {ready ? (
              <T v="caption" accent weight="semibold">
                Đã tải đủ giọng mẫu cho buổi tụng này
              </T>
            ) : (
              <>
                {vs.note ? (
                  <T v="caption" muted>
                    {vs.note}
                  </T>
                ) : null}
                {vs.size ? (
                  <Button
                    title={`Tải giọng mẫu (${formatMB(vs.size)})`}
                    icon="download"
                    size="md"
                    loading={vs.busy}
                    onPress={download}
                  />
                ) : null}
              </>
            )}
            <T v="caption" muted>
              {VOICE_CREDIT}
            </T>
          </>
        ) : (
          <>
            <T v="body" muted>
              Giọng có sẵn trên máy đọc từng câu.
            </T>
            {tts === false ? (
              <>
                <T v="caption">{NO_VOICE_HELP}</T>
                <Button title="Mở cài đặt giọng nói" variant="secondary" size="md" onPress={() => openTtsSettings()} />
              </>
            ) : null}
          </>
        )}
      </Card>

      <SectionHeader title="Khi tụng" />
      <Card style={{ gap: 4 }}>
        <Row between gap={12} style={{ minHeight: 52 }}>
          <View style={{ flex: 1 }}>
            <T v="headline">Nhịp mõ</T>
            <T v="caption" muted>
              Mỗi tiếng mõ một chữ. Mới tụng nên để chậm.
            </T>
          </View>
          <Stepper
            value={chant.bpm}
            min={BPM_MIN}
            max={BPM_MAX}
            step={10}
            onChange={(bpm) => setChant({ bpm })}
            format={(v) => `${v}`}
          />
        </Row>
        <SettingRow label="Tiếng mõ" value={chant.mo} onChange={(mo) => setChant({ mo })} />
        <SettingRow
          label="Chuông chuyển bài"
          sub="Thỉnh chuông lúc bắt đầu, giữa các bài và khi xong."
          value={chant.chuong}
          onChange={(chuong) => setChant({ chuong })}
        />
        <SettingRow
          label="Hiện nghĩa tiếng Việt"
          sub="Với bài có bản dịch."
          value={chant.nghia}
          onChange={(nghia) => setChant({ nghia })}
        />
      </Card>

      <SectionHeader title="Nghe tụng mẫu" />
      <Card style={{ paddingVertical: 4 }}>
        <NavRow
          icon="youtube"
          title="Nghe chư Tăng tụng, đọc theo"
          subtitle={
            videosFor(id).length
              ? 'Xem video ngay trong app, chữ kinh ở bên dưới.'
              : 'Thêm video YouTube của chùa nhà mình để nghe ngay trong app.'
          }
          onPress={() => {
            track('chant_listen_official', { id });
            router.push(`/video?key=${id}` as never);
          }}
        />
        {rec ? (
          <NavRow
            icon="headphones"
            title="Tụng theo bản ghi của tôi"
            subtitle={rec.name}
            href={`/chant/${id}/play?src=rec${ritual ? `&ritual=${ritual}` : ''}`}
          />
        ) : null}
        <NavRow
          icon="upload"
          title={rec ? 'Đổi bản ghi' : 'Thêm bản ghi của tôi'}
          subtitle="Tệp âm thanh trên máy: tự thu, hoặc bản chùa mình cho phép dùng. Chỉ lưu trên máy này."
          onPress={add}
        />
        {rec ? <Button title="Bỏ bản ghi" variant="text" size="md" onPress={remove} /> : null}
      </Card>
      <Sources sources={[SRC.kinhNhatTung]} />
      <T v="caption" muted style={{ color: c.inkMuted }}>
        Tụng ở nơi yên tĩnh, ngồi hoặc đứng ngay ngắn. Không cần thuộc, đọc theo chữ trên màn hình.
      </T>
    </Screen>
  );
}
