import type { Sign, Tip } from './types';
import { SRC } from './sources';

export const SIGN_AREAS = [
  { id: 'ban-tho', name: 'Trên bàn thờ' }, { id: 'trong-nha', name: 'Trong nhà' }, { id: 'co-the', name: 'Cơ thể' }, { id: 'giac-mo', name: 'Giấc mơ' },
] as const;

const THANH_KINH = { text: 'Thành kính cốt ở cái tâm.', by: 'Thượng tọa Thích Đức Thiện, GHPGVN (Báo Thanh Tra, 2020)' };

export const SIGNS: Sign[] = [
  {
    id: 'huong-chay-khong-deu', title: 'Hương cháy không đều', area: 'ban-tho', sub: 'Hay gặp · có giải thích thực tế',
    folk: 'Nhiều nơi cho rằng hương cháy lệch, nén nhanh nén chậm là lời nhắc của gia tiên, nhắc con cháu sống hòa thuận.',
    practical: 'Thường do gió, quạt, độ ẩm, hoặc lõi tăm và bột hương không đều.',
    advice: ['Đặt bát hương tránh quạt, cửa sổ', 'Dùng hương khô, rõ nguồn gốc', 'Giữ tâm bình thản, không cần cúng giải'],
    quote: THANH_KINH, sources: [SRC.thanhTra, SRC.phongTuc], keywords: 'huong chay lech chay nhanh cham khong deu nhang',
  },
  {
    id: 'tan-huong-cuon', title: 'Tàn hương cuộn, không rơi', area: 'ban-tho', sub: 'Dân gian gọi là "hương nở hoa"',
    folk: 'Dân gian gọi là hương nở hoa, thường coi là điềm vui trong nhà.',
    practical: 'Tàn hương cuộn khi bột hương có độ kết dính cao và không khí khô, ít gió.',
    advice: ['Không cần làm gì thêm', 'Khi tàn dài, gạt nhẹ để tránh rơi ra ngoài bát hương'],
    sources: [SRC.phongTuc], keywords: 'tan huong cuon huong no hoa tan khong roi',
  },
  {
    id: 'chan-huong-chay', title: 'Chân hương bốc cháy', area: 'ban-tho', sub: 'Xử lý an toàn trước', fire: true,
    safetyFirst: 'Dập lửa trước: úp kín bát hương bằng nắp hoặc đĩa, hoặc rưới ít nước. Không thổi, không dùng tay.',
    folk: 'Có nơi coi là điềm vượng, có nơi coi là điềm cần lưu ý. Các cách hiểu rất khác nhau.',
    practical: 'Chân hương tích nhiều lâu ngày, gặp tàn hương còn đỏ thì bén lửa. Đây là nguy cơ cháy cần xử lý ngay.',
    advice: ['Dập lửa an toàn', 'Định kỳ tỉa bớt chân hương (thường vào 23 tháng Chạp)', 'Không để hương cháy khi cả nhà đi vắng'],
    sources: [SRC.phongTuc], keywords: 'chan huong boc chay bat huong chay hoa',
  },
  {
    id: 'buom-dem', title: 'Bướm đêm bay vào nhà', area: 'trong-nha', sub: 'Nhiều người nghĩ tới người thân đã khuất',
    folk: 'Dân gian nhiều nơi cho rằng bướm đêm bay vào nhà là người thân đã khuất về thăm.',
    practical: 'Bướm đêm bị ánh đèn thu hút, hay bay vào nhà vào buổi tối, nhất là mùa mưa.',
    advice: ['Mở cửa, tắt bớt đèn để bướm bay ra', 'Không cần đập hay đuổi mạnh', 'Nếu nhớ người thân, thắp nén hương tưởng nhớ'],
    sources: [SRC.phongTuc], keywords: 'buom den buom dem bay vao nha',
  },
  {
    id: 'giat-mat', title: 'Giật mắt', area: 'co-the', sub: 'Thường do mỏi mắt, thiếu ngủ', seekHelp: 'bac-si',
    folk: 'Dân gian có câu "nam tả nữ hữu" để đoán việc tốt xấu theo mắt trái, mắt phải.',
    practical: 'Giật mí mắt thường do mỏi mắt, thiếu ngủ, căng thẳng, uống nhiều cà phê. Thường tự hết sau vài ngày.',
    advice: ['Ngủ đủ, nghỉ mắt khỏi màn hình', 'Bớt cà phê, trà đặc'],
    sources: [SRC.phongTuc], keywords: 'giat mat mat trai mat phai nam ta nu huu',
  },
  {
    id: 'mo-nguoi-mat', title: 'Mơ thấy người đã khuất', area: 'giac-mo', sub: 'Thường gặp khi nhớ thương', seekHelp: 'nguoi-than',
    folk: 'Nhiều người tin rằng người thân đã khuất về báo mộng, nhắc nhở hoặc thăm con cháu.',
    practical: 'Giấc mơ thường phản ánh điều mình đang nghĩ, đang nhớ. Mơ thấy người thân là chuyện rất thường gặp, nhất là gần ngày giỗ.',
    advice: ['Thắp nén hương, kể chuyện với người đã khuất nếu thấy nhẹ lòng', 'Nói chuyện với người thân trong nhà'],
    sources: [SRC.phongTuc], keywords: 'mo thay nguoi mat bao mong mo ong ba',
  },
];

