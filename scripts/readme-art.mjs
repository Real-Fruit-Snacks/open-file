#!/usr/bin/env node
/**
 * Draws the moving picture at the top of the README, docs/assets/smothered-mate-light.svg and
 * smothered-mate-dark.svg, and the repository's social card, docs/assets/social.png, from a
 * production build:
 *
 *   npm run build && npm run preview          (in one terminal)
 *   npm run readme:art                        (in another)
 *
 * The picture is the first step of the lesson "Mating patterns every player should know", played
 * in the app as a learner might: the tempting Nxd8+ first, which the coach answers with Nxe6, the
 * take-back, then Nh6+ Kh8 Qg8+ Rxg8 Nf7#. Each screen is the app's own, captured in its light or
 * dark theme, under a caption set in Newsreader (scripts/fonts/, OFL) in the brand's Dayshift or
 * Nightshift colours. The screens are WebP inside an SVG that steps through them with CSS, which
 * GitHub plays inside a README <img>: the first whole, each after it only where it differs from
 * the one before. Between two screens the piece that moves slides from its square to the next,
 * drawn with the app's own piece set. A reader who turns motion off sees the mate, still.
 *
 * The app's timers run on Playwright's clock, so every screen is taken at the same moment of the
 * lesson each run. Another base URL can be passed: `node scripts/readme-art.mjs http://…/`.
 *
 * `--check` plays the step and writes the pictures to test-results/readme-art/ instead, and fails
 * when the coach's words or the moves no longer match the committed pictures (the fingerprint in
 * them): the lesson changed, and the pictures need drawing again.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, seedLearner } from './lib/screenshots.mjs';

/* global document, getComputedStyle, Image -- these run inside the page */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'docs', 'assets');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const BASE = new URL(args.find((arg) => /^https?:/.test(arg)) ?? 'http://127.0.0.1:4173/');
const OUT = CHECK ? join(ROOT, 'test-results', 'readme-art') : ASSETS;

/** The lesson page, laid out as on a laptop: the board, and the coach beside it. */
const DEVICE = { viewport: { width: 1080, height: 860 }, deviceScaleFactor: 2 };
const TODAY = Date.parse('2026-10-06T17:30:00Z');

/** The picture, in CSS pixels: the caption above, the app's board and coach below. */
const FRAME = { width: 1100, pad: 33, head: 92 };
/** Each screen is written at 1.5 times that, twice the README's width on a phone. */
const SCALE = 1.5;
const QUALITY = 0.8;
/** The app slides a piece in 200 ms; a little slower here, so the eye can follow at README size. */
const SLIDE = 320;
/** The pause between a move and the reply that answers it at once. */
const BREATH = 380;
/** A screen fades in over the one before once the piece has landed. */
const FADE = 160;
/** At the end the first screen fades in again, over the last. */
const LOOP_FADE = 700;

/** The brand's two themes, the only colours the picture adds to the app's own. */
const THEMES = {
  dark: { bg: '#0C0D10', line: '#262A33', text: '#E8E6E1', mute: '#8A8F99', ember: '#FF6A3D' },
  light: { bg: '#F6F5F2', line: '#D6D3CB', text: '#1A1B1E', mute: '#666A73', ember: '#C03B0A' },
};

/**
 * The step as the learner plays it. Each beat is what they do (two squares clicked, Take back or
 * Continue), the pieces that move on the way from the screen before (groups one after the other,
 * the pieces in a group together), the caption and how long the screen stays up. `expect` is the
 * piece the beat must leave on a square, so a changed lesson stops the run rather than drawing
 * the wrong thing; `more` presses the coach's "More below", for a question cut off by the box.
 */
