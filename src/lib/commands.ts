import { about, experience, menu, profile, projects, skills } from '../data/site';
import { THEME_NAMES } from './themes';

/** A single output line. `c` is an optional CSS class from terminal.css. */
export type Out = { t: string; c?: string };

export const L = (t = '', c?: string): Out => ({ t, c });

export type CommandCtx = {
  setTheme: (name: string) => boolean;
  clearScreen: () => void;
  showBanner: () => void;
};

export type Command = {
  name: string;
  desc: string;
  aliases?: string[];
  hidden?: boolean;
  run: (args: string[], ctx: CommandCtx) => Out[] | void;
};

const RULE = '─'.repeat(46);

function heading(title: string): Out[] {
  return [L(`┌─ ${title.toUpperCase()} ${'─'.repeat(Math.max(0, 42 - title.length))}`, 'rule'), L()];
}

const registry: Command[] = [
  {
    name: 'help',
    desc: 'list every available command',
    aliases: ['?', 'commands'],
    run: () => {
      const rows = registry
        .filter((c) => !c.hidden)
        .map((c) => L(`  ${c.name.padEnd(12)} ${c.desc}`, 'row'));
      return [
        ...heading('help'),
        ...rows,
        L(),
        L('  use ↑ ↓ to move the menu, enter to select, tab to autocomplete.', 'dim'),
      ];
    },
  },

  {
    name: 'about',
    desc: 'who i am',
    aliases: ['whoami', 'me'],
    run: () => [...heading('about'), ...about.map((l) => L(`  ${l}`)), L()],
  },

  {
    name: 'experience',
    desc: "where i've worked",
    aliases: ['work', 'exp'],
    run: () => {
      const out: Out[] = [...heading('experience')];
      experience.forEach((job, i) => {
        out.push(L(`  ▸ ${job.role}`, 'hl-line'));
        out.push(L(`    ${job.company}${job.location ? ` · ${job.location}` : ''}`, 'accent-line'));
        out.push(L(`    ${job.period}`, 'dim'));
        out.push(L());
        job.bullets.forEach((b) => out.push(L(`      • ${b}`)));
        if (i < experience.length - 1) out.push(L(`  ${RULE}`, 'dim'));
      });
      out.push(L());
      return out;
    },
  },

  {
    name: 'projects',
    desc: "what i've built",
    aliases: ['work-samples', 'proj'],
    run: () => {
      const out: Out[] = [...heading('projects')];
      projects.forEach((p, i) => {
        out.push(L(`  ▸ ${p.name}`, 'hl-line'));
        out.push(L(`    ${p.blurb}`));
        out.push(L(`    [${p.stack.join('] [')}]`, 'accent-line'));
        if (p.url) out.push(L(`    [${p.url}](${p.url})`, 'dim'));
        if (i < projects.length - 1) out.push(L());
      });
      out.push(L());
      return out;
    },
  },

  {
    name: 'skills',
    desc: 'what i work with',
    aliases: ['stack', 'tech'],
    run: () => {
      const out: Out[] = [...heading('skills')];
      const pad = Math.max(...skills.map((s) => s.group.length));
      skills.forEach((s) => {
        out.push(L(`  ${s.group.padEnd(pad)}  ${s.items.join('  ·  ')}`, 'row'));
      });
      out.push(L());
      return out;
    },
  },

  {
    name: 'contact',
    desc: 'say hello',
    aliases: ['socials', 'links', 'email'],
    run: () => {
      const out: Out[] = [...heading('contact')];
      out.push(L(`  email     [${profile.email}](mailto:${profile.email})`, 'row'));
      profile.socials.forEach((s) => {
        out.push(L(`  ${s.label.toLowerCase().padEnd(9)} [${s.url}](${s.url})`, 'row'));
      });
      out.push(L());
      out.push(L(`  based in ${profile.location}. always up for a good problem.`, 'dim'));
      out.push(L());
      return out;
    },
  },

  {
    name: 'resume',
    desc: 'open my resume',
    aliases: ['cv'],
    run: () => {
      window.open(profile.resumeUrl, '_blank', 'noopener');
      return [L(`  opening ${profile.resumeUrl} ...`, 'dim'), L()];
    },
  },

  {
    name: 'theme',
    desc: `switch palette (${THEME_NAMES.join(', ')})`,
    run: (args, ctx) => {
      const want = args[0];
      if (!want) {
        return [
          L('  usage: theme <name>', 'dim'),
          L(`  available: ${THEME_NAMES.join('  ·  ')}`, 'accent-line'),
          L(),
        ];
      }
      if (!ctx.setTheme(want)) {
        return [L(`  no theme named "${want}". try: ${THEME_NAMES.join(', ')}`, 'err'), L()];
      }
      return [L(`  theme set to ${want}.`, 'accent-line'), L()];
    },
  },

  {
    name: 'banner',
    desc: 'redraw the name art',
    run: (_args, ctx) => {
      ctx.showBanner();
    },
  },

  {
    name: 'clear',
    desc: 'wipe the screen',
    aliases: ['cls'],
    run: (_args, ctx) => {
      ctx.clearScreen();
    },
  },

  {
    name: 'date',
    desc: 'current time',
    hidden: true,
    run: () => [L(`  ${new Date().toString()}`, 'dim'), L()],
  },

  {
    name: 'echo',
    desc: 'repeat after me',
    hidden: true,
    run: (args) => [L(`  ${args.join(' ')}`), L()],
  },

  {
    name: 'sudo',
    desc: 'nice try',
    hidden: true,
    run: () => [L('  aakash is not in the sudoers file. this incident has been reported.', 'err'), L()],
  },

  {
    name: 'exit',
    desc: 'leave',
    hidden: true,
    aliases: ['quit', 'logout'],
    run: () => [L('  you can check out any time you like, but you can never leave.', 'accent-line'), L()],
  },
];

export const COMMANDS = registry;

export function findCommand(name: string): Command | undefined {
  const n = name.toLowerCase();
  return registry.find((c) => c.name === n || c.aliases?.includes(n));
}

/** Primary command names only — preferred for tab completion. */
export const COMMAND_NAMES = registry.map((c) => c.name).sort();

/** All command names + aliases, for tab completion fallback. */
export const COMPLETIONS = registry
  .flatMap((c) => [c.name, ...(c.aliases ?? [])])
  .concat(menu.map((m) => m.cmd))
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort();

/** Resolves a prefix the way a shell would: exact match, else longest common prefix. */
export function complete(fragment: string): { value: string; matches: string[] } {
  const frag = fragment.toLowerCase();
  if (!frag) return { value: fragment, matches: [] };

  const primary = COMMAND_NAMES.filter((c) => c.startsWith(frag));
  const matches = primary.length ? primary : COMPLETIONS.filter((c) => c.startsWith(frag));
  if (matches.length === 0) return { value: fragment, matches: [] };
  if (matches.length === 1) return { value: matches[0], matches };

  let prefix = matches[0];
  for (const m of matches) {
    while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return { value: prefix.length > frag.length ? prefix : fragment, matches };
}
