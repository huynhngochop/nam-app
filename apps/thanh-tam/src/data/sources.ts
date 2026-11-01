import type { SourceRef } from './types';

export const SRC = {
  phongTuc: { kind: 'sach-co', title: 'Việt Nam phong tục, Phan Kế Bính (1915)' },
  thoMai: { kind: 'sach-co', title: 'Thọ Mai gia lễ' },
  tb204: {
    kind: 'giao-hoi',
    title: 'Thông bạch 204/TB-HĐTS (2024), Hội đồng Trị sự GHPGVN',
    url: 'https://tienphong.vn/giao-hoi-yeu-cau-khong-thu-tien-mua-le-dot-vang-ma-dip-le-vu-lan-post1655330.tpo',
  },
  cv033: {
    kind: 'giao-hoi',
    title: 'Công văn 033/CV-HĐTS (2019) của GHPGVN về dâng sao giải hạn',
    url: 'https://giaoduc.net.vn/gdvn-post195837.gd',
  },
  vanghoaVangMa: {
    kind: 'bao-chi',
    title: 'Báo Văn Hóa: Bộ VHTTDL với chủ trương bỏ đốt vàng mã',
    url: 'https://baovanhoa.vn/van-hoa/bo-vhttdl-quyet-liet-voi-chu-truong-bo-dot-vang-ma-41674.html',
  },
  thanhTra: {
    kind: 'bao-chi',
    title: 'Báo Thanh Tra (2020): Thượng tọa Thích Đức Thiện',
    url: 'https://thanhtra.com.vn/an-sinh-AFA9C5670/thuong-toa-thich-duc-thien-phat-giao-khong-co-thang-nao-goi-la-thang-co-hon-7B9BB1CB.html',
  },
  giacNgo: { kind: 'bao-chi', title: 'Báo Giác Ngộ' },
} satisfies Record<string, SourceRef>;

/** Danh sách nguồn chính cho TT-24. */
export const MAIN_SOURCES: SourceRef[] = [
  SRC.phongTuc,
  SRC.thoMai,
  SRC.tb204,
  SRC.cv033,
  { kind: 'bao-chi', title: 'Báo Giác Ngộ, Báo Văn Hóa, Báo Thanh Tra' },
];
export const SOURCE_KIND_LABEL = {
  'sach-co': 'Sách cổ',
  'giao-hoi': 'Giáo hội',
  'bao-chi': 'Báo chí',
  'nghien-cuu': 'Nghiên cứu',
} as const;
