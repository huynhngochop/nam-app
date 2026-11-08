/**
 * Video tụng kinh để nghe và đọc theo ngay trong app (trình phát YouTube nhúng; app không lưu, không tải video).
 * Chọn bản có chữ chạy theo, giọng tụng chậm rõ. Nhúng bằng trình phát chính thức của YouTube theo điều khoản của YouTube;
 * video nào chủ kênh tắt nhúng thì app có nút mở bằng YouTube.
 * Khóa: mã nghi thức hoặc mã bài kinh (xem data/kinh.ts), giống đường dẫn /chant/<khóa>.
 */
export type Video = { id: string; title: string };

export const VIDEOS: Record<string, Video[]> = {
  // nghi thức
  'cau-an': [
    { id: 'se3QnoZlC3g', title: 'Nghi thức tụng kinh Phổ Môn, có chữ (ĐĐ. Thích Trí Thoát)' },
    { id: 'kOsU1kpqsug', title: 'Kinh Phổ Môn, nghi thức cầu an (HT. Thích Trí Quảng)' },
  ],
  'cau-sieu': [
    { id: '27WuaUE8dwM', title: 'Nghi thức cầu siêu, tụng kinh A Di Đà' },
    { id: 'ZxgrBp3YSe0', title: 'Tụng kinh A Di Đà, có chữ (Thích Trí Thoát)' },
  ],
  'vu-lan-bao-hieu': [
    { id: 'TZmflOyFJns', title: 'Kinh Vu Lan trọn bộ, có chữ (TT. Thích Trí Thoát)' },
    { id: 'F4VICtihnUc', title: 'Tụng kinh Vu Lan báo hiếu, có phụ đề (Thầy Thích Trí Thoát)' },
  ],
  // từng bài
  'a-di-da': [
    { id: 'mqDYk3OQJhU', title: 'Kinh A Di Đà, âm Hán (HT. Thích Trí Thoát)' },
    { id: 'ZxgrBp3YSe0', title: 'Tụng kinh A Di Đà, có chữ (Thích Trí Thoát)' },
  ],
  'bat-nha': [
    { id: 'dfovLYA4jhI', title: 'Bát Nhã Tâm Kinh, 7 biến có chữ (TT. Thích Trí Thoát)' },
    { id: '_-YcpHu_ozA', title: 'Tụng Bát Nhã Tâm Kinh, có phụ đề (Thầy Thích Trí Thoát)' },
  ],
  'dai-bi': [
    { id: 'jIG32hQJPp4', title: 'Chú Đại Bi, 7 biến có chữ (TT. Thích Trí Thoát)' },
    { id: 'J0wb3TIv93E', title: 'Chú Đại Bi, 3 biến chữ to (TT. Thích Trí Thoát)' },
  ],
  'pho-mon': [
    { id: 'se3QnoZlC3g', title: 'Nghi thức tụng kinh Phổ Môn, có chữ (ĐĐ. Thích Trí Thoát)' },
    { id: 'kOsU1kpqsug', title: 'Kinh Phổ Môn, nghi thức cầu an (HT. Thích Trí Quảng)' },
  ],
  'vu-lan': [{ id: 'TZmflOyFJns', title: 'Kinh Vu Lan trọn bộ, có chữ (TT. Thích Trí Thoát)' }],
  'vang-sanh': [
    { id: 'K12W4zGQWGE', title: 'Chú Vãng Sanh, 21 biến có chữ (TT. Thích Trí Thoát)' },
    { id: '_A63TeRfixg', title: 'Chú Vãng Sanh, 21 lần có chữ (Thích Huệ Duyên)' },
  ],
  'niem-a-di-da': [
    { id: 'TdCaPqyr3Nk', title: 'Niệm Nam mô A Di Đà Phật, 108 biến (ĐĐ. Thích Trí Thoát)' },
    { id: 'y3uioBP0chM', title: 'Niệm Nam mô A Di Đà Phật, 108 biến (Thầy Thích Trí Thoát)' },
  ],
  'niem-quan-am': [
    { id: '_C9bydoVVRw', title: 'Niệm Nam mô Đại Bi Quán Thế Âm Bồ Tát, 108 biến (Thầy Thích Trí Thoát)' },
    { id: 'uE2-pfQLYWA', title: 'Nam mô Đại Bi Quán Thế Âm Bồ Tát, 108 lần (Thích Trí Thoát)' },
  ],
};

/** Video của một bài kinh hay nghi thức (khóa giống đường dẫn /chant/<khóa>). */
export const videosFor = (key: string): Video[] => VIDEOS[key] ?? [];

/** Lấy mã video từ đường dẫn YouTube người dùng dán (youtu.be, watch?v=, shorts, embed, live). */
export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m =
    s.match(/youtu\.be\/([\w-]{11})/) ??
    s.match(/[?&]v=([\w-]{11})/) ??
    s.match(/youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/([\w-]{11})/);
  return m ? m[1] : null;
}

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