export const TIPS: Tip[] = [
  {
    id: 'so-nen-huong', title: 'Thắp bao nhiêu nén hương?', summary: 'Số lẻ: 1, 3 hoặc 5 nén.',
    body: ['Thường thắp số lẻ: 1, 3 hoặc 5 nén. Ngày thường 1 hoặc 3 nén là đủ; lễ lớn có thể 5 nén.', 'Nhà có nhiều bát hương thì thắp bát ở giữa trước, rồi đến hai bên.'],
    fire: 'Cắm hương xa rèm, quạt. Không để hương, nến cháy khi cả nhà đi vắng.',
    usedIn: ['mung-1-ram', 'gio-thuong', 'than-tai-hang-ngay'], sources: [SRC.phongTuc, SRC.giacNgo], keywords: 'thap huong bao nhieu nen so le nhang',
  },
  {
    id: 'ha-le', title: 'Khi nào hạ lễ?', summary: 'Khi hương cháy gần hết.',
    body: ['Đợi hương cháy gần hết (khoảng 2/3 nén) rồi vái xin hạ lễ.', 'Không cần vội; cũng không cần để lễ qua đêm.'],
    usedIn: ['mung-1-ram', 'gio-thuong'], sources: [SRC.phongTuc], keywords: 'ha le khi nao ha le',
  },
  {
    id: 'bao-sai', title: 'Lau dọn bàn thờ cuối năm', summary: 'Thường làm vào ngày 23 tháng Chạp.',
    body: ['Nhiều nhà lau dọn bàn thờ (bao sái) vào ngày 23 tháng Chạp, khi tiễn ông Táo.', 'Dùng khăn sạch với nước ấm hoặc nước gừng. Tỉa bớt chân hương, giữ lại số lẻ.'],
    usedIn: ['ong-cong-ong-tao'], sources: [SRC.phongTuc], keywords: 'bao sai lau ban tho don ban tho tia chan huong',
  },
  {
    id: 'tha-ca-chep', title: 'Thả cá chép sau lễ ông Táo', summary: 'Thả nhẹ ở nơi nước sạch.',
    body: ['Thả cá ở ao, hồ nước sạch; thả nhẹ sát mặt nước, không ném từ trên cao.', 'Không thả cả túi ni lông xuống nước.'],
    usedIn: ['ong-cong-ong-tao'], sources: [SRC.phongTuc], keywords: 'tha ca chep ong tao',
  },
  {
    id: 'mam-ngu-qua', title: 'Bày mâm ngũ quả theo miền', summary: 'Mỗi miền một cách, theo nếp nhà mình.',
    body: ['Miền Bắc thường có nải chuối xanh đỡ phía dưới, bưởi ở giữa, xen quất, hồng, phật thủ.', 'Miền Nam hay bày mãng cầu, dừa, đu đủ, xoài, sung ("cầu vừa đủ xài").', 'Quả tươi, sạch là được; không cần đắt tiền.'],
    usedIn: ['mung-1-ram', 'giao-thua'], sources: [SRC.phongTuc], keywords: 'mam ngu qua bay qua tet mien bac mien nam',
  },
  {
    id: 'hoa-vang-an-toan', title: 'Hóa vàng an toàn', summary: 'Có thể không hóa; nếu hóa thì ít và an toàn.',
    body: ['Giáo hội khuyên không đốt vàng mã, thay bằng việc thiện (Thông bạch 204/TB-HĐTS, 2024).', 'Nếu hóa: hóa ít, ở nơi thoáng, có xô nước, chờ tàn hẳn mới rời đi.'],
    fire: 'Chung cư: chỉ hóa ở nơi ban quản lý quy định. Không để trẻ nhỏ lại gần.',
    usedIn: ['mung-1-ram', 'giao-thua'], sources: [SRC.tb204, SRC.vanghoaVangMa], keywords: 'hoa vang dot vang ma an toan chung cu',
  },
];

export const signById = (id: string) => SIGNS.find((s) => s.id === id);
export const tipById = (id: string) => TIPS.find((t) => t.id === id);
