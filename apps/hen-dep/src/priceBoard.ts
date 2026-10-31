import { AiUnavailableError, callAi, fold } from '@nam/core';

/**
 * Tách bảng giá thành danh sách dịch vụ (HD-C17/18).
 * Văn bản lấy từ OCR trên máy (khi tích hợp ML Kit/Vision) hoặc người dùng dán vào.
 * Có cổng AI → nhờ AI tách; không có → bộ tách theo quy tắc chạy trên máy.
 */
export type ParsedService = {
  name: string;
  price: number | null;
  durationMin: number;
  durationGuessed: boolean;
  group: string;
};

const GUESS: { re: RegExp; min: number; group: string }[] = [
  { re: /nhuom|tay|highlight|balayage/, min: 120, group: 'Tóc' },
  { re: /uon|duoi|ep/, min: 150, group: 'Tóc' },
  { re: /goi/, min: 45, group: 'Gội dưỡng' },
  { re: /cat/, min: 30, group: 'Tóc' },
  { re: /nail|son|gel|mong|ve mong/, min: 60, group: 'Nail' },
  { re: /massage|spa|cham soc da|facial/, min: 60, group: 'Spa' },
  { re: /trang diem|makeup/, min: 60, group: 'Trang điểm' },
];

/** "180K" | "180.000" | "180,000đ" | "1tr2" → số VND */
export function parsePrice(raw: string): number | null {
  const s = fold(raw).replace(/\s/g, '');
  const tr = s.match(/(\d+)(tr|trieu)(\d+)?/);
  if (tr) return Number(tr[1]) * 1e6 + (tr[3] ? Number(tr[3].padEnd(3, '0')) * 1000 : 0);
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
    const m = l.match(/^(.*?)[\s.:\-–…]*((?:\d[\d.,]*\s*(?:k|K|đ|d|vnd|VND|tr|triệu)?)(?:\s*\d+)?)\s*$/);
    const name = (m ? m[1] : l).replace(/[.:\-–…]+$/, '').trim();
    if (!name || /^bang gia|^menu|^gia$/.test(fold(name))) continue;
    const price = m ? parsePrice(m[2]) : null;
    const g = GUESS.find((x) => x.re.test(fold(name)));
    const dur = l.match(/(\d+)\s*(phut|p|')/i);
    out.push({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      price,
      durationMin: dur ? Number(dur[1]) : (g?.min ?? 45),
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
