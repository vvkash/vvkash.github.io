/**
 * ============================================================================
 *  EDIT THIS FILE TO UPDATE YOUR SITE. Nothing else needs to change.
 * ============================================================================
 *
 *  Everything here becomes a file in the terminal's virtual filesystem, so
 *  adding a project adds ~/projects/<slug>.md that visitors can `ls` and `cat`.
 *
 *  Tiny markup you can use inside any string below:
 *    **bold**              -> bright white
 *    `code`                -> green highlight, for the words worth noticing
 *    ~dim~                 -> muted grey, for dates and other metadata
 *    [label](https://url)  -> clickable link
 *    ''                    -> blank line
 *
 *  Order matters: sections print in the order you declare things here, so the
 *  newest role goes first.
 */

export const profile = {
  name: 'Aakash Shah',
  handle: 'aakash',
  host: 'aakashxyz.com',
  tagline: 'swe intern @ Microsoft and IBM',
  location: 'Redmond, WA',
  email: 'ashah114@charlotte.edu',
  socials: [
    { label: 'GitHub', url: 'https://github.com/vvkash' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/aakash--shah' },
  ],
  resumeUrl: '/resume.pdf',
};

// ---------------------------------------------------------------------------
// ABOUT
// ---------------------------------------------------------------------------
export const about: string[] = [
  "Hi, I'm **Aakash Shah** — a rising senior at `UNC Charlotte`.",
  '',
  'I love building software. Mostly mobile apps, ML/AI performance work,',
  'reverse engineering, and blockchain.',
  '',
  'Off the keyboard: friends and family, training mma, and playing soccer.',
];

// ---------------------------------------------------------------------------
// EXPERIENCE
// ---------------------------------------------------------------------------
export type Job = {
  company: string;
  /** The team or org inside the company, printed next to it in green. */
  org?: string;
  role: string;
  /** Omit it and the date is left out entirely. */
  period?: string;
  location?: string;
  /** Plain prose, no bullets. One or two sentences is the point. */
  summary: string[];
};

export const experience: Job[] = [
  {
    company: 'Microsoft',
    org: 'Azure + AI',
    role: 'Software Engineer Intern',
    period: 'Jun 2026 — Aug 2026',
    location: 'Redmond, WA',
    summary: [
      'On the Data Galaxy team, building the `pipelines` that pull failure signals out of 200+ production data flows — and the `prediction engine` that calls incidents about a day before they land.',
    ],
  },
  {
    company: 'IBM',
    org: 'watsonx NLP',
    role: 'Software Engineer Intern',
    period: 'Fall 2026',
    summary: [
      'Tuning language models for enterprise text, and the `AI infra` around them that gets predictions in front of real users.',
    ],
  },
  {
    company: 'SAS Institute',
    org: 'AI/ML Anomaly Detection',
    role: 'Software Engineer Intern',
    period: 'May 2025 — May 2026',
    location: 'Cary, NC',
    summary: [
      'Anomaly detection for industrial IoT — training `pipelines` that halved model time, and `Go` + `Python` APIs streaming live HVAC and solar predictions.',
    ],
  },
  {
    company: 'AI4Health',
    org: 'Mobile Security Research',
    role: 'Undergraduate Researcher',
    period: 'Mar 2026 — Aug 2026',
    location: 'UNC Charlotte',
    summary: [
      'Android biometrics that recognise you from how you touch your phone. All on-device `PyTorch`, so most of the work was `performance`.',
    ],
  },
  {
    company: 'VisioniOS Lab',
    org: 'Spatial Computing',
    role: 'Undergraduate Researcher',
    period: 'Aug 2025 — Nov 2025',
    location: 'UNC Charlotte',
    summary: [
      'Vision Pro navigation for blind users — `CoreML` detection under 80ms, with spatial audio doing the actual guiding.',
    ],
  },
  {
    company: 'NEIC',
    org: 'Developer Tooling',
    role: 'Software Engineer Intern',
    period: 'Jan 2025 — Apr 2025',
    location: 'Remote',
    summary: [
      'Internal `tooling` for a 50+ developer org, plus webhook-driven Slack alerts so issues stopped sitting in a queue.',
    ],
  },
];

// ---------------------------------------------------------------------------
// EDUCATION
// ---------------------------------------------------------------------------
export type School = {
  school: string;
  degree: string;
  period: string;
  location?: string;
  summary: string[];
};

export const education: School[] = [
  {
    school: 'UNC Charlotte',
    degree: 'B.S. Computer Science',
    period: 'Expected May 2027',
    location: 'Charlotte, NC',
    summary: [
      'Rising senior. Coursework in `data structures & algorithms`, computer networks, systems and architecture.',
    ],
  },
];

// ---------------------------------------------------------------------------
// PROJECTS
// ---------------------------------------------------------------------------
export type Project = {
  name: string;
  blurb: string;
  stack: string[];
  url?: string;
  /** What the link reads as. Falls back to the bare URL. */
  urlLabel?: string;
};

export const projects: Project[] = [
  {
    name: 'Gravity Terminal',
    blurb:
      'Two-leg arbitrage engine across Kalshi and Polymarket — slippage limits, automated hedge retry, and `$50k+` routed on-chain.',
    stack: ['Go', 'TypeScript', 'React', 'PostgreSQL', 'Solana'],
    url: 'https://gravityterminal.app/',
    urlLabel: 'gravityterminal.app',
  },
  {
    name: 'Gold Mine UNCC',
    blurb:
      'iOS and Android app for campus transit, maps and services — `3,500 users`, with offline caching.',
    stack: ['Swift', 'Kotlin', 'Jetpack Compose', 'MapKit', 'Core Data'],
    url: 'https://apps.apple.com/in/app/gold-mine-uncc/id6744618754',
    urlLabel: 'App Store',
  },
];

// ---------------------------------------------------------------------------
// CONTACT — shown by `cat contact.txt`
// ---------------------------------------------------------------------------
const contactRows: { label: string; text: string; url: string }[] = [
  { label: 'email', text: profile.email, url: `mailto:${profile.email}` },
  ...profile.socials.map((s) => ({
    label: s.label.toLowerCase(),
    text: s.url.replace(/^https?:\/\//, ''),
    url: s.url,
  })),
];

const contactPad = Math.max(...contactRows.map((r) => r.label.length));

export const contact: string[] = [
  ...contactRows.map((r) => `\`${r.label.padEnd(contactPad)}\`   [${r.text}](${r.url})`),
  '',
  'currently in the seattle area, heading to the bay for the fall.',
  'always open for a chat and opportunities :)',
];

// ---------------------------------------------------------------------------
// SKILLS
// ---------------------------------------------------------------------------
export const skills: { group: string; items: string[] }[] = [
  {
    group: 'languages',
    items: ['Python', 'Go', 'Swift', 'TypeScript', 'Kotlin', 'C++', 'Java'],
  },
  { group: 'ml + ai', items: ['PyTorch', 'LightGBM', 'CoreML', 'embeddings', 'NLP'] },
  { group: 'backend', items: ['FastAPI', 'Flask', 'Express', 'GraphQL', 'PostgreSQL', 'MongoDB'] },
  { group: 'mobile', items: ['SwiftUI', 'Jetpack Compose', 'ARKit', 'visionOS'] },
  { group: 'cloud', items: ['Azure', 'AWS', 'Docker'] },
  { group: 'tooling', items: ['GitHub Actions', 'Grafana'] },
];