const BEATS = [
  {
    more: true,
    caption: '<b>Nxd8+</b> wins the queen. Tempting.',
    hold: 2600,
  },
  {
    act: ['f7', 'd8'],
    moves: [[['f7', 'd8', 'white knight']], [['c5', 'e6', 'black knight']]],
    expect: ['e6', 'black knight'],
    more: true,
    caption: 'The coach plays the reply that punishes it.',
    hold: 3400,
  },
  {
    act: 'take-back',
    moves: [
      [
        ['d8', 'f7', 'white knight'],
        ['e6', 'c5', 'black knight'],
      ],
    ],
    expect: ['f7', 'white knight'],
    more: true,
    caption: 'Take it back, and look at the king first.',
    hold: 1800,
  },
  {
    act: ['f7', 'h6'],
    moves: [[['f7', 'h6', 'white knight']]],
    expect: ['h6', 'white knight'],
    caption: '<b>Nh6+</b> is double check: one square left.',
    hold: 3000,
  },
  {
    act: 'continue',
    moves: [[['g8', 'h8', 'black king']]],
    expect: ['h8', 'black king'],
    caption: '<b>Kh8</b>, forced. Now give up the queen.',
    hold: 1900,
  },
  {
    act: ['e6', 'g8'],
    moves: [[['e6', 'g8', 'white queen']]],
    expect: ['g8', 'white queen'],
    caption: '<b>Qg8+</b>: only the rook can take her.',
    hold: 2600,
  },
  {
    act: 'continue',
    moves: [[['f8', 'g8', 'black rook']]],
    expect: ['g8', 'black rook'],
    caption: '<b>Rxg8</b> fills the king’s last square.',
    hold: 1900,
  },
  {
    act: ['h6', 'f7'],
    moves: [[['h6', 'f7', 'white knight']]],
    expect: ['f7', 'white knight'],
    caption: '<b>Nf7#</b>. Smothered mate.',
    hold: 4600,
  },
];

const TITLE =
  'Open File’s lesson on the smothered mate, played in the app. White plays the tempting Nxd8+, ' +
  'and the coach answers with Nxe6, which takes the queen back, and explains why. After the ' +
  'take-back come the double check Nh6+, Kh8, the queen sacrifice Qg8+, Rxg8, and Nf7#, ' +
  'smothered mate.';

const PIECES = ['white knight', 'black knight', 'white queen', 'black king', 'black rook'];

/** Lets the app's timers, React and the board's redraws (animation frames) catch up. */
async function settle(page, ms = 300) {
  for (let t = 0; t < ms; t += 50) {
    await page.clock.runFor(50);
    await page.waitForTimeout(20);
  }
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

/** The piece on a square ("white knight"), read from the board as drawn; '' for none. */
function pieceAt(page, square) {
  return page.evaluate((sq) => {
    const board = document.querySelector('cg-board');
    const origin = board.getBoundingClientRect();
    const size = origin.width / 8;
    for (const piece of board.querySelectorAll('piece')) {
      if (piece.classList.contains('ghost') || piece.classList.contains('fading')) continue;
      const box = piece.getBoundingClientRect();
      const file = Math.round((box.left - origin.left) / size);
      const row = Math.round((box.top - origin.top) / size);
      if ('abcdefgh'[file] === sq[0] && 8 - row === Number(sq[1])) {
        return [...piece.classList].join(' ');
      }
    }
    return '';
  }, square);
}

/** Plays the step in one theme: its screens, the coach's words, where the board is, the pieces. */
async function capture(browser, scheme) {
  const context = await browser.newContext({
    ...DEVICE,
    colorScheme: scheme,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    locale: 'en-GB',
    timezoneId: 'UTC',
  });
  await context.clock.install({ time: TODAY });
  await context.addInitScript(seedLearner, {});
  await context.addInitScript((colorScheme) => {
    // The board's own animations off: the picture draws the slides itself, between still screens.
    const state = { animations: false, colorScheme };
    localStorage.setItem('open-file:settings', JSON.stringify({ state, version: 5 }));
  }, scheme);
  const page = await context.newPage();
  await page.goto(new URL('learn/mating-patterns', BASE).href);
  await page.getByTestId('lesson-task').waitFor();
  await page.evaluate(() => document.fonts.ready);
  // From here the app's time only moves when settle() moves it.
  await page.clock.pauseAt(TODAY + 60_000);
  await settle(page);

  const trainer = await page.locator('.trainer').boundingBox();
  const board = await page.locator('cg-board').boundingBox();
  const geometry = {
    width: trainer.width,
    height: trainer.height,
    board: { x: board.x - trainer.x, y: board.y - trainer.y, size: board.width },
  };
  const pieces = await page.evaluate((names) => {
    const images = {};
    for (const name of names) {
      const piece = document.querySelector(`cg-board piece.${name.replace(' ', '.')}`);
      const match =
        piece && /url\("?(data:[^")]+)"?\)/.exec(getComputedStyle(piece).backgroundImage);
      if (match) images[name] = match[1];
    }
    return images;
  }, PIECES);
  for (const name of PIECES) {
    if (!pieces[name]) throw new Error(`no picture of the ${name} on the board`);
  }

  const shots = [];
  const words = [];
  for (const [i, beat] of BEATS.entries()) {
    if (beat.act === 'take-back') {
      await page.getByTestId('lesson-take-back').click();
    } else if (beat.act === 'continue') {
      await page.getByTestId('lesson-play-on').click();
    } else if (beat.act) {
      await clickSquare(page, beat.act[0]);
      await clickSquare(page, beat.act[1]);
    }
    // The opponent answers 600 ms after a move; let that and the coach's words land.
    await settle(page, beat.act ? 1000 : 300);
    if (beat.expect) {
      const [square, want] = beat.expect;
      const found = await pieceAt(page, square);
      if (found !== want) {
        throw new Error(`beat ${i + 1}: expected a ${want} on ${square}, found ${found || 'none'}`);
      }
    }
    if (beat.more) {
      const more = page.getByRole('button', { name: 'More below' });
      if (await more.isVisible()) {
        await more.click();
        await settle(page, 200);
      }
    }
    // No pointer left hovering over a square or a button.
    await page.mouse.move(2, 2);
    await settle(page, 100);
    shots.push(await page.screenshot({ type: 'png', clip: trainer }));
    words.push(await page.getByTestId('coach-log').textContent());
  }
  // The board alone at the mate, for the social card.
  const mate = await page.screenshot({ type: 'png', clip: board });
  await context.close();
  return { shots, words, geometry, pieces, mate };
}

