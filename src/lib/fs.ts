/**
 * A small read-only virtual filesystem.
 *
 * Everything visible here is generated from src/data/site.ts, so that stays the
 * single file worth editing. Commands like ls / cd / cat operate on this tree,
 * which is what makes the prompt behave like a shell rather than a menu.
 */
import { about, contact, education, experience, profile, projects, skills } from '../data/site';

export type FsFile = {
  kind: 'file';
  name: string;
  /** Rendered contents, in the same inline markup used by site.ts. */
  lines: string[];
  /** Opens in a new tab instead of printing, e.g. the resume. */
  href?: string;
};

export type FsDir = {
  kind: 'dir';
  name: string;
  children: FsNode[];
};

export type FsNode = FsFile | FsDir;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function jobFile(job: (typeof experience)[number]): FsFile {
  const meta = [job.role, job.period, job.location].filter(Boolean).join('  ·  ');
  return {
    kind: 'file',
    name: `${slug(job.company)}.md`,
    lines: [
      `**${job.company}**${job.org ? `   \`${job.org}\`` : ''}`,
      `~${meta}~`,
      // A role with nothing to say stops at its header rather than trailing a
      // blank line.
      ...(job.summary.length ? ['', ...job.summary] : []),
    ],
  };
}

function schoolFile(s: (typeof education)[number]): FsFile {
  const meta = [s.degree, s.period, s.location].filter(Boolean).join('  ·  ');
  return {
    kind: 'file',
    name: `${slug(s.school)}.md`,
    lines: [`**${s.school}**`, `~${meta}~`, '', ...s.summary],
  };
}

function projectFile(p: (typeof projects)[number]): FsFile {
  return {
    kind: 'file',
    name: `${slug(p.name)}.md`,
    lines: [
      `**${p.name}**`,
      '',
      p.blurb,
      '',
      `~${p.stack.join('  ·  ')}~`,
      ...(p.url ? [`[${p.urlLabel ?? p.url}](${p.url})`] : []),
    ],
  };
}

export const HOME = `/Users/${profile.handle}`;

export const root: FsDir = {
  kind: 'dir',
  name: '/',
  children: [
    {
      kind: 'dir',
      name: 'Users',
      children: [
        {
          kind: 'dir',
          name: profile.handle,
          children: [
            { kind: 'file', name: 'about.txt', lines: about },
            {
              kind: 'dir',
              name: 'experience',
              children: experience.map(jobFile),
            },
            {
              kind: 'dir',
              name: 'education',
              children: education.map(schoolFile),
            },
            {
              kind: 'dir',
              name: 'projects',
              children: projects.map(projectFile),
            },
            {
              kind: 'file',
              name: 'skills.txt',
              lines: (() => {
                const pad = Math.max(...skills.map((s) => s.group.length));
                return skills.map((s) => `\`${s.group.padEnd(pad)}\`   ${s.items.join('  ·  ')}`);
              })(),
            },
            { kind: 'file', name: 'contact.txt', lines: contact },
            {
              kind: 'file',
              name: 'resume.pdf',
              lines: [`opening ${profile.resumeUrl} ...`],
              href: profile.resumeUrl,
            },
          ],
        },
      ],
    },
  ],
};

export function isDir(node: FsNode): node is FsDir {
  return node.kind === 'dir';
}

/** Splits an absolute path into its segments. */
function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/**
 * Resolves `input` against `cwd` the way a shell would, handling `~`, `.`, `..`,
 * absolute paths and trailing slashes. Returns an absolute path string.
 */
export function resolvePath(cwd: string, input: string): string {
  let base: string[];
  let rest: string;

  if (input === '~' || input.startsWith('~/')) {
    base = segments(HOME);
    rest = input.slice(1);
  } else if (input.startsWith('/')) {
    base = [];
    rest = input;
  } else {
    base = segments(cwd);
    rest = input;
  }

  for (const part of segments(rest)) {
    if (part === '.') continue;
    if (part === '..') base.pop();
    else base.push(part);
  }

  return `/${base.join('/')}`;
}

/** Looks up an absolute path. Returns undefined when it does not exist. */
export function lookup(path: string): FsNode | undefined {
  let node: FsNode = root;
  for (const part of segments(path)) {
    if (!isDir(node)) return undefined;
    const next: FsNode | undefined = node.children.find((c) => c.name === part);
    if (!next) return undefined;
    node = next;
  }
  return node;
}

/** Collapses the home prefix to `~`, the way a prompt displays it. */
export function displayPath(path: string): string {
  if (path === HOME) return '~';
  if (path.startsWith(`${HOME}/`)) return `~${path.slice(HOME.length)}`;
  return path;
}

/** Sorted children: directories first, then files, both alphabetical. */
export function sortedChildren(dir: FsDir): FsNode[] {
  return [...dir.children].sort((a, b) => {
    if (isDir(a) !== isDir(b)) return isDir(a) ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Name as `ls` shows it: directories get a trailing slash. */
export function displayName(node: FsNode): string {
  return isDir(node) ? `${node.name}/` : node.name;
}

/** Completion candidates for a partially typed path. */
export function completePath(cwd: string, fragment: string): string[] {
  const slash = fragment.lastIndexOf('/');
  const dirPart = slash === -1 ? '' : fragment.slice(0, slash + 1);
  const namePart = slash === -1 ? fragment : fragment.slice(slash + 1);

  const dir = lookup(resolvePath(cwd, dirPart || '.'));
  if (!dir || !isDir(dir)) return [];

  return sortedChildren(dir)
    .filter((c) => c.name.startsWith(namePart))
    .map((c) => dirPart + (isDir(c) ? `${c.name}/` : c.name));
}
