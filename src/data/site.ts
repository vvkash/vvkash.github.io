/**
 * ============================================================================
 *  EDIT THIS FILE TO UPDATE YOUR SITE. Nothing else needs to change.
 * ============================================================================
 *
 *  Everything here becomes a file in the terminal's virtual filesystem, so
 *  adding a project adds ~/projects/<slug>.md that visitors can `ls` and `cat`.
 *
 *  Tiny markup you can use inside any string below:
 *    **bold**              -> bright highlight
 *    `code`                -> accent color
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
  role: string;
  company: string;
  /** Omit it and the date line is left out entirely. */
  period?: string;
  location?: string;
  bullets: string[];
};

export const experience: Job[] = [
  {
    role: 'Software Engineer Intern',
    company: 'Microsoft',
    period: 'Jun 2026 — Aug 2026',
    location: 'Redmond, WA',
    bullets: [
      'Built `Azure` Functions collectors that pull failure telemetry out of 200+ production data pipelines into one place.',
      'Trained **AI** models on Azure that call incidents 24h early at 94% precision, and clustered repeat failures with embeddings.',
    ],
  },
  {
    // TODO: add the dates and location, e.g. period: 'Summer 2025'.
    role: 'Software Engineer Intern',
    company: 'IBM',
    bullets: [
      'Worked on `watsonx` **NLP** — evaluating and tuning language models for enterprise text workloads.',
      'Built the services around the model stack so predictions actually reached users.',
    ],
  },
  {
    role: 'Software Engineer Intern',
    company: 'SAS Institute',
    period: 'May 2025 — May 2026',
    location: 'Cary, NC',
    bullets: [
      'Built ML pipelines for anomaly detection on industrial IoT, halving model training time.',
      'Shipped `Go` and `Python` APIs streaming live HVAC and solar predictions, cutting false alerts by 40%.',
    ],
  },
  {
    role: 'Undergraduate Researcher',
    company: 'AI4Health',
    period: 'Mar 2026 — Aug 2026',
    location: 'UNC Charlotte',
    bullets: [
      'Built an Android biometric engine in `Kotlin` that fuses touch dynamics and heart rate into passive authentication.',
      'Ran on-device `PyTorch` models at sub-100ms inference for DARPA-affiliated mobile security research.',
    ],
  },
  {
    role: 'Undergraduate Researcher',
    company: 'VisioniOS Lab',
    period: 'Aug 2025 — Nov 2025',
    location: 'UNC Charlotte',
    bullets: [
      'Engineered a `CoreML` detection engine on Vision Pro in Swift — sub-80ms latency, 92% accuracy.',
      'Built spatial audio cues with `RealityKit` and `ARKit`, cutting navigation errors for blind users by 38%.',
    ],
  },
  {
    role: 'Software Engineer Intern',
    company: 'NEIC',
    period: 'Jan 2025 — Apr 2025',
    location: 'Remote',
    bullets: [
      'Built internal tooling with `TypeScript`, `MongoDB` and `Docker` for a 50+ developer org.',
      'Automated issue tracking with webhook-driven Slack alerts, cutting response time by 45%.',
    ],
  },
];

// ---------------------------------------------------------------------------
// EDUCATION
// ---------------------------------------------------------------------------
export type School = {
  degree: string;
  school: string;
  period: string;
  location?: string;
  bullets: string[];
};

export const education: School[] = [
  {
    degree: 'B.S. in Computer Science',
    school: 'UNC Charlotte',
    period: 'Expected May 2027',
    location: 'Charlotte, NC',
    bullets: [
      'University of North Carolina at Charlotte — rising senior.',
      'Coursework: data structures & algorithms, computer networks, computer systems, computer architecture.',
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
};

export const projects: Project[] = [
  {
    name: 'Gravity Terminal',
    blurb:
      'Two-leg arbitrage engine across Kalshi and Polymarket, with slippage limits, automated hedge retry, and $50k+ routed on-chain.',
    stack: ['Go', 'TypeScript', 'React', 'PostgreSQL', 'Solana'],
  },
  {
    name: 'Gold Mine UNCC',
    blurb:
      'iOS and Android app used by 3,500 students for transit, maps and campus services, with offline caching.',
    stack: ['Swift', 'Kotlin', 'Jetpack Compose', 'MapKit', 'Core Data'],
  },
  {
    name: 'aakashxyz.com',
    blurb: 'This site. A terminal you can actually talk to.',
    stack: ['React', 'TypeScript', 'Vite'],
    url: 'https://aakashxyz.com',
  },
];

// ---------------------------------------------------------------------------
// CONTACT — shown by `cat contact.txt`
// ---------------------------------------------------------------------------
export const contact: string[] = [
  `email      [${profile.email}](mailto:${profile.email})`,
  ...profile.socials.map((s) => `${s.label.toLowerCase().padEnd(10)} [${s.url}](${s.url})`),
  '',
  `based in ${profile.location}. always up for a good problem.`,
];

// ---------------------------------------------------------------------------
// SKILLS
// ---------------------------------------------------------------------------
export const skills: { group: string; items: string[] }[] = [
  { group: 'languages', items: ['Python', 'Go', 'Swift', 'C++', 'TypeScript', 'Kotlin', 'Java'] },
  { group: 'ml + ai', items: ['PyTorch', 'LightGBM', 'CoreML', 'embeddings', 'NLP'] },
  { group: 'backend', items: ['FastAPI', 'Flask', 'Express', 'GraphQL', 'PostgreSQL', 'MongoDB'] },
  { group: 'mobile', items: ['SwiftUI', 'Jetpack Compose', 'ARKit', 'visionOS'] },
  { group: 'cloud', items: ['Azure', 'AWS', 'Docker', 'Grafana', 'GitHub Actions'] },
];