const dataUrl = (png, type = 'image/png') => `data:${type};base64,${png.toString('base64')}`;

/** Newsreader, the captions' type, as CSS. */
async function fontFaces() {
  const face = async (style, file) => {
    const woff2 = (await readFile(join(ROOT, 'scripts', 'fonts', file))).toString('base64');
    return `@font-face {
    font-family: 'Newsreader';
    font-style: ${style};
    font-weight: 200 800;
    src: url(data:font/woff2;base64,${woff2}) format('woff2');
  }`;
  };
  return [
    await face('normal', 'newsreader-latin-opsz-normal.woff2'),
    await face('italic', 'newsreader-latin-opsz-italic.woff2'),
  ].join('\n');
}

/** Where things land in the picture, in its CSS pixels. */
function layout(geometry) {
  const width = FRAME.width - 2 * FRAME.pad;
  const k = width / geometry.width;
  const height = FRAME.head + Math.round(geometry.height * k) + FRAME.pad;
  const board = {
    x: FRAME.pad + geometry.board.x * k,
    y: FRAME.head + geometry.board.y * k,
    size: geometry.board.size * k,
  };
  return { width, height, board, panelX: Math.round(board.x + board.size + 6) };
}

/** Lays out one screen under its caption, as a PNG at SCALE. */
async function frame(page, theme, fonts, shot, place, caption, index) {
  await page.setViewportSize({ width: FRAME.width, height: place.height });
  await page.setContent(`<!doctype html><style>
  ${fonts}
  html, body { margin: 0; }
  body {
    position: relative;
    width: ${FRAME.width}px;
    height: ${place.height}px;
    overflow: hidden;
    background: ${theme.bg};
    color: ${theme.text};
    font-family: 'Newsreader', serif;
    font-optical-sizing: auto;
  }
  .head {
    position: absolute;
    left: ${FRAME.pad}px;
    right: ${FRAME.pad}px;
    top: 0;
    height: ${FRAME.head}px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .caption { font-size: 41px; line-height: 1; font-weight: 420; letter-spacing: -0.012em; }
  .caption b { color: ${theme.ember}; font-weight: 560; }
  .count {
    font-size: 21px;
    font-style: italic;
    color: ${theme.mute};
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .shot {
    position: absolute;
    left: ${FRAME.pad - 1}px;
    top: ${FRAME.head - 1}px;
    width: ${place.width}px;
    border: 1px solid ${theme.line};
    border-radius: 12px;
    overflow: hidden;
  }
  .shot img { display: block; width: 100%; }
</style>
<div class="head"><div class="caption">${caption}</div><div class="count">${index + 1} of ${BEATS.length}</div></div>
<div class="shot"><img src="${dataUrl(shot)}" alt=""></div>`);
  await page.evaluate(() =>
    Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]),
  );
  return page.screenshot({ type: 'png' });
}

