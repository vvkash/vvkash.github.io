export type Theme = {
  name: string;
  /** primary neon */
  neon: string;
  /** secondary neon, used for the banner gradient + highlights */
  neon2: string;
  /** tertiary accent */
  neon3: string;
  /** body text */
  text: string;
  /** muted text */
  dim: string;
  /** page background */
  bg: string;
};

export const THEMES: Theme[] = [
  {
    name: 'neon',
    neon: '#00f0ff',
    neon2: '#ff2bd6',
    neon3: '#a06bff',
    text: '#d6f7ff',
    dim: '#5d7f8c',
    bg: '#05070d',
  },
  {
    name: 'matrix',
    neon: '#39ff14',
    neon2: '#00ffa3',
    neon3: '#b6ff6b',
    text: '#c8ffc0',
    dim: '#3f7a3a',
    bg: '#000a03',
  },
  {
    name: 'synthwave',
    neon: '#ff2bd6',
    neon2: '#ffb200',
    neon3: '#7a5cff',
    text: '#ffd9f4',
    dim: '#8a5a80',
    bg: '#12061f',
  },
  {
    name: 'amber',
    neon: '#ffb000',
    neon2: '#ff7a00',
    neon3: '#ffd980',
    text: '#ffdda8',
    dim: '#8a6224',
    bg: '#0d0700',
  },
  {
    name: 'ice',
    neon: '#7ad7ff',
    neon2: '#c9a7ff',
    neon3: '#ffffff',
    text: '#e6f6ff',
    dim: '#5b7891',
    bg: '#040910',
  },
];

export const THEME_NAMES = THEMES.map((t) => t.name);

export function applyTheme(theme: Theme) {
  const r = document.documentElement;
  r.style.setProperty('--neon', theme.neon);
  r.style.setProperty('--neon-2', theme.neon2);
  r.style.setProperty('--neon-3', theme.neon3);
  r.style.setProperty('--text', theme.text);
  r.style.setProperty('--dim', theme.dim);
  r.style.setProperty('--bg', theme.bg);
  document.body.style.background = theme.bg;
}

export function findTheme(name: string): Theme | undefined {
  return THEMES.find((t) => t.name === name.toLowerCase());
}
