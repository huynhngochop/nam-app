import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AppId, Palette, palette, SchemeName } from './tokens';

export type ThemePref = 'system' | 'light' | 'dark';

type ThemeCtx = { app: AppId; scheme: SchemeName; c: Palette };
const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ app, pref = 'system', children }: { app: AppId; pref?: ThemePref; children: React.ReactNode }) {
  const sys = useColorScheme();
  const scheme: SchemeName = pref === 'system' ? (sys === 'dark' ? 'dark' : 'light') : pref;
  const value = useMemo(() => ({ app, scheme, c: palette(app, scheme) }), [app, scheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme phải nằm trong ThemeProvider');
  return v;
}
