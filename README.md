# aakashxyz.com

Personal site for **Aakash Shah** — a small terminal that behaves like a real
one. Unix-style commands, a virtual filesystem, tab completion, history and
readline key bindings, dressed in macOS/iTerm2 window chrome.

```
            | |               | |           | |          | |
 __ _  __ _ | | __  __ _  ___ | |__     ___ | |__   __ _ | |__
/ _` |/ _` || |/ / / _` |/ __|| '_ \   / __|| '_ \ / _` || '_ \
\__,_|\__,_||_|\_\ \__,_|\__ \|_| |_|  \__ \|_| |_|\__,_||_| |_|
```

Stack: Vite + React + TypeScript. No runtime dependencies beyond React, and no
webfont — it uses whatever mono font your OS already ships.

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

| Export       | Becomes                                                 |
| ------------ | ------------------------------------------------------- |
| `profile`    | The prompt, the banner line, `whoami`, `~/resume.pdf`    |
| `about`      | `~/about.txt`                                            |
| `experience` | `~/experience/<company>.md` — one file per role          |
| `projects`   | `~/projects/<slug>.md` — one file per project            |
| `skills`     | `~/skills.txt`                                           |
| `contact`    | `~/contact.txt`                                          |

Add a project and a new file appears in the tree automatically — there is no
second place to register it.

Inside any string you can use:

| Markup                | Renders as        |
| --------------------- | ----------------- |
| `**text**`            | bright highlight  |
| `` `text` ``          | accent colour     |
| `[label](https://...)`| clickable link    |

Drop a `resume.pdf` into `public/` and `open resume.pdf` will open it.

### Adding a command

Add an entry to the `registry` array in [`src/lib/commands.ts`](src/lib/commands.ts):

```ts
{
  name: 'blog',
  usage: 'blog',
  desc: 'things i wrote',
  run: () => [L('coming soon.', 'dim')],
}
```

`L(text, colourClass)` is one plain line; `S([...])` is one line built from
coloured segments, where a segment with `run: 'cat about.txt'` becomes
clickable. Set `hidden: true` to keep a command out of `help`.

### Adding a theme

Append to `THEMES` in [`src/lib/themes.ts`](src/lib/themes.ts). It is picked up
by the `theme` command automatically and persists in `localStorage`. Ship the
full ANSI set — output colours are driven entirely by the active scheme.

---

## What visitors can do

- `ls`, `cd`, `pwd`, `cat`, `tree`, `open` — the filesystem is real enough to
  explore, and `ls` colours directories blue and links red like a real shell
- Click any filename in the output to `cd`/`cat`/`open` it
- **Tab** completes both command names and paths; **↑ / ↓** walk history
- **Ctrl+A/E/U/K/W** readline editing, **Ctrl+C** cancels, **Ctrl+L** clears
- `help`, `whoami`, `history`, `theme <name>`, `banner`, `clear`
- Hidden: `date`, `echo`, `uname`, `man`, `sudo`, `exit`

---

## Deploying to aakashxyz.com

### The quick way

```powershell
cd C:\Users\t-aakashshah\aakashxyz
.\scripts\setup.cmd
```

It prints a one-time code (like `A1B2-C3D4`) and opens your browser. Sign in
with your **personal** GitHub account, paste the code, and approve the `repo`
and `workflow` scopes.

> **Why `.cmd` and not the `.ps1` directly?** Windows PowerShell 5.1 ships with
> execution policy `Restricted`, so `.\scripts\setup-pages.ps1` fails with
> *"running scripts is disabled on this system"*. Execution policy doesn't apply
> to `.cmd` files, so the wrapper always works and changes no machine setting.
> It prefers PowerShell 7 and falls back to Windows PowerShell. All arguments
> pass straight through, e.g. `.\scripts\setup.cmd -Private`.
>
> If you'd rather run the `.ps1` directly, either use PowerShell 7 (`pwsh`),
> or allow local scripts for your user once — no admin needed:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

That script signs you in (browser flow — no password is typed into the
terminal), creates the repo, pushes, enables Pages with the GitHub Actions
source, and waits for the first deploy. Your site is then **live immediately at
`https://<your-username>.github.io`** — the custom domain is not required to
get online.

It then prints the DNS records and waits for them to resolve. **The custom
domain is attached only once DNS actually points at GitHub.** That ordering is
deliberate: a user Pages site 301-redirects to its custom domain the moment one
is set, so attaching `aakashxyz.com` while it still points at Wix would take the
site offline. If DNS isn't ready the script says so and leaves the site up.

