#!/usr/bin/env node
/**
 * Renders the README's pictures (docs/screenshots/) from a production build: the hero — the
 * puzzle trainer on a laptop beside a game on a phone — and six tiles: game review, a lesson (the
 * coach answering a move), an
 * opening repertoire, progress, the arcade, and the boards and pieces. They are WebP, so the
 * README stays light.
 *
 *   npm run build && npm run preview          (in one terminal)
 *   npm run readme:screenshots                (in another)
 *
 * Pass another base URL, or the names of some pictures to render only those:
 * `node scripts/readme-screenshots.mjs http://127.0.0.1:4173/ progress boards`. The progress page
 * shows six weeks of a made-up learner's training, dated back from a fixed day, and every random
 * choice, the app's included, is seeded, so the pictures change only when the app does — all but
 * the game review, whose engine analysis can come out a little differently from run to run.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, seedLearner, toWebp } from './lib/screenshots.mjs';

/* global document -- these run inside the page */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screenshots');
const args = process.argv.slice(2);
const BASE = new URL(args.find((arg) => /^https?:/.test(arg)) ?? 'http://127.0.0.1:4173/');
const ONLY = args.filter((arg) => !/^https?:/.test(arg));

/** A tile: the desktop layout at 1280 × 800, written at 1600 × 1000. */
const TILE = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.25 };
const LAPTOP = { viewport: { width: 1100, height: 690 }, deviceScaleFactor: 2 };
const PHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};

/** The day the pictures are taken on: the progress page's history is dated back from it. */
const TODAY = Date.parse('2026-10-06T17:30:00Z');
const DAY = 24 * 60 * 60 * 1000;

/** The Immortal Game (Anderssen v Kieseritzky, London 1851): its review has plenty to say. */
const IMMORTAL_GAME =
  '[Event "London"]\n[Site "London ENG"]\n[Date "1851.06.21"]\n[White "Adolf Anderssen"]\n' +
  '[Black "Lionel Kieseritzky"]\n[Result "1-0"]\n\n' +
  '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 ' +
  '9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 ' +
  '16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 ' +
  '23. Be7# 1-0';

/** A quiet Giuoco Pianissimo after castling, White to move: the phone's game. */
const PIANISSIMO = 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 0 7';
/** A Closed Ruy Lopez with every piece on, White to move: the boards-and-pieces tile. */
const RUY_LOPEZ = 'r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 w - - 1 10';

/** The boards on the boards-and-pieces tile: a board theme each, with a piece set. */
const SHOWCASE = [
  ['wood', 'Wood', 'merida', 'Merida'],
  ['marble', 'Marble', 'california', 'California'],
  ['blue3', 'Blue 3', 'maestro', 'Maestro'],
  ['newspaper', 'Newspaper', 'classic', 'Classic'],
  ['green', 'Green', 'chessnut', 'Chessnut'],
  ['purple-diag', 'Purple diagonal', 'cardinal', 'Cardinal'],
  ['olive', 'Olive', 'staunty', 'Staunty'],
  ['metal', 'Metal', 'mpchess', 'MPChess'],
].map(([board, boardLabel, pieces, piecesLabel]) => ({ board, boardLabel, pieces, piecesLabel }));

