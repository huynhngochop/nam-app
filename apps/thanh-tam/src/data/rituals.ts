import type { IconName } from '@nam/ui';
import type { Offering, Ritual, RitualGroup } from './types';
import { SRC } from './sources';

export const GROUPS: { id: RitualGroup; name: string; icon: IconName }[] = [
  { id: 'hang-thang', name: 'Hằng tháng', icon: 'moon' },
  { id: 'tet-le', name: 'Tết, lễ trong năm', icon: 'gift' },
  { id: 'gia-tien', name: 'Gia tiên, giỗ', icon: 'users' },
  { id: 'nha-cua', name: 'Nhà cửa', icon: 'home' },
  { id: 'con-tre', name: 'Con trẻ', icon: 'smile' },
  { id: 'lam-an', name: 'Làm ăn', icon: 'shopping-bag' },
  { id: 'di-le', name: 'Lễ chùa, đền', icon: 'sun' },
  { id: 'kinh-tung', name: 'Kinh tụng', icon: 'book-open' },
];

const VANG_MA: Offering = { name: 'Vàng mã', note: 'Nên hạn chế, thay bằng việc thiện', avoid: true };
const GIAN_DI: Offering[] = [{ name: 'Hương (nhang)' }, { name: 'Hoa tươi' }, { name: 'Nước sạch' }, { name: 'Một đĩa quả' }];
const THAP_HUONG = { title: 'Thắp hương, khấn', text: 'Thắp số lẻ: 1, 3 hoặc 5 nén. Đứng ngay ngắn trước bàn thờ, đọc văn khấn.', fire: true };
const LAU_DON = { title: 'Lau dọn bàn thờ', text: 'Lau bụi, thay nước, cắm hoa tươi. Không cần rút chân hương ngày thường.' };
const HA_LE = [
  { title: 'Vái xin hạ lễ', text: 'Khi hương cháy gần hết, đứng trước bàn thờ vái 3 vái.' },
  { title: 'Hóa vàng (nếu có)', text: 'Có thể không hóa. Nếu hóa, hóa ít, ở nơi an toàn.', fire: true },
  { title: 'Thụ lộc', text: 'Cả nhà dùng lễ vật, không bỏ phí.' },
];

