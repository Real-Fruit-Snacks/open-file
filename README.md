# open-file

Learn and play chess in your browser, offline

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/cover-dark.svg">
  <img alt="open-file: a rated puzzle on the board, a knight fork shown as an arrow, with the solution and Stockfish's evaluation beside it" src="docs/assets/cover-light.svg" width="100%">
</picture>

Open **<https://real-fruit-snacks.github.io/open-file/>**. To keep it as an app, use the install button in the address bar (Chrome and Edge), _Share → Add to Home Screen_ (iPhone and iPad) or _Menu → Install app_ (Android). Everything it needs downloads on the first visit; after that it works offline, and _Download every puzzle_ in Settings keeps all 48,000 puzzles offline too.

Or take the whole app with you: every [release](https://github.com/Real-Fruit-Snacks/open-file/releases/latest) has `open-file-<version>-offline.zip` (about 190 MB). Unzip it and double-click **Start Open File** (the `.exe` on Windows, the `.command` on macOS, `start-open-file.sh` on Linux); it opens at `http://localhost:8064/` with no internet connection.

A complete chess trainer in one web app: lessons, puzzles, drills, opening repertoires, a Stockfish opponent with a coach, a human-like opponent that plays like a person rated 600 to 2600, game analysis and an arcade of chess games, with nothing to sign up for. No ads and no tracking; progress lives on your device. Sync between devices is end-to-end encrypted with a recovery phrase only you hold, and optional network features are off by default.

The name: in chess, an open file is a column with no pawns on it, the road a rook takes into the game.

## What's in it

**Learn** — 75 interactive lessons in three courses, each a conversation with a coach who says why
every move works, answers your mistakes with the reply that punishes them, and plays combinations
out move by move; a placement quiz that picks your starting point, spaced recall of what you
learned, lessons you already know marked done in a tap, and a gallery of the nineteen named mates.

**Puzzles** — 48,000 engine-verified tactics across eight rating bands, a Glicko-2 rating with
calibration, daily puzzle, Puzzle Rush, blind puzzles (the line in notation only, the board frozen
at the start), Woodpecker sets, a review queue for misses, and puzzles made from the blunders in
your own games.

**Play** — Stockfish 19 at eight levels from a beatable Newcomer to full strength, or a human-like
opponent: Maia-3, a neural network trained on millions of real games, which plays like a person rated
600 to 2600 — the plausible plans and the missed tactics of that rating, not an engine's random
blunders (an optional 25 MB download, run on your device). With clocks, take-backs, hints, a coach
that pauses on a mistake and explains it, a blunder check that asks "checks, captures, threats?"
before a move that hangs material, blindfold play, two players at one device, Chess960 from a new
start position every game, and a start from any position.

**Play online** — live games against people, with no account: post a game at a tap and carry on
with anything else in the app until someone joins, join one from the list, or send a friend a
private link: to a game now, or to a correspondence game of days a move, with a notification when it
is your turn. Moves can be premoved, and friends can watch from a link. Or one of the games made for
two: Chess960, a puzzle race on the same puzzle at the same moment (or a race room for up to
eight), Arbiter and Who Stands Better? duels, Army Draft and blindfold chess. The relay referees,
keeping both clocks; you play under a made-up name, and messages are a few set phrases, so nothing a
stranger types ever reaches you. Signed in to Lichess, the same post looks for an opponent there
too, rated if you like, and the game is played here.

**Analyze** — multi-line analysis by a multi-threaded Stockfish (with its full network as an optional
99 MB download), a full variation tree, a position report, game review with an evaluation graph,
key moments explained in words and a chart of where the clock time went — or analyse the game
yourself first and let the review score what you found — and then a second try at each of your
mistakes. Beside the board, what players of a chosen rating play in the position (and which of
their favourite moves are traps), and your own games that reached it. Analyse a finished game with
your opponent, or any game with friends, on one shared board. Chess960 too, Lichess and chess.com
imports, and shareable links that carry the whole game.

**Sync** — turn on sync between devices and your phone, tablet and computer stay in step: progress,
lessons, review schedules, repertoires, analyses, games and settings, so any device is ready to
play as you left it — and each device can keep any of them to itself. There is no account, only a
12-word recovery phrase (or its QR code), and everything is encrypted on the device before it
leaves. Changes made offline are merged, not overwritten. Or connect your Lichess account and the app keeps
in step with it, both ways: puzzles you solve here count on Lichess, your Lichess puzzle history and
its misses come here, games you play are imported to Lichess, and your own repertoires and saved
analyses live in private Lichess studies.

**Train** — coordinate, vision and endgame drills on a 41-rung ladder, "What's the threat?" (name
the opponent's threat, then meet it — in real positions and in your own games), sixteen opening
repertoires trained with spaced repetition (or import your own, and find the common replies one has
no answer to yet), eight endgame studies and 46 classic games to guess move by move.

**Arcade** — eleven games that are not puzzles: a simul against up to eight engines at once, each
board with its own clocks, Hand & Brain with Stockfish as your partner, a daily opening Wordle, Who
Stands Better?, the Odds Ladder, Army Draft, Fortress, Engine Says, Blindfold, Arbiter (catch the
illegal move in a replayed classic) and Ghost Knight (hunt a knight you only see every third move).
Army Draft, Blindfold, Arbiter and Who Stands Better? can also be played against a person online.

<table>
  <tr>
    <td width="33%"><img src="docs/screenshots/review.webp" alt="Game review of the Immortal Game: the evaluation graph, each side's accuracy and the key moments explained, beside the board and the engine's lines"></td>
    <td width="33%"><img src="docs/screenshots/lesson.webp" alt="A lesson on forks: after the knight fork, the coach says what the move does and why it works, and Black replies"></td>
    <td width="33%"><img src="docs/screenshots/openings.webp" alt="Learning the Italian Game repertoire, the next move shown as an arrow"></td>
  </tr>
  <tr>
    <td align="center">Game review</td>
    <td align="center">Lessons with a coach</td>
    <td align="center">Opening repertoires</td>
  </tr>
  <tr>
    <td width="33%"><img src="docs/screenshots/progress.webp" alt="The progress page: six weeks of puzzle rating, accuracy, streak and training totals"></td>
    <td width="33%"><img src="docs/screenshots/arcade.webp" alt="The arcade of chess games"></td>
    <td width="33%"><img src="docs/screenshots/boards.webp" alt="Eight boards, each in a different board theme with a different piece set"></td>
  </tr>
  <tr>
    <td align="center">Progress</td>
    <td align="center">The arcade</td>
    <td align="center">Board themes and piece sets</td>
  </tr>
</table>

Every section in detail: [docs/FEATURES.md](docs/FEATURES.md). How it is built: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Contributing, especially chess content: [CONTRIBUTING.md](CONTRIBUTING.md) and the [content guide](docs/CONTENT_GUIDE.md).

## Tested on

- Any evergreen browser with WebAssembly and Web Workers: Chrome and Edge 111+, Firefox 121+, Safari 16.4+ (iOS 16.4+)
- CI on every push: lint, typecheck, unit tests with a coverage floor, the puzzle data, the end-to-end suite on desktop and phone Chromium, Firefox and WebKit, visual snapshots and Lighthouse; a separate workflow checks every lesson, drill, study and repertoire move with Stockfish ([what CI runs](CONTRIBUTING.md#what-ci-runs))
- _Not_ tested: browsers older than those above, which lack the features the engine needs

## Known issues

- Browsers give a site about 5 MB of local storage. The app caps what it keeps (recent puzzles, games, analyses) to stay inside it, and keeps running if a write no longer fits; a backup or device sync keeps the rest.
- The human-like opponent (about 25 MB) and Stockfish's full network (about 99 MB) are optional downloads, kept on the device once fetched.
- Device sync, live games and notifications while the app is closed need the relay. The public build uses mine; a fork either deploys its own or turns them off (see Configuration).
- The interface is in British English only.
- Four piece sets (California, Maestro, Staunty, Cardinal) are CC BY-NC-SA 4.0: a commercial fork must remove them.

## Configuration

Everything the app can be set to is under Settings, listed in [docs/FEATURES.md](docs/FEATURES.md). To run or host your own copy:

```bash
git clone https://github.com/Real-Fruit-Snacks/open-file.git
cd open-file
npm install     # Node 22.22 or newer
npm run dev     # downloads the engine and the human-like opponent on first run, then serves http://localhost:5173
npm run check   # CI's quality and build gates: lint, dead code, format, typecheck, unit tests, build, bundle budget
```

To host a fork, enable its workflows on the **Actions** tab, set **Settings → Pages → Source** to **GitHub Actions**, and push to `main`; once CI passes, the deploy workflow publishes it, and a version tag publishes a release with the offline copy. Custom domains and other static hosts: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

`src/site.config.ts` holds the name, URLs and the sync relay. Device sync, live games and pushed notifications go through a small relay of your own, a Cloudflare Worker (free plan) or a plain Node server: [relay/README.md](relay/README.md) shows how to deploy it and what it can and cannot see. Setting `syncRelay` to `''` leaves all three out.

## License

Open File is licensed under the [GNU General Public License v3.0 or later](LICENSE). It bundles
GPL-licensed components that are inseparable from the delivered app (Chessground for the board,
Stockfish for the engine), so a copyleft licence for the whole is the honest choice. The human-like
opponent's model, Maia-3, and Lichess's board pictures are under the GNU Affero General Public
License v3, which the GPL v3 allows the app to be combined with
([LICENSES/AGPL-3.0.txt](LICENSES/AGPL-3.0.txt)). Third-party components
and their licences are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The built site
ships the texts (`licence.txt`, `licence-agpl.txt`, `licence-apache.txt`, `licence-ofl.txt` for the IBM
Plex fonts, and `notices.txt`) and links
them from the footer of every page, next to the credits the components ask for — among them the
chosen piece set's. The piece sets come from the Lichess collection under their own licences; four of
them (California, Maestro, Staunty and Cardinal) are CC BY-NC-SA 4.0 and may not be used commercially,
so a commercial fork must remove them (see THIRD_PARTY_NOTICES.md).
