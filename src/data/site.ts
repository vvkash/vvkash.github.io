/**
 * ============================================================================
 *  EDIT THIS FILE TO UPDATE YOUR SITE. Nothing else needs to change.
 * ============================================================================
 *
 *  Tiny markup you can use inside any string below:
 *    **bold**              -> bright highlight
 *    `code`                -> accent color
 *    [label](https://url)  -> clickable link
 *    ''                    -> blank line
 */

export const profile = {
  name: 'Aakash Shah',
  handle: 'aakash',
  host: 'aakashxyz.com',
  tagline: 'software engineer // builder of things',
  location: 'Redmond, WA',
  email: 'hello@aakashxyz.com',
  socials: [
    { label: 'GitHub', url: 'https://github.com/' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/' },
    { label: 'X', url: 'https://x.com/' },
  ],
  resumeUrl: '/resume.pdf',
};

/** The arrow-key selectable menu. `cmd` must match a command name. */
export const menu = [
  { cmd: 'about', label: 'about', hint: 'who i am' },
  { cmd: 'experience', label: 'experience', hint: "where i've worked" },
  { cmd: 'projects', label: 'projects', hint: "what i've built" },
  { cmd: 'skills', label: 'skills', hint: 'what i work with' },
  { cmd: 'contact', label: 'contact', hint: 'say hello' },
];

// ---------------------------------------------------------------------------
// ABOUT  — TODO: replace with your real bio
// ---------------------------------------------------------------------------
export const about: string[] = [
  "Hi, I'm **Aakash Shah** — a software engineer based in `Redmond, WA`.",
  '',
  'TODO: Write 3-4 lines here about what you do, what you care about,',
  'and what you are working on right now.',
  '',
  'Outside of code you can find me: TODO.',
];

// ---------------------------------------------------------------------------
// EXPERIENCE — TODO: replace with your real roles
// ---------------------------------------------------------------------------
export type Job = {
  role: string;
  company: string;
  period: string;
  location?: string;
  bullets: string[];
};

export const experience: Job[] = [
  {
    role: 'Software Engineer Intern',
    company: 'Microsoft',
    period: '2025 — Present',
    location: 'Redmond, WA',
    bullets: [
      'TODO: what you built, the impact, the numbers.',
      'TODO: a second bullet with the tech you used.',
    ],
  },
  {
    role: 'TODO: Previous Role',
    company: 'TODO: Company',
    period: '20XX — 20XX',
    location: 'TODO',
    bullets: ['TODO: accomplishment one.', 'TODO: accomplishment two.'],
  },
];

// ---------------------------------------------------------------------------
// PROJECTS — TODO: replace with your real projects
// ---------------------------------------------------------------------------
export type Project = {
  name: string;
  blurb: string;
  stack: string[];
  url?: string;
};

export const projects: Project[] = [
  {
    name: 'aakashxyz.com',
    blurb: 'This site. A terminal you can actually talk to.',
    stack: ['React', 'TypeScript', 'Vite'],
    url: 'https://aakashxyz.com',
  },
  {
    name: 'TODO: Project Two',
    blurb: 'TODO: one punchy sentence about what it does.',
    stack: ['TODO', 'TODO'],
  },
  {
    name: 'TODO: Project Three',
    blurb: 'TODO: one punchy sentence about what it does.',
    stack: ['TODO'],
  },
];

// ---------------------------------------------------------------------------
// SKILLS — TODO: tune these groups
// ---------------------------------------------------------------------------
export const skills: { group: string; items: string[] }[] = [
  { group: 'languages', items: ['TypeScript', 'Python', 'C#', 'Go', 'SQL'] },
  { group: 'frontend', items: ['React', 'Vite', 'Tailwind', 'Next.js'] },
  { group: 'backend', items: ['Node', '.NET', 'FastAPI', 'PostgreSQL'] },
  { group: 'cloud', items: ['Azure', 'AWS', 'Docker', 'GitHub Actions'] },
];
