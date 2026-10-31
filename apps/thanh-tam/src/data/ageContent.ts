/** Nội dung Tuổi & năm (bản đầy đủ ở trang "Nội dung · Tuổi & năm" của bộ thiết kế). */
export type AgeTerm = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  folk: string;
  practical: string;
  advice: string[];
  careful?: boolean;
};

const SAO_REAL =
  'Chưa có cơ sở cho thấy sao chiếu mệnh quyết định việc trong năm. Kế hoạch, sức khỏe và cách mình đối xử với người khác quan trọng hơn.';
const HAN_REAL =
  'Vận hạn là bảng quy ước theo tuổi, không dựa trên đo lường nào. Đọc như một lời nhắc sống cẩn thận thì có ích; lo sợ thì không.';
const sao = (title: string, summary: string, folk: string, advice: string[], careful = false): AgeTerm => ({
  id: `sao:${title}`,
  kind: 'Sao chiếu mệnh',
  title: `Sao ${title}`,
  summary,
  folk,
  practical: SAO_REAL,
  advice,
  careful,
});
const han = (title: string, summary: string, folk: string, advice: string[], careful = true): AgeTerm => ({
  id: `han:${title}`,
  kind: 'Vận hạn',
  title: `Vận hạn ${title}`,
  summary,
  folk,
  practical: HAN_REAL,
  advice,
  careful,
});

