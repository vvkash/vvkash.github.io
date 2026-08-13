/**
 * Terminal colour schemes.
 *
 * These are real palettes people run in iTerm2, not invented neon. Each one
 * supplies a background, a foreground and the ANSI colours the output actually
 * uses, so `theme <name>` recolours everything consistently.
 */
export type Theme = {
  name: string;
  /** Terminal background. */
  bg: string;
  /** Title bar. */
  chrome: string;
  /** Window border and title bar hairline. */
  border: string;
  /** Default text. */
  fg: string;
  /** Muted text: comments, hints, secondary detail. */
  dim: string;
  /** Selection highlight. */
  sel: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  /** True when the scheme is light, so the chrome can adapt. */
  light?: boolean;
};

export const THEMES: Theme[] = [
  {
    name: 'onedark',
    bg: '#15181e',
    chrome: '#22262f',
    border: '#05070a',
    fg: '#c3c9d4',
    dim: '#6b7385',
    sel: '#3b4456',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
  },
  {
    name: 'nord',
    bg: '#2e3440',
    chrome: '#3b4252',
    border: '#161a21',
    fg: '#d8dee9',
    dim: '#7b88a1',
    sel: '#434c5e',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
  },
  {
    name: 'gruvbox',
    bg: '#1d2021',
    chrome: '#2c2f30',
    border: '#0d0f0f',
    fg: '#d5c4a1',
    dim: '#7c6f64',
    sel: '#3c3836',
    red: '#fb4934',
    green: '#b8bb26',
    yellow: '#fabd2f',
    blue: '#83a598',
    magenta: '#d3869b',
    cyan: '#8ec07c',
  },
  {
    name: 'solarized',
    bg: '#002b36',
    chrome: '#073642',
    border: '#001b23',
    fg: '#93a1a1',
    dim: '#5c737a',
    sel: '#0b4250',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
  },
  {
    name: 'light',
    bg: '#fdf6e3',
    chrome: '#e9e1cd',
    border: '#c7bfab',
    fg: '#3f5359',
    dim: '#8a9899',
    sel: '#e3dac2',
    red: '#c9302c',
    green: '#4f7a00',
    yellow: '#96700a',
    blue: '#2076b8',
    magenta: '#c02d73',
    cyan: '#22867f',
    light: true,
  },
];

export const THEME_NAMES = THEMES.map((t) => t.name);

export function findTheme(name: string): Theme | undefined {
  return THEMES.find((t) => t.name === name.toLowerCase());
}

export function applyTheme(theme: Theme) {
  const r = document.documentElement;
  const set = (k: string, v: string) => r.style.setProperty(k, v);

  set('--bg', theme.bg);
  set('--chrome', theme.chrome);
  set('--border', theme.border);
  set('--fg', theme.fg);
  set('--dim', theme.dim);
  set('--sel', theme.sel);
  set('--red', theme.red);
  set('--green', theme.green);
  set('--yellow', theme.yellow);
  set('--blue', theme.blue);
  set('--magenta', theme.magenta);
  set('--cyan', theme.cyan);

  r.dataset.appearance = theme.light ? 'light' : 'dark';
  r.style.colorScheme = theme.light ? 'light' : 'dark';

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.bg);
}
