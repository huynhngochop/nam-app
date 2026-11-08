import type { Guide } from './types';
import { SRC } from './sources';

/**
 * Hướng dẫn chi tiết có hình: bày bàn thờ, mâm cỗ theo miền, vái lạy, châm trà rót rượu, thắp hương.
 * Viết theo nếp phổ biến; chỗ nào các nơi làm khác nhau thì nói rõ để người dùng theo nếp nhà mình.
 * Thêm hướng dẫn = thêm bản ghi ở đây; kiểm thử quét mọi lễ trỏ tới id có thật.
 */
const BAO_DAU_TU = {
  kind: 'bao-chi',
  title: 'Báo Đầu Tư: Tục cúng gia tiên ba ngày Tết của người Việt',
  url: 'https://baodautu.vn/tuc-cung-gia-tien-ba-ngay-tet-cua-nguoi-viet-d21610.html',
} as const;

export const GUIDES: Guide[] = [
  {
    id: 'trinh-tu-cung',
    title: 'Trình tự một buổi cúng',
    summary: 'Từ lau dọn, bày lễ, châm trà rót rượu, thắp hương, khấn, lạy đến hạ lễ.',
    icon: 'list',
    sections: [
      {
        h: 'Trước khi cúng',
        p: [
          '1. Tắm rửa, mặc quần áo gọn gàng, kín đáo. Tắt tivi, nhạc to.',
          '2. Lau bàn thờ bằng khăn sạch riêng, thay nước, cắm hoa tươi.',
          '3. Bày lễ vật: hoa, quả, mâm cơm (nếu có). Xem phần "Bày bàn thờ" và "Mâm cỗ".',
        ],
      },
      {
        h: 'Khi cúng',
        p: [
          '4. Rót chén nước sạch, châm trà, rót rượu (nếu có). Rượu rót khoảng hai phần ba chén.',
          '5. Thắp nến hoặc đèn, rồi thắp hương số lẻ (1, 3 hoặc 5 nén).',
          '6. Cầm hương ngang trán, vái 3 vái, cắm hương ngay ngắn.',
          '7. Chắp tay, đọc văn khấn rõ ràng, chậm rãi. Đọc thầm cũng được.',
          '8. Khấn xong: lạy hoặc vái theo nơi thờ. Gia tiên thường 4 lạy rồi 3 vái; Phật 3 lạy.',
        ],
      },
      {
        h: 'Sau khi cúng',
        p: [
          '9. Đợi hương cháy khoảng hai phần ba (cúng giỗ, Tết thì rót thêm rượu, châm thêm trà trong lúc chờ).',
          '10. Đứng trước bàn thờ vái 3 vái xin hạ lễ.',
          '11. Hóa vàng nếu có (có thể không hóa). Hạ lễ, cả nhà thụ lộc, không bỏ phí.',
        ],
      },
      {
        h: 'Người già, người đau chân',
        p: [
          'Không quỳ được thì đứng chắp tay vái. Tâm thành quan trọng hơn số lạy.',
          'Có thể nhờ con cháu thắp hương giúp, mình đứng khấn.',
        ],
      },
    ],
    sources: [SRC.phongTuc, SRC.thoMai, BAO_DAU_TU],
    keywords: 'trinh tu cung cac buoc cach cung thu tu cung le',
  },
  {
    id: 'bay-ban-tho',
    title: 'Bày bàn thờ gia tiên',
    summary: 'Bát hương ở giữa, đèn nến hai bên, chén nước trà rượu phía trước, hoa và quả hai bên.',
    icon: 'home',
    sections: [
      {
        h: 'Cách bày thường gặp',
        fig: 'ban-tho',
        figLabel: 'Bàn thờ nhìn từ phía trước',
        legend: [
          'Ảnh thờ, bài vị (nếu có) ở hàng trong cùng.',
          'Bát hương ở chính giữa. Nhà có ba bát thì bát giữa lớn nhất, cao nhất.',
          'Đèn hoặc nến hai bên bát hương.',
          'Ba chén trước bát hương: nước sạch ở giữa, trà và rượu hai bên.',
          'Lọ hoa đặt bên phải (nhìn từ ngoài vào).',
          'Đĩa quả đặt bên trái (nhìn từ ngoài vào).',
          'Mâm cơm, xôi, gà đặt phía trước hoặc trên bàn phụ thấp hơn.',
        ],
        p: [
          'Câu "đông bình tây quả": tính từ bàn thờ nhìn ra, phía tay trái là đông (đặt lọ hoa), tay phải là tây (đặt quả). Nhìn từ ngoài vào thì ngược lại: hoa bên phải, quả bên trái.',
          'Nhiều nhà bày khác (hai lọ hoa hai bên, quả ở giữa). Nhà đã có nếp riêng thì giữ nếp nhà.',
        ],
      },
      {
        h: 'Chén nước, trà, rượu',
        p: [
          'Chén nhỏ, cùng bộ. Nước sạch thay hằng ngày hoặc mùng 1, rằm.',
          'Rượu trắng là phổ biến; cúng xong có thể đổ vào chậu cây, không đổ vào bát hương.',
        ],
      },
      {
        h: 'Không nên',
        p: [
          'Không đặt bàn thờ dưới gầm cầu thang, đối diện nhà vệ sinh hay ngay cạnh bếp lửa.',
          'Không để đồ linh tinh, giấy tờ, chìa khóa trên bàn thờ.',
          'Không để nến, đèn dầu sát rèm, sát vách gỗ.',
        ],
      },
    ],
    sources: [SRC.phongTuc, SRC.thoMai],
    keywords: 'bay ban tho dong binh tay qua bat huong chen nuoc den nen lo hoa vi tri',
  },
  {
    id: 'mam-co',
    title: 'Mâm cỗ cúng theo miền',
    summary: 'Miền Bắc "bốn bát sáu đĩa", miền Nam thịt kho, canh khổ qua; mâm chay cho ngày rằm.',
    icon: 'grid',
    sections: [
      {
        h: 'Miền Bắc: bốn bát, sáu đĩa',
        fig: 'mam-bac',
        figLabel: 'Mâm cỗ miền Bắc nhìn từ trên xuống',
        legend: [
          'Bát canh măng (măng khô hầm chân giò).',
          'Bát miến (miến nấu lòng gà).',
          'Bát bóng thả (bóng bì nấu với su hào, cà rốt).',
          'Bát mọc hoặc canh thập cẩm.',
          'Đĩa gà luộc (để cả con, mỏ ngậm bông hồng hoặc lá chanh tùy nhà).',
          'Đĩa giò lụa hoặc chả quế.',
          'Đĩa nem rán.',
          'Đĩa xôi gấc hoặc xôi đỗ.',
          'Đĩa bánh chưng (ngày Tết).',
          'Đĩa dưa hành hoặc nộm.',
        ],
        p: [
          'Ngày thường, giỗ nhỏ: bớt còn một bát canh, ba bốn đĩa là đủ.',
          'Bát đặt hàng trong, đĩa hàng ngoài; gà luộc thường đặt giữa hoặc hướng đầu vào bát hương.',
          'Đặt kèm bát cơm, đôi đũa, chén nước mắm hoặc muối.',
        ],
      },
      {
        h: 'Miền Nam',
        fig: 'mam-nam',
        figLabel: 'Mâm cúng miền Nam nhìn từ trên xuống',
        legend: [
          'Thịt kho hột vịt (thịt kho tàu).',
          'Canh khổ qua nhồi thịt.',
          'Bánh tét cắt khoanh.',
          'Dưa món hoặc dưa cải, củ kiệu tôm khô.',
          'Gà luộc hoặc gà xé phay.',
          'Chả giò.',
          'Đĩa xôi hoặc bánh.',
        ],
        p: [
          'Ngày giỗ thường có thêm món người mất thích lúc còn sống.',
          'Mỗi nhà một kiểu; mâm vừa đủ ăn, không phí.',
        ],
      },
      {
        h: 'Miền Trung',
        p: [
          'Gần với miền Bắc nhưng nhiều món địa phương: bánh tét, tré, nem chua, thịt heo luộc chấm mắm, canh hầm.',
          'Nhiều nhà Huế bày nhiều chén đĩa nhỏ, mỗi món một ít.',
        ],
      },
      {
        h: 'Mâm chay (mùng 1, rằm, lễ Phật)',
        fig: 'mam-chay',
        figLabel: 'Mâm chay nhìn từ trên xuống',
        legend: ['Xôi hoặc oản.', 'Chè.', 'Canh rau củ.', 'Đậu phụ sốt cà chua hoặc nấm xào.', 'Rau luộc hoặc nộm.'],
        p: ['Ban Phật chỉ dâng lễ chay: hương, hoa, quả, nước, oản, xôi chè. Không dâng đồ mặn, không dâng rượu.'],
      },
    ],
    sources: [SRC.phongTuc, SRC.thoMai],
    keywords: 'mam co mam com cung bon bat sau dia mien bac mien nam mien trung mam chay mon cung',
  },
  {
    id: 'vai-lay',
    title: 'Cách vái, cách lạy, số lạy',
    summary: 'Gia tiên 4 lạy 3 vái, Phật 3 lạy, người sống 2 lạy. Đứng vái cũng được.',
    icon: 'user',
    sections: [
      {
        h: 'Cách vái',
        fig: 'vai',
        figLabel: 'Ba bước một lần vái',
        legend: [
          'Đứng thẳng, hai chân khép, hai tay chắp trước ngực (có thể cầm hương).',
          'Đưa tay lên ngang trán.',
          'Cúi người xuống, tay hạ theo; rồi đứng thẳng lại. Như vậy là một vái.',
        ],
        p: ['Vái liền nhau theo số đã định, không vội. Khi vái cầm hương thì giữ hương thẳng, xa tóc, xa mặt.'],
      },
      {
        h: 'Cách lạy',
        fig: 'lay',
        figLabel: 'Bốn bước một lạy',
        legend: [
          'Đứng thẳng, chắp tay ngang trán.',
          'Quỳ xuống: nam quỳ gối trái trước rồi gối phải; nữ có thể ngồi xếp chân sang trái.',
          'Đặt hai bàn tay xuống chiếu, cúi đầu sát tay.',
          'Ngẩng lên, đứng dậy (hoặc ngồi thẳng). Như vậy là một lạy.',
        ],
        p: [
          'Lạy xong số lạy thì đứng dậy, vái thêm 3 vái rồi lui ra.',
          'Nên trải chiếu hoặc thảm sạch trước bàn thờ.',
        ],
      },
      {
        h: 'Số lạy, số vái theo nơi thờ',
        p: [
          '• Gia tiên, người đã khuất: 4 lạy, rồi 3 vái. Đứng thì vái 4 vái.',
          '• Ban Phật: 3 lạy (lạy sát đất). Đứng thì vái 3 vái.',
          '• Thần linh (Thổ công, Thần tài, Thành hoàng): thường vái 3 vái; có nơi lạy 5 lạy.',
          '• Người còn sống (lễ mừng thọ, lễ cưới): 2 lạy.',
          '• Thắp hương xong, xin hạ lễ: vái 3 vái.',
          'Cách tính có khác nhau theo vùng, theo dòng họ. Nhà đã có nếp riêng thì giữ nếp nhà.',
        ],
      },
      {
        h: 'Người già, người đau gối',
        p: ['Đứng chắp tay vái thay cho lạy là đủ lễ. Không cố quỳ khi đau chân, dễ ngã.'],
      },
    ],
    sources: [SRC.phongTuc, BAO_DAU_TU],
    keywords: 'cach lay cach vai so lay may lay 4 lay 3 vai lay phat lay gia tien quy lay',
  },
  {
    id: 'tra-ruou',
    title: 'Châm trà, rót rượu, ba tuần rượu',
    summary: 'Trà rót trước khi thắp hương; giỗ, Tết rót rượu ba tuần, mỗi tuần một lần vái.',
    icon: 'coffee',
    sections: [
      {
        h: 'Châm trà',
        fig: 'cham-tra',
        figLabel: 'Pha và rót trà',
        legend: [
          'Tráng ấm bằng nước sôi, cho trà vào, tráng nhanh rồi đổ nước đầu.',
          'Pha nước thứ hai, đợi 2 đến 3 phút.',
          'Rót đều vào chén, khoảng hai phần ba chén. Rót bằng hai tay hoặc tay phải, tay trái đỡ.',
        ],
        p: [
          'Rót trà trước khi thắp hương. Trà nguội thì thay chén mới, không rót chồng lên.',
          'Mùng 1, rằm không có trà thì chén nước sạch là đủ.',
        ],
      },
      {
        h: 'Rót rượu: ba tuần rượu',
        fig: 'ba-tuan',
        figLabel: 'Ba tuần rượu theo nén hương',
        legend: [
          'Tuần 1: rót rượu, thắp hương, khấn xong thì lạy (hoặc vái).',
          'Tuần 2: khi hương cháy khoảng một nửa, rót thêm rượu, châm thêm trà, vái 3 vái.',
          'Tuần 3: khi hương sắp tàn, rót thêm lần cuối, vái 3 vái rồi xin hạ lễ.',
        ],
        p: [
          'Ba tuần rượu dùng trong giỗ, Tết, lễ lớn. Mùng 1, rằm thường chỉ rót một lần.',
          'Mỗi lần rót chỉ thêm một chút, không để tràn. Nhiều nhà mời mọi người đứng sau người chủ lễ cùng vái.',
          'Cúng xong, rượu và trà có thể dùng hoặc tưới cây; không đổ vào bát hương.',
        ],
      },
    ],
    sources: [SRC.phongTuc, SRC.thoMai],
    keywords: 'cham tra rot ruou ba tuan ruou tuan ruou dang ruou cung gio',
  },
  {
    id: 'thap-huong',
    title: 'Thắp và cắm hương',
    summary: 'Số lẻ 1, 3, 5 nén; phẩy tắt lửa, không thổi; nhiều bàn thờ thì thắp theo thứ tự.',
    icon: 'sun',
    sections: [
      {
        h: 'Số nén và cách cắm',
        fig: 'thap-huong',
        figLabel: 'Cắm 1, 3 và 5 nén',
        legend: [
          '1 nén: cắm chính giữa bát hương.',
          '3 nén: cắm thành hàng ngang, nén giữa cao hơn hoặc bằng nhau.',
          '5 nén: một nén giữa, bốn nén quanh, hoặc hàng ngang.',
        ],
        p: [
          'Châm lửa bằng nến hay bật lửa. Hương bén lửa thì phẩy nhẹ cho tắt ngọn lửa, không thổi bằng miệng.',
          'Cầm hương bằng hai tay ngang trán, vái 3 vái rồi cắm thẳng, cắm chắc.',
          'Hương cháy dở cũng không rút ra; cuối năm mới tỉa chân hương (giữ số lẻ).',
        ],
      },
      {
        h: 'Nhà có nhiều bàn thờ',
        fig: 'nhieu-ban-tho',
        figLabel: 'Thứ tự thắp hương',
        legend: ['Ban Phật (nếu có).', 'Thần linh: Thổ công, Táo quân.', 'Gia tiên.', 'Thần tài (ở cửa hàng).'],
        p: [
          'Nhiều nhà thắp theo thứ tự trên: ban cao trước, ban thấp sau. Nhà đã có nếp riêng thì theo nếp nhà.',
          'Bàn thờ có ba bát hương: thắp bát giữa trước, rồi bát bên trái, bát bên phải (nhìn từ ngoài vào).',
        ],
      },
    ],
    sources: [SRC.phongTuc, SRC.giacNgo],
    keywords: 'thap huong cam huong so nen 1 3 5 nen phay tat lua nhieu ban tho thu tu thap huong',
  },
];

export const guideById = (id: string) => GUIDES.find((g) => g.id === id);
