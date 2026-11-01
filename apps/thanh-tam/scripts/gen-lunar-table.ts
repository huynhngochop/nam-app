/**
 * Sinh bảng âm lịch tính sẵn 1900–2100 từ thuật toán thiên văn (src/calendar/astro.ts).
 * Chạy: npx tsx apps/thanh-tam/scripts/gen-lunar-table.ts
 * Kết quả: src/calendar/lunarData.ts (≈ 1 KB dữ liệu). CI so lại bảng này với thuật toán và bảng vàng.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLunarTable } from '../src/calendar/buildTable';

const t = buildLunarTable();
const out = `/* Sinh tự động bởi scripts/gen-lunar-table.ts — KHÔNG sửa tay. */
/** JDN của mùng 1 tháng Giêng năm âm ${t.firstYear}. */
export const FIRST_MONTH_JD = ${t.firstMonthJd};
export const FIRST_LUNAR_YEAR = ${t.firstYear};
/** Mỗi ký tự hex = 4 tháng liên tiếp; bit 1 = tháng đủ (30 ngày), 0 = tháng thiếu (29). */
export const MONTH_BITS = '${t.monthBits}';
export const MONTH_COUNT = ${t.monthCount};
/** Tháng nhuận của từng năm âm từ ${t.firstYear} (0 = không nhuận). Mỗi ký tự là một số hex 0–c. */
export const LEAP_MONTHS = '${t.leapMonths}';
/** Ngày Thanh minh trong tháng 4 dương lịch của từng năm từ ${t.firstYear}, 2 chữ số mỗi năm. */
export const THANH_MINH = '${t.thanhMinh}';
`;
writeFileSync(join(__dirname, '../src/calendar/lunarData.ts'), out);
console.log(`Đã ghi ${t.monthCount} tháng, ${t.leapMonths.length} năm.`);
