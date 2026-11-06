# Engine binaries

This directory holds the Stockfish WASM builds behind every feature that needs an engine: **Play**
and its coach, **Analyze** and game review, the endgame drills, the classic games and the arcade's
engine games. The files are **not committed** — they are downloaded and checksum-verified by
`npm run engine:setup`, which also runs automatically before `npm run dev` and `npm run build`.
`npm run engine:setup -- --lite` installs the two lite builds only (about 4 MB instead of 200 MB),
which is all the content checks need.

| File                            | Build         | Purpose                                                       |
| ------------------------------- | ------------- | ------------------------------------------------------------- |
| `stockfish-19-lite-single.js`   | `single`      | Lite engine, one thread: worker bootstrap / Emscripten glue   |
| `stockfish-19-lite-single.wasm` | `single`      | Engine + embedded small NNUE network                          |
| `stockfish-19-lite.js`          | `multi`       | Lite engine with threads (pthreads): the default              |
| `stockfish-19-lite.wasm`        | `multi`       | Engine + embedded small network (shared memory)               |
| `stockfish-19-single.js`        | `full-single` | Full engine, one thread (_Settings → Full engine_)            |
| `stockfish-19-single.wasm`      | `full-single` | Engine + embedded large network (about 99 MB)                 |
| `stockfish-19.js`               | `full-multi`  | Full engine with threads                                      |
| `stockfish-19.wasm`             | `full-multi`  | Engine + embedded large network (shared memory)               |
| `version.json`                  |               | What is installed, written by the setup script (a record)     |

Source: <https://github.com/nmrugg/stockfish.js> (GPL-3.0). Pinned version and
SHA-256 checksums live in [`scripts/setup-engine.mjs`](../../scripts/setup-engine.mjs).

## Which build runs

Two settings and the browser decide (`chooseEngineBuild` in `src/engine/build.ts`):

- **Threads — on by default.** The threaded builds need `SharedArrayBuffer`, which browsers only
  expose to cross-origin-isolated pages. GitHub Pages cannot send the
  `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers that isolation needs, so the
  service worker adds them to every response it serves (`src/sw/isolation.ts`). The first visit has
  no service worker yet and runs one thread; from the next load on, the threaded build runs with all
  cores but one (at most eight, four on phones and tablets). With threads switched off, fewer than
  three cores, or a browser that cannot isolate the page, a one-thread build runs.
- **Full engine — off by default.** The lite builds carry Stockfish's small network and already
  play far above any human level, so the first load and the offline copy stay small. Switching
  _Settings → Full engine_ on downloads the build with the large network that this device runs
  (threaded or not) through the service worker, which keeps it offline; switching it off deletes it.
  Until the download is complete, the lite engine runs.

Only `stockfish-19-lite-single.*` is precached. The threaded lite build is cached the first time it
runs and the full builds when they are downloaded (`src/sw.ts`, cache `open-file-engine`, never
expiring); a new release's service worker deletes the engine files it no longer names. Whatever
build fails to start hands over to a lighter one — full to lite, threads to one thread — so the
engine always starts (`src/engine/EngineClient.ts`).

## Offline installation

If you cannot reach GitHub from your machine, download the eight files (or, with `--lite`, the four
lite ones) from the release page linked above, place them here and run `npm run engine:setup` — it
will verify the checksums and write `version.json`. Or keep them in a folder of their own and run
`npm run engine:setup -- --from <that folder>`, which copies them here with the same checks; the
dev kit ([CONTRIBUTING.md](../../CONTRIBUTING.md#developing-offline)) carries them in
`offline/files/engine/`.
