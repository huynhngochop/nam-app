import type { IconName } from '@nam/ui';

export type TxKind = 'expense' | 'income' | 'transfer';
export type TxSource = 'auto' | 'manual' | 'import';
export type TxStatus = 'confirmed' | 'pending';

/** Một giao dịch. amount luôn dương (đồng); kind quyết định dấu. Lưu trong SQLite (src/db.ts). */
export type Tx = {
  id: string;
  amount: number;
  kind: TxKind;
  categoryId: string | null;
  merchant: string;
  note: string;
  at: number;
  account: string | null;
  source: TxSource;
  status: TxStatus;
  /** Văn bản thông báo gốc — chỉ ở trên máy. */
  raw: string | null;
  fundId: string | null;
  /** Đánh dấu nghi trùng / chuyển nội bộ chờ người dùng xem (VG-19). */
  flag: 'dup' | 'transfer' | null;
  /** Mã giao dịch liên quan (bản trùng hoặc chân kia của chuyển khoản). */
  pairId: string | null;
  createdAt: number;
};

export type Category = { id: string; name: string; icon: IconName; kind: 'expense' | 'income'; builtin?: boolean };
export type Rule = { id: string; keyword: string; categoryId: string };
export type Fund = { id: string; name: string; icon: IconName; goal: number; saved: number; deadline: number | null; remindPayday: boolean; createdAt: number };
/** Thông báo chưa đọc được (VG-18) — chờ người dùng điền một lần. */
export type Unparsed = { id: string; text: string; app: string | null; at: number };

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Ăn uống', icon: 'coffee', kind: 'expense', builtin: true },
  { id: 'home', name: 'Nhà & hóa đơn', icon: 'home', kind: 'expense', builtin: true },
  { id: 'shop', name: 'Mua sắm', icon: 'shopping-bag', kind: 'expense', builtin: true },
  { id: 'move', name: 'Đi lại', icon: 'navigation', kind: 'expense', builtin: true },
  { id: 'health', name: 'Sức khỏe', icon: 'heart', kind: 'expense', builtin: true },
  { id: 'study', name: 'Học tập', icon: 'book-open', kind: 'expense', builtin: true },
  { id: 'family', name: 'Gia đình', icon: 'users', kind: 'expense', builtin: true },
  { id: 'fun', name: 'Giải trí', icon: 'film', kind: 'expense', builtin: true },
  { id: 'phone', name: 'Điện thoại & mạng', icon: 'smartphone', kind: 'expense', builtin: true },
  { id: 'gift', name: 'Quà & hiếu hỉ', icon: 'gift', kind: 'expense', builtin: true },
  { id: 'other', name: 'Khác', icon: 'more-horizontal', kind: 'expense', builtin: true },
  { id: 'salary', name: 'Lương', icon: 'briefcase', kind: 'income', builtin: true },
  { id: 'bonus', name: 'Thưởng', icon: 'award', kind: 'income', builtin: true },
  { id: 'side', name: 'Thu nhập thêm', icon: 'trending-up', kind: 'income', builtin: true },
  { id: 'in_other', name: 'Thu khác', icon: 'plus-circle', kind: 'income', builtin: true },
];

export const FUND_ICONS: IconName[] = ['map-pin', 'shield', 'smartphone', 'heart', 'home', 'gift', 'book-open', 'truck'];
