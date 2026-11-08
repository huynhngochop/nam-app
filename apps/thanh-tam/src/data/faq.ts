import type { SourceRef } from './types';
import { SRC } from './sources';

/**
 * Câu hỏi thường gặp cho "Hỏi Thành Tâm" (trả lời trên máy, không gửi câu hỏi đi đâu).
 * Câu trả lời theo nếp dân gian phổ biến và hướng dẫn của Giáo hội; ghi rõ chỗ nào tùy nếp nhà.
 * `alt`: cách hỏi khác; `kw`: từ khóa không dấu để khớp câu hỏi.
 */
export type Faq = {
  id: string;
  q: string;
  alt: string[];
  kw: string;
  a: string[];
  links: { title: string; href: string }[];
  sources?: SourceRef[];
};

export const FAQ: Faq[] = [
  {
    id: 'so-nen-huong',
    q: 'Thắp mấy nén hương?',
    alt: ['thắp bao nhiêu nén nhang', 'mấy cây nhang', 'số nén hương'],
    kw: 'thap may nen huong bao nhieu nhang so le cay nhang',
    a: [
      'Thường thắp số lẻ: 1, 3 hoặc 5 nén. Ngày thường 1 hoặc 3 nén là đủ, lễ lớn có thể 5 nén.',
      'Nhà có nhiều bát hương thì thắp bát giữa trước rồi đến hai bên.',
    ],
    links: [{ title: 'Thắp bao nhiêu nén hương?', href: '/tip/so-nen-huong' }],
    sources: [SRC.phongTuc],
  },
  {
    id: 'ha-le',
    q: 'Khi nào hạ lễ?',
    alt: ['bao lâu thì hạ lễ', 'hạ đồ cúng lúc nào', 'cúng xong bao lâu dọn'],
    kw: 'ha le khi nao bao lau don do cung huong chay het',
    a: ['Đợi hương cháy gần hết (khoảng hai phần ba nén) rồi vái xin hạ lễ. Không cần để lễ qua đêm.'],
    links: [{ title: 'Khi nào hạ lễ?', href: '/tip/ha-le' }],
    sources: [SRC.phongTuc],
  },
  {
    id: 'gio-ngay-nao',
    q: 'Cúng giỗ vào ngày nào, trước hay đúng ngày mất?',
    alt: ['giỗ làm trước được không', 'cúng giỗ sớm', 'tiên thường là gì', 'giỗ tính ngày nào'],
    kw: 'gio ngay nao truoc dung ngay mat tien thuong lam som cung gio som am lich',
    a: [
      'Giỗ tính theo ngày mất âm lịch. Nhiều nhà làm lễ tiên thường hôm trước và cúng chính đúng ngày.',
      'Có thể làm sớm vài ngày để con cháu về đủ; thường không làm sau ngày giỗ. Thành Tâm tự đổi ngày giỗ âm sang dương mỗi năm và nhắc trước.',
    ],
    links: [
      { title: 'Lễ cúng giỗ', href: '/ritual/gio-thuong' },
      { title: 'Sổ giỗ', href: '/anniversaries' },
    ],
    sources: [SRC.thoMai, SRC.phongTuc],
  },
  {
    id: 'thang-thieu',
    q: 'Giỗ ngày 30 mà năm nay tháng đó thiếu thì cúng ngày nào?',
    alt: ['tháng thiếu không có ngày 30', 'giỗ 30 tháng thiếu', 'ngày 30 không có'],
    kw: 'thang thieu ngay 30 khong co ngay 30 gio 29 cuoi thang',
    a: [
      'Tháng âm thiếu chỉ có 29 ngày. Nhiều nhà cúng ngày 29, tức ngày cuối tháng. Thành Tâm tự tính theo cách này và báo trước.',
      'Nhà theo lệ khác thì chọn "Hỏi mỗi năm" khi thêm ngày giỗ.',
    ],
    links: [{ title: 'Sổ giỗ', href: '/anniversaries' }],
  },
  {
    id: 'thang-nhuan',
    q: 'Người mất vào tháng nhuận thì giỗ tháng nào?',
    alt: ['giỗ tháng nhuận', 'mất tháng nhuận', 'năm nhuận cúng giỗ'],
    kw: 'thang nhuan gio thang nao mat thang nhuan nam nhuan',
    a: [
      'Thường giỗ vào tháng thường cùng tên. Ví dụ mất tháng 6 nhuận thì giỗ tháng 6 hằng năm. Thành Tâm tính theo cách này.',
    ],
    links: [{ title: 'Sổ giỗ', href: '/anniversaries' }],
  },
  {
    id: 'ram-gio-nao',
    q: 'Cúng rằm, mùng 1 vào giờ nào?',
    alt: ['cúng rằm lúc mấy giờ', 'cúng mùng một buổi nào', 'cúng chiều 14 được không'],
    kw: 'cung ram mung 1 gio nao may gio buoi sang chieu toi 14 30 khi nao',
    a: [
      'Không có giờ bắt buộc. Nhiều nhà cúng chiều hôm trước (14 hoặc 30) hoặc sáng hôm đó.',
      'Tránh cúng quá khuya. Bận thì cúng lúc tiện nhất, lòng thành là chính.',
    ],
    links: [{ title: 'Lễ rằm, mùng 1', href: '/ritual/mung-1-ram' }],
    sources: [SRC.phongTuc],
  },
  {
    id: 'chay-man',
    q: 'Rằm, mùng 1 cúng chay hay mặn?',
    alt: ['cúng chay hay mặn', 'có cần cúng mặn', 'ban phật cúng gì'],
    kw: 'cung chay hay man do man do chay ban phat',
    a: [
      'Ban Phật luôn cúng chay. Ban gia tiên tùy nếp nhà: rằm, mùng 1 nhiều nhà chỉ hương hoa quả hoặc cỗ chay; giỗ, Tết thường có cỗ mặn.',
      'Đổi nếp nhà (chay hay mặn) trong Cài đặt để Thành Tâm gợi ý lễ vật cho đúng.',
    ],
    links: [
      { title: 'Lễ rằm, mùng 1', href: '/ritual/mung-1-ram' },
      { title: 'Đổi nếp nhà', href: '/onboarding/tradition?edit=1' },
    ],
  },
  {
    id: 'huong-lech',
    q: 'Hương cháy không đều, cháy lệch có sao không?',
    alt: ['nhang cháy lệch', 'hương cháy so le', 'hương cháy nhanh chậm'],
    kw: 'huong chay khong deu lech so le nhang chay nhanh cham',
    a: [
      'Dân gian hay đoán điềm, nhưng thường do hương ẩm, gió, chân hương khác nhau. Giữ hương khô, tránh gió, tỉa chân hương là được.',
    ],
    links: [{ title: 'Hương cháy không đều', href: '/sign/huong-chay-khong-deu' }],
  },
  {
    id: 'tan-cuon',
    q: 'Tàn hương cuộn lại là điềm gì?',
    alt: ['tàn nhang cong', 'tàn hương uốn cong', 'hoa hương'],
    kw: 'tan huong cuon cong uon hoa huong dieu gi',
    a: [
      'Tàn cuộn là do lõi tre và bột hương cháy không đều, thường gặp khi trời lặng gió. Dân gian coi là điềm tốt; không cần lo lắng.',
    ],
    links: [{ title: 'Tàn hương cuộn', href: '/sign/tan-huong-cuon' }],
  },
  {
    id: 'chan-huong-chay',
    q: 'Bát hương bốc cháy phải làm sao?',
    alt: ['chân hương cháy', 'bát nhang bị cháy', 'cháy bát hương'],
    kw: 'bat huong boc chay chan huong chay bat nhang chay lua',
    a: [
      'Việc đầu tiên là dập lửa an toàn: úp nắp hoặc rắc tro, không đổ nước vào đồ điện. Sau đó tỉa bớt chân hương để không cháy lại.',
    ],
    links: [{ title: 'Chân hương bốc cháy', href: '/sign/chan-huong-chay' }],
  },
  {
    id: 'bao-sai',
    q: 'Khi nào lau dọn bàn thờ, tỉa chân hương?',
    alt: ['bao sái bàn thờ', 'lau bàn thờ ngày nào', 'rút chân nhang'],
    kw: 'bao sai lau don ban tho tia rut chan huong nhang khi nao ngay nao',
    a: [
      'Nhiều nhà lau dọn bàn thờ vào ngày 23 tháng Chạp. Dùng khăn sạch với nước ấm hoặc nước gừng, tỉa chân hương giữ lại số lẻ.',
    ],
    links: [{ title: 'Lau dọn bàn thờ cuối năm', href: '/tip/bao-sai' }],
    sources: [SRC.phongTuc],
  },
  {
    id: 'thay-bat-huong',
    q: 'Có cần thay tro, thay bát hương không?',
    alt: ['đổi bát hương mới', 'tro bát hương đầy', 'thay tro bát nhang'],
    kw: 'thay tro bat huong doi bat huong moi tro day bat nhang',
    a: [
      'Không cần thay thường xuyên. Tro đầy thì vơi bớt khi lau dọn cuối năm.',
      'Bát hương mới hoặc chuyển bát hương sang chỗ khác thì làm lễ an vị.',
    ],
    links: [{ title: 'Lễ an vị bát hương', href: '/ritual/an-vi-bat-huong' }],
  },
  {
    id: 'dat-ban-tho',
    q: 'Đặt bàn thờ ở đâu cho đúng?',
    alt: ['bàn thờ đặt hướng nào', 'lập bàn thờ lần đầu', 'vị trí bàn thờ'],
    kw: 'dat ban tho o dau huong nao vi tri lap ban tho lan dau',
    a: [
      'Chọn nơi cao ráo, sạch, yên tĩnh. Tránh đặt sát nhà vệ sinh, bếp, dưới dầm hay cạnh giường ngủ.',
      'Hướng thường theo hướng nhà. Không bắt buộc xem thầy; nhà mới ra ở riêng có thể bắt đầu đơn giản.',
    ],
    links: [{ title: 'Lễ an vị bát hương', href: '/ritual/an-vi-bat-huong' }],
    sources: [SRC.phongTuc],
  },
  {
    id: 'ong-tao',
    q: 'Cúng ông Công ông Táo ngày nào, giờ nào?',
    alt: ['tiễn táo quân', 'cúng 23 tháng chạp', 'cúng ông táo trước mấy giờ'],
    kw: 'ong cong ong tao tao quan 23 thang chap gio nao truoc 12 gio trua',
    a: [
      'Ngày 23 tháng Chạp. Nhiều nơi cúng trước 12 giờ trưa; bận có thể cúng từ tối 22. Sau lễ thả cá chép ở nơi nước sạch.',
    ],
    links: [
      { title: 'Lễ ông Công ông Táo', href: '/ritual/ong-cong-ong-tao' },
      { title: 'Thả cá chép', href: '/tip/tha-ca-chep' },
    ],
    sources: [SRC.phongTuc],
  },
  {
    id: 'than-tai',
    q: 'Cúng Thần Tài hằng ngày thế nào?',
    alt: ['ban thần tài', 'cúng thần tài thổ địa', 'mùng 10 thần tài'],
    kw: 'than tai tho dia hang ngay mung 10 via than tai cung',
    a: [
      'Hằng ngày thắp hương, thay nước sạch. Mùng 10 âm mỗi tháng và mùng 10 tháng Giêng (vía Thần Tài) cúng đầy đủ hơn.',
    ],
    links: [
      { title: 'Cúng Thần Tài hằng ngày', href: '/ritual/than-tai-hang-ngay' },
      { title: 'Mùng 10 Thần Tài', href: '/ritual/mung-10-than-tai' },
    ],
  },
  {
    id: 'vang-ma',
    q: 'Có nên đốt vàng mã không?',
    alt: ['hóa vàng', 'đốt tiền vàng', 'vàng mã có cần'],
    kw: 'dot vang ma hoa vang tien vang co nen',
    a: [
      'Giáo hội Phật giáo khuyên không đốt vàng mã, thay bằng việc thiện. Nếu nhà vẫn hóa thì hóa ít, ở nơi thoáng, có sẵn nước.',
    ],
    links: [{ title: 'Hóa vàng an toàn', href: '/tip/hoa-vang-an-toan' }],
    sources: [SRC.tb204, SRC.vanghoaVangMa],
  },
  {
    id: 'thanh-minh',
    q: 'Tảo mộ Thanh minh vào ngày nào?',
    alt: ['tiết thanh minh', 'đi tảo mộ', 'sửa mộ'],
    kw: 'tao mo thanh minh tiet thanh minh ngay nao di tao mo',
    a: [
      'Tiết Thanh minh bắt đầu khoảng ngày 4 hoặc 5 tháng 4 dương lịch. Nhiều nhà đi tảo mộ trong những ngày của tiết này.',
    ],
    links: [{ title: 'Lễ Thanh minh', href: '/ritual/thanh-minh' }],
  },
  {
    id: 'vu-lan',
    q: 'Rằm tháng Bảy cúng gì?',
    alt: ['lễ vu lan', 'cúng cô hồn', 'tháng bảy cúng gì'],
    kw: 'ram thang bay vu lan co hon cung chung sinh thang 7',
    a: [
      'Rằm tháng Bảy là lễ Vu Lan báo hiếu: cúng gia tiên, có thể tụng kinh Vu Lan. Nhiều nhà cúng thêm mâm cháo, gạo muối ngoài trời.',
      'Phật giáo không có "tháng cô hồn"; không cần kiêng việc lớn cả tháng.',
    ],
    links: [
      { title: 'Lễ Vu Lan', href: '/ritual/vu-lan' },
      { title: 'Nghi thức Vu Lan', href: '/chant/vu-lan-bao-hieu' },
    ],
    sources: [SRC.thanhTra],
  },
  {
    id: 'tung-gio',
    q: 'Ngày giỗ tụng kinh gì?',
    alt: ['cầu siêu tụng kinh gì', 'tụng kinh cho người mất', 'kinh cầu siêu'],
    kw: 'gio tung kinh gi cau sieu nguoi mat kinh cau sieu a di da vang sanh',
    a: [
      'Thường tụng nghi thức cầu siêu: kinh A Di Đà, chú Vãng Sanh, Bát Nhã Tâm Kinh, niệm Phật A Di Đà, hồi hướng. Bản gọn khoảng 8 phút.',
    ],
    links: [{ title: 'Nghi thức cầu siêu', href: '/chant/cau-sieu' }],
  },
  {
    id: 'tung-cau-an',
    q: 'Rằm, mùng 1, đầu năm tụng kinh gì?',
    alt: ['cầu an tụng kinh gì', 'tụng kinh cầu bình an', 'kinh cầu an'],
    kw: 'ram mung 1 dau nam tung kinh gi cau an binh an kinh pho mon dai bi',
    a: ['Thường tụng nghi thức cầu an: chú Đại Bi, Bát Nhã Tâm Kinh, phẩm Phổ Môn, niệm Quán Thế Âm, hồi hướng.'],
    links: [{ title: 'Nghi thức cầu an', href: '/chant/cau-an' }],
  },
  {
    id: 'khong-thuoc-kinh',
    q: 'Không thuộc kinh, không có thầy thì tụng thế nào?',
    alt: ['mới tụng kinh', 'không biết tụng kinh', 'tụng kinh tại nhà'],
    kw: 'khong thuoc kinh khong co thay moi tung kinh tai nha khong biet tung',
    a: [
      'Không cần thuộc: đọc theo chữ trên màn hình, mõ giữ nhịp. Có giọng đọc mẫu và video chư Tăng tụng để đọc theo.',
      'Bận thì chỉ niệm danh hiệu Phật vài phút cũng được.',
    ],
    links: [{ title: 'Tụng kinh', href: '/chant' }],
  },
  {
    id: 'nha-co-tang',
    q: 'Nhà có tang thì Tết, rằm cúng thế nào?',
    alt: ['nhà có tang ăn tết', 'năm có tang', 'để tang có cúng rằm'],
    kw: 'nha co tang tet ram nam co tang de tang cung',
    a: [
      'Vẫn cúng gia tiên như thường, giữ đơn giản. Năm đầu nhiều nhà không dán câu đối đỏ, ít đi chúc Tết. Mỗi miền, mỗi nhà một nếp.',
    ],
    links: [{ title: 'Lễ cúng giỗ', href: '/ritual/gio-thuong' }],
    sources: [SRC.thoMai],
  },
  {
    id: 'nha-moi',
    q: 'Về nhà mới cần cúng gì?',
    alt: ['chuyển nhà', 'nhập trạch', 'dọn về nhà mới'],
    kw: 've nha moi chuyen nha nhap trach don nha cung gi',
    a: [
      'Làm lễ nhập trạch: báo với thần linh, gia tiên rằng gia đình về ở. Lễ vật đơn giản: hương, hoa, quả, trầu cau, bếp lửa đầu tiên.',
    ],
    links: [{ title: 'Lễ nhập trạch', href: '/ritual/nhap-trach' }],
  },
  {
    id: 'day-thang',
    q: 'Cúng đầy tháng cho bé thế nào?',
    alt: ['đầy tháng', 'cúng mụ', 'cúng thôi nôi'],
    kw: 'day thang be cung mu ba mu thoi noi tre so sinh',
    a: [
      'Lễ đầy tháng cúng mười hai Bà Mụ và Đức Ông, cảm ơn và cầu cho bé khỏe. Thành Tâm có văn khấn điền sẵn tên bé.',
    ],
    links: [{ title: 'Lễ đầy tháng', href: '/ritual/day-thang' }],
  },
  {
    id: 'khai-truong',
    q: 'Khai trương cửa hàng cúng gì?',
    alt: ['mở cửa hàng', 'khai trương', 'mở hàng đầu năm'],
    kw: 'khai truong cua hang mo hang mo cua dau nam cung gi',
    a: ['Lễ khai trương cúng thần linh, Thần Tài, cầu buôn bán thuận lợi. Văn khấn điền sẵn tên cửa hàng.'],
    links: [{ title: 'Lễ khai trương', href: '/ritual/khai-truong' }],
  },
  {
    id: 'sao-han',
    q: 'Năm nay tuổi tôi có hạn không, có cần dâng sao giải hạn?',
    alt: ['sao chiếu mệnh', 'giải hạn', 'kim lâu tam tai', 'năm tuổi'],
    kw: 'nam nay tuoi han sao chieu menh dang sao giai han kim lau tam tai nam tuoi',
    a: [
      'Xem tuổi, sao, hạn theo lịch dân gian cho từng người trong nhà ở mục Tuổi & năm.',
      'Giáo hội Phật giáo không khuyến khích dâng sao giải hạn; sống lành, làm việc thiện là chính.',
    ],
    links: [{ title: 'Tuổi & năm', href: '/age' }],
    sources: [SRC.cv033],
  },
  {
    id: 'mo-nguoi-mat',
    q: 'Mơ thấy người đã mất có sao không?',
    alt: ['nằm mơ thấy ông bà', 'mơ người chết', 'mộng thấy người thân đã khuất'],
    kw: 'mo thay nguoi da mat chet ong ba mong nguoi than da khuat',
    a: [
      'Thường là do nhớ thương. Có thể thắp hương, khấn thăm hỏi, làm việc tốt hồi hướng. Nếu mơ nhiều kèm mất ngủ kéo dài, nên nói với người thân hoặc bác sĩ.',
    ],
    links: [{ title: 'Mơ thấy người đã mất', href: '/sign/mo-nguoi-mat' }],
  },
  {
    id: 'doi-may',
    q: 'Đổi điện thoại có mất sổ giỗ không?',
    alt: ['sao lưu dữ liệu', 'chuyển sang máy mới', 'khôi phục dữ liệu'],
    kw: 'doi dien thoai may moi mat so gio sao luu du lieu khoi phuc chuyen may',
    a: [
      'Dữ liệu nằm trên máy. Vào Sao lưu và chia sẻ, tạo bản sao lưu rồi lưu vào Drive, mail hoặc Zalo. Máy mới mở tệp đó để khôi phục.',
    ],
    links: [{ title: 'Sao lưu và chia sẻ', href: '/data' }],
  },
  {
    id: 'gui-so-gio',
    q: 'Làm sao gửi sổ giỗ cho anh chị em trong nhà?',
    alt: ['chia sẻ sổ giỗ', 'sổ giỗ chung cả nhà', 'gửi ngày giỗ qua zalo'],
    kw: 'gui so gio chia se anh chi em ca nha chung zalo mail',
    a: [
      'Vào Sổ giỗ, chọn Gửi cho cả nhà, chọn ngày giỗ rồi gửi qua mail, Zalo. Người nhận mở tệp trong Thành Tâm: ngày mới được thêm, ngày trùng sẽ hỏi trước khi ghi đè.',
    ],
    links: [
      { title: 'Gửi sổ giỗ', href: '/anniversaries/share' },
      { title: 'Nhận sổ giỗ', href: '/data' },
    ],
  },
  {
    id: 'khong-co-tieng',
    q: 'Sao bấm đọc văn khấn không có tiếng?',
    alt: ['giọng máy không đọc', 'không nghe thấy giọng đọc', 'không có giọng đọc'],
    kw: 'bam doc khong co tieng giong may khong doc khong nghe giong doc am thanh',
    a: [
      'Nhiều máy chưa có giọng tiếng Việt. Dùng Giọng mẫu (tải một lần, không cần giọng của máy), hoặc vào Cài đặt, mục Giọng máy tiếng Việt để cài.',
      'Kiểm tra âm lượng và nút gạt im lặng của máy.',
    ],
    links: [
      { title: 'Giọng đọc mẫu', href: '/voices' },
      { title: 'Cài đặt', href: '/settings' },
    ],
  },
  {
    id: 'khong-thong-bao',
    q: 'Sao không thấy thông báo nhắc lễ?',
    alt: ['không có thông báo', 'không nhắc rằm', 'không nhắc giỗ'],
    kw: 'khong thay thong bao nhac le khong nhac ram gio bao thuc',
    a: [
      'Vào Cài đặt, mục Nhắc lịch: xem thông báo đã bật chưa và bấm Gửi thử thông báo.',
      'Một số máy tắt app chạy nền để tiết kiệm pin; cho Thành Tâm được chạy nền trong cài đặt pin của máy.',
    ],
    links: [{ title: 'Cài đặt', href: '/settings' }],
  },
];

/** Gợi ý câu hỏi khi chưa gõ gì. */
export const FAQ_SUGGEST = ['gio-ngay-nao', 'so-nen-huong', 'ram-gio-nao', 'tung-gio', 'gui-so-gio', 'sao-han'];