So the normal flow is: run it once now to go live, add the DNS records, then
re-run it to attach the domain and turn on HTTPS. It's safe to re-run at any
point. Needs [GitHub CLI](https://cli.github.com) (`winget install --id GitHub.cli`).

### Check whether it worked

```powershell
.\scripts\verify.cmd
```

Read-only — changes nothing. It reports sign-in, remote, repo, Pages config,
the last workflow run, whether the URLs actually respond, and where DNS
currently points, marking each line `[ok]`, `[pending]` or `[no]`.

### Or by hand

The workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
builds and publishes on every push to `main`.

1. Push this repo to GitHub. Name it `<your-username>.github.io` so it serves
   from the root — a project repo serves from `/<repo>/` and would need
   `base` changed in `vite.config.ts`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Add the DNS records below and wait for them to resolve.
4. **Only then** — **Settings → Pages → Custom domain:** enter `aakashxyz.com`
   and save. Doing this before DNS resolves takes the site offline, because
   `<your-username>.github.io` starts redirecting to a domain that doesn't
   point at GitHub yet.
5. Once GitHub has issued the certificate, tick **Enforce HTTPS**.

> There's no `CNAME` file in this repo on purpose. When you publish with a
> GitHub Actions workflow, GitHub ignores `CNAME` and reads the custom domain
> from the repo settings instead.

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
| CNAME  | `www` | `<your-username>.github.io` (skip on Wix — see below) |

> **⚠️ First: verify the domain contact email.** Wix sent a verification link to
> the registrant address. If it isn't clicked before the deadline in the Wix
> warning banner, **ICANN requires the domain to be suspended** — it stops
> resolving entirely and nothing below will work. Check that inbox (and spam),
> or hit *Resend Verification Email* in the Wix domain panel. Do this first.
>
> **This domain is registered at Wix** and currently uses Wix DNS
> (`ns6.wixdns.net` / `ns7.wixdns.net`, parked on `185.230.63.x`).
>
> - **Edit the records at Wix** — dashboard → *Domains* → `aakashxyz.com` →
>   *DNS Records*. The domain shows as **Unassigned** (not attached to any Wix
>   site), which is exactly the state where Wix lets you edit DNS. Delete the
>   three parked `185.230.63.x` `A` records and add the ones above.
> - **Skip the `www` CNAME.** Wix reserves the `www` host for connecting a Wix
>   site, so it'll reject that record with *"Hostname already in use"*. The apex
>   `A` records alone are enough — the site works fine at `aakashxyz.com`.
> - **Cloudflare DNS isn't an option yet.** Wix doesn't allow pointing a
>   Wix-registered domain at third-party nameservers, and the domain is under
>   the ICANN 60-day post-registration transfer lock (Wix shows *"available for
>   transfer on Oct 11, 2026"*), so it can't move registrars until then.
>   That lock only blocks *registrar transfers* — editing DNS records at Wix
>   works normally in the meantime, which is all GitHub Pages needs.

### Step by step at Wix

1. Go to **<https://www.wix.com/my-account/domains>**.
2. Click **`aakashxyz.com`** → **Manage DNS Records** (under *Advanced*, or the
   `⋯` menu next to the domain).
3. In the **A (Host)** section, **delete the three parked records** pointing at
   `185.230.63.107`, `185.230.63.171` and `185.230.63.186`. Those are Wix's
   parking page.
4. Add **four A records**, one per IP in the table above. **Leave the Host name
   field blank** — Wix appends `.aakashxyz.com` to whatever you type, so `@`
   becomes the invalid `@.aakashxyz.com` and is rejected. Blank means the root
   domain. (Wix's docs: *"If you're instructed to create a DNS record with the
   @ sign in the Host Name field, leave the Host Name field blank instead."*)
5. Optionally add the **four AAAA records** (also blank host) for IPv6 visitors.
6. **Skip the `www` CNAME** — Wix reserves that host and will reject it with
   *"Hostname already in use"*. Apex-only works fine.
7. Set the lowest TTL Wix offers so it propagates quickly, then **Save**.
   Accept any "this may affect your site" warning — the domain isn't attached
   to a Wix site, so there's nothing to break.

Check it took effect:

```powershell
Resolve-DnsName aakashxyz.com -Type A | Select-Object IPAddress
```

Once that returns the `185.199.x` addresses instead of `185.230.x`, re-run
`.\scripts\setup.cmd` — it detects the change, attaches the domain, and
turns on HTTPS.

Propagation is usually minutes, occasionally up to 24h.

> Worth adding while you're in the DNS panel: a null MX and an SPF record so
> nobody can spoof mail from your domain — `MX @ 0 "."` and `TXT @ "v=spf1 -all"`.
> Skip these if you plan to set up email on the domain.

### Prefer Vercel / Cloudflare Pages / Netlify?

Any of them work with zero config — import the repo, they'll detect Vite
(build `npm run build`, output `dist`), then add `aakashxyz.com` as a custom
domain and follow their DNS instructions. You'd still add the records in the
Wix DNS panel, and the same "verify your contact email first" warning applies.
