import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioModule,
  AudioQuality,
  IOSOutputFormat,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';

/**
 * Ghi âm giọng nói cho Whisper: m4a (AAC) mono 16 kHz, 32 kbps → ~4 KB/giây, 60 giây ≈ 240 KB.
 * Nhỏ hơn ~8 lần preset HIGH_QUALITY: upload nhanh hơn, tốn ít dung lượng 4G hơn.
 */
const SPEECH: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: { outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.MEDIUM },
  web: { mimeType: 'audio/webm', bitsPerSecond: 32000 },
};

export const MAX_TURN_SEC = 120; // Part 2 tối đa 2 phút

export function useSpeechRecorder() {
  const recorder = useAudioRecorder(SPEECH);
  const state = useAudioRecorderState(recorder, 500);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const stopping = useRef(false);

  const ensurePermission = useCallback(async () => {
    const r = await AudioModule.requestRecordingPermissionsAsync();
    setPermission(r.granted ? 'granted' : 'denied');
    if (r.granted) await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    return r.granted as boolean;
  }, []);

  const start = useCallback(async () => {
    if (permission !== 'granted' && !(await ensurePermission())) return false;
    await recorder.prepareToRecordAsync();
    recorder.record();
    return true;
  }, [permission, ensurePermission, recorder]);

  /** Dừng và trả về đường dẫn file, hoặc null nếu quá ngắn (dưới khoảng 1 giây). */
  const stop = useCallback(async (): Promise<string | null> => {
    if (stopping.current) return null;
    stopping.current = true;
    try {
      const ms = state.durationMillis ?? 0;
      await recorder.stop();
      // trả micro cho loa ngoài (iOS): bật lại chế độ phát bình thường
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      return ms >= 700 ? recorder.uri : null; // trạng thái cập nhật mỗi 500 ms nên chừa sai số
    } finally {
      stopping.current = false;
    }
  }, [recorder, state.durationMillis]);

  // Tự dừng khi quá dài. Không tự gọi recorder khi rời màn: useAudioRecorder đã giải phóng recorder trước,
  // chạm vào recorder đã giải phóng sẽ ném lỗi native và làm hỏng cây giao diện (CI bắt được lỗi này).
  useEffect(() => {
    if (state.isRecording && state.durationMillis >= MAX_TURN_SEC * 1000) void stop();
  }, [state.isRecording, state.durationMillis, stop]);

  return {
    isRecording: state.isRecording as boolean,
    seconds: Math.floor((state.durationMillis ?? 0) / 1000),
    permission,
    ensurePermission,
    start,
    stop,
  };
}