/**
 * Each screen as the pieces of it to draw, in WebP: the first whole, each later one only where it
 * differs from the one before, in up to three boxes (the caption, the board's side and the
 * coach's side), each the smallest box around what changed there.
 */
async function pieces(page, pngs, place) {
  const regions = [
    [0, 0, FRAME.width, FRAME.head],
    [0, FRAME.head, place.panelX, place.height - FRAME.head],
    [place.panelX, FRAME.head, FRAME.width - place.panelX, place.height - FRAME.head],
  ];
  const parts = await page.evaluate(
    async ({ sources, regions, scale, quality }) => {
      const load = async (src) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return { canvas, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
      };
      const encode = (canvas, x, y, w, h) => {
        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        out.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
        return out.toDataURL('image/webp', quality).slice('data:image/webp;base64,'.length);
      };
      const frames = [];
      for (const src of sources) frames.push(await load(src));
      const { width, height } = frames[0].canvas;
      const result = [
        [{ x: 0, y: 0, w: width, h: height, webp: encode(frames[0].canvas, 0, 0, width, height) }],
      ];
      for (let f = 1; f < frames.length; f++) {
        const [before, after] = [frames[f - 1].data, frames[f].data];
        const boxes = [];
        for (const [rx, ry, rw, rh] of regions) {
          const [x0, y0] = [Math.round(rx * scale), Math.round(ry * scale)];
          const [x1, y1] = [
            Math.min(width, Math.round((rx + rw) * scale)),
            Math.min(height, Math.round((ry + rh) * scale)),
          ];
          let [left, top, right, bottom] = [x1, y1, -1, -1];
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = (y * width + x) * 4;
              if (
                Math.abs(before[i] - after[i]) > 2 ||
                Math.abs(before[i + 1] - after[i + 1]) > 2 ||
                Math.abs(before[i + 2] - after[i + 2]) > 2
              ) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
              }
            }
          }
          if (right < 0) continue;
          // A few pixels more on each side, so the edge of a box falls where nothing changed.
          left = Math.max(x0, left - 4);
          top = Math.max(y0, top - 4);
          right = Math.min(x1 - 1, right + 4);
          bottom = Math.min(y1 - 1, bottom + 4);
          const [w, h] = [right - left + 1, bottom - top + 1];
          boxes.push({ x: left, y: top, w, h, webp: encode(frames[f].canvas, left, top, w, h) });
        }
        result.push(boxes);
      }
      return result;
    },
    { sources: pngs.map((png) => dataUrl(png)), regions, scale: SCALE, quality: QUALITY },
  );
  // Back to the picture's CSS pixels.
  return parts.map((boxes) =>
    boxes.map(({ x, y, w, h, webp }) => ({
      x: x / SCALE,
      y: y / SCALE,
      w: w / SCALE,
      h: h / SCALE,
      webp,
    })),
  );
}

/** The top-left corner of a square, in the picture's units. */
function corner(board, square) {
  const file = 'abcdefgh'.indexOf(square[0]);
  const rank = Number(square[1]);
  const size = board.size / 8;
  return [board.x + file * size, board.y + (8 - rank) * size];
}

const round = (n) => Math.round(n * 100) / 100;

/**
 * The animated SVG. The screens are layers, each drawn over the ones before as its turn comes and
 * kept to the end, when the first screen fades in over them all, ready to start again. During a
 * slide the square the piece leaves is already drawn as the next screen has it, and the piece
 * glides above.
 */