export const RITUALS: Ritual[] = [
  {
    id: 'mung-1-ram', title: 'Cúng mùng 1, rằm', group: 'hang-thang', icon: 'moon', minutes: 15,
    summary: 'Thắp hương gia tiên và Thổ công ngày đầu tháng, giữa tháng, cầu cả nhà bình an.',
    meaning: 'Ngày mùng Một và ngày Rằm, con cháu thắp hương mời gia tiên, thần linh về chứng giám, nhớ ơn tổ tiên và cầu một tháng bình an. Đây là lễ thường xuyên nhất trong nhà người Việt.',
    when: { rule: { kind: 'monthly', days: [1, 15] }, text: 'Sáng mùng 1, Rằm (hoặc tối hôm trước)' },
    where: ['Bàn thờ gia tiên', 'Thổ công'],
    offerings: {
      bac: [{ name: 'Hương (nhang)' }, { name: 'Hoa tươi', note: 'Cúc, huệ hoặc sen' }, { name: 'Quả tươi', note: 'Mâm ngũ quả hoặc một nải chuối' },
        { name: 'Trầu cau, rượu, nước sạch' }, { name: 'Xôi, gà luộc', note: 'Hoặc mâm cơm nhà', optional: true }, VANG_MA],
      nam: [{ name: 'Hương (nhang)' }, { name: 'Hoa tươi', note: 'Cúc, huệ, lay ơn' }, { name: 'Quả tươi', note: 'Mãng cầu, dừa, đu đủ, xoài' },
        { name: 'Trà, rượu, nước sạch' }, { name: 'Mâm cơm hoặc bánh', optional: true }, VANG_MA],
      chay: [{ name: 'Hương (nhang)' }, { name: 'Hoa tươi' }, { name: 'Quả tươi' }, { name: 'Nước sạch, trà' }, { name: 'Xôi, chè, oản', optional: true }],
      gianDi: GIAN_DI,
    },
    variantNote: 'Miền Bắc thường có mâm ngũ quả có chuối xanh, bưởi; miền Nam hay bày mãng cầu, dừa, đu đủ, xoài. Theo nếp nhà mình nếu đã có.',
    steps: [LAU_DON, { title: 'Bày lễ vật', text: 'Theo danh sách đã chọn. Lễ giản dị cũng đủ.' }, THAP_HUONG],
    afterSteps: HA_LE, cautions: ['Không cần mâm cao cỗ đầy; tâm thành là chính.'],
    prayers: ['gia-tien-thuong', 'tho-cong'], tips: ['so-nen-huong', 'ha-le'], sources: [SRC.phongTuc, SRC.thoMai, SRC.tb204],
    keywords: 'mung 1 ram ram mung mot gia tien tho cong hang thang ram thang',
  },
  {
    id: 'than-tai-hang-ngay', title: 'Thần tài, Thổ địa hằng ngày', group: 'lam-an', icon: 'shopping-bag', minutes: 5,
    summary: 'Thắp hương ban Thần tài mỗi sáng trước khi mở hàng.',
    meaning: 'Nhiều gia đình buôn bán thờ Thần tài và Thổ địa, thắp hương mỗi sáng để cầu làm ăn thuận lợi.',
    when: { rule: null, text: 'Sáng mỗi ngày, trước khi mở hàng' }, where: ['Ban Thần tài'],
    offerings: { chung: [{ name: 'Hương' }, { name: 'Nước sạch' }, { name: 'Hoa tươi', optional: true }, { name: 'Quả tươi', optional: true }], gianDi: [{ name: 'Hương' }, { name: 'Nước sạch' }] },
    steps: [{ title: 'Thay nước', text: 'Thay chén nước sạch, lau ban thờ.' }, THAP_HUONG], afterSteps: [],
    prayers: ['than-tai'], tips: ['so-nen-huong'], sources: [SRC.phongTuc], keywords: 'than tai tho dia hang ngay ban than tai buon ban',
  },
  {
    id: 'mung-10-than-tai', title: 'Cúng mùng 10 Thần tài', group: 'lam-an', icon: 'shopping-bag', minutes: 10,
    summary: 'Nhiều nhà buôn bán cúng Thần tài vào ngày mùng 10 âm lịch hằng tháng.',
    meaning: 'Theo tục nhiều nơi, mùng 10 âm lịch là ngày cúng Thần tài, nhất là mùng 10 tháng Giêng.',
    when: { rule: { kind: 'monthly', days: [10] }, text: 'Sáng mùng 10 âm lịch' }, where: ['Ban Thần tài'],
    offerings: { chung: [{ name: 'Hương' }, { name: 'Hoa tươi' }, { name: 'Quả tươi' }, { name: 'Nước sạch, rượu' }, { name: 'Bánh kẹo', optional: true }, VANG_MA], gianDi: GIAN_DI },
    steps: [LAU_DON, { title: 'Bày lễ vật', text: 'Bày gọn trên ban Thần tài.' }, THAP_HUONG], afterSteps: HA_LE,
    prayers: ['than-tai'], sources: [SRC.phongTuc], keywords: 'mung 10 than tai via than tai',
  },
  {
    id: 'ong-cong-ong-tao', title: 'Cúng ông Công ông Táo', group: 'tet-le', icon: 'gift', minutes: 20,
    summary: 'Tiễn Táo quân về trời ngày 23 tháng Chạp.',
    meaning: 'Theo tín ngưỡng dân gian, ngày 23 tháng Chạp Táo quân về trời báo việc trong nhà một năm. Gia đình cúng tiễn, dọn dẹp bếp núc, chuẩn bị đón Tết.',
    when: { rule: { kind: 'yearly', day: 23, month: 12 }, text: 'Trước 12 giờ trưa ngày 23 tháng Chạp' }, where: ['Bàn thờ gia tiên hoặc gian bếp'],
    offerings: {
      bac: [{ name: 'Hương, hoa, quả' }, { name: 'Cá chép sống', note: 'Thả sau lễ, nơi nước sạch', optional: true }, { name: 'Mũ ông Công, áo, hia (giấy)', optional: true }, { name: 'Mâm cơm hoặc xôi, gà', optional: true }, VANG_MA],
      nam: [{ name: 'Hương, hoa, quả' }, { name: 'Kẹo mè, chè', optional: true }, { name: 'Mâm cơm hoặc xôi, gà', optional: true }, VANG_MA],
      gianDi: GIAN_DI,
    },
    variantNote: 'Miền Bắc thường thả cá chép; miền Nam ít dùng cá chép, hay cúng kẹo mè. Theo nếp nhà mình.',
    steps: [{ title: 'Dọn bếp', text: 'Lau dọn bếp, bàn thờ trước ngày cúng.' }, { title: 'Bày lễ vật', text: 'Có thể bày ở bàn thờ gia tiên.' }, THAP_HUONG],
    afterSteps: [...HA_LE.slice(0, 2), { title: 'Thả cá chép (nếu có)', text: 'Thả nhẹ ở ao, hồ nước sạch; không ném từ trên cao, không thả túi ni lông.' }, HA_LE[2]],
    prayers: ['ong-tao', 'gia-tien-thuong'], tips: ['tha-ca-chep', 'bao-sai'], sources: [SRC.phongTuc, SRC.vanghoaVangMa],
    keywords: 'ong cong ong tao 23 thang chap tao quan tien tao quan ca chep',
  },
  {
    id: 'giao-thua', title: 'Cúng giao thừa', group: 'tet-le', icon: 'gift', minutes: 20,
    summary: 'Lễ ngoài trời đón năm mới, rồi thắp hương gia tiên trong nhà.',
    meaning: 'Đêm cuối năm, nhiều gia đình bày lễ ngoài sân để tiễn năm cũ, đón năm mới, rồi vào nhà thắp hương gia tiên.',
    when: { rule: { kind: 'last-day', month: 12 }, text: 'Đêm 30 Tết (tháng thiếu là đêm 29)' }, where: ['Ngoài sân hoặc ban công', 'Bàn thờ gia tiên'],
    offerings: { chung: [{ name: 'Hương, hoa, nến' }, { name: 'Mâm ngũ quả' }, { name: 'Bánh chưng hoặc bánh tét', optional: true }, { name: 'Trà, rượu' }, VANG_MA], gianDi: GIAN_DI },
    steps: [{ title: 'Bày lễ ngoài trời', text: 'Đặt mâm lễ nơi thoáng, xa vật dễ cháy.', fire: true }, THAP_HUONG, { title: 'Vào nhà thắp hương gia tiên', text: 'Khấn gia tiên mời về ăn Tết.' }],
    afterSteps: HA_LE, prayers: ['giao-thua', 'gia-tien-thuong'], sources: [SRC.phongTuc],
    keywords: 'giao thua 30 tet tat nien dem 30 le ngoai troi',
  },
  {
    id: 'ram-thang-gieng', title: 'Rằm tháng Giêng', group: 'tet-le', icon: 'gift', minutes: 15,
    summary: 'Tết Nguyên tiêu, lễ rằm lớn đầu năm.',
    meaning: 'Rằm tháng Giêng là rằm đầu tiên của năm. Nhiều gia đình cúng gia tiên, đi lễ chùa cầu an.',
    when: { rule: { kind: 'yearly', day: 15, month: 1 }, text: 'Ngày Rằm tháng Giêng' }, where: ['Bàn thờ gia tiên'],
    offerings: { chung: [{ name: 'Hương, hoa, quả' }, { name: 'Mâm cơm hoặc mâm chay', optional: true }, { name: 'Trà, rượu, nước' }, VANG_MA], gianDi: GIAN_DI },
    steps: [LAU_DON, { title: 'Bày lễ vật', text: 'Mâm cơm hoặc mâm chay đều được.' }, THAP_HUONG], afterSteps: HA_LE,
    prayers: ['gia-tien-thuong'], sources: [SRC.phongTuc], keywords: 'ram thang gieng nguyen tieu ram dau nam',
  },
  {
    id: 'thanh-minh', title: 'Tết Thanh minh', group: 'tet-le', icon: 'sun', minutes: 30,
    summary: 'Tảo mộ, thăm mộ phần ông bà vào tiết Thanh minh.',
    meaning: 'Tiết Thanh minh (đầu tháng 4 dương lịch), con cháu đi tảo mộ, sửa sang mộ phần, thắp hương tưởng nhớ ông bà.',
    when: { rule: { kind: 'solar-term', term: 'thanh-minh' }, text: 'Tiết Thanh minh, đầu tháng 4 dương lịch' }, where: ['Mộ phần', 'Bàn thờ gia tiên'],
    offerings: { chung: [{ name: 'Hương, hoa' }, { name: 'Quả, bánh' }, { name: 'Nước sạch' }, VANG_MA], gianDi: GIAN_DI },
    steps: [{ title: 'Dọn dẹp mộ phần', text: 'Nhổ cỏ, đắp đất, lau bia mộ.' }, THAP_HUONG], afterSteps: HA_LE,
    prayers: ['gia-tien-thuong'], sources: [SRC.phongTuc], keywords: 'thanh minh tao mo thang 3',
  },
  {
    id: 'vu-lan', title: 'Rằm tháng Bảy, Vu Lan', group: 'tet-le', icon: 'heart', minutes: 20,
    summary: 'Lễ báo hiếu cha mẹ, tổ tiên và cúng chúng sinh.',
    meaning: 'Rằm tháng Bảy là lễ Vu Lan báo hiếu. Thượng tọa Thích Đức Thiện (GHPGVN) nói trên Báo Thanh Tra năm 2020: "Phật giáo không có tháng nào gọi là tháng cô hồn." Báo hiếu thiết thực là yêu thương cha mẹ khi còn có thể.',
    when: { rule: { kind: 'yearly', day: 15, month: 7 }, text: 'Ngày Rằm tháng Bảy' }, where: ['Bàn thờ gia tiên', 'Ngoài sân (cúng chúng sinh)'],
    offerings: { chung: [{ name: 'Hương, hoa, quả' }, { name: 'Mâm cơm hoặc mâm chay' }, { name: 'Cháo, bỏng, muối gạo (cúng chúng sinh)', optional: true }], gianDi: GIAN_DI },
    steps: [LAU_DON, THAP_HUONG, { title: 'Cúng chúng sinh (nếu có)', text: 'Bày ngoài sân, lễ nhỏ. Sau lễ có thể tặng lại cho người cần.' }],
    afterSteps: HA_LE, cautions: ['Giáo hội khuyên không đốt vàng mã dịp Vu Lan, thay bằng việc thiện.'],
    prayers: ['gia-tien-thuong'], sources: [SRC.thanhTra, SRC.tb204], keywords: 'vu lan ram thang bay ram thang 7 cung chung sinh bao hieu co hon',
  },
  {
    id: 'ram-thang-muoi', title: 'Rằm tháng Mười', group: 'tet-le', icon: 'gift', minutes: 15,
    summary: 'Tết Hạ nguyên, nhiều nhà cúng cơm gạo mới.',
    meaning: 'Rằm tháng Mười (Tết Hạ nguyên, Tết cơm mới) là dịp dâng gạo mới sau mùa gặt lên gia tiên.',
    when: { rule: { kind: 'yearly', day: 15, month: 10 }, text: 'Ngày Rằm tháng Mười' }, where: ['Bàn thờ gia tiên'],
    offerings: {
      bac: [{ name: 'Hương, hoa, quả' }, { name: 'Cơm gạo mới, xôi', optional: true }, { name: 'Trà, rượu, nước' }, VANG_MA],
      nam: [{ name: 'Hương, hoa' }, { name: 'Quả tươi', note: 'Mãng cầu, dừa, đu đủ, xoài' }, { name: 'Mâm cơm hoặc mâm chay', optional: true }, VANG_MA],
      gianDi: GIAN_DI,
    },
    steps: [LAU_DON, THAP_HUONG], afterSteps: HA_LE, prayers: ['gia-tien-thuong'], sources: [SRC.phongTuc], keywords: 'ram thang muoi ha nguyen com moi',
  },
  {
    id: 'gio-thuong', title: 'Cúng giỗ', group: 'gia-tien', icon: 'users', minutes: 30, needs: ['tenNguoiMat'],
    summary: 'Tưởng nhớ người thân vào ngày mất hằng năm.',
    meaning: 'Ngày giỗ là ngày con cháu tưởng nhớ người đã khuất, sum họp, nhắc lại công ơn sinh thành.',
    when: { rule: null, text: 'Ngày mất âm lịch hằng năm (xem Sổ giỗ)' }, where: ['Bàn thờ gia tiên'],
    offerings: { chung: [{ name: 'Hương, hoa, quả' }, { name: 'Mâm cơm, món người mất thích' }, { name: 'Trà, rượu, nước' }, VANG_MA], chay: [{ name: 'Hương, hoa, quả' }, { name: 'Mâm chay' }, { name: 'Trà, nước' }], gianDi: GIAN_DI },
    steps: [LAU_DON, { title: 'Bày mâm cỗ', text: 'Có món người mất thích (ghi trong Sổ giỗ).' }, THAP_HUONG], afterSteps: HA_LE,
    prayers: ['gio'], sources: [SRC.phongTuc, SRC.thoMai], keywords: 'gio cung gio ngay gio gio dau gio het tieu tuong dai tuong',
  },
  {
    id: 'nhap-trach', title: 'Về nhà mới (nhập trạch)', group: 'nha-cua', icon: 'home', minutes: 20,
    summary: 'Báo cáo thần linh, gia tiên khi dọn về nhà mới.',
    meaning: 'Khi chuyển về nhà mới, gia đình làm lễ nhập trạch để báo với thần linh nơi ở mới và gia tiên.',
    when: { rule: null, text: 'Ngày dọn về nhà mới' }, where: ['Giữa nhà', 'Bàn thờ gia tiên'],
    offerings: { chung: [{ name: 'Hương, hoa, quả' }, { name: 'Bếp lửa nhỏ hoặc bếp điện mới', note: 'Mang vào nhà trước tiên theo tục nhiều nơi', optional: true }, { name: 'Gạo, muối, nước' }, { name: 'Xôi, gà', optional: true }, VANG_MA], gianDi: GIAN_DI },
    steps: [{ title: 'Mang đồ vào nhà', text: 'Nhiều nhà mang bát hương, gạo, nước vào trước.' }, { title: 'Bày lễ giữa nhà', text: 'Bày gọn, xa rèm.' }, THAP_HUONG],
    afterSteps: HA_LE, prayers: ['nhap-trach', 'gia-tien-thuong'], sources: [SRC.phongTuc], keywords: 'nhap trach ve nha moi chuyen nha',
  },
  {
    id: 'an-vi-bat-huong', title: 'Lập bàn thờ, an vị bát hương', group: 'nha-cua', icon: 'home', minutes: 30,
    summary: 'Lễ khi mới lập bàn thờ gia tiên hoặc thay bát hương.',
    meaning: 'Khi ra ở riêng hoặc lập bàn thờ mới, gia đình làm lễ an vị bát hương để mời gia tiên về nơi thờ mới.',
    when: { rule: null, text: 'Ngày gia đình chọn' }, where: ['Bàn thờ gia tiên'],
    offerings: { chung: [{ name: 'Bát hương sạch', note: 'Lót tro sạch hoặc cát' }, { name: 'Hương, hoa, quả' }, { name: 'Nước sạch, trà' }, { name: 'Xôi, gà hoặc mâm chay', optional: true }], gianDi: GIAN_DI },
    steps: [{ title: 'Chuẩn bị bát hương', text: 'Rửa sạch, lau khô, lót tro sạch.' }, { title: 'Đặt bát hương', text: 'Đặt ngay ngắn giữa bàn thờ.' }, THAP_HUONG],
    afterSteps: HA_LE, prayers: ['an-vi-bat-huong'], tips: ['so-nen-huong'], sources: [SRC.phongTuc], keywords: 'lap ban tho an vi bat huong ra o rieng ban tho moi',
  },
  {
    id: 'day-thang', title: 'Cúng đầy tháng', group: 'con-tre', icon: 'smile', minutes: 20, needs: ['tenEmBe'],
    summary: 'Tạ ơn Bà Mụ khi bé tròn một tháng tuổi.',
    meaning: 'Khi bé tròn tháng, gia đình cúng Mười hai Bà Mụ và gia tiên, cầu cho bé khỏe mạnh.',
    when: { rule: null, text: 'Ngày bé tròn một tháng (theo âm lịch)' }, where: ['Bàn thờ gia tiên hoặc bàn lễ riêng'],
    offerings: { chung: [{ name: 'Hương, hoa, quả' }, { name: 'Xôi, chè' }, { name: 'Bánh kẹo', optional: true }, { name: '12 phần đồ nhỏ (theo tục)', optional: true }], gianDi: GIAN_DI },
    steps: [{ title: 'Bày lễ', text: 'Bày bàn lễ Bà Mụ và thắp hương gia tiên.' }, THAP_HUONG], afterSteps: HA_LE.filter((s) => !s.fire),
    prayers: ['day-thang', 'gia-tien-thuong'], sources: [SRC.phongTuc], keywords: 'day thang ba mu em be thoi noi',
  },
  {
    id: 'khai-truong', title: 'Khai trương cửa hàng', group: 'lam-an', icon: 'shopping-bag', minutes: 20, needs: ['tenCuaHang'],
    summary: 'Lễ báo thần linh, Thần tài khi mở cửa hàng mới.',
    meaning: 'Khi mở cửa hàng, chủ hàng làm lễ báo thần linh, Thần tài, cầu làm ăn thuận lợi.',
    when: { rule: null, text: 'Sáng ngày khai trương' }, where: ['Ban Thần tài', 'Giữa cửa hàng'],
    offerings: { chung: [{ name: 'Hương, hoa, quả' }, { name: 'Xôi, gà hoặc heo quay', optional: true }, { name: 'Trà, rượu, nước' }, VANG_MA], gianDi: GIAN_DI },
    steps: [{ title: 'Bày lễ', text: 'Bày ở ban Thần tài hoặc giữa cửa hàng.' }, THAP_HUONG], afterSteps: HA_LE,
    prayers: ['khai-truong'], sources: [SRC.phongTuc], keywords: 'khai truong mo cua hang mo hang dau nam',
  },
];

export const ritualById = (id: string) => RITUALS.find((r) => r.id === id);
export const ritualsByGroup = (g: RitualGroup) => RITUALS.filter((r) => r.group === g);

/** Lễ vật theo miền, ăn chay/mặn, đầy đủ/giản dị. */
export function offeringsFor(r: Ritual, region: 'bac' | 'trung' | 'nam', diet: 'man' | 'chay', simple: boolean): Offering[] {
  if (simple) return r.offerings.gianDi;
  if (diet === 'chay' && r.offerings.chay) return r.offerings.chay;
  return r.offerings[region] ?? r.offerings.chung ?? r.offerings.bac ?? r.offerings.gianDi;
}