/** A seeded generator (mulberry32): the made-up history comes out the same every run. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same generator in the page, in place of Math.random: the app's own choices repeat too. */
function seedPageRandom(seed) {
  let a = seed;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dayKey = (ms) => new Date(ms).toISOString().slice(0, 10);

async function getJson(page, path) {
  const response = await page.request.get(new URL(path, BASE).href);
  if (!response.ok()) throw new Error(`${path}: ${response.status()}`);
  return response.json();
}

/** The lessons in course order, from the generated index the app itself reads. */
async function lessonIds() {
  const source = await readFile(join(ROOT, 'src', 'features', 'learn', 'lessonMeta.ts'), 'utf8');
  return [...source.matchAll(/^\s+id: '([\w-]+)'/gm)].map((match) => match[1]);
}

/** Themes this learner finds hard and easy, so "Strengths and weaknesses" has both. */
const HARD = new Set(['deflection', 'quietMove', 'defensiveMove', 'xRayAttack', 'rookEndgame']);
const EASY = new Set(['fork', 'mateIn2', 'hangingPiece', 'backRankMate', 'mateIn1']);

/**
 * Six weeks of training: about ten rated puzzles on most days (real ones from the bundled set),
 * lessons, drills, games, a Puzzle Rush, a recent backup and a streak still running.
 */
async function progressSeed(page) {
  const random = seeded(1851);
  const index = await getJson(page, 'puzzles/index.json');
  const pool = [];
  for (const band of index.buckets.filter((b) => b.max >= 1100 && b.min <= 2000)) {
    pool.push(...(await getJson(page, `puzzles/${band.files[0]}`)));
  }
  const missed = new Set([40, 37, 33, 30, 26, 21, 17, 14]);
  const trainingDays = [];
  for (let ago = 41; ago >= 0; ago--) {
    if (!missed.has(ago)) trainingDays.push(dayKey(TODAY - ago * DAY));
  }

  // The rating climbs from 1310 towards 1700, as a steady learner's does: each result is drawn
  // around that path, so the chart wanders like real data but always ends in the same place.
  let rating = 1310;
  const total = trainingDays.length;
  const attempts = [];
  const ratingHistory = [];
  const themeStats = {};
  const solvedByTheme = {};
  let solved = 0;
  let failed = 0;
  let solveTimeMs = 0;
  for (const [d, day] of trainingDays.entries()) {
    const goal = 1310 + 390 * ((d + 1) / total) ** 0.9;
    const count = 6 + Math.floor(random() * 9);
    // Evenings, and this afternoon for today's session.
    let at = Date.parse(`${day}T${day === dayKey(TODAY) ? '15' : '19'}:00:00Z`);
    for (let i = 0; i < count; i++) {
      const near = pool.filter((p) => Math.abs(p.rating - rating) < 120);
      const puzzle = near[Math.floor(random() * near.length)] ?? pool[0];
      const tags = puzzle.themes.split(' ');
      const hard = tags.some((t) => HARD.has(t));
      const base = hard ? 0.5 : tags.some((t) => EASY.has(t)) ? 0.86 : 0.72;
      const chance = Math.min(0.95, Math.max(0.2, base + (goal - rating) / 250));
      const outcome = random() < chance ? 'solved' : 'failed';
      const before = rating;
      rating +=
        outcome === 'solved' ? 4 + Math.round(random() * 4) : -(10 + Math.round(random() * 6));
      const durationMs = Math.round(14_000 + random() * 50_000);
      at += Math.round(60_000 + random() * 120_000);
      attempts.push({
        id: puzzle.id,
        puzzleRating: puzzle.rating,
        outcome,
        hintUsed: false,
        hintLevel: 0,
        ratingBefore: before,
        ratingAfter: rating,
        themes: puzzle.themes,
        at,
        durationMs,
      });
      ratingHistory.push({ at, rating });
      for (const tag of tags) {
        const stat = (themeStats[tag] ??= { solved: 0, failed: 0 });
        stat[outcome] += 1;
        if (outcome === 'solved') solvedByTheme[tag] = (solvedByTheme[tag] ?? 0) + 1;
      }
      if (outcome === 'solved') {
        solved += 1;
        solveTimeMs += durationMs;
      } else {
        failed += 1;
      }
    }
  }

  const lessons = Object.fromEntries(
    (await lessonIds()).slice(0, 31).map((id, i) => {
      const at = TODAY - (40 - i) * DAY;
      return [id, { stepsDone: [0, 1, 2, 3], completedAt: at, lastVisitedAt: at }];
    }),
  );
  // From the learner's side: thirteen wins, nine losses, two draws against levels 3 to 5.
  const outcomes = ['win', 'win', 'loss', 'win', 'draw', 'loss', 'win', 'loss', 'win', 'loss'];
  const games = Array.from({ length: 24 }, (_, i) => {
    const color = i % 2 === 0 ? 'white' : 'black';
    const outcome = i === 23 ? 'win' : outcomes[i % outcomes.length];
    const won = color === 'white' ? '1-0' : '0-1';
    const lost = color === 'white' ? '0-1' : '1-0';
    return {
      id: `readme-${i}`,
      at: TODAY - (i * 1.6 + 0.4) * DAY,
      level: 3 + Math.floor(i / 8),
      color,
      result: outcome === 'win' ? won : outcome === 'loss' ? lost : '1/2-1/2',
      reason: outcome === 'draw' ? 'repetition' : 'checkmate',
      plies: 48 + Math.floor(random() * 50),
      pgn: '1. e4 e5 2. Nf3 Nc6 *',
      source: 'play',
    };
  });
  return {
    puzzleRating: rating,
    puzzleRd: 58,
    puzzleVolatility: 0.06,
    lastRatedAt: attempts[attempts.length - 1].at,
    ratedAttempts: attempts.length,
    ratingHistory,
    attempts: attempts.slice(-300).reverse(),
    themeStats,
    lifetime: { attempts: attempts.length, solved, failed, solvedByTheme, solveTimeMs },
    trainingDays,
    streak: { current: 9, best: 16, lastDate: dayKey(TODAY) },
    lessons,
    games,
    rushRuns: [
      { at: TODAY - 9 * DAY, mode: 'timed', score: 21, peakRating: 1720, durationMs: 180_000 },
      { at: TODAY - 2 * DAY, mode: 'timed', score: 26, peakRating: 1805, durationMs: 180_000 },
    ],
    drills: {
      coordinates: { best: 34, attempts: 11, lastAt: TODAY - 3 * DAY },
      vision: { best: 22, attempts: 6, lastAt: TODAY - 5 * DAY },
      'mate-kq': { best: 9, attempts: 3, lastAt: TODAY - 12 * DAY },
      'mate-kr': { best: 14, attempts: 4, lastAt: TODAY - 8 * DAY },
    },
    guessGames: {
      'opera-game': { score: 31, maxScore: 34, completedAt: TODAY - 20 * DAY },
      'immortal-game': { score: 27, maxScore: 46, completedAt: TODAY - 15 * DAY },
      'evergreen-game': { score: 30, maxScore: 48, completedAt: TODAY - 6 * DAY },
    },
    lastBackupAt: TODAY - 2 * DAY,
    lastBackupAttempts: attempts.length - 14,
  };
}

/** Hides the cards between the engine and the review, so the review shows beside the board. */
async function showReviewBesideBoard(page) {
  await page.evaluate(() => {
    for (const card of document.querySelectorAll('.trainer__panel > *')) {
      const text = card.textContent ?? '';
      if (/Opening explorer|Position report|Copy FEN/.test(text) && !/Game review/.test(text)) {
        card.style.display = 'none';
      }
    }
    const trainer = document.querySelector('.trainer');
    const header = document.querySelector('.shell__header');
    if (trainer) {
      const top = trainer.getBoundingClientRect().top + document.documentElement.scrollTop;
      document.documentElement.scrollTop = top - (header?.offsetHeight ?? 60) - 20;
    }
  });
}

/** The square an arrow on a white-side board starts or ends on, from its SVG coordinates. */
function arrowSquares(page) {
  return page.evaluate(() => {
    const line = document.querySelector('cg-container svg.cg-shapes line');
    if (!line) return null;
    const square = (x, y) =>
      `${'abcdefgh'[Math.round(Number(x) + 3.5)]}${Math.round(3.5 - Number(y)) + 1}`;
    return [
      square(line.getAttribute('x1'), line.getAttribute('y1')),
      square(line.getAttribute('x2'), line.getAttribute('y2')),
    ];
  });
}

/** Clicks a square on a board seen from White's side. */
async function clickSquare(page, square) {
  const box = await page.locator('cg-board').first().boundingBox();
  const file = 'abcdefgh'.indexOf(square[0]);
  const rank = Number(square[1]);
  await page.mouse.click(
    box.x + ((file + 0.5) * box.width) / 8,
    box.y + ((8 - rank + 0.5) * box.height) / 8,
  );
}

/** Plays the move the trainer's arrow shows, then waits for its reply and the next arrow. */
async function playArrow(page) {
  // The arrow as it is before the move: read after it, a quick reply may already have replaced it.
  const previous = await page.evaluate(() => {
    const line = document.querySelector('cg-container svg.cg-shapes line');
    return line ? `${line.getAttribute('x1')},${line.getAttribute('y1')}` : '';
  });
  const [from, to] = await arrowSquares(page);
  await clickSquare(page, from);
  await clickSquare(page, to);
  // A move with a note stops the line until Continue; the reply and the next arrow come after.
  const next = page.waitForFunction(
    (before) => {
      const line = document.querySelector('cg-container svg.cg-shapes line');
      return line !== null && `${line.getAttribute('x1')},${line.getAttribute('y1')}` !== before;
    },
    previous,
    { timeout: 10_000 },
  );
  const proceed = page.getByRole('button', { name: /^Continue/ });
  const paused = await Promise.race([
    next.then(() => false),
    proceed.waitFor({ timeout: 10_000 }).then(() => true),
  ]);
  if (paused) await proceed.click();
  await next;
}

/** The tiles, each a function of a fresh page that leaves it ready to capture. */
const TILES = {
  async review(page) {
    const fragment = new URLSearchParams({ pgn: IMMORTAL_GAME, ply: '35' }).toString();
    await page.goto(new URL(`analyze#${fragment}`, BASE).href);
    await page.getByRole('button', { name: 'Review game' }).click();
    await page.locator('.evalgraph').first().waitFor({ timeout: 180_000 });
    await page
      .locator('.engine-status')
      // The search finished at its set depth: one thread (no isolation without the worker), so
      // the same lines every run; only the speed beside them depends on the machine.
      .filter({ hasText: /depth 18\b.*idle/ })
      .waitFor({ timeout: 120_000 });
    await showReviewBesideBoard(page);
  },
  async lesson(page) {
    await page.goto(new URL('learn/forks', BASE).href);
    await page.getByTestId('lesson-task').waitFor();
    // The fork, then the coach: what the move does and why it works; Continue, then Black's reply
    // and the next question.
    await clickSquare(page, 'e4');
    await clickSquare(page, 'f6');
    await page.getByTestId('lesson-play-on').click();
    await page.getByTestId('coach-note').waitFor();
    await page.getByTestId('lesson-task').waitFor();
  },
  async openings(page) {
    await page.goto(new URL('openings/italian', BASE).href);
    await page.getByRole('button', { name: 'Start learning' }).click();
    // (An arrow is an SVG line, which Playwright never counts as visible.)
    await page.locator('cg-container svg.cg-shapes line').first().waitFor({ state: 'attached' });
    // Four moves into the line: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3, the next one shown.
    for (let i = 0; i < 4; i++) await playArrow(page);
  },
  async progress(page) {
    await page.goto(new URL('progress', BASE).href);
    await page.getByRole('heading', { name: 'Puzzle rating' }).waitFor();
  },
  async arcade(page) {
    await page.goto(new URL('arcade', BASE).href);
    await page.getByRole('heading', { name: 'Arcade', level: 1 }).waitFor();
  },
};

/** Opens a page as a seeded learner and runs `go`; the caller captures and closes. */
async function open(browser, device, { settings = {}, progress, clock = false, seed = 1858 }, go) {
  const context = await browser.newContext({
    ...device,
    colorScheme: settings.colorScheme ?? 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    locale: 'en-GB',
    timezoneId: 'UTC',
  });
  if (clock) await context.clock.setFixedTime(TODAY);
  await context.addInitScript(seedPageRandom, seed);
  await context.addInitScript(seedLearner, { progress });
  await context.addInitScript((s) => {
    const state = { animations: false, ...s };
    localStorage.setItem('open-file:settings', JSON.stringify({ state, version: 5 }));
  }, settings);
  const page = await context.newPage();
  await go(page);
  // Let the last animation, the fonts and the engine's arrows settle.
  await page.waitForTimeout(800);
  return { context, page };
}

async function write(page, name, png, quality = 0.86) {
  const webp = await toWebp(page, png, quality);
  await writeFile(join(OUT, name), webp);
  console.log(`  docs/screenshots/${name} (${Math.round(webp.length / 1024)} KB)`);
}

const dataUrl = (png) => `data:image/png;base64,${png.toString('base64')}`;

/** Lays out `body` (HTML around data-URL images) at the device's size and writes it. */
/** The app's own type, IBM Plex Sans, for the captions of a composed image. */
const PLEX_SANS = join(ROOT, 'src', 'styles', 'fonts', 'ibm-plex-sans-latin-wght-normal.woff2');

async function compose(browser, device, name, style, body, quality) {
  const plex = (await readFile(PLEX_SANS)).toString('base64');
  const context = await browser.newContext(device);
  const page = await context.newPage();
  await page.setContent(`<!doctype html><style>
  @font-face {
    font-family: 'IBM Plex Sans';
    font-weight: 100 700;
    src: url(data:font/woff2;base64,${plex}) format('woff2');
  }
  html, body { margin: 0; height: 100%; }
  body {
    font-family: 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }
  ${style}
</style>${body}`);
  await page.evaluate(() =>
    Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]),
  );
  await write(page, name, await page.screenshot({ type: 'png' }), quality);
  await context.close();
}

