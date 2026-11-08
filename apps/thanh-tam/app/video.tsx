import React, { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppBar, Button, Chip, Chips, Screen, SectionHeader, Sheet, T, TextField, useLayout, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { goBack } from '../src/nav';
import { useTT } from '../src/store';
import { YouTubePlayer } from '../src/YouTubePlayer';
import { videosFor, watchUrl, youtubeId, type Video } from '../src/data/videos';
import { chantLines, chantPlan, kinhById, listenUrl } from '../src/data/kinh';

/**
 * TT-36 · Nghe tụng và đọc theo: video YouTube phát ngay trong app, chữ kinh ngay bên dưới (máy rộng: cạnh nhau).
 * Không chuyển sang app YouTube; video nào chủ kênh tắt nhúng thì có nút mở bằng YouTube.
 */
export default function VideoScreen() {
  const L = useLayout();
  const toast = useToast();
  const { key, v } = useLocalSearchParams<{ key: string; v?: string }>();
  const mine = useTT((s) => s.myVideos[key]);
  const myVideos = useTT((s) => s.myVideos);
  const set = useTT((s) => s.set);
  const list = useMemo<Video[]>(
    () => [...(mine ? [{ ...mine, title: `${mine.title} (của tôi)` }] : []), ...videosFor(key)],
    [key, mine],
  );
  const [cur, setCur] = useState<string | undefined>(v ?? list[0]?.id);
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState('');
  const video = list.find((x) => x.id === cur) ?? list[0];
  const plan = chantPlan(key, true);
  const lines = useMemo(() => (plan ? chantLines(plan.steps) : []), [plan]);

  const save = () => {
    const id = youtubeId(link);
    if (!id) {
      toast('Đường dẫn chưa đúng. Dán link video YouTube, ví dụ youtu.be/…', { tone: 'error' });
      return;
    }
    set({ myVideos: { ...myVideos, [key]: { id, title: 'Video tôi thêm' } } });
    setCur(id);
    setAdding(false);
    setLink('');
    track('video_added', { key });
  };

  const player = video ? (
    <View style={{ gap: 8 }}>
      <YouTubePlayer id={video.id} title={video.title} />
      <T v="caption" muted numberOfLines={2}>
        {video.title}
      </T>
      <Button
        title="Không xem được? Mở bằng YouTube"
        variant="text"
        size="sm"
        icon="external-link"
        onPress={() => Linking.openURL(watchUrl(video.id)).catch(() => {})}
      />
      {list.length > 1 ? (
        <Chips>
          {list.map((x, i) => (
            <Chip key={x.id} label={`Bản ${i + 1}`} selected={x.id === video.id} onPress={() => setCur(x.id)} />
          ))}
        </Chips>
      ) : null}
      <Button
        title="Tìm bản khác trên YouTube"
        variant="text"
        size="sm"
        icon="search"
        onPress={() => Linking.openURL(listenUrl(plan?.title ?? '')).catch(() => {})}
      />
      <Button
        title={mine ? 'Đổi video của tôi' : 'Thêm video của tôi'}
        variant="secondary"
        size="md"
        icon="plus"
        onPress={() => setAdding(true)}
      />
    </View>
  ) : (
    <Button title="Thêm video YouTube cho bài này" icon="plus" onPress={() => setAdding(true)} />
  );

  const text = (
    <View style={{ gap: 6 }}>
      <SectionHeader title="Đọc theo" />
      {lines.map((l, i) => (
        <View key={i}>
          {i === 0 || lines[i - 1].step !== l.step ? (
            <T v="headline" accent style={{ marginTop: i ? 16 : 0 }} accessibilityRole="header">
              {kinhById(l.kinh)?.title}
              {l.times > 1 ? ` · ${l.times} lần` : ''}
            </T>
          ) : null}
          <T v="body" style={{ fontSize: 19, lineHeight: 30, fontStyle: l.mantra ? 'italic' : 'normal' }}>
            {l.text}
          </T>
        </View>
      ))}
    </View>
  );

  return (
    <Screen scroll readable={false}>
      <AppBar title={plan?.title ?? 'Nghe tụng'} onBack={goBack} />
      {L.twoPane ? (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.1, gap: 8 }}>{player}</View>
          <View style={{ flex: 1 }}>{text}</View>
        </View>
      ) : (
        <View style={{ gap: 12, width: '100%', maxWidth: L.readableWidth, alignSelf: 'center' }}>
          {player}
          {text}
        </View>
      )}
      <Sheet visible={adding} onClose={() => setAdding(false)} title="Thêm video YouTube">
        <T v="body" muted>
          Mở video trên YouTube, bấm Chia sẻ, Sao chép đường liên kết, rồi dán vào đây. Ví dụ bản tụng của chùa nhà mình.
        </T>
        <TextField label="Đường dẫn video" value={link} onChangeText={setLink} placeholder="https://youtu.be/…" />
        <Button title="Lưu" onPress={save} />
        {mine ? (
          <Button
            title="Bỏ video của tôi"
            variant="text"
            onPress={() => {
              const { [key]: _drop, ...rest } = myVideos;
              set({ myVideos: rest });
              setCur(videosFor(key)[0]?.id);
              setAdding(false);
            }}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}
