# Deployment

## GitHub Pages (recommended)

1. Push the repository to GitHub.
2. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` (the site deploys once CI has passed), or trigger **Deploy to GitHub Pages** from
   the Actions tab.

The workflow (`.github/workflows/deploy.yml`) runs when the **CI** workflow completes successfully on
a push to `main`, and on demand. It:

- checks out exactly the commit CI tested,
- installs dependencies with `npm ci --ignore-scripts` (no package runs an install script), then
  downloads and checksum-verifies the engine and the human-like opponent's model (both from a cache
  when it can),
- builds with `VITE_BASE_PATH` taken from `actions/configure-pages` — `/` for `user.github.io`
  repositories, `/<repo>/` for project sites,
- keeps the build's source maps as a workflow artifact (`sourcemaps-<commit>`, 90 days) — they are
  never deployed,
- uploads `dist/` and deploys it with `actions/deploy-pages`.

Every action in the workflows is pinned to a commit SHA, with its version in a comment; Dependabot
moves the pins. First deploys can take a minute to propagate. The site URL is shown on the workflow's
summary page.

The deployed site is about 235 MB, nearly all of it the full engine's two builds (99 MB each) and
the human-like opponent's model and runtime (25 MB). A visitor downloads a full engine only after
switching _Settings → Full engine_ on, and the human-like opponent only after asking for it in the
game setup or in Settings, and keeps either offline from then on; the app's own offline copy is
about 6 MB, plus the threaded lite engine (2 MB). GitHub Pages allows a 1 GB site and has a soft
bandwidth limit of 100 GB a month — on the order of a thousand full-engine downloads, or four
thousand of the human-like opponent.

On a `user.github.io` repository the app owns the whole origin: its service worker is registered at
the root scope and Pages serves its `404.html` for every unknown path. The worker only answers
navigations to the app's own routes (`src/sw/appRoutes.ts`), so another project published under the
same user page keeps working — but `404.html` will still show this app's "not found" page for a path
no project owns. Prefer a project site (`/<repo>/`) when the origin hosts more than one site. CI
builds and tests the app under `/open-file/` too, behind a server that answers like Pages
(`npm run preview:pages -- --base /open-file/` does the same locally after a build with that
`VITE_BASE_PATH`).

### Custom domain

Add a `public/CNAME` file containing your domain, then configure the domain under **Settings → Pages**.
Because the base path becomes `/`, nothing else changes.

### Updating

Every push to `main` that passes CI redeploys. Builds are reproducible: the build date the app shows
is the commit's date (or `SOURCE_DATE_EPOCH`), so redeploying an unchanged commit produces identical
files and no update for anyone. Returning visitors keep the cached version for the moment: the app
looks for a newer build on load, every hour, and whenever it is brought back into view, and once one
is ready it shows a "A new version is ready" toast with a **Reload now** button and otherwise loads
the new version at the visitor's next in-app navigation.

### Releases

Bump `version` in `package.json` and add the version's `CHANGELOG.md` section, then push a matching
tag (`git tag v0.12.0 && git push origin v0.12.0`). The **Release** workflow refuses a tag that does
not match `package.json`. Otherwise it builds the [offline copy](#the-offline-copy) from the tag,
unzips it and tries it in a browser with its own launcher, then publishes a GitHub release for the
tag: that section as the notes, a link to the live app (the `siteUrl` in `src/site.config.ts`), and
`open-file-<version>-offline.zip` with its `SHA256SUMS.txt` attached. A release that failed can
be published again from the **Actions** tab (_Release → Run workflow_, with the tag), from the tag's
own code.

When a release changes how the app looks, refresh the README's pictures before tagging it: run
`npm run build && npm run preview`, then `npm run readme:screenshots` and `npm run readme:art` in
another terminal, and commit `docs/screenshots/` and `docs/assets/`. The pictures are seeded and dated from a fixed day, so a run that
changes one has found a real change in the app — except the game review, whose engine analysis
varies a little from run to run.

### The Lichess sign-in

Nothing to set up: Lichess lets apps without a server sign people in with PKCE and no registration.
The app names itself by its address (`lichess.org` shows the learner the site and path asking) and
asks Lichess to send the learner back to `<site>/settings/lichess`, which the service worker and the
Pages `404.html` fallback both serve. Moving the site to another address only changes that name:
devices already connected keep their tokens. The Content-Security-Policy already allows
`connect-src https://lichess.org`.

