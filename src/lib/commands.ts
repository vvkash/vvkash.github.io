import { profile } from '../data/site';
import {
  completePath,
  displayName,
  displayPath,
  HOME,
  isDir,
  lookup,
  resolvePath,
  sortedChildren,
  type FsDir,
  type FsFile,
  type FsNode,
} from './fs';
import { THEME_NAMES } from './themes';
import { WORDMARK } from './ascii';

/**
 * One run of coloured text. `run` turns it into something clickable that types
 * the command for you, the way cmd-clicking a path in iTerm2 opens it.
 */
export type Seg = { t: string; c?: string; run?: string; href?: string };

/** One output line: either plain text with inline markup, or explicit segments. */
export type Out = { t?: string; c?: string; segs?: Seg[] };

export const L = (t = '', c?: string): Out => ({ t, c });
export const S = (segs: Seg[], c?: string): Out => ({ segs, c });

/**
 * Art rows carry their colour as explicit segments so they never reach the
 * inline markup parser, which would otherwise be free to read stray backticks
 * or brackets in the art as formatting. The `art` class pins line-height to 1
 * so the figlet stems join up across rows, and applies the lean.
 */
const art = (t: string): Out => S([{ t, c: 'fg' }], 'art');

export type CommandCtx = {
  cwd: string;
  setCwd: (path: string) => void;
  clear: () => void;
  setTheme: (name: string) => boolean;
  history: string[];
  cols: number;
};

export type Command = {
  name: string;
  usage: string;
  desc: string;
  /** Hidden from `help`, but still runnable. */
  hidden?: boolean;
  /** `help` prints a blank line whenever this changes. */
  group?: string;
  run: (args: string[], ctx: CommandCtx) => Out[] | void;
};

const err = (msg: string) => [L(msg, 'red')];

/** Colour a filesystem entry the way `ls` does. */
function entrySeg(node: FsNode, path: string): Seg {
  const name = displayName(node);
  if (isDir(node)) return { t: name, c: 'blue bold', run: `cd ${path}` };
  if (node.href) return { t: name, c: 'red', run: `open ${path}` };
  return { t: name, c: 'fg', run: `cat ${path}` };
}

/** Lays entries out in columns, the way `ls` fills the terminal width. */
function columns(nodes: FsNode[], prefix: string, cols: number): Out[] {
  if (nodes.length === 0) return [];
  const width = Math.max(...nodes.map((n) => displayName(n).length)) + 3;
  const perRow = Math.max(1, Math.floor((cols - 2) / width));
  const rows: Out[] = [];

  for (let i = 0; i < nodes.length; i += perRow) {
    const segs: Seg[] = [];
    for (const node of nodes.slice(i, i + perRow)) {
      const name = displayName(node);
      segs.push(entrySeg(node, prefix + node.name));
      segs.push({ t: ' '.repeat(Math.max(1, width - name.length)) });
    }
    rows.push(S(segs));
  }
  return rows;
}

/**
 * The numbered menu shown on boot. Each entry is just a shortcut to a path in
 * the filesystem, so the menu and the shell never disagree about what exists.
 */
type Section = { name: string; path: string; hint: string };

const SECTIONS: Section[] = [
  { name: 'about', path: '~/about.txt', hint: 'who i am' },
  { name: 'experience', path: '~/experience', hint: "where i've worked" },
  { name: 'education', path: '~/education', hint: 'where i studied' },
  { name: 'projects', path: '~/projects', hint: "what i've built" },
  { name: 'skills', path: '~/skills.txt', hint: 'what i work with' },
  { name: 'contact', path: '~/contact.txt', hint: 'how to reach me' },
];

/** Prints a file, or every file in a directory separated by rules. */
function readSection(path: string): Out[] {
  const node = lookup(resolvePath(HOME, path));
  if (!node) return err(`${path}: No such file or directory`);
  if (!isDir(node)) return node.lines.map((l) => L(l));

  // Declaration order, not `ls` order: site.ts lists roles newest first and
  // that is the order they should be read in.
  const files = node.children.filter((c): c is FsFile => !isDir(c));
  return files.flatMap((f, i) => [...(i ? [L()] : []), ...f.lines.map((l) => L(l))]);
}

