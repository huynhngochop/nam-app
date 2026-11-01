import type { Prayer } from './types';

/**
 * Văn khấn biên soạn lại theo khuôn cổ truyền (phần khuôn là của chung), không chép từ các cuốn văn khấn hiện đại.
 * Ô điền: {tinChu} {diaChi} {hoGiaTien} {ngayAm} {thangAm} {namCanChi} {tenNguoiMat} {quanHe} {tenCuaHang} {tenEmBe}.
 * "[x3]" ở cuối dòng = đọc 3 lần. Đoạn cách nhau bằng dòng trống.
 */
const MO = 'Nam mô A Di Đà Phật! [x3]';
const LAY_CHUNG = 'Con lạy chín phương Trời, mười phương chư Phật, chư Phật mười phương.';
const THAN_LINH =
  'Con kính lạy Hoàng thiên, Hậu thổ, chư vị Tôn thần. Con kính lạy ngài Bản cảnh Thành hoàng, ngài Bản xứ Thổ địa, ngài Bản gia Táo quân cùng chư vị Tôn thần.';
const TIN_CHU = 'Tín chủ con là {tinChu}, ngụ tại {diaChi}.';
const NGAY = 'Hôm nay là ngày {ngayAm} tháng {thangAm} năm {namCanChi}';
const KET = 'Tín chủ con lễ bạc tâm thành, cúi xin chứng giám.';