/** The hero: the puzzle trainer in a laptop window, a game on a phone in the dark theme. */
async function hero(browser) {
  // The seed picks the rated puzzle: a mate in three with White to move.
  const laptop = await open(browser, LAPTOP, { seed: 12 }, async (page) => {
    await page.goto(new URL('puzzles', BASE).href);
    await page
      .locator('.puzzle-status')
      .filter({ hasText: /Your move/ })
      .waitFor();
  });
  const laptopPng = await laptop.page.screenshot({ type: 'png' });
  await laptop.context.close();
  const phone = await open(browser, PHONE, { settings: { colorScheme: 'dark' } }, async (page) => {
    await page.goto(new URL(`play?fen=${encodeURIComponent(PIANISSIMO)}&color=white`, BASE).href);
    // The new-game dialog opens on the position handed over; start the game from it.
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'New game' }).waitFor();
  });
  const phonePng = await phone.page.screenshot({ type: 'png' });
  await phone.context.close();

  await compose(
    browser,
    { viewport: { width: 1200, height: 640 }, deviceScaleFactor: 2 },
    'hero.webp',
    `body {
    position: relative;
    overflow: hidden;
    /* The brand's Dayshift, flat: no gradients, and borders rather than shadows. */
    background: #eceae4;
  }
  .laptop, .phone { position: absolute; }
  .laptop {
    left: 46px;
    top: 43px;
    width: 880px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #d6d3cb;
    box-shadow: 0 1px 2px rgb(26 27 30 / 8%);
  }
  .phone {
    left: 888px;
    top: 42px;
    width: 248px;
    padding: 9px;
    border-radius: 44px;
    background: #1a1d24;
    border: 1px solid #262a33;
  }
  img { display: block; width: 100%; }
  .phone img { border-radius: 35px; }`,
    `<div class="laptop"><img src="${dataUrl(laptopPng)}" alt=""></div>
<div class="phone"><img src="${dataUrl(phonePng)}" alt=""></div>`,
    0.88,
  );
}

