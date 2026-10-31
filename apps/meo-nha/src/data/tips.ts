/**
 * Dữ liệu mẫu để chạy app khi chưa có máy chủ. Bản phát hành đọc từ GET /tips (xem App · Mẹo Nhà).
 * Mọi mẹo có hóa chất tẩy rửa, điện, gas, độ cao phải có `safety` (MN-20).
 */
export type CategoryId = 'kitchen' | 'home' | 'plants' | 'laundry' | 'saving' | 'repair';
export type Tip = {
  id: string;
  title: string;
  summary: string;
  categoryId: CategoryId;
  sub?: string;
  minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number;
  ratingCount: number;
  steps: string[];
  caution?: string;
  safety?: string[];
  product?: { name: string; url: string };
  keywords: string;
  childSafe?: boolean;
};

export const CATEGORIES: {
  id: CategoryId;
  name: string;
  icon: 'coffee' | 'home' | 'feather' | 'wind' | 'dollar-sign' | 'tool';
  subs: string[];
}[] = [
  { id: 'kitchen', name: 'Bếp', icon: 'coffee', subs: ['Dầu mỡ', 'Khử mùi', 'Bảo quản'] },
  { id: 'home', name: 'Nhà cửa', icon: 'home', subs: ['Nồm ẩm', 'Nhà tắm', 'Côn trùng'] },
  { id: 'plants', name: 'Cây xanh', icon: 'feather', subs: ['Trong nhà', 'Ban công', 'Sâu bệnh'] },
  { id: 'laundry', name: 'Giặt ủi', icon: 'wind', subs: ['Vết bẩn', 'Đồ trắng', 'Phơi'] },
  { id: 'saving', name: 'Tiết kiệm', icon: 'dollar-sign', subs: ['Điện', 'Nước', 'Đi chợ'] },
  { id: 'repair', name: 'Sửa chữa nhỏ', icon: 'tool', subs: ['Cửa', 'Ống nước'] },
];

export const DIFF_LABEL = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' } as const;

