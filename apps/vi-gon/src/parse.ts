import { fold } from '@nam/core';
import { Rule } from './types';

/**
 * Đọc thông báo biến động số dư / SMS ngân hàng — chạy hoàn toàn trên máy, không gửi đi đâu.
 * Hỗ trợ các dạng thường gặp:
 *   "TK 1234xxx5678 -85,000VND 12:31 29/10/26 SD: 1,234,000VND ND: COM TAM BA GHIEN"
 *   "TK *1234 −85.000 VND lúc 12:31. ND: COM TAM BA GHIEN"
 *   "Số dư TK VCB 0011 -50,000 VND lúc 29-10-2026 08:12:05. Số dư 2,345,000 VND. Ref MBVCB.123.CA PHE"
 *   "+18,500,000 VND ... ND: LUONG THANG 10"
 */
export type Parsed = {
  amount: number;
  kind: 'expense' | 'income';
  at: number | null;
  account: string | null;
  merchant: string;
  balance: number | null;
};

// Dấu +/− không được đứng ngay sau chữ số (phần đuôi số tài khoản, ngày). Sau chữ thì được: "PS-50,000", "GD-50,000".
const MONEY = /(?:^|[^0-9])([+\-−–])\s*([\d]{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]00)?\s*(?:VND|VNĐ|đ|d\b|dong)?/i;
// Ngày (29-10-2026, 29/10/26, 30-10) và giờ (08:12:05) — bỏ đi trước khi tìm số tiền (lỗi V1).
// (?![.,]\d): không nuốt phần đầu của số tiền liền sau ("29-10-50,000").
const DATES = /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b(?![.,]\d)/g;
const TIMES = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g;
const BAL = /(?:SD|S[ốo] d[ưu]|so du|balance)\s*[:.]?\s*([\d.,]+)/i;

const toNumber = (s: string) => Number(s.replace(/[.,](?=\d{3}\b)/g, '').replace(/[.,]/g, ''));

