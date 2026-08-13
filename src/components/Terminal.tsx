import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { complete, findCommand, welcome, type CommandCtx, type Out, type Seg } from '../lib/commands';
import { displayPath, HOME } from '../lib/fs';
import { applyTheme, findTheme, THEMES } from '../lib/themes';
import { profile } from '../data/site';
import { Inline } from './Inline';
import '../styles/terminal.css';

type Row = Out & { id: number };

const THEME_KEY = 'axyz.theme';
const HISTORY_MAX = 100;

/** `Wed Aug 13 12:32:54` — the format macOS prints on login. */
function loginStamp(d: Date): string {
  const day = d.toDateString().slice(0, 10);
  return `${day} ${d.toTimeString().slice(0, 8)}`;
}

export default function Terminal() {
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState('');
  const [caret, setCaret] = useState(0);
  const [cwd, setCwd] = useState(HOME);
  const [busy, setBusy] = useState(true);
  const [size, setSize] = useState({ cols: 80, rows: 24 });

  const idRef = useRef(0);
  const bootedRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef(-1);
  const draftRef = useRef('');
  const cwdRef = useRef(cwd);
  const colsRef = useRef(80);

  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLSpanElement>(null);

  cwdRef.current = cwd;
  colsRef.current = size.cols;

  const emit = useCallback((items: Out[]) => {
    setRows((prev) => [
      ...prev,
      ...items.map((o) => {
        idRef.current += 1;
        return { ...o, id: idRef.current };
      }),
    ]);
  }, []);

  const clear = useCallback(() => setRows([]), []);

  const setTheme = useCallback((name: string) => {
    const theme = findTheme(name);
    if (!theme) return false;
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme.name);
    } catch {
      /* private mode: the theme just will not persist */
    }
    return true;
  }, []);

  // ---- measure the character cell so the title bar can report a real size ---
  useLayoutEffect(() => {
    const measure = () => {
      const cell = cellRef.current;
      const screen = screenRef.current;
      if (!cell || !screen) return;
      const w = cell.getBoundingClientRect().width / 10;
      const h = cell.getBoundingClientRect().height;
      if (!w || !h) return;
      setSize({
        cols: Math.max(20, Math.floor(screen.clientWidth / w)),
        rows: Math.max(8, Math.floor(screen.clientHeight / h)),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (screenRef.current) ro.observe(screenRef.current);
    window.addEventListener('load', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener('load', measure);
    };
  }, []);

  // ---- run a command --------------------------------------------------------
  const exec = useCallback(
    (raw: string) => {
      const cmd = raw.trim();

      emit([
        {
          segs: [
            { t: `${profile.handle}@${profile.host.split('.')[0]}`, c: 'green bold' },
            { t: ' ' },
            { t: displayPath(cwdRef.current), c: 'blue bold' },
            { t: ' % ', c: 'dim' },
            { t: raw },
          ],
        },
      ]);

      if (!cmd) return;

      historyRef.current = [...historyRef.current.filter((h) => h !== cmd), cmd].slice(-HISTORY_MAX);
      histIdxRef.current = -1;

      const [name, ...args] = cmd.split(/\s+/);
      const command = findCommand(name);

      if (!command) {
        emit([{ t: `zsh: command not found: ${name}`, c: 'red' }]);
        return;
      }

      const ctx: CommandCtx = {
        cwd: cwdRef.current,
        setCwd,
        clear,
        setTheme,
        history: historyRef.current,
        cols: colsRef.current,
      };

      const out = command.run(args, ctx);
      if (out?.length) emit(out);
    },
    [clear, emit, setTheme],
  );

  const runNow = useCallback(
    (cmd: string) => {
      setInput('');
      setCaret(0);
      exec(cmd);
      inputRef.current?.focus({ preventScroll: true });
    },
    [exec],
  );

  // ---- boot -----------------------------------------------------------------
  useEffect(() => {
    const saved = (() => {
      try {
        return window.localStorage.getItem(THEME_KEY);
      } catch {
        return null;
      }
    })();
    applyTheme(findTheme(saved ?? '') ?? THEMES[0]);

    if (bootedRef.current) return;
    bootedRef.current = true;

    emit([
      { t: `Last login: ${loginStamp(new Date())} on ttys000`, c: 'dim' },
      {},
      ...welcome(),
      {},
    ]);
    setBusy(false);
    inputRef.current?.focus({ preventScroll: true });
  }, [emit]);

  // ---- follow the newest output, exactly like a terminal ---------------------
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows, input]);

  // ---- key handling ---------------------------------------------------------
  const syncCaret = useCallback(() => {
    const el = inputRef.current;
    if (el) setCaret(el.selectionStart ?? el.value.length);
  }, []);

  const replaceLine = useCallback((value: string) => {
    setInput(value);
    setCaret(value.length);
    const el = inputRef.current;
    if (el) {
      el.value = value;
      requestAnimationFrame(() => el.setSelectionRange(value.length, value.length));
    }
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const pos = el.selectionStart ?? input.length;

    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input;
      setInput('');
      setCaret(0);
      exec(value);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const { value, matches } = complete(input, cwdRef.current);
      if (matches.length > 1) {
        emit([
          {
            segs: matches.flatMap((m): Seg[] => [
              { t: m, c: m.endsWith('/') ? 'blue bold' : undefined },
              { t: '   ' },
            ]),
          },
        ]);
      }
      if (value !== input) replaceLine(value);
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const hist = historyRef.current;
      if (hist.length === 0) return;
      e.preventDefault();

      if (e.key === 'ArrowUp') {
        if (histIdxRef.current === -1) draftRef.current = input;
        histIdxRef.current = Math.min(hist.length - 1, histIdxRef.current + 1);
      } else {
        histIdxRef.current = Math.max(-1, histIdxRef.current - 1);
      }

      const idx = histIdxRef.current;
      replaceLine(idx === -1 ? draftRef.current : hist[hist.length - 1 - idx]);
      return;
    }

    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      emit([
        {
          segs: [
            { t: `${profile.handle}@${profile.host.split('.')[0]}`, c: 'green bold' },
            { t: ' ' },
            { t: displayPath(cwdRef.current), c: 'blue bold' },
            { t: ' % ', c: 'dim' },
            { t: `${input}^C` },
          ],
        },
      ]);
      replaceLine('');
      histIdxRef.current = -1;
      return;
    }

    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      clear();
      return;
    }

    // readline bindings that browsers do not give us outside macOS
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      el.setSelectionRange(0, 0);
      setCaret(0);
      return;
    }

    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      el.setSelectionRange(input.length, input.length);
      setCaret(input.length);
      return;
    }

    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      replaceLine(input.slice(pos));
      return;
    }

    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      const next = input.slice(0, pos);
      setInput(next);
      el.value = next;
      setCaret(pos);
      requestAnimationFrame(() => el.setSelectionRange(pos, pos));
      return;
    }

    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      const left = input.slice(0, pos).replace(/\s*\S+\s*$/, '');
      const next = left + input.slice(pos);
      setInput(next);
      el.value = next;
      setCaret(left.length);
      requestAnimationFrame(() => el.setSelectionRange(left.length, left.length));
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      replaceLine('');
      return;
    }

    // Any other key moves the caret; read it back after the browser applies it.
    requestAnimationFrame(syncCaret);
  };

  const prompt = useMemo(
    () => ({
      user: `${profile.handle}@${profile.host.split('.')[0]}`,
      path: displayPath(cwd),
    }),
    [cwd],
  );

  const before = input.slice(0, caret);
  const under = input.slice(caret, caret + 1);
  const after = input.slice(caret + 1);

  return (
    <div
      className="desk"
      onMouseUp={() => {
        if (window.getSelection()?.toString()) return;
        inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <main className="win">
        <header className="bar">
          <div className="lights" aria-hidden="true">
            <span className="light close" />
            <span className="light min" />
            <span className="light max" />
          </div>
          <div className="bar-title">
            {profile.handle} — -zsh — {size.cols}×{size.rows}
          </div>
        </header>

        <div className="screen" ref={screenRef}>
          {/* Ten characters wide, used to measure one cell. */}
          <span aria-hidden="true" className="cell-probe" ref={cellRef}>
            0000000000
          </span>

          {rows.map((row) => (
            <div className={`row ${row.c ?? ''}`} key={row.id}>
              {row.segs ? (
                row.segs.map((seg, i) =>
                  seg.run ? (
                    <button
                      className={`seg link ${seg.c ?? ''}`}
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        runNow(seg.run as string);
                      }}
                      type="button"
                    >
                      {seg.t}
                    </button>
                  ) : (
                    <span className={`seg ${seg.c ?? ''}`} key={i}>
                      {seg.t}
                    </span>
                  ),
                )
              ) : (
                <Inline text={row.t ?? ''} />
              )}
            </div>
          ))}

          {!busy && (
            <div className="row prompt">
              <span className="seg green bold">{prompt.user}</span>
              <span className="seg"> </span>
              <span className="seg blue bold">{prompt.path}</span>
              <span className="seg dim"> % </span>
              <span className="seg">{before}</span>
              <span className="cursor">{under || ' '}</span>
              <span className="seg">{after}</span>
            </div>
          )}
        </div>
      </main>

      <input
        aria-label="Terminal input"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className="capture"
        onBlur={() => {
          window.setTimeout(() => {
            if (document.activeElement !== document.body) return;
            if (window.getSelection()?.toString()) return;
            inputRef.current?.focus({ preventScroll: true });
          }, 0);
        }}
        onChange={(e) => {
          setInput(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={onKeyDown}
        onSelect={syncCaret}
        ref={inputRef}
        spellCheck={false}
        value={input}
      />
    </div>
  );
}