### The sync relay

Sync between devices, live games and the notifications that come while the app is closed need a
small relay of your own; the site works without it. Settings offers sync, Play live games, and the
notifications card its correspondence and reminder switches only when `syncRelay` in
[`src/site.config.ts`](../src/site.config.ts) names one.
The relay in [`relay/`](../relay/README.md) runs on Cloudflare Workers with a D1 database for the
vaults and the push reminders, and three Durable Object classes for live games (the waiting room,
the game rooms, and the race and analysis rooms), all of which the free plan covers:

```bash
npm ci --prefix relay
cd relay
npx wrangler@latest login
npx wrangler@latest deploy
```

`npm run relay:deploy` does the same from the repository's root. The relay has two packages, which
referee live games: chess.js, and chessops for Chess960. The first deploy creates the D1 database
(Wrangler 4.45 or later) and writes its id into `relay/wrangler.jsonc`: commit that change. A
deploy that brings the `live-v1` migration (0.26 and later) creates the waiting room's and the game
rooms' Durable Objects; until it has run, Play says live games are not set up on the relay. The
`live-v2` migration (0.29) creates the class of race and analysis rooms, `LiveGroup` (bound as
`LIVE_GROUPS`); without it the relay refuses those rooms (`404`) and everything else goes on. A relay older than the
app may not know its newest games (one from before 0.28 takes only games of chess, one from before
0.29 no Chess960, correspondence, race or analysis rooms), so when a release changes the relay, as 0.28 and
0.29 do, deploy the relay first. Wrangler prints the Worker's address,
`https://open-file-sync.<your-subdomain>.workers.dev`. Put it in `syncRelay`, and the site's
origin in `ALLOWED_ORIGINS` in `relay/wrangler.jsonc`. The page's Content-Security-Policy picks the
relay's origin up from `syncRelay` at build time. To check it, run
`curl https://open-file-sync.<your-subdomain>.workers.dev/v1/health`. A fork that does not want
sync sets `syncRelay` to `''`; one that hosts the relay itself runs `relay/src/server.mjs` behind
HTTPS (see `relay/README.md`).

Deploying the 0.29 relay also sets its two crons (`triggers` in `relay/wrangler.jsonc`): the daily
one, which deletes vaults unused for a year (or never changed after they were made, for 30 days),
reminders unheard of for 60 days and the day-old counts behind the limits per address, and one every 15
minutes, which sends the daily reminders due (at most 25 a run, within the free plan's requests of
its own). Push needs nothing to configure: the Worker makes its push tables in the same D1 database
and its own key pair for Web Push (VAPID) the first time they are needed, and keeps the pair there.
Push messages name a contact for the push services; set `PUSH_CONTACT` in `vars` (`mailto:` or
`https:`) to one you read, or they name the first `https` origin in `ALLOWED_ORIGINS`. The Node
server keeps the same in its SQLite file and sends the reminders every minute; it keeps live games
in memory, so a restart ends them, correspondence games included.

The relay stores only sealed vaults under random names, keeps no logs, and deletes vaults unused for
a year. It limits what one address, and everyone together, can make and write each day, so a script
cannot fill its database or spend its free allowances from one connection; the limits can be
changed in `vars` (`relay/README.md`, "Abuse"). A flood of requests from many addresses can still
use up a day's allowance, until midnight UTC: to stop one before it counts, give the relay a domain
on Cloudflare with a rate-limiting rule in front (the same section shows how). Moving the site to another address only needs the new origin in
`ALLOWED_ORIGINS`: synced data is tied to the recovery phrase, not to the site. A new relay starts empty, though: after `syncRelay` changes, each device
says its synced copy is gone and keeps its data, and turning sync on again starts a new phrase.

