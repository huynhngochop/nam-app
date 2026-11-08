/**
 * Video tụng kinh để nghe và đọc theo ngay trong app (trình phát YouTube nhúng; app không lưu, không tải video).
 * Chọn bản có chữ chạy theo, giọng tụng chậm rõ; mỗi mục 3 bản để bản nào lỗi thì trình phát tự chuyển bản kế.
 * Nhúng bằng trình phát chính thức của YouTube theo điều khoản của YouTube.
 * Khóa: mã nghi thức hoặc mã bài kinh (xem data/kinh.ts), giống đường dẫn /chant/<khóa>.
 */
export type Video = { id: string; title: string };

export const VIDEOS: Record<string, Video[]> = {
  // nghi thức
  'cau-an': [
    { id: 'se3QnoZlC3g', title: 'Nghi thức tụng kinh Phổ Môn, có chữ (ĐĐ. Thích Trí Thoát)' },
    { id: 'jv4NEO8oIEQ', title: 'Kinh Phổ Môn, kinh cầu an, có chữ' },
    { id: 'G3U680o2Ucc', title: 'Kinh Phổ Môn, cầu an, có chữ' },
  ],
  'cau-sieu': [
    { id: '27WuaUE8dwM', title: 'Nghi thức cầu siêu, tụng kinh A Di Đà' },
    { id: 'Q97Bhx8nEaw', title: 'Kinh A Di Đà, có chữ (TT. Thích Trí Thoát)' },
    { id: 'YUiNU-910EY', title: 'Tụng kinh A Di Đà, chữ to dễ đọc (TT. Thích Trí Thoát)' },
  ],
  'vu-lan-bao-hieu': [
    { id: 'TZmflOyFJns', title: 'Kinh Vu Lan trọn bộ, có chữ (TT. Thích Trí Thoát)' },
    { id: 'qSwGkeRWjgc', title: 'Kinh Vu Lan Bồn và Báo Hiếu Phụ Mẫu Ân, có chữ (TT. Thích Trí Thoát)' },
    { id: 'Qu776xzSSGY', title: 'Tụng kinh Vu Lan báo hiếu, chữ to (Thầy Thích Pháp Hòa)' },
  ],
  // từng bài
  'a-di-da': [
    { id: 'Q97Bhx8nEaw', title: 'Kinh A Di Đà, có chữ (TT. Thích Trí Thoát)' },
    { id: 'ZxgrBp3YSe0', title: 'Tụng kinh A Di Đà, có chữ (Thích Trí Thoát)' },
    { id: 'y9-NThG9bPI', title: 'Nghi thức thọ trì kinh A Di Đà, có chữ (Thầy Thích Pháp Hòa)' },
  ],
  'bat-nha': [
    { id: 'dfovLYA4jhI', title: 'Bát Nhã Tâm Kinh, 7 biến có chữ (TT. Thích Trí Thoát)' },
    { id: '_-YcpHu_ozA', title: 'Tụng Bát Nhã Tâm Kinh, có phụ đề (Thầy Thích Trí Thoát)' },
    { id: 'y4BNjUJl8d8', title: 'Bát Nhã Tâm Kinh, 1 biến dễ đọc (Thầy Thích Trí Thoát)' },
  ],
  'dai-bi': [
    { id: 'jIG32hQJPp4', title: 'Chú Đại Bi, 7 biến có chữ (TT. Thích Trí Thoát)' },
    { id: 'yoIcQgOqGpw', title: 'Chú Đại Bi, 21 biến có chữ (TT. Thích Trí Thoát)' },
    { id: 'n3qCN8mem1w', title: 'Chú Đại Bi 21 biến, có chữ để tụng theo (Thầy Thích Trí Thoát)' },
  ],
  'pho-mon': [
    { id: 'se3QnoZlC3g', title: 'Nghi thức tụng kinh Phổ Môn, có chữ (ĐĐ. Thích Trí Thoát)' },
    { id: 'jv4NEO8oIEQ', title: 'Kinh Phổ Môn, kinh cầu an, có chữ' },
    { id: 'mgW7jMAZSOQ', title: 'Kinh Phổ Môn (nghĩa), chữ to (HT. Thích Trí Thoát)' },
  ],
  'vu-lan': [
    { id: 'TZmflOyFJns', title: 'Kinh Vu Lan trọn bộ, có chữ (TT. Thích Trí Thoát)' },
    { id: 'qSwGkeRWjgc', title: 'Kinh Vu Lan Bồn và Báo Hiếu Phụ Mẫu Ân, có chữ (TT. Thích Trí Thoát)' },
    { id: 'jqMF122EdPI', title: 'Kinh Vu Lan báo hiếu, kinh tụng có chữ' },
  ],
  'vang-sanh': [
    { id: 'K12W4zGQWGE', title: 'Chú Vãng Sanh, 21 biến có chữ (TT. Thích Trí Thoát)' },
    { id: 'ErFVQPdH-S4', title: 'Chú Vãng Sanh, 108 biến có chữ (TT. Thích Trí Thoát)' },
    { id: '_A63TeRfixg', title: 'Chú Vãng Sanh, 21 lần có chữ (Thích Huệ Duyên)' },
  ],
  'niem-a-di-da': [
    { id: 'y3uioBP0chM', title: 'Niệm Nam mô A Di Đà Phật, 108 biến (Thầy Thích Trí Thoát)' },
    { id: 'TdCaPqyr3Nk', title: 'Niệm Nam mô A Di Đà Phật, 108 biến (ĐĐ. Thích Trí Thoát)' },
    { id: 'FYD3LxfQv5U', title: 'Niệm Nam mô A Di Đà Phật, 108 biến (Phật tử Thiện Quang)' },
  ],
  'niem-quan-am': [
    { id: 'OA6XreMHoTs', title: 'Niệm danh hiệu Quán Thế Âm Bồ Tát, 108 biến (Thích Trí Thoát)' },
    { id: '_C9bydoVVRw', title: 'Niệm Nam mô Đại Bi Quán Thế Âm Bồ Tát, 108 biến (Thầy Thích Trí Thoát)' },
    { id: 'mQZH1NnQrus', title: 'Niệm danh hiệu Quán Thế Âm Bồ Tát, 108 biến (Thích Trí Thoát)' },
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
