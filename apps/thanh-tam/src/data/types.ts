import type { IconName } from '@nam/ui';

export type Region = 'bac' | 'trung' | 'nam';
export type Diet = 'man' | 'chay';
export type RitualGroup =
  'hang-thang' | 'tet-le' | 'gia-tien' | 'nha-cua' | 'con-tre' | 'lam-an' | 'di-le' | 'kinh-tung';

export type LunarRule =
  | { kind: 'monthly'; days: number[] }
  | { kind: 'yearly'; day: number; month: number }
  | { kind: 'last-day'; month: number }
  | { kind: 'solar-term'; term: 'thanh-minh' };

export type Offering = { name: string; note?: string; optional?: boolean; avoid?: boolean };
export type Step = { title: string; text: string; fire?: boolean };
export type SourceRef = { kind: 'sach-co' | 'giao-hoi' | 'bao-chi' | 'nghien-cuu'; title: string; url?: string };

export type Ritual = {
  id: string;
  title: string;
  group: RitualGroup;
  icon: IconName;
  summary: string;
  meaning: string;
  when: { rule: LunarRule | null; text: string };
  where: string[];
  minutes: number;
  /** Lễ vật theo miền; thiếu miền thì dùng 'chung'. Giản dị dùng chung mọi miền. */
  offerings: {
    chung?: Offering[];
    bac?: Offering[];
    trung?: Offering[];
    nam?: Offering[];
    chay?: Offering[];
    gianDi: Offering[];
  };
  variantNote?: string;
  steps: Step[];
  afterSteps: Step[];
  cautions?: string[];
  prayers: string[];
  tips?: string[];
  sources: SourceRef[];
  keywords: string;
  /** Lễ cần điền thêm thông tin riêng (tên người mất, tên cửa hàng, tên bé). */
  needs?: ('tenNguoiMat' | 'tenCuaHang' | 'tenEmBe')[];
};

export type PrayerField =
  | 'tinChu'
  | 'diaChi'
  | 'hoGiaTien'
  | 'ngayAm'
  | 'thangAm'
  | 'namCanChi'
  | 'tenNguoiMat'
  | 'quanHe'
  | 'tenCuaHang'
  | 'tenEmBe';
/** Văn khấn: đoạn cách nhau bằng dòng trống; ô điền {tinChu}; lặp "[x3]" ở cuối dòng. */
export type Prayer = { id: string; title: string; deity: string; body: string; short?: string; minutes: number };

export type Sign = {
  id: string;
  title: string;
  area: 'ban-tho' | 'trong-nha' | 'co-the' | 'giac-mo';
  sub: string;
  folk: string;
  practical: string;
  advice: string[];
  seekHelp?: 'bac-si' | 'nguoi-than';
  fire?: boolean;
  safetyFirst?: string;
  quote?: { text: string; by: string };
  sources: SourceRef[];
  keywords: string;
};
export type Tip = {
  id: string;
  title: string;
  summary: string;
  body: string[];
  fire?: string;
  usedIn: string[];
  sources: SourceRef[];
  keywords: string;
};
