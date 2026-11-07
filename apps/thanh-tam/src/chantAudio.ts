import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/**
 * Tiếng mõ và chuông của màn tụng (âm tự tổng hợp, xem scripts/gen_sounds.py).
 * Mõ dùng 3 player xoay vòng để nhịp nhanh không cắt tiếng trước. Lỗi âm thanh không được làm hỏng buổi tụng.
 */
const MO = require('../assets/sounds/mo.wav');
const CHUONG = require('../assets/sounds/chuong.wav');

let mo: AudioPlayer[] = [];
let chuong: AudioPlayer | null = null;
let turn = 0;

function strike(p: AudioPlayer | null | undefined) {
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // bỏ qua: máy không phát được thì vẫn tụng theo chữ
  }
}

export async function openChantAudio() {
  try {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
  } catch {
    // web hoặc máy không hỗ trợ: dùng chế độ mặc định
  }
  try {
    if (!mo.length) mo = [0, 1, 2].map(() => createAudioPlayer(MO));
    if (!chuong) chuong = createAudioPlayer(CHUONG);
  } catch {
    mo = [];
    chuong = null;
  }
}

export function setMoVolume(v: number) {
  for (const p of mo) {
    try {
      p.volume = v;
    } catch {
      // bỏ qua
    }
  }
}

export function knock() {
  if (!mo.length) return;
  turn = (turn + 1) % mo.length;
  strike(mo[turn]);
}

export function bell() {
  strike(chuong);
}

export function closeChantAudio() {
  for (const p of [...mo, chuong]) {
    try {
      p?.pause();
      p?.remove();
    } catch {
      // bỏ qua
    }
  }
  mo = [];
  chuong = null;
}

/** Phát bản ghi người dùng tự thêm. Trả về player để màn hình điều khiển; null nếu không mở được. */
export function openRecording(uri: string): AudioPlayer | null {
  try {
    return createAudioPlayer({ uri });
  } catch {
    return null;
  }
}
