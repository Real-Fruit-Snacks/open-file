# Third-party notices

Open File is licensed under GPL-3.0-or-later (see `LICENSE`). It is built on the following
third-party work. The deployed site distributes the components marked **shipped**; the others are
development-time tools only.

## Shipped in the app

| Component                                                                                                                                                                                                                                                | Licence                                                               | Role                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Stockfish](https://stockfishchess.org/) via [Stockfish.js](https://github.com/nmrugg/stockfish.js) (v19 WASM: lite and full, single-threaded and pthreads builds)                                                                                       | GPL-3.0-only                                                          | Chess engine (`public/engine/`, downloaded by `npm run engine:setup`)                   |
| [Maia-3](https://huggingface.co/UofTCSSLab/Maia3-5M) (5M parameters) by the University of Toronto's Computational Social Science Lab, in the [browser-ready ONNX export](https://huggingface.co/bqrio/maia3-onnx) by bqrio (half-precision weights)      | AGPL-3.0                                                              | The human-like opponent's model (`public/maia/`, installed by `npm run maia:setup`)     |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) (`onnxruntime-web`: its JavaScript and its SIMD WebAssembly build)                                                                                                                          | MIT                                                                   | Runs the human-like opponent's model in a worker                                        |
| [IBM Plex Sans and IBM Plex Mono](https://github.com/IBM/plex) by IBM, as packaged by [Fontsource](https://fontsource.org/) (`src/styles/fonts/`: Plex Sans variable, Latin and Latin Extended, and its Latin italic; Plex Mono 400, 500 and 600, Latin) | OFL-1.1 (`LICENSES/OFL-1.1.txt`, published as `licence-ofl.txt`)      | The interface's type: Plex Sans for text, Plex Mono for code, labels and the app's name |
| [Chessground](https://github.com/lichess-org/chessground) (`@lichess-org/chessground`)                                                                                                                                                                   | GPL-3.0-or-later                                                      | Board rendering, drag & drop, arrows                                                    |
| cburnett piece set (from the Chessground package, re-emitted by `scripts/generate-pieces.mjs` as `src/components/board/pieces/classic.css`)                                                                                                              | CC BY-SA 3.0 — Colin M.L. Burnett                                     | The "Classic" pieces, the default set                                                   |
| Merida piece set by Armando Hernandez Marroquin (from the [Lichess repository](https://github.com/lichess-org/lila), `src/components/board/pieces/merida/`)                                                                                              | GPL-2.0-or-later                                                      | The "Merida" pieces                                                                     |
| [Chessnut](https://github.com/LexLuengas/chessnut-pieces) piece set by Alexis Luengas (from the Lichess repository, `src/components/board/pieces/chessnut/`)                                                                                             | Apache-2.0 (`LICENSES/Apache-2.0.txt`)                                | The "Chessnut" pieces                                                                   |
| MPChess piece set by [Maxime Chupin](https://github.com/chupinmaxime) (from the Lichess repository, `src/components/board/pieces/mpchess/`)                                                                                                              | GPL-3.0-or-later                                                      | The "MPChess" pieces                                                                    |
| Celtic piece set by Maurizio Monge, from [chess-art](https://github.com/maurimo/chess-art) (via the Lichess repository, `src/components/board/pieces/celtic/`)                                                                                           | MIT (notice below)                                                    | The "Celtic" pieces                                                                     |
| California piece set by [Jerry S.](https://sites.google.com/view/jerrychess/home) (from the Lichess repository, `src/components/board/pieces/california/`)                                                                                               | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) | The "California" pieces — **non-commercial use only**                                   |
| Maestro, Staunty and Cardinal piece sets by sadsnake1 (from the Lichess repository, `src/components/board/pieces/{maestro,staunty,cardinal}/`)                                                                                                           | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) | The "Maestro", "Staunty" and "Cardinal" pieces — **non-commercial use only**            |
| Board pictures by the lila authors and [pirouetti](https://lichess.org/@/pirouetti) (from the Lichess repository, `public/images/board/`; in `public/boards/`, with previews scaled down from them in `public/boards/thumbs/`)                           | AGPL-3.0-or-later                                                     | The textured board themes (Wood, Maple, Marble, Newspaper and the rest)                 |
| [chess.js](https://github.com/jhlywa/chess.js)                                                                                                                                                                                                           | BSD-2-Clause                                                          | Move generation, legality, PGN/FEN; the relay referees live games with it               |
| [chessops](https://github.com/niklasf/chessops) by Niklas Fiekas                                                                                                                                                                                         | GPL-3.0-or-later                                                      | Chess960 rules; the relay referees online Chess960 games with it                        |
| [@badrap/result](https://github.com/badrap/result) (a dependency of chessops)                                                                                                                                                                            | MIT (notice below)                                                    | A result type, used by chessops                                                         |
| [React](https://react.dev/) / react-dom                                                                                                                                                                                                                  | MIT                                                                   | UI                                                                                      |
| [React Router](https://reactrouter.com/)                                                                                                                                                                                                                 | MIT                                                                   | Routing                                                                                 |
| [Zustand](https://github.com/pmndrs/zustand)                                                                                                                                                                                                             | MIT                                                                   | State and localStorage persistence                                                      |
| [Workbox](https://developer.chrome.com/docs/workbox) (`workbox-core`, `-precaching`, `-routing`, `-strategies`, `-expiration`, `-cacheable-response`, `-window`; built by vite-plugin-pwa)                                                               | MIT                                                                   | Service worker / offline caching                                                        |
| [Lichess puzzle database](https://database.lichess.org/#puzzles)                                                                                                                                                                                         | CC0 1.0 (public domain)                                               | Puzzle positions and solutions (`public/puzzles/`)                                      |
| [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings)                                                                                                                                                                              | CC0 1.0 (public domain)                                               | ECO opening names and lines (`public/openings/`)                                        |
| [Lichess tablebase API](https://github.com/lichess-org/lila-tablebase) (optional, network)                                                                                                                                                               | Service — not bundled                                                 | Seven-piece endgame lookups when enabled in settings                                    |
| [Lichess opening explorer API](https://lichess.org/api#tag/Opening-Explorer) (optional, network)                                                                                                                                                         | Service — not bundled                                                 | Master and community game statistics per position when enabled in settings              |
| [Lichess](https://lichess.org/api) and [chess.com](https://www.chess.com/news/view/published-data-api) public game APIs (optional, network)                                                                                                              | Services — not bundled                                                | Importing the learner's own games on request                                            |
| [Lichess API](https://lichess.org/api): OAuth, puzzle activity and results, game import and export, studies (optional, network)                                                                                                                          | Service — not bundled                                                 | The account sync, once the learner connects an account                                  |
| [scalalib](https://github.com/ornicar/scalalib) by Thibault Duplessis: the name clean-up rules of `StringOps`, ported to TypeScript (`src/lib/lichess/lichessNames.ts`)                                                                                  | MIT                                                                   | Names sent to Lichess already as Lichess keeps them                                     |
| BIP-39 English word list by Marek Palatinus, Pavol Rusnak, Aaron Voisine and Sean Bowe (from the [bitcoin/bips repository](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt), `src/lib/sync/bip39English.ts`)                            | MIT (notice below)                                                    | The words of the sync recovery phrase                                                   |
| [uqr](https://github.com/unjs/uqr) by Anthony Fu, a port of [Project Nayuki’s QR code generator](https://www.nayuki.io/page/qr-code-generator-library)                                                                                                   | MIT (notice below)                                                    | The QR code that adds a device to sync                                                  |

The sounds, the lessons, courses, endgame drills and the study annotations are original work of this
project and covered by its licence.
The game scores of the classic games and the positions of the endgame studies (Réti 1921, Saavedra 1895
and traditional endings) are public-domain facts; every annotation is written for this project.

Stockfish is GPL-3.0 software. The source code corresponding to the shipped binaries is the
[Stockfish.js v19.0.0 release](https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.0) (built from
the [Stockfish](https://github.com/official-stockfish/Stockfish) sources it names); the exact files and
their SHA-256 checksums are pinned in `scripts/setup-engine.mjs`. The four builds are the same engine:
two embed Stockfish's small network ("lite"), two its large one ("full"), each single-threaded and with
pthreads. A full build reaches a device only when the learner switches the full engine on. The full
GPL-3.0 text ships with the site as `licence.txt`.

Maia-3 is the University of Toronto Computational Social Science Lab's model of human play (Monroe et
al., _Chessformer: A Unified Architecture for Chess Modeling_, ICLR 2026), licensed under the GNU
Affero General Public License v3. The app ships the 5M-parameter model unmodified, exactly as
published in bqrio's ONNX export at a pinned revision (the address and the SHA-256 are in
`scripts/setup-maia.mjs`); the original checkpoints are at
[huggingface.co/UofTCSSLab/Maia3-5M](https://huggingface.co/UofTCSSLab/Maia3-5M). The model reaches a
device only when the learner downloads the human-like opponent. The app combines it with its own
GPL-3.0-or-later code as section 13 of the GPL v3 allows, so the combination also falls under the
AGPL's network clause: the complete source code of the app is the repository linked from the footer of
every page. The AGPL-3.0 text ships with the site as `licence-agpl.txt`.

ONNX Runtime Web is MIT-licensed (© Microsoft Corporation; the build keeps its notice in the
human-like opponent's worker script). Its WebAssembly build contains the open-source components
listed in ONNX Runtime's
[third-party notices](https://github.com/microsoft/onnxruntime/blob/v1.30.0/ThirdPartyNotices.txt).

The rules by which Lichess cleans study and chapter names come from scalalib (MIT); the recovery
phrase's word list is BIP-39's (MIT, Copyright (c) 2013 Marek Palatinus, Pavol Rusnak, Aaron Voisine
and Sean Bowe); uqr, which draws the QR code, is MIT too (Copyright (c) Project Nayuki, Copyright
(c) 2023 Anthony Fu); and so is @badrap/result, which chessops uses (Copyright (c) 2018 Badrap Oy).
Each is under the same permission notice, here with scalalib's copyright line:

> Copyright (c) Thibault Duplessis
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
> associated documentation files (the "Software"), to deal in the Software without restriction,
> including without limitation the rights to use, copy, modify, merge, publish, distribute,
> sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
> NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
> OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
> CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Development tools (not shipped)

Vite, TypeScript, Vitest, Playwright, ESLint, Prettier and their dependencies — MIT/Apache-2.0 licensed.
Run `npx license-checker --summary` for the full transitive list.

## Piece sets

Every set but Classic is copied unchanged from the Lichess repository (`public/piece/<set>/` in
[lichess-org/lila](https://github.com/lichess-org/lila)), where each set's author and licence are
listed in [COPYING.md](https://github.com/lichess-org/lila/blob/master/COPYING.md); the build inlines
the SVGs into one stylesheet per set. `src/components/board/pieces/README.md` lists them again.

**California, Maestro, Staunty and Cardinal are licensed CC BY-NC-SA 4.0 and may not be used
commercially.** The rest of Open File is GPL-3.0-or-later and may be, but these four sets may
not: anyone who sells the app, charges for access or shows ads in it must remove them first (their
folders and stylesheets in `src/components/board/pieces/`, and their ids in
`src/store/settings.ts`, `src/components/board/pieceSets.ts`, `src/components/board/pieceStyles.ts`
and `scripts/pieces/index.mjs`).
Changes to them, if any, must be shared under the same licence.

Merida (GPL-2.0-or-later) and MPChess (GPL-3.0-or-later) are distributed under GPL-3.0, the
licence in `LICENSE`. Chessnut's Apache-2.0 licence is in `LICENSES/Apache-2.0.txt`. Celtic's MIT
licence:

```
MIT License

Copyright (c) Maurizio Monge

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Board themes

The twenty textured boards are Lichess's board pictures, copied unchanged from `public/images/board/`
in [lichess-org/lila](https://github.com/lichess-org/lila) to `public/boards/` (Lichess's
`canvas2.jpg`, `pink-pyramid.png` and `svg/newspaper.svg` are `canvas.jpg`, `pink.png` and
`newspaper.svg` here). [COPYING.md](https://github.com/lichess-org/lila/blob/master/COPYING.md)
credits them to the lila authors and [pirouetti](https://lichess.org/@/pirouetti) under the GNU
Affero General Public License, version 3 or later. The 128-pixel previews in `public/boards/thumbs/`
are scaled-down copies made by `scripts/generate-board-thumbs.mjs`, under the same licence. As with
Maia-3, the app combines them with its own GPL-3.0-or-later code as section 13 of the GPL v3 allows:
the AGPL-3.0 text ships with the site as `licence-agpl.txt`, and the complete source code is the
repository linked from the footer of every page.

The five flat Lichess boards (Brown, Blue, IC, Green and Purple) are not pictures: the app draws
them from their two colours. Ice, Walnut and High contrast are the app's own.

## The offline copy's launchers

Each release also offers an offline copy of the site (`scripts/package-offline.mjs`) with small
launchers for Windows, macOS and Linux that serve it on the computer itself (`launcher/`, part of
Open File, GPL-3.0-or-later). They are built with [Go](https://go.dev/) and contain its runtime
and standard library (BSD-3-Clause, © The Go Authors); every copy carries that licence in
`licences/launcher.txt`. Nothing else is added to the site in the copy.

## Attribution requirements

- The built site carries the licences and these notices: `scripts/postbuild.mjs` copies `LICENSE` to
  `licence.txt`, `LICENSES/AGPL-3.0.txt` to `licence-agpl.txt`, `LICENSES/Apache-2.0.txt` to
  `licence-apache.txt`, `LICENSES/OFL-1.1.txt` to `licence-ofl.txt` and this file to `notices.txt` in `dist/`, and the footer of every page links
  to them. Keep them (and the engine source link above) when redistributing the site.
- Maia-3 (AGPL-3.0) is credited in the footer of every page, next to a link to its licence and one to
  the app's source code; keep both when redistributing the site.
- The board pictures (AGPL-3.0-or-later) are credited here and under the board picker in Settings,
  with a link to their licence, while one of them is the chosen board.
- Every piece set is credited here, under the piece picker in Settings, and in the footer of every
  page while it is the chosen set ("Pieces (Classic): Colin M.L. Burnett, CC BY-SA 3.0", the
  licence linked). The pieces are used unmodified.
- The offline copy carries the site as built (its licences and these notices in `app/`) and the
  launchers' Go licence in `licences/launcher.txt`; keep both when redistributing it.
- Puzzles are CC0 and need no attribution; a link to the source game on Lichess is shown anyway.
  Some lesson tasks and the placement quiz use positions from the same database and say so.
