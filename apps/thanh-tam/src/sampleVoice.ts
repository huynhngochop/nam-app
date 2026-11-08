import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useTT } from './store';
import { cueAt, hashCues, voiceItems, type VoiceItem } from './lib/voiceCues';

/**
 * Giọng đọc mẫu: tệp âm thanh tạo sẵn trên CI (.github/workflows/thanh-tam-voice.yml), đăng ở GitHub Releases.
 * App tải từng bài khi người dùng chọn, lưu trong máy, phát lại không cần mạng. Không cần giọng tiếng Việt của máy.
 */
export const VOICE_BASE = 'https://github.com/huynhngochop/nam-app/releases/download/thanh-tam-voice/';
export const VOICE_CREDIT =
  'Giọng đọc mẫu tạo bằng phần mềm Piper (mã nguồn mở) với giọng tiếng Việt vais1000, dữ liệu VAIS-1000 (giấy phép CC BY 4.0).';

export type ManifestItem = { file: string; bytes: number; ms: number; hash: string; cues: [number, number][] };
export type Manifest = { v: number; voice: string; credit: string; items: Record<string, ManifestItem> };

let manifest: Manifest | null = null;
let items: Map<string, VoiceItem & { hash: string }> | null = null;

export function voiceCatalog() {
  if (!items) items = new Map(voiceItems().map((it) => [it.id, { ...it, hash: hashCues(it.cues, it.pace) }]));
  return items;
}

const dir = () => new Directory(Paths.document, 'giong-mau');
const localManifestFile = () => new File(dir(), 'manifest.json');

function readLocalManifest(): Manifest | null {
  if (Platform.OS === 'web') return null;
  try {
    const f = localManifestFile();
    return f.exists ? (JSON.parse(f.textSync()) as Manifest) : null;
  } catch {
    return null;
  }
}

/** Danh mục giọng mẫu. Có mạng thì lấy bản mới và lưu lại; mất mạng thì dùng bản đã lưu. */
export async function getManifest(fresh = false): Promise<Manifest> {
  if (manifest && !fresh) return manifest;
  try {
    const r = await fetch(`${VOICE_BASE}manifest.json?t=${Date.now()}`);
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as Manifest;
    manifest = j;
    if (Platform.OS !== 'web') {
      try {
        const d = dir();
        if (!d.exists) d.create();
        const f = localManifestFile();
        if (f.exists) f.delete();
        f.create();
        f.write(JSON.stringify(j));
      } catch {
        // không lưu được thì lần sau tải lại
      }
    }
    return j;
  } catch {
    const local = readLocalManifest();
    if (local) {
      manifest = local;
      return local;
    }
    throw new Error('KHONG_CO_MANG');
  }
}

/** Mốc thời gian từng câu của bài đã tải (đọc từ danh mục đã lưu, không cần mạng). */
export function voiceTimings(id: string): [number, number][] | null {
  const m = manifest ?? readLocalManifest();
  if (m && !manifest) manifest = m;
  return m?.items[id]?.cues ?? null;
}

export type VoiceState = 'san-sang' | 'can-tai' | 'can-tai-lai';
export function voiceState(id: string): VoiceState {
  const v = useTT.getState().voices[id];
  const want = voiceCatalog().get(id)?.hash;
  if (!v) return 'can-tai';
  return v.hash === want && voiceTimings(id) ? 'san-sang' : 'can-tai-lai';
}

/** Dung lượng cần tải (byte) cho các bài chưa có. Bài máy chủ chưa có bản khớp nội dung thì không tính. */
export function bytesToDownload(m: Manifest, ids: string[]) {
  return ids.reduce((a, id) => {
    const it = m.items[id];
    return it && it.hash === voiceCatalog().get(id)?.hash && voiceState(id) !== 'san-sang' ? a + it.bytes : a;
  }, 0);
}

/**
 * Tải giọng mẫu cho các bài. Trả về số bài đã tải và số bài máy chủ chưa có bản khớp (đang cập nhật).
 * `onProgress(xong, tổng)` để màn hình hiện tiến độ.
 */
