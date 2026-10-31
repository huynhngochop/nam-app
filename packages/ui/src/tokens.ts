/** Sinh từ design system "Năm App" (tokens.json). Đổi màu ở đây, không viết cứng trong màn hình. */
export type SchemeName = 'light' | 'dark';
export type AppId = 'meo' | 'nhip' | 'sansang' | 'hen' | 'vi' | 'tt';

const base = {
  light: {
    bg: '#f6f4f0',
    surface: '#ffffff',
    surface2: '#efece6',
    ink: '#1c1a17',
    inkMuted: '#6b655d',
    line: '#e3ded6',
    onAccent: '#ffffff',
    positive: '#1f7a4d',
    negative: '#b42318',
    warning: '#8f6215',
    scrim: 'rgba(20,17,15,0.45)',
  },
  dark: {
    bg: '#141311',
    surface: '#1e1c1a',
    surface2: '#2a2724',
    ink: '#f2efea',
    inkMuted: '#a8a198',
    line: '#36322e',
    onAccent: '#14110f',
    positive: '#5cc48e',
    negative: '#f28b82',
    warning: '#d9ab5a',
    scrim: 'rgba(0,0,0,0.6)',
  },
} as const;

const accents: Record<AppId, Record<SchemeName, { a: string; a2: string; at: string }>> = {
  meo: { light: { a: '#a64a22', a2: '#3f7d3a', at: '#fbeee6' }, dark: { a: '#e8875c', a2: '#7cc073', at: '#3a2418' } },
  nhip: { light: { a: '#c23b2a', a2: '#1b2230', at: '#fdecea' }, dark: { a: '#f07a68', a2: '#0d1118', at: '#3a1d19' } },
  sansang: {
    light: { a: '#1e3a5f', a2: '#e0a526', at: '#e8eef6' },
    dark: { a: '#8fb4e3', a2: '#f0bf55', at: '#1b2738' },
  },
  hen: { light: { a: '#9b2c55', a2: '#8f6215', at: '#f9e8ee' }, dark: { a: '#ef8fb2', a2: '#d9ab5a', at: '#3a1a26' } },
  vi: { light: { a: '#0b6e5f', a2: '#1f7a4d', at: '#e2f3ef' }, dark: { a: '#4fd1b8', a2: '#5cc48e', at: '#12302b' } },
  tt: { light: { a: '#6e3b1f', a2: '#b8862b', at: '#f6ece0' }, dark: { a: '#e0b07a', a2: '#d9ab5a', at: '#33241a' } },
};

/** Chế độ khấn của Thành Tâm luôn tối ấm (TT-10). */
export const ttNight = { bg: '#1a1410', ink: '#f3e6d3', inkMuted: '#bfa98c', field: '#e9c48c', gold: '#d9ab5a', soft: 'rgba(255,255,255,0.08)', now: 'rgba(217,171,90,0.16)' };

/** Màn tập trung của Nhịp luôn tối. */
export const night = {
  bg: '#1b2230',
  bgDeep: '#0d1118',
  ink: '#f2efea',
  inkMuted: '#9aa3b5',
  soft: 'rgba(255,255,255,0.08)',
};
export const proAmber = '#e0a526';

export function palette(app: AppId, scheme: SchemeName) {
  return { ...base[scheme], ...accents[app][scheme] };
}
export type Palette = ReturnType<typeof palette>;

export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const;

export const type = {
  numeral: { fontSize: 40, lineHeight: 46, fontFamily: fonts.bold, letterSpacing: -1 },
  display: { fontSize: 28, lineHeight: 34, fontFamily: fonts.bold, letterSpacing: -0.5 },
  title: { fontSize: 20, lineHeight: 26, fontFamily: fonts.bold },
  headline: { fontSize: 16, lineHeight: 22, fontFamily: fonts.semibold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: fonts.medium },
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
} as const;
export type TypeVariant = keyof typeof type;