function svg({ parts, place, pieces: images, fingerprint }) {
  // The timeline, in milliseconds: when each screen starts fading in and when it is fully up.
  const timeline = [];
  let t = 0;
  for (const [i, beat] of BEATS.entries()) {
    const groups = [];
    if (i > 0) {
      for (const [g, group] of beat.moves.entries()) {
        if (g > 0) t += BREATH;
        groups.push({ start: t, end: t + SLIDE, group });
        t += SLIDE;
      }
    }
    const fadeStart = t;
    const fadeEnd = i === 0 ? 0 : t + FADE;
    timeline.push({ groups, fadeStart, fadeEnd });
    t = fadeEnd + beat.hold;
  }
  const total = t + LOOP_FADE;
  const pct = (ms) => `${round((ms / total) * 10000) / 100}%`;
  // The next keyframe after `ms`, for a change that is a step rather than a fade.
  const just = (ms) => pct(ms + total / 20000);

  const css = [];
  const defs = [];
  const layers = [];
  const patches = [];
  const movers = [];
  const clips = new Map();
  const size = round(place.board.size / 8);

  for (const [i, boxes] of parts.entries()) {
    const images = boxes.map(
      ({ x, y, w, h, webp }) =>
        `<image x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" href="data:image/webp;base64,${webp}"/>`,
    );
    defs.push(`<g id="s${i}">${images.join('')}</g>`);
    if (i === 0) {
      layers.push('<use href="#s0"/>');
      continue;
    }
    const { fadeStart, fadeEnd } = timeline[i];
    css.push(
      `@keyframes s${i}{0%{opacity:0}${pct(fadeStart)}{opacity:0}${pct(fadeEnd)}{opacity:1}100%{opacity:1}}`,
    );
    layers.push(`<use href="#s${i}" class="s${i}"/>`);
  }

  let n = 0;
  for (const [i, { groups, fadeEnd }] of timeline.entries()) {
    for (const [g, { start, end, group }] of groups.entries()) {
      const last = g === groups.length - 1;
      for (const [from, to, piece] of group) {
        // The square the piece leaves, as the next screen has it, from the moment it leaves; and
        // for a piece that stops on the way (a move before the reply), the square it lands on.
        const squares = last
          ? [[from, start]]
          : [
              [from, start],
              [to, end],
            ];
        for (const [square, at] of squares) {
          const [x, y] = corner(place.board, square);
          clips.set(
            square,
            `<clipPath id="q${square}"><rect x="${round(x)}" y="${round(y)}" width="${size}" height="${size}"/></clipPath>`,
          );
          css.push(
            `@keyframes p${n}{0%{opacity:0}${pct(at)}{opacity:0}${just(at)}{opacity:1}${pct(fadeEnd)}{opacity:1}${just(fadeEnd)}{opacity:0}100%{opacity:0}}`,
          );
          patches.push(`<use href="#s${i}" clip-path="url(#q${square})" class="p${n}"/>`);
          n++;
        }
        // Hidden until it leaves; then it glides, eased in and out as the app's board does, and
        // waits on its new square until the next screen is up under it (or, stopping on the way,
        // until its square is drawn).
        const [x0, y0] = corner(place.board, from);
        const [x1, y1] = corner(place.board, to);
        const at = `translate(${round(x1 - x0)}px,${round(y1 - y0)}px)`;
        const gone = last ? fadeEnd : end;
        css.push(
          `@keyframes p${n}{0%{opacity:0;transform:none}${pct(start)}{opacity:0;transform:none}${just(start)}{opacity:1;transform:none;animation-timing-function:cubic-bezier(.65,0,.35,1)}${pct(end)}{opacity:1;transform:${at}}${pct(gone)}{opacity:1;transform:${at}}${just(gone)}{opacity:0;transform:${at}}100%{opacity:0;transform:${at}}}`,
        );
        movers.push(
          `<image href="${images[piece]}" x="${round(x0)}" y="${round(y0)}" width="${size}" height="${size}" class="p${n}"/>`,
        );
        n++;
      }
    }
  }

  // Each set of keyframes moves the layer with the class of the same name.
  const names = css.map((line) => {
    const name = /^@keyframes (\w+)/.exec(line)[1];
    return `.${name}{animation-name:${name}}`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FRAME.width} ${place.height}" width="${FRAME.width}" height="${place.height}" role="img" aria-labelledby="title">
<title id="title">${TITLE}</title>
<!-- Drawn by scripts/readme-art.mjs from the app's own screens (npm run readme:art). fingerprint: ${fingerprint} -->
<style>
[class]{animation-duration:${total}ms;animation-iteration-count:infinite;animation-timing-function:linear;animation-fill-mode:both}
[class^="p"],.again{opacity:0}
.again{animation-name:again}
@keyframes again{0%{opacity:0}${pct(total - LOOP_FADE)}{opacity:0}100%{opacity:1}}
${names.join('\n')}
${css.join('\n')}
@media (prefers-reduced-motion:reduce){[class]{animation:none}}
</style>
<defs>
${defs.join('\n')}
${[...clips.values()].join('\n')}
</defs>
${layers.join('\n')}
<use href="#s0" class="again"/>
${patches.join('\n')}
${movers.join('\n')}
</svg>
`;
}

/** A short, stable name for what the coach says and the moves played, beat by beat. */
function fingerprintOf(words) {
  return createHash('sha256')
    .update(JSON.stringify([BEATS.map((beat) => beat.moves ?? null), words]))
    .digest('hex')
    .slice(0, 16);
}

/** The social card, 1280 × 640: the name, the line, and the mate on the board, on Nightshift. */
async function card(browser, fonts, board) {
  const theme = THEMES.dark;
  const context = await browser.newContext({ viewport: { width: 1280, height: 640 } });
  const page = await context.newPage();
  await page.setContent(`<!doctype html><style>
  ${fonts}
  html, body { margin: 0; }
  body {
    width: 1280px;
    height: 640px;
    box-sizing: border-box;
    padding: 0 88px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 472px;
    align-items: center;
    gap: 56px;
    background: ${theme.bg};
    color: ${theme.text};
    font-family: 'Newsreader', serif;
    font-optical-sizing: auto;
  }
  h1 { margin: 0; font-size: 124px; line-height: 0.92; font-weight: 480; letter-spacing: -0.03em; }
  p { margin: 30px 0 0; font-size: 40px; line-height: 1.16; color: ${theme.mute}; }
  .mate { margin: 44px 0 0; font-size: 30px; font-style: italic; color: ${theme.text}; }
  .mate b { color: ${theme.ember}; font-style: normal; font-weight: 560; }
  img { display: block; width: 472px; border: 1px solid ${theme.line}; border-radius: 10px; }
</style>
<div>
  <h1>open-file</h1>
  <p>Learn and play chess<br>in your browser, offline</p>
  <p class="mate"><b>Nf7#</b>&ensp;smothered mate</p>
</div>
<img src="${dataUrl(board)}" alt="">`);
  await page.evaluate(() =>
    Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]),
  );
  const png = await page.screenshot({ type: 'png' });
  await context.close();
  return png;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await launchBrowser();
  const fonts = await fontFaces();
  const fingerprints = new Set();
  let mateBoard;
  for (const scheme of ['light', 'dark']) {
    const { shots, words, geometry, pieces: images, mate } = await capture(browser, scheme);
    if (scheme === 'dark') mateBoard = mate;
    const fingerprint = fingerprintOf(words);
    fingerprints.add(fingerprint);
    const place = layout(geometry);
    const context = await browser.newContext({ deviceScaleFactor: SCALE });
    const page = await context.newPage();
    const pngs = [];
    for (const [i, shot] of shots.entries()) {
      pngs.push(await frame(page, THEMES[scheme], fonts, shot, place, BEATS[i].caption, i));
    }
    const parts = await pieces(page, pngs, place);
    await context.close();
    const file = join(OUT, `smothered-mate-${scheme}.svg`);
    const body = svg({ parts, place, pieces: images, fingerprint });
    await writeFile(file, body);
    console.log(`  ${relative(ROOT, file)} (${Math.round(body.length / 1024)} KB)`);
  }
  if (fingerprints.size > 1) throw new Error('the light and dark runs saw different lessons');
  const [fingerprint] = fingerprints;

  const png = await card(browser, fonts, mateBoard);
  const cardFile = join(OUT, 'social.png');
  await writeFile(cardFile, png);
  console.log(`  ${relative(ROOT, cardFile)} (${Math.round(png.length / 1024)} KB)`);
  await browser.close();

  if (CHECK) {
    const committed = await readFile(join(ASSETS, 'smothered-mate-dark.svg'), 'utf8');
    const saved = /fingerprint: (\w+)/.exec(committed)?.[1];
    if (saved !== fingerprint) {
      console.error(
        `The README's picture shows another version of the lesson (fingerprint ${saved ?? 'none'}, ` +
          `the app now ${fingerprint}). Draw it again with npm run readme:art and commit docs/assets/.`,
      );
      process.exit(1);
    }
    console.log(`The README's picture matches the lesson (fingerprint ${fingerprint}).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
