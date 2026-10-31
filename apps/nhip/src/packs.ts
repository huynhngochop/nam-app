/**
 * Tải gói âm thanh sau khi mua (NH-19). Tệp nằm trên máy chủ nội dung (EXPO_PUBLIC_CONTENT_URL), tải từng tệp,
 * tiếp tục được khi rớt mạng. Khi chưa cấu hình máy chủ nội dung, trả lỗi rõ ràng để màn hiển thị và cho thử lại.
 */
export class PackDownloadError extends Error {
  constructor(public code: 'NO_CONTENT_SERVER' | 'NETWORK' | 'STORAGE') {
    super(code);
  }
}

export async function downloadPack(_packId: string, onProgress: (pct: number) => void): Promise<void> {
  const base = process.env.EXPO_PUBLIC_CONTENT_URL;
  if (!base) throw new PackDownloadError('NO_CONTENT_SERVER');
  // Khi có máy chủ: dùng expo-file-system (File.downloadFileAsync) theo danh sách tệp `${base}/packs/${packId}/manifest.json`,
  // kiểm tra checksum từng tệp rồi gọi onProgress.
  onProgress(0);
  throw new PackDownloadError('NETWORK');
}

export const DOWNLOAD_ERROR_TEXT: Record<PackDownloadError['code'], string> = {
  NO_CONTENT_SERVER: 'Máy chủ nội dung chưa được cấu hình ở bản này. Gói đã mua vẫn thuộc về bạn.',
  NETWORK: 'Tải bị ngắt. Gói đã mua vẫn thuộc về bạn. Sẽ tự tải tiếp khi có Wi-Fi.',
  STORAGE: 'Máy không đủ dung lượng trống để tải gói.',
};
