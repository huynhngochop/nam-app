/**
 * Phân quyền theo route (lỗi W3). Ẩn tab chưa đủ: nhân viên vẫn mở được màn của chủ tiệm bằng đường dẫn / deep link.
 * Trả về đường dẫn cần chuyển tới, hoặc null nếu được phép.
 */
export type Role = 'owner' | 'staff';

/** Màn chỉ dành cho chủ tiệm (segment đầu tiên sau khi bỏ group như "(tabs)"). */
export const OWNER_ONLY = new Set([
  'revenue',
  'shop',
  'settings',
  'billing',
  'services',
  'staff',
  'campaign',
  'campaign-ai',
  'link',
  'scan',
  'setup',
]);

export function redirectFor(segments: string[], role: Role | null): string | null {
  const first = segments.find((s) => !s.startsWith('('));
  if (!role) return first && first !== 'auth' ? '/auth' : null;
  if (role === 'staff' && first && OWNER_ONLY.has(first)) return '/(tabs)/calendar';
  return null;
}