export function parseBankText(text: string, now = new Date()): Parsed | null {
  if (!text || text.length < 8) return null;
  const t = text.replace(/\s+/g, ' ').trim();

  // Bỏ phần số dư trước khi tìm số tiền giao dịch (số dư không có dấu +/− nhưng tránh nhầm).
  const balM = t.match(BAL);
  const withoutBal = (balM ? t.replace(balM[0], ' ') : t).replace(DATES, ' ').replace(TIMES, ' ');
  const m = withoutBal.match(MONEY);
  let amount: number | null = null;
  let kind: Parsed['kind'] = 'expense';
  if (m) {
    amount = toNumber(m[2]);
    kind = m[1] === '+' ? 'income' : 'expense';
  } else {
    // Dạng không dấu: "Giao dich: 50,000 VND" + từ khóa ghi nợ/ghi có
    const n = withoutBal.match(/(?:GD|giao dich|so tien|PS)\s*[:.]?\s*([\d.,]{4,})\s*(?:VND|đ)/i);
    if (n) {
      amount = toNumber(n[1]);
      kind = /ghi co|nhan|\bcredit\b|\+/i.test(fold(t)) ? 'income' : 'expense';
    }
  }
  if (!amount || !Number.isFinite(amount) || amount <= 0 || amount > 50_000_000_000) return null;

  // Thời gian
  let at: number | null = null;
  const time = t.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  const date = t.match(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (time || date) {
    const d = new Date(now);
    if (date) {
      const day = Number(date[1]);
      const mon = Number(date[2]) - 1;
      let yr = date[3] ? Number(date[3]) : now.getFullYear();
      if (yr < 100) yr += 2000;
      if (day >= 1 && day <= 31 && mon >= 0 && mon <= 11) d.setFullYear(yr, mon, day);
    }
    if (time) d.setHours(Number(time[1]), Number(time[2]), 0, 0);
    at = d.getTime() > now.getTime() + 3600000 ? now.getTime() : d.getTime();
  }

  // Tài khoản: lấy 4 số cuối
  const acc = t.match(/(?:TK|tai khoan|tài khoản|account|A\/C)\s*[:.]?\s*[A-Z]*\s*\*?([\dx*]{3,})/i);
  const account = acc ? acc[1].replace(/[^\d]/g, '').slice(-4) || null : null;

  // Nội dung
  let merchant = '';
  const nd = t.match(/\b(?:ND|N[ộo]i dung|noi dung|Ref|ndck|Desc)\s*[:.]?\s*(.+)$/i);
  if (nd) merchant = cleanMerchant(nd[1]);

  return { amount, kind, at, account, merchant, balance: balM ? toNumber(balM[1]) : null };
}

/** "MBVCB.12345.COM TAM BA GHIEN.CT tu 0011..." → "Com tam ba ghien" */
export function cleanMerchant(s: string): string {
  let x = s
    .replace(/\b(MBVCB|IBFT|FT\d+|TRACE\s*\d+|REF\s*\S+|CT tu\s*\S+.*|GD\s*\d+)\b/gi, ' ')
    .replace(/\b\d{6,}\b/g, ' ')
    .replace(/[._]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  x = x.replace(/^(thanh toan|tt|chuyen tien|chuyen khoan|ck)\s+/i, '').trim();
  if (x.length > 48) x = x.slice(0, 48).trim();
  return x ? x.charAt(0).toUpperCase() + x.slice(1).toLowerCase() : '';
}

const BUILTIN: { re: RegExp; cat: string }[] = [
  { re: /\b(luong|salary|payroll)\b/, cat: 'salary' },
  { re: /\b(thuong|bonus)\b/, cat: 'bonus' },
  { re: /\b(grab|be |gojek|xanh sm|taxi|xang|petrolimex|gui xe|vetc|epass)\b/, cat: 'move' },
  {
    re: /\b(com|pho|bun|banh mi|cafe|ca phe|coffee|highlands|phuc long|tra sua|katinat|circle k|ga ran|kfc|lotteria|nha hang|quan an|an uong|shopeefood|grabfood)\b/,
    cat: 'food',
  },
  {
    re: /\b(dien luc|evn|tien dien|tien nuoc|cap nuoc|nuoc sach|internet|fpt telecom|vnpt|tien nha|thue nha|chung cu|quan ly)\b/,
    cat: 'home',
  },
  { re: /\b(viettel|mobifone|vinaphone|nap tien dt|nap dien thoai|data|topup)\b/, cat: 'phone' },
  { re: /\b(shopee|lazada|tiki|sendo|tiktok shop|bach hoa|winmart|coopmart|big c|go!|aeon|uniqlo)\b/, cat: 'shop' },
  { re: /\b(nha thuoc|pharmacity|long chau|benh vien|phong kham|nha khoa)\b/, cat: 'health' },
  { re: /\b(hoc phi|truong|khoa hoc|sach|fahasa)\b/, cat: 'study' },
  { re: /\b(netflix|spotify|youtube|cgv|lotte cinema|galaxy|game|steam)\b/, cat: 'fun' },
  { re: /\b(dam cuoi|mung|qua|sinh nhat|hieu)\b/, cat: 'gift' },
];

/** Quy tắc người dùng trước, rồi bộ từ khóa sẵn có. confident = có thể lưu mà không cần hỏi. */
export function categorize(
  merchant: string,
  kind: 'expense' | 'income',
  rules: Rule[],
): { categoryId: string; confident: boolean } {
  const f = ` ${fold(merchant)} `;
  const up = merchant.toUpperCase();
  const r = rules.find(
    (x) => up.includes(x.keyword) || f.includes(` ${fold(x.keyword)} `) || f.includes(fold(x.keyword)),
  );
  if (r) return { categoryId: r.categoryId, confident: true };
  const b = BUILTIN.find((x) => x.re.test(f));
  if (b) {
    const isIncomeCat = b.cat === 'salary' || b.cat === 'bonus';
    if (isIncomeCat === (kind === 'income')) return { categoryId: b.cat, confident: false };
  }
  return { categoryId: kind === 'income' ? 'in_other' : 'other', confident: false };
}

/** Từ khóa gợi ý để tạo quy tắc từ nơi chi: 2 từ đầu, viết hoa. */
export function ruleKeyword(merchant: string) {
  return fold(merchant).toUpperCase().split(' ').filter(Boolean).slice(0, 2).join(' ');
}

/** Nhận diện dấu hiệu định dạng (VG-18): các từ không phải số ở đầu thông báo. */
export function signatureOf(text: string) {
  return fold(text)
    .replace(/[\d.,:+\-−/]+/g, '#')
    .replace(/\s+/g, ' ')
    .slice(0, 24);
}
