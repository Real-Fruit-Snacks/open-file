#!/usr/bin/env node
/**
 * Fails the build when the production bundle outgrows its budget.
 *
 * The limits are gzipped sizes, which is what a visitor downloads. Content
 * chunks (the arcade positions, the threat drill's) are allowed more than code chunks,
 * and the code that runs at start-up — the entry chunk plus whatever it
 * imports statically, React aside — is kept small so an update re-downloads
 * little. (How the bundler splits that start-up code between chunks changes
 * from release to release, so the limit is on the sum, not on one file.)
 *
 *   node scripts/check-bundle-size.mjs           # after `vite build`
 *   node scripts/check-bundle-size.mjs --print   # just list the sizes
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = join(process.cwd(), 'dist');
const ASSETS = join(DIST, 'assets');

const KB = 1024;
/** Gzipped limits per chunk family (matched by file name prefix). */
const BUDGETS = [
  { name: 'entry', match: /^index-/, limitBytes: 56 * KB },
  { name: 'react', match: /^react-/, limitBytes: 110 * KB },
  // One chunk per file of lessons (src/features/learn/lessons/<file>.ts), loaded when one of its
  // lessons is opened.
  { name: 'lesson content', match: /^(beginner|intermediate|advanced)\d*-/, limitBytes: 40 * KB },
  { name: 'arcade positions', match: /^positions-/, limitBytes: 40 * KB },
  { name: 'classic games', match: /^games-/, limitBytes: 40 * KB },
  // The threat drill's 1,200 positions, loaded with the drill only.
  { name: 'threat positions', match: /^threat-positions-/, limitBytes: 90 * KB },
  { name: 'any other chunk', match: /./, limitBytes: 40 * KB },
];
/**
 * The code that runs before the first page: the entry and its static imports, React aside. (0.20
 * reached 42 KB, the earlier limit, as the settings came to check 28 board themes and nine piece
 * sets at start-up; 0.24 reached 44 KB as they came to be kept per profile, apart from the
 * device's, which the bundler now puts in a chunk of their own; 0.28 reached 45.3 KB with Play's
 * new routes — the hub, the duels, the redirects from the old addresses — and their icons.)
 */
const STARTUP_LIMIT_BYTES = 46 * KB;
/**
 * The service worker precaches this much at install: keep first loads honest. (0.20 raised it from
 * 6.5 MB for the eight piece sets from Lichess, about 0.27 MB of stylesheets, so every set works
 * offline from the first visit; the page itself loads only the chosen one. 0.25 raised it from
 * 6.75 MB for the lessons rewritten as conversations with a coach, about 0.7 MB more on disk —
 * some 0.2 MB gzipped — so every lesson still works offline; a lesson page loads only its file.
 * 0.29 raised it from 7.5 MB for its features, about 0.25 MB on disk — Chess960's rules (chessops),
 * correspondence, race and analysis rooms, notifications, quick search, human moves, the gap
 * finder — so all of them work offline from the first visit as well. 0.32's fonts, IBM Plex Sans
 * and Mono, about 0.17 MB of woff2, fit within it.)
 */
const PRECACHE_LIMIT_BYTES = 7.75 * KB * KB;

function gzipSize(file) {
  return gzipSync(readFileSync(file), { level: 9 }).length;
}

function precacheBytes() {
  const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
  // Workbox injects the manifest as [{"revision":…,"url":"…"}, …].
  const urls = [...sw.matchAll(/"url":"([^"]+)"/g)].map((m) => m[1].split('?')[0]);
  let total = 0;
  for (const url of urls) {
    try {
      total += statSync(join(DIST, decodeURIComponent(url))).size;
    } catch {
      // A URL that is not a file (the navigation route, say) weighs nothing.
    }
  }
  return { total, count: urls.length };
}

const print = process.argv.includes('--print');
const files = readdirSync(ASSETS).filter((f) => f.endsWith('.js'));
const rows = files
  .map((file) => {
    const budget = BUDGETS.find((b) => b.match.test(file));
    const gz = gzipSize(join(ASSETS, file));
    return { file, gz, budget, over: gz > budget.limitBytes };
  })
  .sort((a, b) => b.gz - a.gz);

/** The chunks the entry imports statically (Rolldown writes `from"./x.js"` and `import"./x.js"`). */
function startupChunks() {
  const entry = rows.find((r) => r.budget.name === 'entry');
  if (!entry) return [];
  const source = readFileSync(join(ASSETS, entry.file), 'utf8');
  const imported = new Set(
    [...source.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)].map((m) => m[1]),
  );
  return rows.filter((r) => r === entry || (imported.has(r.file) && r.budget.name !== 'react'));
}

const fmt = (n) => `${(n / KB).toFixed(1)} KB`;
for (const row of rows.slice(0, print ? rows.length : 12)) {
  const flag = row.over ? '  OVER' : '';
  console.log(
    `${fmt(row.gz).padStart(9)}  ${row.file.padEnd(40)} ${row.budget.name} ≤ ${fmt(row.budget.limitBytes)}${flag}`,
  );
}
const startup = startupChunks();
const startupBytes = startup.reduce((sum, r) => sum + r.gz, 0);
console.log(
  `\nstart-up code: ${fmt(startupBytes)} gzipped in ${startup.length} chunk${startup.length === 1 ? '' : 's'} (limit ${fmt(STARTUP_LIMIT_BYTES)})`,
);
const precache = precacheBytes();
console.log(
  `\nprecache: ${precache.count} entries, ${(precache.total / KB / KB).toFixed(2)} MB on disk (limit ${(PRECACHE_LIMIT_BYTES / KB / KB).toFixed(1)} MB)`,
);

const failures = rows.filter((r) => r.over).map((r) => `${r.file} is ${fmt(r.gz)} gzipped`);
if (startupBytes > STARTUP_LIMIT_BYTES) {
  failures.push(`the start-up code is ${fmt(startupBytes)} gzipped`);
}
if (precache.total > PRECACHE_LIMIT_BYTES) {
  failures.push(`the precache is ${(precache.total / KB / KB).toFixed(2)} MB`);
}
// The human-like opponent's runtime ships once, in maia/ (downloaded on request): a copy among
// the assets would be 14 MB deployed for nothing (see ortWasmReference in vite.config.ts).
for (const file of readdirSync(ASSETS).filter((f) => f.endsWith('.wasm'))) {
  failures.push(`${file} was copied into the assets`);
}
if (failures.length && !print) {
  console.error(`\nBundle budget exceeded:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\nBundle within budget.');