### Crash reports

A crash report (the error page's "Copy details" or its pre-filled issue) names the version, the build
date and the commit. The stack is minified; download the `sourcemaps-<commit>` artifact from that
commit's deploy run to read it.

### Renaming and branding

Everything user-visible lives in [`src/site.config.ts`](../src/site.config.ts): the name, tagline,
site and repository URLs and theme colours (the release notes read the site URL from there too).
Replace `scripts/icons/logo.svg` and run `npm run icons:generate` for new icons (and
`npm run screenshots` against a preview of the new build for the install dialog), then update the badge
URLs at the top of `README.md` and the links in `.github/ISSUE_TEMPLATE/config.yml`.

## The offline copy

Each release carries the app for use without a connection: `open-file-<version>-offline.zip`,
which unpacks to

```text
open-file-<version>/
  README.txt                    how to start it, for Windows, macOS and Linux
  Start Open File.exe       the launcher for Windows (x64)
  Start Open File.command   macOS: starts the launcher for Apple silicon or Intel
  start-open-file.sh        Linux: starts the launcher for x64 or Arm64
  app/                          the site, built for the root of a site, with every engine build
  bin/                          the macOS and Linux launchers
  licences/launcher.txt         the launchers' licence notice (they contain Go's standard library)
```

The launcher (`launcher/`, Go, no dependencies) serves `app/` at `http://localhost:8064/` the way
GitHub Pages serves the live site (a path with no file gets `404.html` and a 404), on the loopback
addresses only, with the cross-origin isolation headers on every response, and opens the browser.
The browser keeps the app's data per address, so the port is fixed: a later copy finds the same
progress. When another program holds 8064 the launcher takes the next free port up to 8073 and says
so; `-port` picks one, `-no-browser` leaves the browser closed, `-app` serves another folder. A
second start while a copy runs opens the running one, or asks for it to be closed if it is another
version. The launcher answers `GET /__open-file/launcher` with its name and version, which is how
a second start recognises it.

Sync between devices and live games work from the copy when the computer is online, as long as the
relay lists `http://localhost:8064` in `ALLOWED_ORIGINS` (`relay/wrangler.jsonc` does).

To make the copy yourself — Node, Go 1.24 or newer and `zip`:

```bash
npm run build              # for the root of a site, with the full engine and the human-like opponent
npm run release:offline    # release/open-file-<version>/, its zip and SHA256SUMS.txt
npm run e2e:offline        # starts the unpacked copy with its launcher and tries it in Chromium
```

`release:offline` refuses a build for a sub-path or one without every engine build and the
human-like opponent's files at their pinned checksums. The zip is reproducible: sorted entries, the
commit's date (or `SOURCE_DATE_EPOCH`), and launchers built without paths or build IDs.

## Other static hosts

Any static host works (Netlify, Cloudflare Pages, Vercel, S3 + CloudFront, nginx):

```bash
VITE_BASE_PATH=/ npm run build
# upload dist/ (sourcemaps/ stays behind)
```

Requirements:

- Serve `index.html` for unknown paths (SPA fallback) **or** rely on the generated `404.html`.
- Serve `.wasm` with `Content-Type: application/wasm` (all mainstream hosts do): the service worker
  keeps an engine file offline only when it has that type.
- Keep `licence.txt`, `licence-agpl.txt` and `notices.txt` next to `index.html`: every page links to
  them.
- Serve `maia/` as it is built (no rewriting of `.onnx` or `.wasm` bodies): the app checks the
  human-like opponent's files against their SHA-256 and refuses anything else.

Optional headers:

- `Content-Security-Policy: frame-ancestors 'none'` — the one directive the page's own policy (a meta
  tag in `index.html`) cannot set. The service worker adds it to the pages it serves, but a host
  header also covers the very first visit.