export const PRAYERS: Prayer[] = [
  {
    id: 'gia-tien-thuong',
    title: 'Văn khấn gia tiên (mùng 1, rằm, ngày lễ)',
    deity: 'Gia tiên',
    minutes: 3,
    body: [
      MO,
      LAY_CHUNG,
      THAN_LINH,
      'Con kính lạy các cụ Tổ khảo, Tổ tỷ, chư vị hương linh nội ngoại họ {hoGiaTien}.',
      TIN_CHU,
      `${NGAY}, tín chủ con thành tâm sắm lễ, hương hoa trà quả, thắp nén tâm hương dâng lên trước án.`,
      'Kính mời các cụ Tổ khảo, Tổ tỷ, chư vị hương linh nội ngoại về chứng giám lòng thành, thụ hưởng lễ vật.',
      'Cúi xin phù hộ độ trì cho toàn gia chúng con mạnh khỏe, bình an, công việc hanh thông, gia đạo hòa thuận.',
      KET,
      MO,
    ].join('\n\n'),
    short: [
      MO,
      'Con kính lạy gia tiên nội ngoại họ {hoGiaTien}.',
      `${NGAY}, con là {tinChu} thành tâm dâng nén hương, cúi xin gia tiên chứng giám, phù hộ cả nhà bình an.`,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'tho-cong',
    title: 'Văn khấn Thổ công (Táo quân, Thổ địa)',
    deity: 'Thổ công',
    minutes: 2,
    body: [
      MO,
      LAY_CHUNG,
      'Con kính lạy ngài Đông trù Tư mệnh Táo phủ Thần quân, ngài Bản gia Thổ địa Long mạch Tôn thần, các ngài Ngũ phương, Ngũ thổ, Phúc đức chính thần.',
      TIN_CHU,
      `${NGAY}, tín chủ con thành tâm sắm lễ, hương hoa trà quả, dâng lên trước án.`,
      'Cúi xin các ngài chứng giám, phù hộ cho toàn gia chúng con được bình an, nhà cửa yên ổn, mọi việc thuận lợi.',
      KET,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'than-tai',
    title: 'Văn khấn Thần tài, Thổ địa',
    deity: 'Thần tài',
    minutes: 2,
    body: [
      MO,
      LAY_CHUNG,
      'Con kính lạy ngài Thần Tài, ngài Thổ Địa cai quản trong khu vực này cùng chư vị Tôn thần.',
      TIN_CHU,
      `${NGAY}, tín chủ con thành tâm sắm lễ, hương hoa trà quả, dâng lên trước ban.`,
      'Cúi xin các ngài chứng giám, phù hộ cho việc làm ăn của gia đình chúng con được thuận lợi, buôn bán ngay thẳng, khách đến vui vẻ.',
      KET,
      MO,
    ].join('\n\n'),
    short: [
      MO,
      `Con kính lạy ngài Thần Tài, ngài Thổ Địa. ${NGAY}, con là {tinChu} dâng nén hương, cúi xin các ngài chứng giám, phù hộ làm ăn thuận lợi.`,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'ong-tao',
    title: 'Văn khấn ông Công ông Táo (23 tháng Chạp)',
    deity: 'Táo quân',
    minutes: 3,
    body: [
      MO,
      LAY_CHUNG,
      'Con kính lạy ngài Đông trù Tư mệnh Táo phủ Thần quân.',
      TIN_CHU,
      `${NGAY}, nhân ngày Táo quân về chầu trời, tín chủ con thành tâm sắm lễ, hương hoa trà quả, dâng lên trước án.`,
      'Một năm qua, ngài đã cai quản bếp lửa, che chở cho gia đình chúng con. Cúi xin ngài thương xót, bỏ qua những điều sơ suất của gia đình, tâu lên những điều tốt lành.',
      'Cúi xin ngài phù hộ cho gia đình chúng con năm mới mạnh khỏe, bình an, hòa thuận.',
      KET,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'giao-thua',
    title: 'Văn khấn giao thừa ngoài trời',
    deity: 'Đương niên',
    minutes: 3,
    body: [
      MO,
      LAY_CHUNG,
      'Con kính lạy Đức Đương niên Hành khiển, Đức Đương cảnh Thành hoàng, ngài Bản xứ Thổ địa cùng chư vị Tôn thần.',
      TIN_CHU,
      'Phút giao thừa năm cũ sang năm mới, tín chủ con thành tâm sắm lễ, hương hoa trà quả, đặt trước sân nhà, kính tiễn quan cũ, đón quan mới.',
      'Cúi xin các ngài phù hộ cho toàn gia chúng con năm mới mạnh khỏe, bình an, công việc thuận lợi, gia đạo hòa thuận.',
      KET,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'gio',
    title: 'Văn khấn ngày giỗ',
    deity: 'Gia tiên',
    minutes: 4,
    body: [
      MO,
      LAY_CHUNG,
      THAN_LINH,
      'Con kính lạy các cụ Tổ khảo, Tổ tỷ, chư vị hương linh nội ngoại họ {hoGiaTien}.',
      TIN_CHU,
      `${NGAY}, là ngày giỗ của {quanHe} {tenNguoiMat}.`,
      'Nhớ ơn sinh thành, dưỡng dục, con cháu thành tâm sắm lễ, hương hoa trà quả, cơm canh dâng lên trước án.',
      'Kính mời hương linh {quanHe} {tenNguoiMat} về chứng giám lòng thành, thụ hưởng lễ vật. Kính mời các cụ Tổ khảo, Tổ tỷ, chư vị hương linh nội ngoại cùng về hâm hưởng.',
      'Cúi xin phù hộ cho con cháu mạnh khỏe, bình an, học hành tấn tới, gia đạo hòa thuận.',
      KET,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'nhap-trach',
    title: 'Văn khấn về nhà mới (nhập trạch)',
    deity: 'Thần linh',
    minutes: 3,
    body: [
      MO,
      LAY_CHUNG,
      THAN_LINH,
      'Tín chủ con là {tinChu}.',
      `${NGAY}, gia đình chúng con dọn về ngôi nhà mới tại {diaChi}, thành tâm sắm lễ, hương hoa trà quả, dâng lên trước án.`,
      'Kính cáo các ngài Thần linh cai quản nơi đây, cho phép gia đình chúng con được nhập trạch, an cư.',
      'Cúi xin các ngài chứng giám, phù hộ cho gia đình chúng con ở nơi mới được bình an, mạnh khỏe, mọi việc hanh thông.',
      KET,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'khai-truong',
    title: 'Văn khấn khai trương',
    deity: 'Thần tài',
    minutes: 3,
    body: [
      MO,
      LAY_CHUNG,
      THAN_LINH,
      'Con kính lạy ngài Thần Tài, ngài Thổ Địa cai quản trong khu vực này.',
      'Tín chủ con là {tinChu}.',
      `${NGAY}, tín chủ con khai trương cửa hàng {tenCuaHang} tại {diaChi}, thành tâm sắm lễ, hương hoa trà quả, dâng lên trước án.`,
      'Cúi xin các ngài chứng giám, phù hộ cho việc buôn bán được thuận lợi, khách hàng tin tưởng, làm ăn ngay thẳng, bền lâu.',
      KET,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'an-vi-bat-huong',
    title: 'Văn khấn an vị bát hương',
    deity: 'Gia tiên',
    minutes: 3,
    body: [
      MO,
      LAY_CHUNG,
      THAN_LINH,
      'Con kính lạy các cụ Tổ khảo, Tổ tỷ, chư vị hương linh nội ngoại họ {hoGiaTien}.',
      TIN_CHU,
      `${NGAY}, gia đình chúng con lập bàn thờ, an vị bát hương, thành tâm sắm lễ, hương hoa trà quả, dâng lên trước án.`,
      'Kính mời gia tiên nội ngoại về an vị nơi đây, chứng giám lòng thành của con cháu.',
      'Cúi xin phù hộ cho toàn gia chúng con mạnh khỏe, bình an, gia đạo hòa thuận.',
      KET,
      MO,
    ].join('\n\n'),
  },
  {
    id: 'day-thang',
    title: 'Văn khấn đầy tháng',
    deity: 'Bà Mụ',
    minutes: 3,
    body: [
      MO,
      LAY_CHUNG,
      'Con kính lạy Đức Mười hai Bà Mụ, Ba Đức Ông, chư vị Tiên Bà.',
      TIN_CHU,
      `${NGAY}, cháu {tenEmBe} tròn một tháng tuổi. Gia đình chúng con thành tâm sắm lễ, hương hoa trà quả, xôi chè dâng lên trước án.`,
      'Cúi xin các ngài chứng giám, phù hộ cho cháu {tenEmBe} ăn ngoan, ngủ yên, mạnh khỏe, lớn khôn.',
      KET,
      MO,
    ].join('\n\n'),
  },
];

export const prayerById = (id: string) => PRAYERS.find((p) => p.id === id);
