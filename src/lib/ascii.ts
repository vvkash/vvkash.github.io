/**
 * "AAKASH SHAH" in the ANSI Shadow figlet font.
 *
 * The art is NOT rendered as text. Web fonts routinely ship U+2588 FULL BLOCK
 * with a different advance width than their normal glyphs (Google's JetBrains
 * Mono subset omits it entirely, so it falls back to another face), which makes
 * the character grid drift and visibly warps the letters. Instead the rows are
 * parsed once into rectangles that get drawn with CSS, so the art is
 * pixel-perfect regardless of which font actually loads.
 *
 * To change the name: paste new ANSI Shadow art into ROWS. Everything below
 * adapts automatically.
 */
const ROWS = [
  ' █████╗  █████╗ ██╗  ██╗ █████╗ ███████╗██╗  ██╗',
  '██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔════╝██║  ██║',
  '███████║███████║█████╔╝ ███████║███████╗███████║',
  '██╔══██║██╔══██║██╔═██╗ ██╔══██║╚════██║██╔══██║',
  '██║  ██║██║  ██║██║  ██╗██║  ██║███████║██║  ██║',
  '╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝',
  '        ███████╗██╗  ██╗ █████╗ ██╗  ██╗        ',
  '        ██╔════╝██║  ██║██╔══██╗██║  ██║        ',
  '        ███████╗███████║███████║███████║        ',
  '        ╚════██║██╔══██║██╔══██║██╔══██║        ',
  '        ███████║██║  ██║██║  ██║██║  ██║        ',
  '        ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝        ',
];

/** A horizontal run of solid cells: x/y are grid cells, w is a cell count. */
export type Run = { x: number; y: number; w: number };

function parse(rows: string[]): Run[] {
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '█') {
        x += 1;
        continue;
      }
      let w = 0;
      while (row[x + w] === '█') w += 1;
      runs.push({ x, y, w });
      x += w;
    }
  });
  return runs;
}

/** Only the solid blocks, with fully blank trailing rows dropped. */
const SOLID_ROWS = (() => {
  const stripped = ROWS.map((r) => r.replace(/[^█]/g, ' '));
  let end = stripped.length;
  while (end > 0 && stripped[end - 1].trim() === '') end -= 1;
  return stripped.slice(0, end);
})();

export const BANNER_RUNS: Run[] = parse(SOLID_ROWS);

export const BANNER_ROWS = SOLID_ROWS.length;

export const BANNER_COLS = BANNER_RUNS.reduce((max, r) => Math.max(max, r.x + r.w), 0);

export const BOOT_LOG = [
  'booting aakash-os v2.1.0 ...',
  '[  ok  ] mounting /dev/aakash',
  '[  ok  ] loading neon.sys',
  '[  ok  ] calibrating crt phosphors',
  '[  ok  ] uplink established @ aakashxyz.com',
];