- Not needed for the multi-threaded engine: the service worker adds the `Cross-Origin-Opener-Policy`
  and `Cross-Origin-Embedder-Policy` headers itself to every response it serves, unless the learner
  switches threads off (see `src/sw/isolation.ts`). A host that sends them makes the first visit
  isolated too, and keeps every page isolated even with threads off; the app loads nothing those
  headers would block.

## Environment variables

| Variable            | Default                       | Purpose                                                                        |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `VITE_BASE_PATH`    | `/`                           | URL prefix the site is served from (the end-to-end tests follow it too).       |
| `SOURCE_DATE_EPOCH` | the commit date               | Build date in seconds since 1970, for reproducible builds outside git.         |
| `ALL_BROWSERS`      | unset                         | `1` runs the Firefox and WebKit projects in a local `npm run e2e`, as CI does. |
| `OFFLINE_BUNDLE`    | `release/open-file-<version>` | The unpacked offline copy `npm run e2e:offline` tries.                         |

## Checking a deployment

- Open the site, then go offline (DevTools → Network → Offline) and reload: it should still work,
  including Play and Analyze.
- After that reload, _Settings → Engine diagnostics_ shows "Cross-origin isolated: Yes" and a
  threaded build (on a device that reports at least three CPU cores).
- Chrome DevTools → Application → Manifest: no warnings; "Add to home screen" available.
- The console shows no Content-Security-Policy violations, and the footer's Licence, AGPL-3.0 and
  Third-party notices links open `licence.txt`, `licence-agpl.txt` and `notices.txt`.
- _Settings → Sync between devices → Turn on sync_ shows a recovery phrase and "Synced just now." (a
  failure names the relay's answer; a CORS error in the console means the site's origin is missing
  from `ALLOWED_ORIGINS`).
- _Play → Play the computer → New game → Opponent: A human-like opponent → Download_ fetches about
  25 MB and the game starts; after that, it plays offline too.
- `curl https://open-file-sync.<your-subdomain>.workers.dev/v1/health` answers with
  `"live":true` and `"push":true`, and _Play_ shows the open games connected ("Nobody else is here
  right now"). In a second browser, a game posted in one appears in the other's list, and joining it
  opens the board in both; a puzzle race posted from its tile opens the same puzzle on both boards.
- During that game, _Copy watch link_ gives a `/play/watch/<id>` link; opened in a third browser it
  follows the moves, and the players see "1 watching".
- _Play → Invite a friend_ with a time control from the _Correspondence_ group and _Create the link_
  opens the board waiting for your friend; the link opened in a second browser offers _Join this
  game_, and after a move each, both list the game under _Your correspondence games_ on Play.
- On Play, the puzzle race's _A room for up to eight → Make the room_ opens a room with its link;
  opened in a second browser, _Join the room_ adds that player, and the host's _Start with 2
  players_ starts the race on both. A `404` for `/v1/rooms/…` in the console means the `live-v2`
  migration has not run.
- When a game between the two browsers is over, _Analyse together_ in both opens the same shared
  board with the game's moves; a move played in one appears in the other.
- `curl https://open-file-sync.<your-subdomain>.workers.dev/v1/push/key` answers with the
  relay's public key. _Settings → App → Notifications → Daily reminder_ (in a browser that can show
  notifications; on an iPhone or iPad, the app on the Home Screen) asks for the permission and stays
  on, which means the relay kept the reminder. Set its time to the next quarter hour and close the
  app: the reminder comes at about that time, unless a training day was recorded today.
- _Settings → Lichess account → Connect_ goes to lichess.org, asks for the puzzle and study
  permissions and comes back to Settings connected; the card then reads "Synced just now", and a
  private study named _Open File · Repertoires_ appears on Lichess once there is a custom
  repertoire. _Disconnect_ withdraws the permission (the app then disappears from the third-party apps in
  the Lichess account's settings).
- `npm run lighthouse` against a preview of the same build passes its accessibility, best-practices
  and SEO floors (Lighthouse no longer has a PWA category).
