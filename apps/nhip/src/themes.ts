/** Giao diện vòng hẹn giờ (Cửa hàng → Giao diện). Miễn phí, chỉ đổi màu vòng ở màn Hẹn giờ và phiên tập trung. */
export type RingThemeId = 'default' | 'forest' | 'ocean' | 'sunset' | 'lavender';
export type RingTheme = { id: RingThemeId; name: string; focus: string; rest: string };

export const RING_THEMES: RingTheme[] = [
  { id: 'default', name: 'Mặc định', focus: '#f07a68', rest: '#5cc48e' },
  { id: 'forest', name: 'Rừng thông', focus: '#4fae7a', rest: '#9bd17f' },
  { id: 'ocean', name: 'Biển đêm', focus: '#4a9fe0', rest: '#6fd3c8' },
  { id: 'sunset', name: 'Hoàng hôn', focus: '#f0a040', rest: '#e8708a' },
  { id: 'lavender', name: 'Oải hương', focus: '#a58bf0', rest: '#7fc4e8' },
];

export const ringTheme = (id: RingThemeId | undefined) => RING_THEMES.find((t) => t.id === id) ?? RING_THEMES[0];