export const AGE_TERMS: AgeTerm[] = [
  sao(
    'Thái Dương',
    'Được coi là sao tốt, nhất là với nam giới: công việc hanh thông, dễ được giúp đỡ.',
    'Sao mặt trời, chủ sự sáng sủa, công danh.',
    ['Tận dụng năm được coi là thuận để học thêm, nhận việc mới'],
  ),
  sao(
    'Thái Âm',
    'Được coi là sao tốt, nhất là với nữ giới: êm ấm, tình cảm, tiền bạc ổn định.',
    'Sao mặt trăng, chủ sự êm đềm, gia đạo.',
    ['Dành thời gian cho gia đình', 'Tiết kiệm đều đặn'],
  ),
  sao('Mộc Đức', 'Được coi là sao tốt: hòa thuận, dễ có tin vui trong nhà.', 'Sao phúc đức, chủ sự hòa hợp.', [
    'Làm việc thiện',
    'Thăm hỏi họ hàng',
  ]),
  sao(
    'Thổ Tú',
    'Được coi là sao trung tính: nhắc giữ hòa khí, tránh tranh cãi trong nhà, nơi làm việc.',
    'Sao đất, chủ sự trì trệ, lời qua tiếng lại nhỏ.',
    ['Nói chậm, nghe nhiều', 'Nghỉ ngơi đủ'],
  ),
  sao(
    'Thủy Diệu',
    'Được coi là sao trung tính: có tin vui về tiền bạc, nhưng nhắc cẩn thận khi đi sông nước, lời nói.',
    'Sao nước, chủ tài lộc và lời ăn tiếng nói.',
    ['Mặc áo phao khi đi thuyền', 'Cân nhắc trước khi hứa'],
  ),
  sao(
    'Vân Hớn',
    'Được coi là sao trung tính: nhắc giữ sức khỏe, tránh nóng giận, cẩn thận giấy tờ.',
    'Sao lửa, chủ sự nóng nảy, tranh chấp nhỏ.',
    ['Khám sức khỏe định kỳ', 'Đọc kỹ hợp đồng'],
  ),
  sao(
    'La Hầu',
    'Dân gian coi là sao cần thận trọng với nam giới: giữ bình tĩnh, cẩn thận giấy tờ, việc công. Đây là quan niệm, không phải điều chắc chắn sẽ xảy ra.',
    'La Hầu được coi là sao cần thận trọng với nam giới: giữ bình tĩnh, cẩn thận giấy tờ.',
    ['Kiểm tra kỹ giấy tờ, hợp đồng', 'Giữ sức khỏe, đi lại cẩn thận', 'Muốn tâm an: đi lễ cầu an ở chùa'],
    true,
  ),
  sao(
    'Kế Đô',
    'Dân gian coi là sao cần thận trọng với nữ giới: giữ lời nói, cẩn thận khi đi xa. Đây là quan niệm, không phải điều chắc chắn sẽ xảy ra.',
    'Kế Đô được coi là sao cần thận trọng: giữ lời nói, cẩn thận khi đi xa.',
    ['Đi xa có kế hoạch, giữ liên lạc với người nhà', 'Tránh chuyện đồn đại', 'Muốn tâm an: đi lễ cầu an ở chùa'],
    true,
  ),
  sao(
    'Thái Bạch',
    'Dân gian coi là sao cần thận trọng về tiền bạc: chi tiêu có kế hoạch, tránh cho vay lớn. Đây là quan niệm, không phải điều chắc chắn sẽ xảy ra.',
    'Thái Bạch được coi là sao chủ hao tài.',
    ['Lập ngân sách, có quỹ dự phòng', 'Không bảo lãnh nợ cho người khác'],
    true,
  ),
  han(
    'Huỳnh Tuyền',
    'Dân gian coi là lời nhắc về sức khỏe: nghỉ ngơi đủ, khám sức khỏe định kỳ.',
    'Hạn chủ sức khỏe.',
    ['Khám tổng quát đầu năm', 'Ngủ đủ giấc'],
  ),
  han(
    'Tam Kheo',
    'Dân gian coi Tam Kheo là lời nhắc giữ gìn sức khỏe, nhất là tay chân, khi đi lại, chơi thể thao. Nên hiểu là lời nhắc sống cẩn thận.',
    'Hạn chủ chân tay, xương khớp.',
    ['Khởi động kỹ trước khi tập', 'Đi xe cẩn thận, đội mũ bảo hiểm'],
  ),
  han(
    'Ngũ Mộ',
    'Dân gian coi là lời nhắc về tiền bạc: chi tiêu chặt chẽ, tránh hao hụt không đáng.',
    'Hạn chủ hao tài, mất mát nhỏ.',
    ['Ghi chi tiêu', 'Cất giữ giấy tờ, đồ giá trị cẩn thận'],
  ),
  han(
    'Thiên Tinh',
    'Dân gian hiểu khác nhau: có nơi coi là nhắc tránh thị phi, có nơi coi là năm có may. Giữ hòa khí là đủ.',
    'Có nguồn coi là hạn thị phi, tranh chấp; có nguồn coi là hạn may.',
    ['Giữ hòa khí', 'Đọc kỹ giấy tờ trước khi ký'],
    false,
  ),
  han('Toán Tận', 'Dân gian coi là lời nhắc giữ tiền: không đầu tư liều, không cho vay lớn.', 'Hạn chủ hao tài lớn.', [
    'Không đầu tư theo lời rủ',
    'Có quỹ dự phòng 3–6 tháng chi tiêu',
  ]),
  han(
    'Thiên La',
    'Dân gian coi là lời nhắc công việc dễ vướng: làm chắc từng bước, giữ tinh thần thoải mái.',
    'Hạn chủ vướng mắc, lo âu.',
    ['Chia việc lớn thành bước nhỏ', 'Ngủ đủ, vận động'],
  ),
  han(
    'Địa Võng',
    'Dân gian coi là lời nhắc cẩn thận giấy tờ, lời nói, tránh dính vào chuyện không rõ ràng.',
    'Hạn chủ tai tiếng, vướng mắc giấy tờ.',
    ['Giữ hóa đơn, hợp đồng', 'Không ký thay, không đứng tên hộ'],
  ),
  han(
    'Diêm Vương',
    'Dân gian coi là lời nhắc quan tâm sức khỏe của mình và người thân, nhất là người lớn tuổi.',
    'Hạn chủ lo âu, chuyện người thân.',
    ['Đưa bố mẹ đi khám', 'Gọi điện hỏi thăm thường xuyên'],
  ),
  {
    id: 'tam-tai',
    kind: 'Tam tai',
    title: 'Tam tai',
    careful: true,
    summary: 'Ba năm liền dân gian khuyên cân nhắc việc lớn (làm nhà, cưới, mở hàng). Nhiều nhà vẫn làm bình thường.',
    folk: 'Mỗi nhóm tuổi tam hợp gặp tam tai 3 năm liền: Thân-Tý-Thìn gặp năm Dần, Mão, Thìn · Dần-Ngọ-Tuất gặp Thân, Dậu, Tuất · Hợi-Mão-Mùi gặp Tỵ, Ngọ, Mùi · Tỵ-Dậu-Sửu gặp Hợi, Tý, Sửu.',
    practical: HAN_REAL,
    advice: ['Lên kế hoạch kỹ hơn cho việc lớn', 'Nếu muốn theo tục thì mượn tuổi'],
  },
  {
    id: 'nam-tuoi',
    kind: 'Thái Tuế',
    title: 'Năm tuổi',
    careful: true,
    summary: 'Năm trùng con giáp của mình. Dân gian coi là năm nên sống chậm, giữ sức khỏe.',
    folk: 'Năm trùng Thái Tuế.',
    practical: HAN_REAL,
    advice: ['Đầu năm đi lễ cầu an nếu muốn', 'Khám sức khỏe'],
  },
  {
    id: 'xung',
    kind: 'Thái Tuế',
    title: 'Xung Thái Tuế',
    careful: true,
    summary: 'Năm có con giáp đối xung với tuổi mình. Dân gian khuyên giữ hòa khí, tránh quyết định vội.',
    folk: 'Lục xung: Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu, Thìn-Tuất, Tỵ-Hợi.',
    practical: HAN_REAL,
    advice: ['Quyết định lớn nên hỏi ý người thân'],
  },
  {
    id: 'kim-lau',
    kind: 'Làm nhà, cưới hỏi',
    title: 'Kim lâu',
    summary:
      'Tuổi mụ chia 9 dư 1 (Kim lâu thân), 3 (thê), 6 (tử), 8 (lục súc). Dân gian khuyên tránh cưới, làm nhà năm phạm Kim lâu.',
    folk: 'Dân gian tính Kim lâu theo tuổi mụ chia 9.',
    practical: HAN_REAL,
    advice: ['Việc lớn nên tính theo điều kiện thật: tài chính, thời tiết, giấy phép, sức khỏe'],
  },
  {
    id: 'hoang-oc',
    kind: 'Làm nhà',
    title: 'Hoang ốc',
    summary:
      'Sáu cung đếm theo tuổi: Nhất Cát, Nhì Nghi, Tứ Tấn Tài được coi là thuận; Tam Địa Sát, Ngũ Thọ Tử, Lục Hoang Ốc được coi là cần thận trọng.',
    folk: 'Mốc 10 tuổi là Nhất Cát, 20 Nhì Nghi, 30 Tam Địa Sát, 40 Tứ Tấn Tài, 50 Ngũ Thọ Tử, 60 Lục Hoang Ốc; tuổi lẻ đếm tiếp từ mốc chục.',
    practical: HAN_REAL,
    advice: ['Nếu muốn theo tục thì mượn tuổi'],
  },
  {
    id: 'muon-tuoi',
    kind: 'Làm nhà',
    title: 'Mượn tuổi',
    summary:
      'Khi tuổi chủ nhà không thuận, nhiều nhà nhờ người thân hợp tuổi đứng ra làm lễ động thổ. Nhà vẫn đứng tên chủ nhà thật.',
    folk: 'Tục mượn tuổi phổ biến ở nhiều vùng.',
    practical: 'Việc lớn nên tính theo điều kiện thật: tài chính, thời tiết, giấy phép, sức khỏe.',
    advice: ['Chọn người thân khỏe mạnh, hợp tuổi năm đó'],
  },
  {
    id: 'tuoi-mu',
    kind: 'Khái niệm',
    title: 'Tuổi mụ',
    summary: 'Tuổi mụ là tuổi âm: tính cả năm sinh, cộng thêm một tuổi khi qua Tết.',
    folk: 'Tuổi mụ = năm âm đang xem − năm âm sinh + 1.',
    practical: 'Sao, vận hạn, kim lâu, hoang ốc đều tính theo tuổi mụ.',
    advice: [],
  },
];

