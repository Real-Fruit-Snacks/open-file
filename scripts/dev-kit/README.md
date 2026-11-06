# Open File {{VERSION}}: the dev kit

Everything needed to build, test and change Open File {{VERSION}} on Windows x64 with no internet
connection, except Node.js and Go: the source at commit `{{COMMIT}}` (the `v{{VERSION}}` tag),
every npm package it installs, the engine, the human-like opponent's model and the headless
Chromium the end-to-end tests run in. `offline/setup.ps1` installs them from the kit and downloads
nothing.

## Install first

| Tool            | Version CI uses  | Needed for                                                                                                        | Offline installer |
| --------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------- |
| Node.js         | {{NODE_VERSION}} | everything; with npm {{NPM_VERSION}}; {{NODE_MINIMUM}} or newer works                                             | <{{NODE_URL}}>    |
| Go              | {{GO_VERSION}}   | the launcher (`launcher/`); {{GO_MINIMUM}} or newer works                                                         | <{{GO_URL}}>      |
| Git for Windows | {{GIT_VERSION}}  | optional: commits; one unit test also checks the launcher's shell scripts with its `sh`, when that is on the PATH | <{{GIT_URL}}>     |

The Node.js and Go installers are the official standalone ones (`.msi`), which install with no
network.

## Set up

Unzip the kit into a short folder, such as `C:\src`. Its longest path is {{LONGEST_PATH}}
characters, and Windows' _Extract All_ stops at 260, counting the folder it unzips into; Windows'
`tar` has no such limit. In PowerShell (Windows PowerShell 5.1 or PowerShell 7):

```powershell
tar -xf {{ZIP}} -C C:\src
cd C:\src\{{FOLDER}}
Set-ExecutionPolicy -Scope Process Bypass
.\offline\setup.ps1
```

`setup.ps1` checks Node.js and Go and says what is missing, then:

- installs the npm packages of the app and of `relay/` from `offline/npm-cache/`
  (`npm ci --offline --cache offline/npm-cache --ignore-scripts`, as CI installs them);
- installs the engine and the model into `public/engine/` and `public/maia/` from `offline/files/`
  (`node scripts/setup-engine.mjs --from offline/files/engine`, and `setup-maia.mjs` likewise),
  checked against the same pinned SHA-256 checksums as a download;
- points Playwright at `offline/files/ms-playwright/` for that window (`PLAYWRIGHT_BROWSERS_PATH`).

It can be run again at any time. The execution policy line lets the window run the script and
lasts until it closes.

## Then

```powershell
npm run check                                     # lint, dead code, format, types, unit tests, build, budgets
npx playwright test --project=desktop-chromium    # end-to-end tests, against the build
cd launcher; go vet ./...; go test ./...; cd ..   # the launcher
npm run dev                                       # the app on http://localhost:5173, with hot reload
```

In a new PowerShell window, point Playwright at the kit first:
`$env:PLAYWRIGHT_BROWSERS_PATH = "C:\src\{{FOLDER}}\offline\files\ms-playwright"`.
`CONTRIBUTING.md` describes the project and the rest of the scripts.

## What is in it

```text
{{FOLDER}}/            the repository at v{{VERSION}} (git archive: no .git folder)
  offline/
    README.md                 this file
    setup.ps1                 the setup (its source: scripts/dev-kit/setup.ps1)
    kit.json                  what the kit holds and asks for, which setup.ps1 reads
    npm-cache/                the {{PACKAGES}} npm packages npm ci installs on Windows, for the app and relay/
    files/engine/             Stockfish {{ENGINE_VERSION}}, its four builds (scripts/setup-engine.mjs)
    files/maia/               {{MAIA_MODEL}}, Maia-3 (scripts/setup-maia.mjs)
    files/ms-playwright/      {{BROWSER_FOLDER}}: Chrome Headless Shell {{BROWSER_VERSION}}, for Playwright {{PLAYWRIGHT_VERSION}}
    licences/                 the licence and notices of everything above (README.md lists them)
```

## What it leaves out

- **Node.js, Go and Git**: install them from the table above.
- **Chrome for Testing**, the Chromium Playwright runs with a window (`--headed`, `--debug`,
  `npm run e2e:ui`): Google's terms for it do not allow passing it on. Point Playwright at Microsoft
  Edge instead:
  `$env:PLAYWRIGHT_CHROMIUM_PATH = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"`.
- **Firefox and WebKit**, which run the cross-browser sample in CI (`ALL_BROWSERS=1`) on every
  change. The kit keeps to the Chromium that `npm run e2e` runs in; and Playwright's WebKit for
  Windows carries no notices for the libraries inside it, so the kit could not pass it on.
- **`zip`**, which `npm run release:offline` packs the offline copy with: the release workflow runs
  that on Linux.
- **What needs the internet anyway**: `npm run puzzles:import` and `openings:import` (they rebuild
  the puzzles and openings from Lichess's data), `npm run relay:deploy` (Cloudflare),
  `npm run lighthouse` (it starts an installed Chrome), adding or updating npm packages, and the
  app's own online features (Lichess, sync, live games).
- The visual snapshots (`npm run e2e:visual`) are drawn with Ubuntu's fonts, so they differ on
  Windows.