/** The boot menu. Every row runs its section when clicked. */
export function menu(): Out[] {
  const pad = Math.max(...SECTIONS.map((s) => s.name.length));

  return [
    ...SECTIONS.map((s, i) =>
      S([
        { t: `  ${i + 1}  `, c: 'dim' },
        { t: s.name.padEnd(pad), c: 'green', run: s.name },
        { t: '   ' },
        { t: s.hint, c: 'dim' },
      ]),
    ),
    L(),
    S([
      { t: '  pick a number, type a name, or ', c: 'dim' },
      { t: 'ls', c: 'green', run: 'ls' },
      { t: ' to look around yourself.', c: 'dim' },
    ]),
  ];
}

const registry: Command[] = [
  {
    name: 'menu',
    usage: 'menu',
    desc: 'the short version',
    group: 'me',
    run: () => menu(),
  },

  ...SECTIONS.map(
    (s): Command => ({
      name: s.name,
      usage: s.name,
      desc: s.hint,
      group: 'me',
      run: () => readSection(s.path),
    }),
  ),

  {
    name: 'help',
    usage: 'help',
    desc: 'list available commands',
    run: () => {
      const out: Out[] = [];
      const shown = registry.filter((c) => !c.hidden);
      const pad = Math.max(...shown.map((c) => c.usage.length));
      let group = shown[0]?.group ?? 'shell';

      for (const c of shown) {
        const g = c.group ?? 'shell';
        if (g !== group) {
          out.push(L());
          group = g;
        }
        out.push(
          S([
            { t: '  ' },
            { t: c.usage.padEnd(pad), c: 'green', run: c.name },
            { t: '   ' },
            { t: c.desc, c: 'dim' },
          ]),
        );
      }
      out.push(L());
      out.push(
        S([
          { t: '  shortcuts  ', c: 'dim' },
          { t: 'tab', c: 'yellow' },
          { t: ' complete   ', c: 'dim' },
          { t: 'up/down', c: 'yellow' },
          { t: ' history   ', c: 'dim' },
          { t: 'ctrl-c', c: 'yellow' },
          { t: ' cancel   ', c: 'dim' },
          { t: 'ctrl-l', c: 'yellow' },
          { t: ' clear', c: 'dim' },
        ]),
      );
      return out;
    },
  },

  {
    name: 'ls',
    usage: 'ls [dir]',
    desc: 'list directory contents',
    run: (args, ctx) => {
      const target = args.find((a) => !a.startsWith('-')) ?? '.';
      const path = resolvePath(ctx.cwd, target);
      const node = lookup(path);

      if (!node) return err(`ls: ${target}: No such file or directory`);
      if (!isDir(node)) return [S([entrySeg(node, target)])];

      const prefix = target === '.' ? '' : `${target.replace(/\/$/, '')}/`;
      return columns(sortedChildren(node), prefix, ctx.cols);
    },
  },

  {
    name: 'cd',
    usage: 'cd [dir]',
    desc: 'change directory',
    run: (args, ctx) => {
      const target = args[0] ?? '~';
      const path = resolvePath(ctx.cwd, target);
      const node = lookup(path);

      if (!node) return err(`cd: no such file or directory: ${target}`);
      if (!isDir(node)) return err(`cd: not a directory: ${target}`);
      ctx.setCwd(path);
    },
  },

  {
    name: 'pwd',
    usage: 'pwd',
    desc: 'print working directory',
    run: (_args, ctx) => [L(ctx.cwd)],
  },

  {
    name: 'cat',
    usage: 'cat <file>',
    desc: 'print a file',
    run: (args, ctx) => {
      if (args.length === 0) return err('usage: cat <file>');

      const out: Out[] = [];
      for (const target of args) {
        const node = lookup(resolvePath(ctx.cwd, target));
        if (!node) {
          out.push(...err(`cat: ${target}: No such file or directory`));
          continue;
        }
        if (isDir(node)) {
          out.push(...err(`cat: ${target}: Is a directory`));
          continue;
        }
        if (node.href) {
          window.open(node.href, '_blank', 'noopener');
        }
        out.push(...node.lines.map((l) => L(l)));
      }
      return out;
    },
  },

  {
    name: 'open',
    usage: 'open <file|url>',
    desc: 'open a file or link in a new tab',
    run: (args, ctx) => {
      const target = args[0];
      if (!target) return err('usage: open <file|url>');

      if (/^https?:\/\//.test(target) || target.startsWith('mailto:')) {
        window.open(target, '_blank', 'noopener');
        return [L(`opening ${target} ...`, 'dim')];
      }

      const node = lookup(resolvePath(ctx.cwd, target));
      if (!node) return err(`open: ${target}: No such file or directory`);
      if (isDir(node)) return err(`open: ${target}: Is a directory`);
      if (!node.href) return err(`open: ${target}: no application knows how to open this`);

      window.open(node.href, '_blank', 'noopener');
      return [L(`opening ${node.href} ...`, 'dim')];
    },
  },

  {
    name: 'tree',
    usage: 'tree',
    desc: 'show the whole tree',
    run: (_args, ctx) => {
      const start = lookup(ctx.cwd);
      if (!start || !isDir(start)) return err('tree: not a directory');

      const out: Out[] = [S([{ t: displayPath(ctx.cwd), c: 'blue bold' }])];

      const walk = (dir: FsDir, prefix: string, base: string) => {
        const kids = sortedChildren(dir);
        kids.forEach((child, i) => {
          const last = i === kids.length - 1;
          const path = `${base}/${child.name}`;
          out.push(
            S([
              { t: prefix + (last ? '└── ' : '├── '), c: 'dim' },
              entrySeg(child, path),
            ]),
          );
          if (isDir(child)) walk(child, prefix + (last ? '    ' : '│   '), path);
        });
      };

      walk(start, '', '.');
      return out;
    },
  },

  {
    name: 'whoami',
    usage: 'whoami',
    desc: 'who you are talking to',
    run: () => [L(profile.handle)],
  },

  {
    name: 'theme',
    usage: 'theme [name]',
    desc: 'switch colour scheme',
    run: (args, ctx) => {
      const want = args[0];
      if (!want) {
        return [
          S([
            { t: 'usage: theme <name>   ', c: 'dim' },
            ...THEME_NAMES.flatMap((n): Seg[] => [
              { t: n, c: 'green', run: `theme ${n}` },
              { t: '  ' },
            ]),
          ]),
        ];
      }
      if (!ctx.setTheme(want)) {
        return err(`theme: unknown scheme: ${want}`);
      }
    },
  },

  {
    name: 'history',
    usage: 'history',
    desc: 'commands you have run',
    run: (_args, ctx) => {
      if (ctx.history.length === 0) return [L('no history yet', 'dim')];
      return ctx.history.map((h, i) =>
        S([
          { t: `${String(i + 1).padStart(4)}  `, c: 'dim' },
          { t: h, run: h },
        ]),
      );
    },
  },

  {
    name: 'banner',
    usage: 'banner',
    desc: 'print the name again',
    run: () => bannerRows(),
  },

  {
    name: 'clear',
    usage: 'clear',
    desc: 'clear the screen',
    run: (_args, ctx) => {
      ctx.clear();
    },
  },

  {
    name: 'date',
    usage: 'date',
    desc: 'current time',
    hidden: true,
    run: () => [L(new Date().toString())],
  },

  {
    name: 'echo',
    usage: 'echo <text>',
    desc: 'repeat after me',
    hidden: true,
    run: (args) => [L(args.join(' '))],
  },

  {
    name: 'uname',
    usage: 'uname',
    desc: 'system info',
    hidden: true,
    run: (args) =>
      args.includes('-a')
        ? [L(`Darwin ${profile.host} 24.5.0 arm64`)]
        : [L('Darwin')],
  },

  {
    name: 'man',
    usage: 'man <command>',
    desc: 'manual page',
    hidden: true,
    run: (args) => {
      const cmd = registry.find((c) => c.name === args[0]);
      if (!args[0]) return err('What manual page do you want?');
      if (!cmd) return err(`No manual entry for ${args[0]}`);
      return [
        S([{ t: 'NAME', c: 'bold' }]),
        L(`     ${cmd.name} -- ${cmd.desc}`),
        L(),
        S([{ t: 'SYNOPSIS', c: 'bold' }]),
        L(`     ${cmd.usage}`),
      ];
    },
  },

  {
    name: 'sudo',
    usage: 'sudo',
    desc: 'nice try',
    hidden: true,
    run: () => err(`${profile.handle} is not in the sudoers file. This incident will be reported.`),
  },

  {
    name: 'exit',
    usage: 'exit',
    desc: 'leave',
    hidden: true,
    run: () => [L('There is no exit. Close the tab like everyone else.', 'dim')],
  },
];

