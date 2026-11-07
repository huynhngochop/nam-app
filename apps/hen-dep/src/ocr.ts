import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Đọc chữ trên ảnh bảng giá ngay trên máy (Android: module modules/hen-dep-text-recognition, ML Kit).
 * iOS / web / Expo Go chưa có module → null, màn quét cho dán chữ như cũ.
 */
type NativeOcr = { recognize(uri: string): Promise<string> };
const native = requireOptionalNativeModule<NativeOcr>('HenDepTextRecognition');

export const ocrAvailable = !!native;

export async function recognizeText(uri: string): Promise<string> {
  if (!native) throw new Error('OCR_UNAVAILABLE');
  return (await native.recognize(uri)).trim();
}
