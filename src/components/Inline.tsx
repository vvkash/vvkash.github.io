import type { JSX } from 'react';

/**
 * Renders the tiny inline markup used across src/data/site.ts:
 *   **bold**   `code`   ~dim~   [label](url)
 *
 * `~dim~` needs a matching pair on the same line, so a lone `~` in a path like
 * ~/projects is left alone.
 */
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|~[^~]+~|\[[^\]]+\]\([^)]+\))/g;

export function Inline({ text }: { text: string }): JSX.Element {
  const parts = text.split(TOKEN).filter((p) => p !== undefined && p !== '');

  return (
    <>
      {parts.map((p, i) => {
        if (p.length > 4 && p.startsWith('**') && p.endsWith('**')) {
          return (
            <b className="hl" key={i}>
              {p.slice(2, -2)}
            </b>
          );
        }
        if (p.length > 2 && p.startsWith('`') && p.endsWith('`')) {
          return (
            <span className="code" key={i}>
              {p.slice(1, -1)}
            </span>
          );
        }
        if (p.length > 2 && p.startsWith('~') && p.endsWith('~')) {
          return (
            <span className="dim" key={i}>
              {p.slice(1, -1)}
            </span>
          );
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
        if (link) {
          return (
            <a href={link[2]} key={i} rel="noreferrer noopener" target="_blank">
              {link[1]}
            </a>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
