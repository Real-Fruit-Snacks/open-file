# Contributing

Thanks for helping make chess more approachable. This document explains how the project is organised
and what we expect from a change.

## Development setup

```bash
git clone https://github.com/Real-Fruit-Snacks/open-file.git
cd open-file
npm install
npm run dev
```

`npm run dev` downloads the pinned Stockfish lite builds into `public/engine/` on first run (about 4 MB)
and starts Vite with hot reload. `npm run build` also fetches the full engine's two builds (about 200 MB,
once; see [`public/engine/README.md`](public/engine/README.md)). Node 22.22 or newer is required (see
`.nvmrc`). Every script works the same on Windows, macOS and Linux, and `.gitattributes` keeps line
endings LF on every platform.

Before opening a pull request run:

```bash
npm run check        # lint + dead code + format check + typecheck + unit tests + build + budgets
npm run e2e          # optional, needs: npx playwright install --with-deps chromium
```

`npm run e2e` runs the desktop and phone Chromium projects. CI also runs Firefox and WebKit; to run
them locally, install them (`npx playwright install --with-deps firefox webkit`) and set
`ALL_BROWSERS=1`.

### What CI runs

- **CI** (`.github/workflows/ci.yml`, every pull request and push to `main`):
  - lint, the dead-code and dependency check, the format check, the typecheck, the unit tests with
    the coverage floor (`npm run test:coverage` fails below the thresholds in `vite.config.ts`) — the
    human-like opponent's model installed, so the test that runs it on real positions is not
    skipped — and the puzzle data validator;
  - a production build with the bundle budget, then the end-to-end suite against it in four
    browser projects (desktop and phone Chromium, Firefox, WebKit), each split across runners
    (four shards for each Chromium project, three for Firefox and for WebKit), whose reports the
    _End-to-end report_ job merges into one HTML report (`playwright-report`, with the traces and
    screenshots of failures); then the visual snapshots and the Lighthouse audit;
  - a second build under the production base path (`/open-file/`), served the way GitHub Pages
    serves it (`npm run preview:pages`), with a smoke test, a deep link and the 404 fallback;
  - the offline copy: the launcher's `gofmt` check, `go vet` and tests on Linux, Windows and macOS,
    then the copy packaged from the build (`npm run release:offline`), unzipped and tried in
    Chromium with its own launcher (`npm run e2e:offline`).

  A pull request that changes only documentation (Markdown, `docs/`, the issue and PR templates)
  skips the builds, the browsers and the audits. Pull requests and pushes allow two retries per
  end-to-end test; the nightly run fails when a test needed one (`PLAYWRIGHT_FAIL_ON_FLAKY=1`), so a
  flaky test is reported every day until it is fixed.

- **Content** (`.github/workflows/content.yml`): the Stockfish checks of the chess content —
  `lessons:verify`, `studies:verify`, `repertoires:verify` and `drills:verify` — whenever a pull
  request or push touches the lessons, studies, repertoires, endgame drills or the checks
  themselves, every Monday, and on demand.
- **README art** (`.github/workflows/readme-art.yml`): plays the lesson the README's moving picture
  shows in a production build (`npm run readme:art -- --check`) and fails when the coach's words or
  the moves no longer match the picture, whenever a pull request or push touches the lessons, the
  board or the picture; the pictures it drew are its artifact. A workflow of its own, so a stale
  picture never holds up a deploy.
- **Links** (`.github/workflows/links.yml`): every link in the Markdown, checked with lychee when the
  Markdown changes on `main` and once a month.
