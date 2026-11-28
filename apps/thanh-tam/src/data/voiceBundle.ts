// Sinh tự động trên CI (apps/thanh-tam/scripts/voice_ai.py bundle), không sửa tay.
// Giọng đọc AI đóng sẵn trong bản cài; bản trong git để trống, app tải giọng mẫu qua mạng.
import type { BundledVoices } from '../lib/voiceBundle';

export const VOICE_BUNDLE_CREDIT = '';
export const BUNDLED_VOICES: BundledVoices = {};
