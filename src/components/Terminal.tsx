import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BANNER_COLS, BANNER_ROWS, BANNER_RUNS, BOOT_LOG } from '../lib/ascii';
import { complete, COMPLETIONS, findCommand, L, type CommandCtx, type Out } from '../lib/commands';
import { applyTheme, findTheme, THEMES } from '../lib/themes';
import { menu, profile } from '../data/site';
import { Inline } from './Inline';
import { Typewriter } from './Typewriter';
import '../styles/terminal.css';

type Line = { id: number; t: string; c?: string };

const PROMPT = `${profile.handle}@${profile.host}`;
const THEME_KEY = 'axyz.theme';

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [menuIdx, setMenuIdx] = useState(0);
  const [booted, setBooted] = useState(false);

  const idRef = useRef(0);
  const runRef = useRef(0);
  const skipRef = useRef(false);
  const startedRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef(-1);

  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mk = useCallback((t: string, c?: string): Line => {
    idRef.current += 1;
    return { id: idRef.current, t, c };
  }, []);

  const sleep = (ms: number) =>
    new Promise<void>((res) => window.setTimeout(res, skipRef.current ? 0 : ms));

  /** Appends lines one at a time so output feels like it is streaming in. */
  const print = useCallback(
    async (items: Out[], delay = 14) => {
      const token = runRef.current;
      for (const item of items) {
        if (runRef.current !== token) return;
        setLines((prev) => [...prev, mk(item.t, item.c)]);
        if (delay) await sleep(delay);
      }
    },
    [mk],
  );

  const pushBanner = useCallback(() => {
    setLines((prev) => [
      ...prev,
      mk('__banner__', 'banner'),
      mk(''),
      mk(`  ${profile.tagline}`, 'accent-line'),
      mk(''),
    ]);
  }, [mk]);

  const setTheme = useCallback((name: string) => {
    const theme = findTheme(name);
    if (!theme) return false;
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme.name);
    } catch {
      /* private mode — theme just won't persist */
    }
    return true;
  }, []);

  const clearScreen = useCallback(() => {
    runRef.current += 1;
    setLines([]);
  }, []);

  const ctx = useMemo<CommandCtx>(
    () => ({ setTheme, clearScreen, showBanner: pushBanner }),
    [setTheme, clearScreen, pushBanner],
  );

  // ---- boot ---------------------------------------------------------------
  useEffect(() => {
    const saved = (() => {
      try {
        return window.localStorage.getItem(THEME_KEY);
      } catch {
        return null;
      }
    })();
    applyTheme(findTheme(saved ?? '') ?? THEMES[0]);

    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      await print(
        BOOT_LOG.map((l) => L(`  ${l}`, l.startsWith('[') ? 'boot-ok' : 'dim')),
        160,
      );
      await sleep(420);
      clearScreen();
      pushBanner();
      await sleep(260);
      await print(
        [
          L('  type `help` for all commands, or pick something below.', 'dim'),
          L('  ↑ ↓ to move · enter to select · tab to autocomplete', 'dim'),
          L(),
        ],
        90,
      );
      setBooted(true);
      inputRef.current?.focus();
    })();
  }, [print, pushBanner, clearScreen]);

  // ---- keep the newest output in view -------------------------------------
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, booted, menuIdx, input]);

  // ---- command execution --------------------------------------------------
  const exec = useCallback(
    async (raw: string) => {
      const cmd = raw.trim();
      setLines((prev) => [...prev, mk(`${PROMPT}:~$ ${cmd}`, 'echo')]);
      if (!cmd) return;

      historyRef.current = [cmd, ...historyRef.current.filter((h) => h !== cmd)].slice(0, 50);
      histIdxRef.current = -1;

      const [name, ...args] = cmd.split(/\s+/);
      const command = findCommand(name);

      if (!command) {
        const guess = COMPLETIONS.find((c) => c.startsWith(name.slice(0, 2).toLowerCase()));
        await print(
          [
            L(`  command not found: ${name}`, 'err'),
            L(guess ? `  did you mean \`${guess}\`? or type \`help\`.` : '  type `help`.', 'dim'),
            L(),
          ],
          40,
        );
        return;
      }

      const out = command.run(args, ctx);
      if (out) await print(out, 12);
    },
    [ctx, mk, print],
  );

  const runMenuItem = useCallback(
    (idx: number) => {
      setMenuIdx(idx);
      setInput('');
      void exec(menu[idx].cmd);
      inputRef.current?.focus();
    },
    [exec],
  );

  // ---- keyboard -----------------------------------------------------------
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!booted) {
      skipRef.current = true;
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim() === '') {
        runMenuItem(menuIdx);
      } else {
        const value = input;
        setInput('');
        void exec(value);
      }
      return;
    }

    // Empty prompt -> arrows drive the menu. Typed prompt -> arrows drive history.
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dir = e.key === 'ArrowDown' ? 1 : -1;

      if (input === '' && histIdxRef.current === -1) {
        setMenuIdx((i) => (i + dir + menu.length) % menu.length);
        return;
      }

      const hist = historyRef.current;
      if (!hist.length) return;
      const next = Math.min(hist.length - 1, Math.max(-1, histIdxRef.current - dir));
      histIdxRef.current = next;
      setInput(next === -1 ? '' : hist[next]);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const frag = input.trim();
      if (!frag) return;
      const { value, matches } = complete(frag);
      if (value !== frag) {
        setInput(value);
      } else if (matches.length > 1) {
        void print([L(`  ${matches.join('   ')}`, 'dim'), L()], 0);
      }
      return;
    }

    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearScreen();
      return;
    }

    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setLines((prev) => [...prev, mk(`${PROMPT}:~$ ${input}^C`, 'echo')]);
      setInput('');
      return;
    }

    if (e.key === 'Escape') {
      setInput('');
    }
  };

  return (
    <div className="crt" onClick={() => inputRef.current?.focus()}>
      <div className="scanlines" aria-hidden="true" />
      <div className="glow-orb" aria-hidden="true" />

      <main className="terminal">
        <header className="titlebar">
          <span className="dot dot-r" />
          <span className="dot dot-y" />
          <span className="dot dot-g" />
          <span className="title">
            {profile.handle}@{profile.host} — zsh — 96×32
          </span>
        </header>

        <div className="screen" ref={screenRef}>
          {lines.map((line) =>
            line.c === 'banner' ? (
              <div className="banner-wrap" key={line.id}>
                <div className="banner-glow">
                  <div
                    aria-label={profile.name}
                    className="banner"
                    role="img"
                    style={
                      {
                        '--cols': BANNER_COLS,
                        '--rows': BANNER_ROWS,
                      } as React.CSSProperties
                    }
                  >
                    {BANNER_RUNS.map((r) => (
                      <i
                        key={`${r.y}-${r.x}`}
                        style={
                          {
                            '--x': r.x,
                            '--y': r.y,
                            '--w': r.w,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`line ${line.c ?? ''}`} key={line.id}>
                <Inline text={line.t} />
              </div>
            ),
          )}

          {booted && (
            <>
              <nav className="menu" aria-label="Sections">
                <div className="menu-top">┌─ navigate ─────────────────────────</div>
                {menu.map((item, i) => (
                  <button
                    className={`menu-item ${i === menuIdx ? 'is-active' : ''}`}
                    key={item.cmd}
                    onClick={(e) => {
                      e.stopPropagation();
                      runMenuItem(i);
                    }}
                    onMouseEnter={() => setMenuIdx(i)}
                    type="button"
                  >
                    <span className="caretmark">{i === menuIdx ? '▸' : ' '}</span>
                    <span className="key">[{i + 1}]</span>
                    <span className="label">{item.label}</span>
                    <span className="hint">{item.hint}</span>
                  </button>
                ))}
                <div className="menu-bot">└────────────────────────────────────</div>
              </nav>

              <div className="promptline">
                <span className="ps1">
                  <span className="ps1-user">{profile.handle}</span>
                  <span className="ps1-at">@</span>
                  <span className="ps1-host">{profile.host}</span>
                  <span className="ps1-path">:~$</span>
                </span>
                <span className="typed">{input}</span>
                <span className="caret" />
              </div>
            </>
          )}

          {!booted && (
            <div className="line dim boot-hint">
              <Typewriter speed={40} text="  press any key to skip" />
            </div>
          )}
        </div>
      </main>

      <input
        aria-label="Terminal input"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className="hidden-input"
        onBlur={() => {
          // Re-arm the prompt, but never steal focus from a link the user clicked.
          window.setTimeout(() => {
            const active = document.activeElement;
            if (active && active !== document.body) return;
            if (window.getSelection()?.toString()) return;
            inputRef.current?.focus({ preventScroll: true });
          }, 0);
        }}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        ref={inputRef}
        spellCheck={false}
        value={input}
      />
    </div>
  );
}
