/**
 * Small ASCII wordmark, printed once on boot.
 *
 * Plain printable ASCII only. Block and box-drawing glyphs are missing from
 * many font subsets and fall back to a face with a different advance width,
 * which shears the character grid. Staying inside ASCII keeps every glyph on
 * the same advance, so this renders correctly in any monospace face.
 */
export const WORDMARK: string[] = [
  "            | |               | |           | |          | |",
  " __ _  __ _ | | __  __ _  ___ | |__     ___ | |__   __ _ | |__",
  "/ _` |/ _` || |/ / / _` |/ __|| '_ \\   / __|| '_ \\ / _` || '_ \\",
  "\\__,_|\\__,_||_|\\_\\ \\__,_|\\__ \\|_| |_|  \\__ \\|_| |_|\\__,_||_| |_|",
];

/** Widest row, used to scale the art down on narrow screens. */
export const WORDMARK_COLS = 64;
