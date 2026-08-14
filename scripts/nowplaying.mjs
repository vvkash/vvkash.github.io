/**
 * Turns a Spotify track link into the `nowPlaying` block in src/data/site.ts.
 *
 *     node scripts/nowplaying.mjs https://open.spotify.com/track/xxxx
 *
 * Spotify's embed page carries everything needed — title, artists, cover art
 * and the 30 second preview — in a JSON blob, so this needs no API key and no
 * app registration. Paste the printed object over the one in site.ts.
 */

const input = process.argv[2];

if (!input) {
  console.error('usage: node scripts/nowplaying.mjs <spotify track link>');
  process.exit(1);
}

const id = input.match(/track[/:]([a-zA-Z0-9]+)/)?.[1];

if (!id) {
  console.error(`not a Spotify track link: ${input}`);
  console.error('expected something like https://open.spotify.com/track/6plFovfD8ciYHHKobwAnnI');
  process.exit(1);
}

const res = await fetch(`https://open.spotify.com/embed/track/${id}`, {
  headers: { 'user-agent': 'Mozilla/5.0' },
});

if (!res.ok) {
  console.error(`spotify returned ${res.status} for track ${id}`);
  process.exit(1);
}

const html = await res.text();
const blob = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)?.[1];

if (!blob) {
  console.error('could not find the track data on the embed page.');
  console.error('spotify probably changed its markup — check the page by hand.');
  process.exit(1);
}

const track = JSON.parse(blob).props?.pageProps?.state?.data?.entity;

if (!track?.title) {
  console.error('the embed page had no track on it. is the link right?');
  process.exit(1);
}

// Largest cover Spotify offers, rehosted on i.scdn.co: the hostname in the
// embed payload is geographic and won't resolve the same way for every visitor.
const cover = [...(track.visualIdentity?.image ?? [])].sort((a, b) => b.maxWidth - a.maxWidth)[0];
const art = cover ? `https://i.scdn.co/image/${cover.url.split('/image/')[1]}` : '';
const preview = track.audioPreview?.url ?? '';

if (!preview) {
  console.warn('! this track has no 30s preview. the widget will link to Spotify instead.\n');
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

console.log(`export const nowPlaying = {
  label: 'favorite song rn',
  title: ${q(track.title)},
  artist: ${q((track.artists ?? []).map((a) => a.name).join(', '))},
  url: ${q(`https://open.spotify.com/track/${id}`)},
  art: ${q(art)},
  preview: ${q(preview)},
};`);
