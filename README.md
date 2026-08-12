# aakashxyz.com

Personal site for **Aakash Shah** — an interactive terminal with neon ASCII name
art and a keyboard-navigable menu.

```
 █████╗  █████╗ ██╗  ██╗ █████╗ ███████╗██╗  ██╗
██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔════╝██║  ██║
███████║███████║█████╔╝ ███████║███████╗███████║
██╔══██║██╔══██║██╔═██╗ ██╔══██║╚════██║██╔══██║
██║  ██║██║  ██║██║  ██╗██║  ██║███████║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
```

Stack: Vite + React + TypeScript. No runtime dependencies beyond React.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # serve the production build
```

---

## Fill in your content

**Everything you need to edit lives in one file: [`src/data/site.ts`](src/data/site.ts).**
Look for the `TODO:` markers.

| Export       | What it controls                                       |
| ------------ | ------------------------------------------------------ |
| `profile`    | Name, handle, tagline, email, social links, resume path |
| `menu`       | The arrow-key selectable list                           |
| `about`      | The `about` section                                     |
| `experience` | Roles, dates, bullets                                   |
| `projects`   | Name, blurb, stack, link                                |
| `skills`     | Grouped skill lists                                     |

Inside any string you can use:

| Markup                | Renders as        |
| --------------------- | ----------------- |
| `**text**`            | bright highlight  |
| `` `text` ``          | accent chip       |
| `[label](https://...)`| clickable link    |

Drop a `resume.pdf` into `public/` and the `resume` command will open it.

### Adding a command

Add an entry to the `registry` array in [`src/lib/commands.ts`](src/lib/commands.ts):

```ts
{
  name: 'blog',
  desc: 'things i wrote',
  aliases: ['writing'],
  run: () => [L('  coming soon.', 'dim'), L()],
}
```

Set `hidden: true` to keep it out of `help` (good for easter eggs).

### Adding a theme

Append to `THEMES` in [`src/lib/themes.ts`](src/lib/themes.ts). It is picked up by
the `theme` command automatically and persists in `localStorage`.

---

## What visitors can do

- **↑ / ↓** move the menu, **Enter** runs the highlighted item
- Type any command; **Tab** autocompletes, **↑ / ↓** recall history once you've typed
- **Ctrl+L** clears, **Ctrl+C** cancels the line
- `help`, `about`, `experience`, `projects`, `skills`, `contact`, `resume`,
  `theme <name>`, `banner`, `clear`
- Hidden: `date`, `echo`, `sudo`, `exit`

---

## Deploying to aakashxyz.com

### The quick way

```powershell
.\scripts\setup-pages.ps1
```

That script signs you in (browser flow — no password is typed into the
terminal), creates the repo, pushes, enables Pages with the GitHub Actions
source, pins the custom domain, waits for the first deploy, prints the DNS
records, waits for them to resolve, then turns on HTTPS enforcement.

It is safe to re-run: it detects an existing repo and picks up where it left
off. Needs [GitHub CLI](https://cli.github.com) (`winget install --id GitHub.cli`).

### Or by hand

The workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
builds and publishes on every push to `main`.

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Pages → Custom domain:** enter `aakashxyz.com` and save.
   (`public/CNAME` already pins the domain so it survives redeploys.)
4. Add the DNS records below.
5. Once they resolve, tick **Enforce HTTPS**.

### DNS records

Apex `aakashxyz.com` needs four `A` records and four `AAAA` records:

| Type   | Name  | Value                       |
| ------ | ----- | --------------------------- |
| A      | `@`   | 185.199.108.153             |
| A      | `@`   | 185.199.109.153             |
| A      | `@`   | 185.199.110.153             |
| A      | `@`   | 185.199.111.153             |
| AAAA   | `@`   | 2606:50c0:8000::153         |
| AAAA   | `@`   | 2606:50c0:8001::153         |
| AAAA   | `@`   | 2606:50c0:8002::153         |
| AAAA   | `@`   | 2606:50c0:8003::153         |
| CNAME  | `www` | `<your-username>.github.io` |

> **This domain is currently on Wix DNS** (`ns6.wixdns.net` / `ns7.wixdns.net`,
> resolving to Wix's parking IPs `185.230.63.x`). Two ways to change that:
>
> - **Edit records at Wix** — Wix dashboard → *Domains* → `aakashxyz.com` →
>   *DNS Records*. If the domain is attached to a Wix site, disconnect it first,
>   otherwise Wix locks the apex `A` records.
> - **Move DNS to Cloudflare** (free, recommended) — add the domain at
>   Cloudflare, copy in the records above, then change the nameservers at Wix to
>   the two Cloudflare gives you. Set the records to **DNS only** (grey cloud)
>   until GitHub has issued the certificate, then you can proxy them.

Verify with `Resolve-DnsName aakashxyz.com -Type A` (or `dig aakashxyz.com`).
Propagation is usually minutes, occasionally up to 24h.

> Worth adding while you're in the DNS panel: a null MX and an SPF record so
> nobody can spoof mail from your domain — `MX @ 0 "."` and `TXT @ "v=spf1 -all"`.
> Skip these if you plan to set up email on the domain.

### Prefer Vercel / Cloudflare Pages / Netlify?

Any of them work with zero config — import the repo, they'll detect Vite
(build `npm run build`, output `dist`), then add `aakashxyz.com` as a custom
domain and follow their DNS instructions. If you go this route, delete
`public/CNAME`.
