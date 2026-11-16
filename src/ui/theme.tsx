import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  dark: false,
  canvas: '#f1f3f8',
  canvasEnd: '#e9edf8',
  surface: '#ffffff',
  surfaceEnd: '#edf2fa',
  ink: '#182033',
  muted: '#526079',
  line: '#e0e5ee',
  strongLine: '#ccd4e2',
  accent: '#234fca',
  accentText: '#ffffff',
  positive: '#146c54',
  danger: '#a03347',
  control: '#edf0f6',
  blue: '#234fca',
  mint: '#146e5b',
  coral: '#9b4458',
  amber: '#88591c',
  orchid: '#7046ab',
  blueWash: '#cedffc',
  mintWash: '#c1eadf',
  coralWash: '#f6d0df',
  amberWash: '#f9d8c3',
  orchidWash: '#dfcef8',
  navStart: '#dfccff',
  navEnd: '#a9ddd0',
};
type Theme = { [K in keyof typeof light]: (typeof light)[K] };
const dark: Theme = {
  dark: true,
  canvas: '#10141f',
  canvasEnd: '#1b2434',
  surface: '#1e2431',
  surfaceEnd: '#253149',
  ink: '#f2f5ff',
  muted: '#c3ccdf',
  line: '#333c50',
  strongLine: '#4b5871',
  accent: '#a9bfff',
  accentText: '#101e43',
  positive: '#a0e2c5',
  danger: '#ffbac6',
  control: '#2a3346',
  blue: '#a9bfff',
  mint: '#9ce5d1',
  coral: '#f2a9b6',
  amber: '#f3c28a',
  orchid: '#d1b3fa',
  blueWash: '#344b73',
  mintWash: '#285759',
  coralWash: '#61354c',
  amberWash: '#62412c',
  orchidWash: '#503970',
  navStart: '#553c79',
  navEnd: '#1c565b',
};
export type Tone = 'blue' | 'mint' | 'coral' | 'amber' | 'orchid';
const Context = createContext(light);
export const useTheme = () => useContext(Context);
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <Context.Provider value={useColorScheme() === 'dark' ? dark : light}>
      {children}
    </Context.Provider>
  );
}
export const wash = (theme: Theme, tone: Tone) => theme[`${tone}Wash`];
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
