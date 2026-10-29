import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { SoundId, soundById } from './data';

/**
 * Bộ trộn âm thanh: mỗi lớp là một player lặp liền mạch. Phát nền khi khóa máy (iOS: UIBackgroundModes audio).
 * Chỉ tạo player cho lớp đang dùng; giải phóng khi bỏ lớp để tiết kiệm bộ nhớ và pin.
 */
const players = new Map<SoundId, AudioPlayer>();
let modeSet = false;

async function ensureMode() {
  if (modeSet) return;
  modeSet = true;
  try { await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }); } catch { modeSet = false; }
}

export async function syncMix(layers: { id: SoundId; vol: number }[], playing: boolean) {
  await ensureMode();
  const want = new Map(layers.filter((l) => soundById(l.id).file).map((l) => [l.id, l.vol]));
  for (const [id, p] of players) {
    if (!want.has(id)) { p.pause(); p.remove(); players.delete(id); }
  }
  for (const [id, vol] of want) {
    let p = players.get(id);
    if (!p) {
      p = createAudioPlayer(soundById(id).file!);
      p.loop = true;
      players.set(id, p);
    }
    p.volume = vol;
    if (playing && !p.playing) p.play();
    if (!playing && p.playing) p.pause();
  }
}

export function stopAll() {
  for (const [, p] of players) { p.pause(); p.remove(); }
  players.clear();
}