const MENH: Record<string, string> = {
  Kim: 'Mệnh Kim: dân gian coi là người quyết đoán, giữ nguyên tắc.',
  Mộc: 'Mệnh Mộc: dân gian coi là người nhân hậu, thích phát triển, học hỏi.',
  Thủy: 'Mệnh Thủy: dân gian coi là người linh hoạt, giao tiếp tốt.',
  Hỏa: 'Mệnh Hỏa: dân gian coi là người nhiệt tình, nhiều năng lượng.',
  Thổ: 'Mệnh Thổ: dân gian coi là người điềm đạm, đáng tin.',
};
for (const [h, s] of Object.entries(MENH)) {
  AGE_TERMS.push({
    id: `menh:${h}`,
    kind: 'Mệnh',
    title: `Mệnh ${h}`,
    summary: s,
    folk: s,
    practical: 'Màu hợp mệnh là quy ước ngũ hành. Chọn màu mình thấy thoải mái là đủ.',
    advice: [],
  });
}

export const termById = (id: string) => AGE_TERMS.find((t) => t.id === id);

/** Lời khuyên năm theo con giáp (2026, 2027). */
export const YEAR_NOTES: Record<number, Record<string, string>> = {
  2026: {
    Tý: 'Năm dân gian khuyên giữ hòa khí, tránh quyết định vội. Việc lớn nên bàn với người thân trước. Giữ nếp sinh hoạt đều đặn, ngủ đủ giấc.',
    Sửu: 'Năm bình thường theo địa chi. Hợp để làm chắc việc đang dở, sắp xếp lại tiền bạc, chăm sóc sức khỏe.',
    Dần: 'Năm được coi là thuận với tuổi Dần. Hợp để bắt đầu việc đã chuẩn bị kỹ: học thêm, đổi việc, mở rộng quan hệ.',
    Mão: 'Năm thứ hai của tam tai. Dân gian khuyên cân nhắc việc lớn; nhiều nhà vẫn làm bình thường. Lên kế hoạch kỹ, chi tiêu có dự phòng.',
    Thìn: 'Năm bình thường theo địa chi. Hợp để học một kỹ năng mới, dành thêm thời gian cho gia đình.',
    Tỵ: 'Năm bình thường theo địa chi. Giữ đều công việc, chú ý nghỉ ngơi sau một năm tuổi vừa qua.',
    Ngọ: 'Năm tuổi của người tuổi Ngọ. Dân gian khuyên sống chậm, giữ sức khỏe. Đầu năm đi lễ cầu an nếu muốn; khám sức khỏe định kỳ.',
    Mùi: 'Vừa lục hợp vừa tam tai năm thứ hai: dễ được giúp đỡ, nhưng việc lớn nên tính kỹ. Hợp để hợp tác, nhờ người có kinh nghiệm góp ý.',
    Thân: 'Năm bình thường theo địa chi. Hợp để củng cố công việc, chăm lo nhà cửa.',
    Dậu: 'Năm bình thường theo địa chi. Giữ hòa khí nơi làm việc, chi tiêu có kế hoạch.',
    Tuất: 'Năm được coi là thuận với tuổi Tuất. Hợp để bắt đầu việc mới đã chuẩn bị, mở rộng quan hệ.',
    Hợi: 'Năm thứ hai của tam tai. Dân gian khuyên cân nhắc việc lớn. Làm chắc từng bước, giữ sức khỏe.',
  },
  2027: {
    Tý: 'Năm bình thường theo địa chi, nhẹ nhàng hơn năm trước. Hợp để làm lại kế hoạch, học thêm.',
    Sửu: 'Năm dân gian khuyên giữ hòa khí, tránh quyết định vội. Việc lớn nên bàn với người thân trước.',
    Dần: 'Năm bình thường theo địa chi. Hợp để duy trì việc đã bắt đầu năm trước.',
    Mão: 'Năm cuối của tam tai, đồng thời tam hợp. Dân gian coi là năm dần hanh thông; việc lớn vẫn nên tính kỹ.',
    Thìn: 'Năm bình thường theo địa chi. Hợp để chăm sóc sức khỏe, sắp xếp tài chính.',
    Tỵ: 'Năm bình thường theo địa chi. Giữ đều công việc, dành thời gian cho người thân.',
    Ngọ: 'Năm được coi là thuận với tuổi Ngọ, sau năm tuổi. Hợp để hợp tác, mở rộng quan hệ.',
    Mùi: 'Năm tuổi và cũng là năm cuối tam tai. Dân gian khuyên sống chậm, giữ sức khỏe, cân nhắc việc lớn. Đi lễ cầu an đầu năm nếu muốn.',
    Thân: 'Năm bình thường theo địa chi. Hợp để học hỏi, củng cố công việc.',
    Dậu: 'Năm bình thường theo địa chi. Chi tiêu có kế hoạch, giữ hòa khí.',
    Tuất: 'Năm bình thường theo địa chi. Hợp để chăm lo nhà cửa, gia đình.',
    Hợi: 'Năm cuối của tam tai, đồng thời tam hợp. Dân gian coi là năm dần hanh thông; làm chắc từng bước.',
  },
};