/** Eight boards, each a theme with a piece set, as the app draws them. */
async function boards(browser) {
  const shots = [];
  for (const { board, pieces } of SHOWCASE) {
    const shot = await open(
      browser,
      { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 },
      { settings: { boardTheme: board, pieceSet: pieces, showCoordinates: false } },
      async (page) => {
        await page.goto(new URL(`analyze?fen=${encodeURIComponent(RUY_LOPEZ)}`, BASE).href);
        await page.getByRole('switch', { name: 'Engine' }).click();
        await page.locator('cg-board piece').first().waitFor();
      },
    );
    shots.push(await shot.page.locator('.board').first().screenshot({ type: 'png' }));
    await shot.context.close();
  }
  await compose(
    browser,
    TILE,
    'boards.webp',
    `body {
    background: #f6f5f2;
    color: #1a1b1e;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 26px;
  }
  .boards { display: grid; grid-template-columns: repeat(4, 268px); gap: 26px 30px; }
  figure { margin: 0; text-align: center; }
  figure img {
    display: block;
    width: 268px;
    border-radius: 5px;
    border: 1px solid #d6d3cb;
  }
  figcaption { margin-top: 10px; font-size: 15px; font-weight: 600; }
  figcaption span { color: #6b6f78; font-weight: 500; }
  p { margin: 0; font-size: 16px; color: #6b6f78; }`,
    `<div class="boards">${SHOWCASE.map(
      (s, i) =>
        `<figure><img src="${dataUrl(shots[i])}" alt=""><figcaption>${s.boardLabel} <span>· ${s.piecesLabel}</span></figcaption></figure>`,
    ).join('')}</div>
<p>8 of the 28 board themes, each with one of the 9 piece sets</p>`,
  );
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await launchBrowser();
  const wanted = (name) => ONLY.length === 0 || ONLY.includes(name);
  if (wanted('hero')) await hero(browser);
  for (const [name, go] of Object.entries(TILES)) {
    if (!wanted(name)) continue;
    let progress;
    if (name === 'progress') {
      const scratch = await browser.newContext();
      progress = await progressSeed(await scratch.newPage());
      await scratch.close();
    }
    const shot = await open(browser, TILE, { progress, clock: name === 'progress' }, go);
    await write(shot.page, `${name}.webp`, await shot.page.screenshot({ type: 'png' }));
    await shot.context.close();
  }
  if (wanted('boards')) await boards(browser);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
