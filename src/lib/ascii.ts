/**
 * Terminal artwork.
 *
 * Everything here is plain printable ASCII on purpose. An earlier version drew
 * the name with U+2588 FULL BLOCK, but web font subsets frequently omit block
 * glyphs and fall back to a face with a different advance width. That makes the
 * character grid drift and visibly warps the art. Staying inside ASCII keeps
 * every glyph on the same advance, so this can be rendered as ordinary text in
 * a <pre> the way a real terminal would.
 *
 * The mascot was produced by rasterising artwork and mapping pixel brightness
 * onto the density ramp " .:~!XW#$" - the same trick behind classic shaded
 * terminal art.
 */

/** Cowsay-style speech bubble around a single line of text. */
export function bubble(text: string): string[] {
  const w = text.length + 2;
  return [` ${'_'.repeat(w)}`, `< ${text} >`, ` ${'-'.repeat(w)}`];
}

/** Shaded mascot. */
export const MASCOT: string[] = [
  '               :#$~',
  '               .WW.',
  '     .!WWWWWWWWXW#XWWWWWWWW!.',
  '    .$$$$$$$$$$$$$$$$$$$$$$$$.',
  '    :$$$#:   :W$$$$W:   :#$$$:',
  '    .$$$!     .$$$$:     ~$$$:',
  '    .$$$$X~:~X$$$$$$X~:~X$$$$:',
  '    .$$$$$$$!!~~~~~~!!#$$$$$$:',
  '     X$$$$$#~~~~~~~~~~#$$$$$W',
  '      .::~~~~~~~~~~~~~~~~::.',
  '        XWWWWWWWWWWWWWWWWX',
  '       !$$$$$$$$$$$$$$$$$$!',
  '       .X################X.',
];

const INDENT = '      ';

/** Speech bubble with the given name, tail, then the mascot below it. */
export function banner(name: string): string[] {
  return [
    ...bubble(name),
    '        \\',
    '         \\',
    ...MASCOT.map((row) => INDENT + row),
  ];
}

/** Widest line of a block of art, for sizing the text to fit. */
export function widthOf(rows: string[]): number {
  return rows.reduce((max, r) => Math.max(max, r.length), 0);
}

export const BOOT_LOG = [
  'booting aakash-os v2.1.0 ...',
  '[  ok  ] mounting /dev/aakash',
  '[  ok  ] loading neon.sys',
  '[  ok  ] calibrating crt phosphors',
  '[  ok  ] uplink established @ aakashxyz.com',
];