export const TIPS: Tip[] = [
  {
    id: 't1',
    title: 'Tẩy dầu mỡ trên mặt bếp',
    summary: 'Baking soda và giấm làm mềm lớp dầu bám lâu ngày.',
    categoryId: 'kitchen',
    sub: 'Dầu mỡ',
    minutes: 5,
    difficulty: 'easy',
    rating: 4.8,
    ratingCount: 1240,
    steps: [
      'Trộn 2 thìa baking soda với 1 thìa giấm thành hỗn hợp sệt.',
      'Thoa lên vết dầu, để 5 phút.',
      'Lau bằng khăn ẩm, lau khô lại.',
    ],
    caution: 'Không dùng trên mặt đá tự nhiên (giấm làm mờ đá).',
    product: { name: 'Bình xịt chia tỉ lệ', url: 'https://example.com/aff/binh-xit' },
    keywords: 'dau mo bep lau chui baking soda giam',
  },
  {
    id: 't2',
    title: 'Hết mùi tủ lạnh bằng bã cà phê',
    summary: 'Phơi khô bã cà phê, đặt hũ hở nắp ở ngăn mát 24 giờ.',
    categoryId: 'kitchen',
    sub: 'Khử mùi',
    minutes: 2,
    difficulty: 'easy',
    rating: 4.7,
    ratingCount: 980,
    steps: ['Phơi hoặc rang khô bã cà phê.', 'Cho vào hũ nhỏ, không đậy nắp.', 'Đặt ở ngăn mát 24 giờ, thay mỗi tuần.'],
    keywords: 'mui tu lanh ba ca phe khu mui',
  },
  {
    id: 't3',
    title: 'Giữ rau thơm tươi cả tuần',
    summary: 'Bọc khăn giấy ẩm và cho vào hộp kín.',
    categoryId: 'kitchen',
    sub: 'Bảo quản',
    minutes: 3,
    difficulty: 'easy',
    rating: 4.6,
    ratingCount: 640,
    steps: [
      'Nhặt bỏ lá úa, không rửa trước khi cất.',
      'Bọc rau bằng khăn giấy hơi ẩm.',
      'Cho vào hộp kín, để ngăn mát.',
    ],
    keywords: 'rau thom tuoi bao quan tu lanh',
  },
  {
    id: 't4',
    title: 'Làm sạch máy hút mùi',
    summary: 'Ngâm lưới lọc trong nước nóng pha baking soda.',
    categoryId: 'kitchen',
    sub: 'Dầu mỡ',
    minutes: 20,
    difficulty: 'medium',
    rating: 4.5,
    ratingCount: 410,
    steps: [
      'Rút điện máy hút mùi trước khi tháo.',
      'Tháo lưới lọc, ngâm 15 phút trong nước nóng pha 4 thìa baking soda.',
      'Chà nhẹ bằng bàn chải, tráng sạch, để khô rồi lắp lại.',
    ],
    safety: ['Rút phích điện trước khi tháo lưới lọc.', 'Cẩn thận nước nóng, đeo găng tay.'],
    keywords: 'may hut mui luoi loc dau mo',
  },
  {
    id: 't5',
    title: 'Chống nồm cho sàn gạch',
    summary: 'Đóng cửa khi trời nồm, lau khô bằng khăn bông.',
    categoryId: 'home',
    sub: 'Nồm ẩm',
    minutes: 10,
    difficulty: 'easy',
    rating: 4.6,
    ratingCount: 1530,
    steps: [
      'Đóng kín cửa khi độ ẩm ngoài trời cao.',
      'Bật quạt hoặc chế độ hút ẩm của điều hòa.',
      'Lau sàn bằng khăn bông khô, không lau ướt.',
    ],
    keywords: 'nom am san gach chay nuoc tuong',
  },
  {
    id: 't6',
    title: 'Tẩy nấm mốc ron gạch nhà tắm',
    summary: 'Javel pha loãng, quét lên ron, để 10 phút.',
    categoryId: 'home',
    sub: 'Nhà tắm',
    minutes: 10,
    difficulty: 'medium',
    rating: 4.7,
    ratingCount: 870,
    steps: [
      'Pha 1 phần nước tẩy javel với 4 phần nước.',
      'Quét lên ron gạch bằng bàn chải cũ, để 10 phút.',
      'Chà nhẹ, xả sạch bằng nước.',
    ],
    safety: [
      'Không trộn nước tẩy javel với giấm hoặc chất tẩy có amoniac — sinh khí độc.',
      'Mở cửa thông gió, đeo găng tay.',
      'Để xa tầm tay trẻ em.',
    ],
    keywords: 'nam moc ron gach nha tam javel tay',
  },
  {
    id: 't7',
    title: 'Đuổi kiến khỏi bếp',
    summary: 'Lau đường kiến đi bằng nước giấm pha loãng.',
    categoryId: 'home',
    sub: 'Côn trùng',
    minutes: 5,
    difficulty: 'easy',
    rating: 4.3,
    ratingCount: 520,
    steps: [
      'Tìm đường kiến vào nhà.',
      'Lau sạch bằng nước pha giấm 1:1 để xóa vệt mùi.',
      'Đậy kín đồ ngọt, lau vụn thức ăn mỗi tối.',
    ],
    keywords: 'kien bep duoi kien giam',
    childSafe: true,
  },
  {
    id: 't8',
    title: 'Khử mùi giày thể thao',
    summary: 'Rắc baking soda vào giày qua đêm.',
    categoryId: 'home',
    minutes: 2,
    difficulty: 'easy',
    rating: 4.4,
    ratingCount: 760,
    steps: ['Rắc 1 thìa baking soda vào mỗi chiếc giày.', 'Để qua đêm.', 'Đổ bỏ bột và phơi giày nơi thoáng.'],
    keywords: 'mui giay khu mui baking soda',
    childSafe: true,
  },
  {
    id: 't9',
    title: 'Cứu trầu bà bị vàng lá',
    summary: 'Giảm tưới, chuyển chỗ có ánh sáng gián tiếp.',
    categoryId: 'plants',
    sub: 'Trong nhà',
    minutes: 15,
    difficulty: 'easy',
    rating: 4.9,
    ratingCount: 1120,
    steps: [
      'Kiểm tra đất: nếu ướt sũng, ngưng tưới 5–7 ngày.',
      'Cắt bỏ lá vàng bằng kéo sạch.',
      'Chuyển cây ra chỗ sáng nhưng không nắng gắt.',
    ],
    keywords: 'trau ba vang la cay trong nha tuoi',
  },
  {
    id: 't10',
    title: 'Tưới cây khi đi vắng 1 tuần',
    summary: 'Dùng chai nhựa đục lỗ nhỏ cắm ngược vào chậu.',
    categoryId: 'plants',
    sub: 'Trong nhà',
    minutes: 10,
    difficulty: 'easy',
    rating: 4.7,
    ratingCount: 690,
    steps: ['Đục 2–3 lỗ nhỏ trên nắp chai nhựa.', 'Đổ đầy nước, vặn nắp.', 'Cắm ngược chai sâu vào đất cạnh gốc cây.'],
    keywords: 'tuoi cay di vang chai nhua',
  },
  {
    id: 't11',
    title: 'Trị rệp sáp bằng nước rửa chén',
    summary: 'Xịt dung dịch xà phòng loãng lên chỗ có rệp.',
    categoryId: 'plants',
    sub: 'Sâu bệnh',
    minutes: 10,
    difficulty: 'easy',
    rating: 4.6,
    ratingCount: 430,
    steps: [
      'Pha 1 thìa nước rửa chén với 1 lít nước.',
      'Xịt kỹ mặt dưới lá và kẽ lá vào chiều mát.',
      'Lặp lại sau 3 ngày nếu còn rệp.',
    ],
    keywords: 'rep sap sau benh cay nuoc rua chen',
  },
  {
    id: 't12',
    title: 'Cây lưỡi hổ bị úng rễ',
    summary: 'Nhấc cây, cắt rễ thối, để khô rồi trồng đất mới.',
    categoryId: 'plants',
    sub: 'Sâu bệnh',
    minutes: 30,
    difficulty: 'medium',
    rating: 4.5,
    ratingCount: 300,
    steps: [
      'Nhấc cây khỏi chậu, rũ bớt đất.',
      'Cắt bỏ rễ mềm, nâu đen bằng kéo sạch.',
      'Để rễ khô 1 ngày, trồng lại bằng đất tơi thoát nước.',
      'Tưới ít, 2 tuần một lần.',
    ],
    keywords: 'luoi ho ung re thoi re',
  },
  {
    id: 't13',
    title: 'Tẩy ố vàng cổ áo trắng',
    summary: 'Nước rửa chén và baking soda, giặt nước ấm.',
    categoryId: 'laundry',
    sub: 'Đồ trắng',
    minutes: 20,
    difficulty: 'easy',
    rating: 4.7,
    ratingCount: 1380,
    steps: [
      'Thoa nước rửa chén lên cổ áo, để 15 phút.',
      'Rắc baking soda, chà nhẹ bằng bàn chải mềm.',
      'Giặt bằng nước ấm không quá 40°C.',
    ],
    keywords: 'o vang co ao trang tay giat',
  },
  {
    id: 't14',
    title: 'Vết dầu trên áo',
    summary: 'Rắc phấn rôm hút dầu trước khi giặt.',
    categoryId: 'laundry',
    sub: 'Vết bẩn',
    minutes: 10,
    difficulty: 'easy',
    rating: 4.6,
    ratingCount: 820,
    steps: [
      'Thấm bớt dầu bằng khăn giấy, không chà.',
      'Rắc phấn rôm phủ vết dầu, để 30 phút.',
      'Phủi bột, thoa nước rửa chén, giặt như thường.',
    ],
    keywords: 'vet dau ao phan rom giat',
  },
  {
    id: 't15',
    title: 'Phơi đồ mùa nồm không bị mùi',
    summary: 'Giặt ít đồ một lần, vắt kỹ, phơi có quạt.',
    categoryId: 'laundry',
    sub: 'Phơi',
    minutes: 5,
    difficulty: 'easy',
    rating: 4.4,
    ratingCount: 560,
    steps: [
      'Giặt ít đồ hơn bình thường để máy vắt kỹ.',
      'Phơi thưa, chừa khoảng cách giữa các món.',
      'Bật quạt thổi trực tiếp hoặc dùng máy sấy.',
    ],
    keywords: 'phoi do nom mui hoi quan ao',
  },
  {
    id: 't16',
    title: 'Giặt gối không bị vón',
    summary: 'Giặt chế độ nhẹ, sấy kèm bóng tennis.',
    categoryId: 'laundry',
    minutes: 15,
    difficulty: 'medium',
    rating: 4.3,
    ratingCount: 290,
    steps: [
      'Giặt 2 gối cùng lúc cho máy cân bằng.',
      'Chọn chế độ nhẹ, nước ấm.',
      'Sấy nhiệt thấp với 2 bóng tennis để bông tơi.',
    ],
    keywords: 'giat goi von bong',
  },
  {
    id: 't17',
    title: 'Giảm tiền điện điều hòa',
    summary: 'Đặt 26–27°C kèm quạt, vệ sinh lưới lọc mỗi tháng.',
    categoryId: 'saving',
    sub: 'Điện',
    minutes: 10,
    difficulty: 'easy',
    rating: 4.8,
    ratingCount: 2100,
    steps: [
      'Đặt nhiệt độ 26–27°C, bật quạt để gió lan đều.',
      'Đóng kín cửa, kéo rèm phía nắng.',
      'Vệ sinh lưới lọc mỗi tháng.',
    ],
    keywords: 'tien dien dieu hoa tiet kiem',
  },
  {
    id: 't18',
    title: 'Đi chợ theo thực đơn tuần',
    summary: 'Lên 7 bữa trước, mua một lần, bớt đồ bỏ phí.',
    categoryId: 'saving',
    sub: 'Đi chợ',
    minutes: 15,
    difficulty: 'easy',
    rating: 4.5,
    ratingCount: 480,
    steps: [
      'Ghi 7 bữa tối cho tuần tới.',
      'Liệt kê nguyên liệu, gạch món đã có trong tủ.',
      'Mua theo danh sách, chia phần cấp đông.',
    ],
    keywords: 'di cho thuc don tuan tiet kiem',
  },
  {
    id: 't19',
    title: 'Cửa gỗ bị kêu cót két',
    summary: 'Nhỏ vài giọt dầu ăn vào bản lề.',
    categoryId: 'repair',
    sub: 'Cửa',
    minutes: 5,
    difficulty: 'easy',
    rating: 4.4,
    ratingCount: 350,
    steps: ['Mở cửa, lau sạch bụi ở bản lề.', 'Nhỏ 2–3 giọt dầu vào khe bản lề.', 'Đóng mở vài lần, lau dầu thừa.'],
    keywords: 'cua keu cot ket ban le',
  },
  {
    id: 't20',
    title: 'Thông bồn rửa chén bị tắc nhẹ',
    summary: 'Nước nóng và baking soda, sau đó giấm.',
    categoryId: 'repair',
    sub: 'Ống nước',
    minutes: 20,
    difficulty: 'medium',
    rating: 4.5,
    ratingCount: 610,
    steps: [
      'Múc bớt nước đọng trong bồn.',
      'Đổ 3 thìa baking soda, sau đó 1 chén giấm, đậy kín 15 phút.',
      'Xả nước nóng (không sôi) để đẩy cặn.',
    ],
    safety: [
      'Không dùng chung với chất thông cống dạng hóa chất đã đổ trước đó.',
      'Không dùng nước sôi với ống nhựa PVC.',
    ],
    keywords: 'thong bon rua chen tac cong',
  },
];

export function tipById(id: string) {
  return TIPS.find((t) => t.id === id);
}
export function categoryOf(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)!;
}
