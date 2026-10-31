import { AiUnavailableError, callAi, fold } from '@nam/core';

/**
 * Tách bảng giá thành danh sách dịch vụ (HD-C17/18).
 * Văn bản lấy từ OCR trên máy (khi tích hợp ML Kit/Vision) hoặc người dùng dán vào.
 * Có cổng AI → nhờ AI tách; không có → bộ tách theo quy tắc chạy trên máy.
 */
export type ParsedService = { name: string; price: number | null; durationMin: number; durationGuessed: boolean; group: string };

const GUESS: { re: RegExp; min: number; group: string }[] = [
  // So khớp nguyên từ (\b) trên chuỗi đã bỏ dấu: "duong" (dưỡng) không được khớp "uon" (uốn) — lỗi H3.
  { re: /\b(nhuom|tay|highlight|balayage)\b/, min: 120, group: 'Tóc' },
  { re: /\b(uon|duoi|ep)\b/, min: 150, group: 'Tóc' },
  { re: /\bgoi\b/, min: 45, group: 'Gội dưỡng' },
  { re: /\bcat\b/, min: 30, group: 'Tóc' },
  { re: /\b(nail|son|gel|mong)\b/, min: 60, group: 'Nail' },
  { re: /\b(massage|spa|facial)\b|cham soc da/, min: 60, group: 'Spa' },
  { re: /trang diem|\bmakeup\b/, min: 60, group: 'Trang điểm' },
];

/** Thời lượng trong dòng bảng giá: "150 phút", "45p", "30'". Không khớp "ph" của từ khác ("phòng"). */
const DURATION = /(\d+)\s*(?:phút|phut|ph|p|')(?![a-zA-Zà-ỹÀ-Ỹđ])/i;

/** "180K" | "180.000" | "180,000đ" | "1tr2" | "1,5tr" | "2,5 triệu" → số VND */
export function parsePrice(raw: string): number | null {
  const s = fold(raw).replace(/\s/g, '');
  // Phần thập phân trước "tr" phải nằm trong cùng nhóm số, nếu không "1,5tr" bị đọc thành 5 triệu (lỗi H1).
  const tr = s.match(/(\d+(?:[.,]\d+)?)(tr|trieu)(\d+)?/);
  if (tr) {
    if (/[.,]/.test(tr[1])) return Math.round(Number(tr[1].replace(',', '.')) * 1e6);
    return Number(tr[1]) * 1e6 + (tr[3] ? Number(tr[3].padEnd(3, '0')) * 1000 : 0);
  }
  const k = s.match(/(\d+(?:[.,]\d+)?)k/);
  if (k) return Math.round(Number(k[1].replace(',', '.')) * 1000);
  const num = s.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,})/);
  if (num) return Number(num[1].replace(/[.,]/g, ''));
  return null;
}

export function parseLocally(text: string): ParsedService[] {
  const out: ParsedService[] = [];
  for (const line of text.split(/\n+/)) {
    const l = line.trim();
    if (l.length < 3) continue;
    // Tách thời lượng ra trước, vì nó có thể đứng sau giá ("Uốn lạnh 800K 150 phút") — lỗi H2.
    const dur = l.match(DURATION);
    const rest = (dur ? l.replace(dur[0], ' ') : l).replace(/[\s\-–:.…]+$/, '').trim();
    const m = rest.match(/^(.*?)[\s.:\-–…]*((?:\d[\d.,]*\s*(?:k|K|đ|d|vnd|VND|tr|triệu)?)(?:\s*\d+)?)\s*$/);
    const name = (m ? m[1] : rest).replace(/[.:\-–…]+$/, '').replace(/\s+/g, ' ').trim();
    if (!name || /^bang gia|^menu|^gia$/.test(fold(name))) continue;
    const price = m ? parsePrice(m[2]) : null;
    const g = GUESS.find((x) => x.re.test(fold(name)));
    out.push({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      price,
      durationMin: dur ? Number(dur[1]) : g?.min ?? 45,
      durationGuessed: !dur,
      group: g?.group ?? 'Khác',
    });
  }
  return out.slice(0, 40);
}

export async function parsePriceBoard(text: string): Promise<{ services: ParsedService[]; viaAi: boolean }> {
  try {
    const r = await callAi<{ services: ParsedService[] }>('price-board', { text });
    return { services: r.services, viaAi: true };
  } catch (e) {
    if (e instanceof AiUnavailableError) return { services: parseLocally(text), viaAi: false };
    throw e;
  }
}
