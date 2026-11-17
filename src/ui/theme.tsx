import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import palette from './website-palette.json';

export type Tone = 'blue' | 'mint' | 'coral' | 'amber' | 'orchid';
export const routeTones = {
  Overview: 'blue',
  Transactions: 'coral',
  Reimbursements: 'amber',
  Investments: 'orchid',
  Assistant: 'orchid',
  Settings: 'mint',
} as const;
function theme(dark: boolean) {
  const p = dark ? palette.dark : palette.light;
  return {
    dark,
    palette: p,
    canvas: p.canvas,
    canvasEnd: p['canvas-end'],
    canvasOrchid: p['canvas-orchid'],
    canvasPeach: p['canvas-peach'],
    canvasMint: p['canvas-mint'],
    surface: p.surface,
    surfaceEnd: p['surface-end'],
    ink: p.ink,
    muted: p.muted,
    line: p.line,
    strongLine: p['strong-line'],
    accent: p.accent,
    accentTop: p['accent-top'],
    accentHover: p['accent-hover'],
    accentText: p['accent-text'],
    positive: p.positive,
    danger: p['rose-ink'],
    control: p.control,
    hover: p.hover,
    soft: p.soft,
    focus: p.focus,
    rim: p.rim,
    flowIn: p['flow-in'],
    flowOut: p['flow-out'],
    blue: p.accent,
    mint: p['tone-mint'],
    coral: p['tone-coral'],
    amber: p['tone-amber'],
    orchid: p['tone-orchid'],
    blueWash: p['wash-blue'],
    mintWash: p['wash-mint'],
    coralWash: p['wash-rose'],
    amberWash: p['wash-peach'],
    orchidWash: p['wash-orchid'],
    navStart: p['nav-start'],
    navEnd: p['nav-end'],
    navInk: p['nav-ink'],
    menuShadow: p['menu-shadow'],
  };
}
export type Theme = ReturnType<typeof theme>;
const light = theme(false),
  dark = theme(true);
const Context = createContext(light);
const ToneContext = createContext<Tone>('blue');
export const RouteToneProvider = ToneContext.Provider;
export const useRouteTone = () => useContext(ToneContext);
export const useTheme = () => useContext(Context);
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <Context.Provider value={useColorScheme() === 'dark' ? dark : light}>
      {children}
    </Context.Provider>
  );
}
export const wash = (t: Theme, tone: Tone) => t[`${tone}Wash`];
export const alpha = (hex: string, opacity: number) =>
  hex.slice(0, 7) +
  Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
export function blend(a: string, b: string, weight: number) {
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (
    '#' +
    rgb(a)
      .map((v, i) =>
        Math.round(v * (1 - weight) + rgb(b)[i] * weight)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