export const COMMANDS = registry;

export function findCommand(name: string): Command | undefined {
  // A bare number picks the matching row from the boot menu.
  if (/^\d+$/.test(name)) {
    const section = SECTIONS[Number(name) - 1];
    return section && registry.find((c) => c.name === section.name);
  }
  return registry.find((c) => c.name === name.toLowerCase());
}

const COMMAND_NAMES = registry.map((c) => c.name).sort();

/** Commands that take a path argument, so tab can complete filenames for them. */
const PATH_COMMANDS = new Set(['cd', 'cat', 'ls', 'open']);

/** Longest string every candidate starts with. */
function commonPrefix(items: string[]): string {
  if (items.length === 0) return '';
  let prefix = items[0];
  for (const item of items) {
    while (!item.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/**
 * Shell-style tab completion: command names in the first word, paths after a
 * command that takes one. Returns the new input plus the candidates to show
 * when the completion is ambiguous.
 */
export function complete(input: string, cwd: string): { value: string; matches: string[] } {
  const trailingSpace = /\s$/.test(input);
  const words = input.split(/\s+/).filter(Boolean);

  // Completing a fresh word after a space, or the very first word.
  const completingNew = trailingSpace || words.length === 0;
  const head = words[0] ?? '';
  const fragment = completingNew ? '' : words[words.length - 1];

  const isFirstWord = words.length === 0 || (words.length === 1 && !trailingSpace);

  const candidates = isFirstWord
    ? COMMAND_NAMES.filter((c) => c.startsWith(fragment))
    : PATH_COMMANDS.has(head)
      ? completePath(cwd, fragment)
      : [];

  if (candidates.length === 0) return { value: input, matches: [] };

  const resolved = candidates.length === 1 ? candidates[0] : commonPrefix(candidates);
  if (resolved.length <= fragment.length) return { value: input, matches: candidates };

  const before = completingNew ? words : words.slice(0, -1);
  const joined = [...before, resolved].join(' ');
  const value = candidates.length === 1 && !resolved.endsWith('/') ? `${joined} ` : joined;

  return { value, matches: candidates.length > 1 ? candidates : [] };
}

/** How many text rows the wordmark occupies. */
export const WORDMARK_ROWS = WORDMARK.length;

/**
 * The wordmark as a *single* row holding newlines, so the CSS shear that
 * tilts it stays continuous instead of stepping row by row. Pass `lines` to
 * get a partial wordmark, which is how the boot draws it a row at a time.
 */
export function bannerRow(lines: number = WORDMARK_ROWS): Out {
  return art(WORDMARK.slice(0, lines).join('\n'));
}

/** The wordmark, as output rows. */
export function bannerRows(): Out[] {
  return [bannerRow()];
}

/** Tagline and location, on one line. */
export function identityRow(): Out {
  return S([
    { t: profile.tagline, c: 'fg' },
    { t: `  ·  ${profile.location}`, c: 'dim' },
  ]);
}

/** The line the boot spinner turns into once loading finishes. */
export function menuHeader(): Out {
  return S([
    { t: '  what do you want to see? ', c: 'fg' },
    { t: `(${SECTIONS.length} sections, or `, c: 'dim' },
    { t: 'help', c: 'green', run: 'help' },
    { t: ' for everything)', c: 'dim' },
  ]);
}