- **Deploy** runs only after CI has passed on `main`, and builds exactly the commit CI tested.
- **Release** runs on a version tag: it builds the offline copy from the tag, tries it as CI does,
  and publishes the GitHub release with the copy attached (see
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#releases)).

### Scripts

| Command                      | Purpose                                                                                                                                                                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                | Start Vite with hot reload on <http://localhost:5173> (downloads the engine and the human-like opponent on first run).                                                                                                                                                                                                      |
| `npm run check`              | Lint, dead-code check, format check, typecheck, unit tests, production build and bundle budget — CI's quality and build gates, run locally.                                                                                                                                                                                 |
| `npm run lint:dead`          | Unused files, exports and dependencies (knip); runs in `check` and CI.                                                                                                                                                                                                                                                      |
| `npm test`                   | Unit tests (Vitest: the app's in the `vmThreads` pool, the relay's, the scripts' and a few others on `forks`); `npm run test:watch` for watch mode, `npm run test:coverage` for a coverage report and the floor CI enforces.                                                                                                |
| `npm run e2e`                | Playwright end-to-end tests, including the axe-core accessibility sweep, against the production build; Chromium only unless `ALL_BROWSERS=1`.                                                                                                                                                                               |
| `npm run build`              | Production build to `dist/`, with `404.html`, `.nojekyll`, `licence.txt`, `licence-agpl.txt` and `notices.txt` for GitHub Pages; source maps go to `sourcemaps/`.                                                                                                                                                           |
| `npm run bundle:check`       | Fail when a gzipped chunk, the start-up code or the service-worker precache outgrows its budget (runs in `check` and CI).                                                                                                                                                                                                   |
| `npm run lighthouse`         | Lighthouse audit of five pages against a running preview (`npm run preview` first); fails on regressions.                                                                                                                                                                                                                   |
| `npm run e2e:visual`         | Pixel snapshots of the static pages; add `-- --update-snapshots` after a deliberate design change.                                                                                                                                                                                                                          |
| `npm run release:offline`    | Package the offline copy a release attaches from `dist/` (a build for the root of a site): the app, the launchers for Windows, macOS and Linux (built with Go 1.24 or newer), a README, as `release/open-file-<version>-offline.zip` with `SHA256SUMS.txt`.                                                                 |
| `npm run e2e:offline`        | Start the unpacked offline copy in `release/` with its own launcher and try it in Chromium (`OFFLINE_BUNDLE` names another unpacked copy).                                                                                                                                                                                  |
| `npm run preview`            | Serve the production build locally.                                                                                                                                                                                                                                                                                         |
| `npm run preview:pages`      | Serve `dist/` as GitHub Pages does (404.html for unknown paths); `-- --base /open-file/` for a build made with that `VITE_BASE_PATH`.                                                                                                                                                                                       |
| `npm run engine:setup`       | (Re)download the pinned Stockfish builds into `public/engine/` and write its `version.json`; `-- --lite` for the two lite builds only.                                                                                                                                                                                      |
| `npm run maia:setup`         | Install the human-like opponent's files into `public/maia/`: the pinned Maia-3 model (downloaded) and ONNX Runtime's WebAssembly build (copied from `node_modules`), both checksum-verified. A build needs them; `npm run dev` only warns when they cannot be installed.                                                    |
| `npm run puzzles:import`     | Rebuild the puzzle set from the Lichess database.                                                                                                                                                                                                                                                                           |
| `npm run puzzles:verify`     | Validate the bundled puzzles; add `--engine 40` for an engine spot-check.                                                                                                                                                                                                                                                   |
| `npm run puzzles:reindex`    | Rebuild `public/puzzles/index.json` from the chunk files after editing them by hand.                                                                                                                                                                                                                                        |
| `npm run openings:import`    | Rebuild the ECO opening table and the opening lines from lichess-org/chess-openings at the pinned commit (`-- --ref <commit>` to move it).                                                                                                                                                                                  |
| `npm run lessons:verify`     | Engine-verify every lesson task, line, scripted reply and refutation (slow; `-- --shard 1/6` runs a sixth; the Content workflow runs six shards).                                                                                                                                                                           |
| `npm run lessons:index`      | Regenerate the lightweight lesson index every list of lessons reads (also runs before build).                                                                                                                                                                                                                               |
| `npm run lessons:preview`    | What the coach says to every legal move of a lesson (`-- forks --engine` scores each move with Stockfish and flags second solutions).                                                                                                                                                                                       |
| `npm run engine:analyse`     | Stockfish's best lines for a position, in SAN (`-- "<fen>" --moves "e4 e5" --depth 22 --multipv 4`).                                                                                                                                                                                                                        |
| `npm run drills:verify`      | Engine-verify the endgame drill positions.                                                                                                                                                                                                                                                                                  |
| `npm run studies:verify`     | Engine-verify every endgame study (accepted moves keep the goal, alternatives that are not listed do not).                                                                                                                                                                                                                  |
| `npm run repertoires:verify` | Engine-verify every move of the built-in repertoires (a learner move within 120 centipawns of the engine's best, an opponent move within 300).                                                                                                                                                                              |
| `npm run arcade:positions`   | Re-evaluate the classic-game positions used by Who Stands Better? and Fortress (slow).                                                                                                                                                                                                                                      |
| `npm run icons:generate`     | Re-render the PWA icons (standard, maskable, monochrome, shortcuts) from `scripts/icons/logo.svg`.                                                                                                                                                                                                                          |
| `npm run screenshots`        | Re-render the install-dialog screenshots in `public/screenshots/` from a running preview (`npm run build && npm run preview` first).                                                                                                                                                                                        |
| `npm run readme:screenshots` | Re-render the README's pictures in `docs/screenshots/` (the hero and six screens, WebP) from a running preview (`npm run build && npm run preview` first); seeded, so only a change in the app changes them (the game review's engine analysis aside).                                                                      |
| `npm run readme:art`         | Redraw the README's moving picture (`docs/assets/smothered-mate-*.svg`, a lesson played in the app) and the social card (`docs/assets/social.png`) from a running preview (`npm run build && npm run preview` first); `-- --check` fails if the lesson no longer matches the picture.                                       |
| `npm run pieces:generate`    | Rebuild the piece-set stylesheets (`src/components/board/pieces/<set>.css`) from the sets' SVGs beside them (sources and licences in `pieces/README.md`).                                                                                                                                                                   |
| `npm run boards:thumbs`      | Re-render the 128-pixel board previews in `public/boards/thumbs/` from the board pictures beside them (Lichess's, AGPL-3.0; see THIRD_PARTY_NOTICES.md), with Playwright's Chromium.                                                                                                                                        |
| `npm run relay:dev`          | Run the relay on <http://localhost:8787> with nothing kept (`relay/src/server.mjs --db :memory:`): device sync, live games and push; point `syncRelay` in `src/site.config.ts` at it to try them locally.                                                                                                                   |
| `npm run relay:deploy`       | Install the relay's two packages, chess.js and chessops (`npm ci --prefix relay`), and deploy it to Cloudflare Workers with Wrangler 4 (`relay/wrangler.jsonc`; the first deploy makes its D1 database, the `live-v1` and `live-v2` migrations its Durable Objects, and the triggers its two crons). See `relay/README.md`. |

## Project layout

```
src/
  app/          shell, routing, PWA registration, theme, platform integrations
  chess/        chess.js helpers, Chess960 on chessops, the PGN parser, the move tree and the
                useChess hook (pure logic, well tested)
  engine/       UCI worker client, strength levels, engine build choice; maia/: the human-like opponent
  components/   board wrapper, chess widgets, generic UI primitives
  features/     one folder per area: home, placement, learn, puzzles, drills, patterns, studies,
                openings, classics, play, live, analyze, games, arcade, progress, reference, settings,
                lab, search (quick search), notifications
  store/        persisted settings, progress, repertoires, games, analyses and profiles (zustand)
  lib/          rating maths, scheduling, imports, backups, share links, sound, dates;
                lichess/: the Lichess account sync; sync/: sync between devices (phrase, crypto, merge)
  test/         test set-up, the stand-ins (lichess.org with its Board API, the relay's vaults and
                live games) the tests talk to
  sw/, sw.ts    the service worker and the helpers it shares with the page
scripts/        engine and model downloads, content checks, puzzle and opening imports, build steps, CI helpers
public/         static assets: engine and maia (downloaded), puzzles, openings and board pictures
                (committed), icons
e2e/            Playwright end-to-end tests and the accessibility sweep
relay/          the relay: a Cloudflare Worker (or Node server) keeping sealed vaults, refereeing
                live games (relay/src/live/, platform-free, with Durable Objects on Cloudflare) and
                sending Web Push (relay/src/push/)
launcher/       the offline copy's launcher (Go): serves the app on this computer and opens the
                browser; bundle/: the start scripts, README and notice the copy carries
docs/           feature reference, architecture, content and deployment guides
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design of each part.

## Kinds of contributions

### Lessons and content

The most valuable contributions. Lessons live in `src/features/learn/lessons/` as plain data, each
step a conversation with a coach; the [content guide](docs/CONTENT_GUIDE.md) explains the format, the
coach's voice, the rules for positions and how to verify a position with the engine. Every lesson is
validated by `lessons.test.ts` — run `npm test` and it will tell you if a FEN is illegal, a task move is
impossible, a "mate in one" is not actually mate or the coach says too much. While writing, `npm run
lessons:preview -- <lesson-id> --engine` shows what the coach says to every move. After adding a lesson
run `npm run lessons:index` (every list of lessons reads a generated index) and `npm run lessons:verify`
(Stockfish checks every task, line and refutation). Endgame studies (`src/features/studies/`),
courses, drills, repertoires and classic games follow the same pattern; `npm run studies:verify`,
`npm run repertoires:verify` and `npm run drills:verify` are their engine checks. The Content workflow
runs all of them on your pull request when it touches the content.

### Puzzles

The bundled set is generated, not hand-written. To change it (more puzzles, different filters), edit
the options of `scripts/import-lichess-puzzles.mjs`, re-run it, then run `npm run puzzles:verify`
(add `--engine 40` for an engine spot-check) and commit the regenerated `public/puzzles/`. Only the
first chunk of each rating band is precached for offline use; `npm run bundle:check` fails if the
precache outgrows its budget.

### Code

- Keep logic out of components: hooks (`useX`) own state machines, components render them.
- Anything with rules (rating maths, puzzle selection, UCI parsing, task judging) needs unit tests.
- Prefer no new runtime dependencies; the bundle is intentionally small.
- The page carries a Content-Security-Policy: a call to a new origin must be added to
  `CONNECT_ORIGINS` in `scripts/lib/html.ts`, or the browser refuses it.
- The Lichess sync is tested against a stand-in lichess.org (`src/test/fakeLichess.ts`) that answers
  as the Lichess server does; when the sync starts using another endpoint, add it there, following
  the server's code, and the unit and end-to-end tests can use it at once.
- Sync between devices is tested against the real relay behind a `fetch` stub
  (`src/test/fakeRelay.ts`, which can also drop answers), with stand-ins for the Cache API and Web
  Locks (`fakeCaches.ts`, `fakeLocks.ts`) and for another device (`syncDevices.ts`). A change to
  how the sync keeps or agrees its base needs a case in `src/lib/sync/integrity.test.ts` or
  `restart.test.ts`: nothing may be counted twice, or taken for deleted, at any step.
- Live games are tested against the relay's own rules: `relay/live.test.ts` runs them on a clock
  the test moves, the app's tests run them behind a stand-in `WebSocket` (`src/test/fakeLiveHub.ts`),
  and the end-to-end tests behind Playwright's WebSocket routes (`e2e/live.ts`), two browser
  contexts playing each other. A change to the protocol goes into `relay/src/live/shared.mjs` or
  the cores first, with a test there, and `relay/README.md` lists the messages. A new kind of group
  room is a module beside `relay/src/live/raceRoom.mjs`, registered in `groupKinds.mjs`.
- Unit tests run in two pools (`vite.config.ts`). The app's run in Vitest's `vmThreads` pool:
  each file has a fresh context, so its modules and stores are its own, but the contexts share a
  worker. A test that replaces `window.location` (a vm context keeps jsdom's fixed), or tells errors
  apart with `instanceof` across realms (a vm context's errors come from another), goes in
  `FORKED_TEST_FILES`, which run on `forks` with the relay's and the scripts' tests.
  `src/test/vmGlobals.ts` lends the vm contexts what jsdom lacks and
  the app uses (`crypto.subtle`, the web streams): a missing web API goes there.
- Accessibility matters: every interactive element is keyboard reachable, status changes are announced
  through `role="status"`, and the layout works from 320 px wide upwards.
- Follow the existing style — Prettier and ESLint enforce most of it (`npm run lint:fix`, `npm run format`).

### Translations

The UI strings are currently in English only and live next to the components. If you want to add a
language, open an issue first so we can agree on an approach (likely a small message catalogue) before
you spend time on it.

## Pull requests

- One topic per PR; small PRs are reviewed faster.
- Fill in the PR template, including screenshots for visual changes.
- Add or update tests, and keep `npm run check` green.
- By contributing you agree that your work is licensed under GPL-3.0-or-later like the rest of the project.

## Reporting problems

Use the issue templates. For a bug in a position (engine disagrees, wrong solution, illegal move),
include the FEN or the puzzle ID shown in the "About this puzzle" panel. Security problems go through
private vulnerability reporting instead — see [SECURITY.md](SECURITY.md).

## Code of conduct

Be kind and constructive. We follow the [Contributor Covenant](CODE_OF_CONDUCT.md).
