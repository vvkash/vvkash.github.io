import { useCallback, useEffect, useRef, useState } from 'react';
import { nowPlaying } from '../data/site';
import '../styles/nowplaying.css';

/**
 * Spotify's preview clips are 30 seconds, but the cap is enforced here too so a
 * longer file could never turn the corner of the page into a jukebox.
 */
const CLIP_SECONDS = 30;

/** Quiet enough that an unexpected click isn't a jump scare. */
const VOLUME = 0.55;

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * The record in the bottom right corner. Click the sleeve and it spins, playing
 * a 30 second preview straight from Spotify's CDN.
 *
 * Nothing is fetched until that first click, so the widget costs an idle
 * visitor one image. If the preview ever stops resolving — Spotify has been
 * known to retire them — `dead` flips and the record becomes a plain link to
 * the track rather than a button that silently does nothing.
 */
export default function NowPlaying({ ready }: { ready: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dead, setDead] = useState(!nowPlaying.preview);
  const [sleeve, setSleeve] = useState(Boolean(nowPlaying.art));

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  /** Built on first play, not on mount: no audio is requested until it's wanted. */
  const load = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = VOLUME;
    audio.src = nowPlaying.preview;

    const reset = () => {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      setElapsed(0);
    };

    audio.addEventListener('timeupdate', () => {
      if (audio.currentTime >= CLIP_SECONDS) reset();
      else setElapsed(audio.currentTime);
    });
    audio.addEventListener('ended', reset);
    audio.addEventListener('error', () => {
      setDead(true);
      setPlaying(false);
      setElapsed(0);
    });

    audioRef.current = audio;
    return audio;
  }, []);

  const toggle = useCallback(() => {
    if (dead) {
      window.open(nowPlaying.url, '_blank', 'noopener');
      return;
    }

    const audio = load();
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    setPlaying(true);
    audio.play().catch(() => {
      setPlaying(false);
      setDead(true);
    });
  }, [dead, load, playing]);

  const progress = Math.min(1, elapsed / CLIP_SECONDS);
  const cued = playing || elapsed > 0;
  const action = dead
    ? `Open ${nowPlaying.title} on Spotify`
    : `${playing ? 'Pause' : 'Play'} a 30 second preview of ${nowPlaying.title} by ${nowPlaying.artist}`;

  return (
    <aside
      className={`np${ready ? ' np-in' : ''}${playing ? ' np-on' : ''}${cued ? ' np-cued' : ''}`}
    >
      <button
        aria-label={action}
        aria-pressed={dead ? undefined : playing}
        className="np-disc"
        onClick={toggle}
        title={action}
        type="button"
      >
        <span className="np-vinyl">
          {sleeve && (
            <img
              alt=""
              className="np-art"
              decoding="async"
              onError={() => setSleeve(false)}
              src={nowPlaying.art}
            />
          )}
        </span>
        <span aria-hidden="true" className="np-gloss" />
        <span aria-hidden="true" className="np-ctl">
          <span className={playing ? 'np-pause' : 'np-play'} />
        </span>
      </button>

      <div className="np-meta">
        <div className="np-line">
          <span className="np-label">{dead ? 'on spotify' : nowPlaying.label}</span>
          <span className={playing ? 'np-time np-live' : 'np-time'}>
            {cued ? clock(elapsed) : `${CLIP_SECONDS}s`}
          </span>
        </div>
        <a className="np-title" href={nowPlaying.url} rel="noopener noreferrer" target="_blank">
          {nowPlaying.title}
        </a>
        <div className="np-artist">{nowPlaying.artist}</div>
      </div>

      <span aria-hidden="true" className="np-bar">
        <span className="np-fill" style={{ '--p': progress } as React.CSSProperties} />
      </span>
    </aside>
  );
}
