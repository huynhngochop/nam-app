/**
 * Giọng giám khảo. Mặc định hiện chữ (không tốn dung lượng, không tốn mạng).
 *
 * Để giám khảo đọc thành tiếng bằng giọng có sẵn trong máy (không tăng đáng kể dung lượng APK):
 *   cd apps/band7 && npx expo install expo-speech
 * rồi trong app/_layout.tsx gọi:
 *   import * as Speech from 'expo-speech';
 *   setVoice({ speak: (t, o) => Speech.speak(t, { language: o.lang, rate: o.rate }), stop: () => Speech.stop() });
 * (Chưa thêm sẵn vì package-lock cần cập nhật bằng mạng.)
 */
export type VoiceOpts = { lang: string; rate: number };
type Provider = { speak: (text: string, o: VoiceOpts) => void; stop: () => void };

let provider: Provider | null = null;
export function setVoice(p: Provider) {
  provider = p;
}
export const voiceAvailable = () => provider !== null;

const LANG = { uk: 'en-GB', us: 'en-US', au: 'en-AU' } as const;

export function speak(text: string, accent: keyof typeof LANG, speed: 'slow' | 'exam') {
  provider?.speak(text, { lang: LANG[accent], rate: speed === 'slow' ? 0.8 : 1 });
}
export function stopSpeaking() {
  provider?.stop();
}
