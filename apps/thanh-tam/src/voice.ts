import { Linking, Platform } from 'react-native';
import * as Speech from 'expo-speech';

import { pickViVoice, type V } from './lib/voicePick';

/**
 * Giọng máy (đọc bằng bộ chuyển chữ thành giọng nói có sẵn trên máy).
 *
 * Lỗi người dùng gặp ở vòng 9: bấm đọc không ra tiếng. Hai nguyên nhân:
 * - Truyền `vi-VN` cho Android: expo-speech tạo `Locale("vi-VN")`, không phải mã hợp lệ nên rơi về giọng mặc định
 *   của máy (thường không đọc được tiếng Việt). Android cần `vi`, iOS cần `vi-VN`; có mã giọng thì truyền thẳng.
 * - Nhiều máy (Samsung, Oppo) dùng bộ giọng không có tiếng Việt. Khi đó nút bị ẩn mà không nói vì sao.
 *   Nay báo rõ và mở cài đặt giọng nói, hoặc dùng giọng đọc mẫu tải về (không cần giọng của máy).
 */
export type TtsStatus = { ok: boolean; voice?: string };
let cache: Promise<TtsStatus> | null = null;

export { pickViVoice };

export function ttsStatus(refresh = false): Promise<TtsStatus> {
  if (!cache || refresh) {
    cache = Speech.getAvailableVoicesAsync()
      .then((v: V[]) => {
        const best = pickViVoice(v);
        return { ok: !!best, voice: best?.identifier };
      })
      .catch(() => ({ ok: false })) as Promise<TtsStatus>;
  }
  return cache as Promise<TtsStatus>;
}

export async function speakVi(
  text: string,
  o: { rate?: number; onDone?: () => void; onStopped?: () => void; onError?: () => void } = {},
) {
  const st = await ttsStatus();
  Speech.speak(text, {
    language: Platform.OS === 'android' ? 'vi' : 'vi-VN',
    voice: st.voice,
    rate: o.rate ?? 0.9,
    onDone: o.onDone,
    onStopped: o.onStopped,
    onError: o.onError,
  });
}

export const stopSpeaking = () => {
  try {
    Speech.stop();
  } catch {
    // bỏ qua
  }
};

/** Mở cài đặt giọng nói của máy để tải giọng tiếng Việt. */
export async function openTtsSettings() {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('com.android.settings.TTS_SETTINGS');
      return;
    } catch {
      // máy không có màn này: mở cài đặt của app
    }
  }
  if (Platform.OS !== 'web') await Linking.openSettings().catch(() => {});
}

export const NO_VOICE_HELP =
  Platform.OS === 'android'
    ? 'Máy chưa có giọng đọc tiếng Việt. Mở Cài đặt giọng nói, chọn "Dịch vụ lời nói của Google", tải giọng Tiếng Việt. Hoặc dùng Giọng đọc mẫu của Thành Tâm, không cần cài gì.'
    : 'Máy chưa có giọng đọc tiếng Việt. Vào Cài đặt, Trợ năng, Nội dung được đọc, Giọng nói, tải giọng Tiếng Việt. Hoặc dùng Giọng đọc mẫu của Thành Tâm.';