export async function downloadVoices(ids: string[], onProgress?: (done: number, total: number) => void) {
  const m = await getManifest(true);
  const need = ids.filter((id) => voiceState(id) !== 'san-sang');
  let done = 0;
  let missing = 0;
  if (Platform.OS !== 'web') {
    const d = dir();
    if (!d.exists) d.create();
  }
  for (const id of need) {
    const it = m.items[id];
    if (!it || it.hash !== voiceCatalog().get(id)?.hash) {
      missing++;
      continue;
    }
    let uri = `${VOICE_BASE}${it.file}`;
    if (Platform.OS !== 'web') {
      const dst = new File(dir(), it.file);
      if (dst.exists) dst.delete();
      const f = await File.downloadFileAsync(uri, dst);
      uri = f.uri;
    }
    useTT.setState((s) => ({ voices: { ...s.voices, [id]: { uri, hash: it.hash, bytes: it.bytes } } }));
    done++;
    onProgress?.(done, need.length);
  }
  return { done, missing };
}

export function removeVoice(id: string) {
  const v = useTT.getState().voices[id];
  if (!v) return;
  if (Platform.OS !== 'web') {
    try {
      const f = new File(v.uri);
      if (f.exists) f.delete();
    } catch {
      // tệp đã mất
    }
  }
  useTT.setState((s) => {
    const { [id]: _drop, ...rest } = s.voices;
    return { voices: rest };
  });
}

export const formatMB = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;

export type VoicePlayback = { pause: () => void; resume: () => void; stop: () => void; playing: () => boolean };

/**
 * Phát một bài giọng mẫu, báo câu đang đọc. Ở câu cần người khấn tự đọc (tên, địa chỉ), nếu `onField` trả về
 * một Promise (ví dụ giọng máy đọc tên) thì dừng tiếng mẫu tới khi xong rồi đọc tiếp; không thì để khoảng lặng.
 */
export function playVoice(
  uri: string,
  cues: [number, number][],
  o: {
    startCue?: number;
    onCue: (i: number) => void;
    onEnd: () => void;
    onField?: (i: number) => Promise<void> | null;
    fieldCues?: Set<number>;
  },
): VoicePlayback | null {
  let p: AudioPlayer;
  try {
    p = createAudioPlayer({ uri });
  } catch {
    return null;
  }
  const starts = cues.map((c) => c[0]);
  const total = cues.length ? cues[cues.length - 1][0] + cues[cues.length - 1][1] : 0;
  let last = -2;
  let ended = false;
  let waiting = false;
  let stopped = false;
  const handled = new Set<number>();
  const startMs = o.startCue && o.startCue > 0 ? (starts[o.startCue] ?? 0) : 0;
  try {
    if (startMs) p.seekTo(startMs / 1000);
    p.play();
  } catch {
    // bỏ qua
  }
  const finish = () => {
    if (ended || stopped) return;
    ended = true;
    clearInterval(iv);
    try {
      p.remove();
    } catch {
      // bỏ qua
    }
    o.onEnd();
  };
  const iv = setInterval(() => {
    if (waiting || stopped) return;
    let t = 0;
    let isPlaying = false;
    let dur = 0;
    try {
      t = (p.currentTime ?? 0) * 1000;
      isPlaying = !!p.playing;
      dur = (p.duration ?? 0) * 1000;
    } catch {
      return;
    }
    const i = cueAt(starts, t);
    if (i !== last && i >= 0) {
      last = i;
      o.onCue(i);
      if (o.fieldCues?.has(i) && o.onField && !handled.has(i)) {
        handled.add(i);
        const wait = o.onField(i);
        if (wait) {
          waiting = true;
          try {
            p.pause();
          } catch {
            // bỏ qua
          }
          wait
            .catch(() => {})
            .then(() => {
              if (stopped) return;
              waiting = false;
              try {
                p.seekTo((cues[i][0] + cues[i][1]) / 1000);
                p.play();
              } catch {
                // bỏ qua
              }
            });
        }
      }
    }
    const end = dur > 0 ? dur : total;
    if (t > 0 && !isPlaying && end > 0 && t >= end - 300) finish();
  }, 120);
  return {
    pause: () => {
      try {
        p.pause();
      } catch {
        // bỏ qua
      }
    },
    resume: () => {
      try {
        p.play();
      } catch {
        // bỏ qua
      }
    },
    stop: () => {
      stopped = true;
      clearInterval(iv);
      try {
        p.pause();
        p.remove();
      } catch {
        // bỏ qua
      }
    },
    playing: () => {
      try {
        return !!p.playing;
      } catch {
        return false;
      }
    },
  };
}
