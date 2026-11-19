/** Định dạng tiếng Việt theo Chuẩn spec › 7. Tiền luôn là số nguyên VND. */
export function groupDigits(n: number): string {
  const digits = Math.round(Math.abs(n)).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
/** 180000 → "180.000đ"; signed → "−85.000đ" / "+18.500.000đ" */
export function vnd(n: number, opts: { signed?: boolean } = {}): string {
  const sign = n < 0 ? '−' : opts.signed && n > 0 ? '+' : '';
  return `${sign}${groupDigits(n)}đ`;
}
/** 3100000 → "3,1 tr"; 1250000000 → "1,25 tỷ"; 520000 → "520k" */
export function shortMoney(n: number): string {
  const absolute = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  const dec = (x: number) => (Math.round(x * 100) / 100).toString().replace('.', ',');
  if (absolute >= 1e9) return `${sign}${dec(absolute / 1e9)} tỷ`;
  if (absolute >= 1e6) return `${sign}${dec(absolute / 1e6)} tr`;
  if (absolute >= 1e3) return `${sign}${Math.round(absolute / 1e3)}k`;
  return `${sign}${absolute}`;
}
export function decimalVi(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',');
}
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WD_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
export const weekdayShort = (d: Date) => WD[d.getDay()];
export const weekdayLong = (d: Date) => WD_LONG[d.getDay()];
/** "T7, 2/11" */
export const shortDate = (d: Date) => `${WD[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
export const dayMonth = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const mmss = (sec: number) =>
  `${pad(Math.floor(Math.max(0, sec) / 60))}:${pad(Math.floor(Math.max(0, sec) % 60))}`;
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function minutesLabel(min: number) {
  const hours = Math.floor(min / 60);
  const minutes = Math.round(min % 60);
  if (hours && minutes) return `${hours} giờ ${minutes} phút`;
  if (hours) return `${hours} giờ`;
  return `${minutes} phút`;
}
export function relativeTime(iso: string | number, now = Date.now()) {
  const ms = typeof iso === 'number' ? iso : Date.parse(iso);
  const seconds = Math.round((now - ms) / 1000);
  if (seconds < 60) return 'vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  const days = Math.floor(seconds / 86400);
  if (days === 1) return 'hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return dayMonth(new Date(ms));
}
/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}
export function greeting(d = new Date()) {
  const hour = d.getHours();
  return hour >= 5 && hour < 11 ? 'Chào buổi sáng' : hour >= 11 && hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
}
