#!/usr/bin/env node
/**
 * Downloads the pinned Stockfish WASM builds into public/engine/.
 *
 * The engine is GPL-3.0 software maintained in a separate project
 * (https://github.com/nmrugg/stockfish.js). Rather than vendoring binaries in
 * git — or pulling the 200 MB `stockfish` npm package into every install — we
 * fetch exactly the files we ship, verify their SHA-256 and cache them
 * locally. The script is idempotent: if the files are present and their
 * checksums match, it exits immediately.
 *
 * Four builds are installed:
 *  - lite-single: one thread, precached by the service worker; the engine of
 *    the first visit and of browsers that cannot run threads.
 *  - lite (pthreads): the default once the page is cross-origin isolated.
 *  - full single and full (pthreads): Stockfish with its large network
 *    (about 99 MB each), fetched only when the learner switches the full
 *    engine on.
 *
 * `--lite` installs the two lite builds only: the content checks and the dev
 * server (which runs no service worker, so no full engine) need no more.
 *
 * `--from <folder>` copies the files from a folder instead of downloading them
 * (the dev kit's offline/files/engine/, or files fetched by hand), with the
 * same checksum checks.
 *
 * Usage:  node scripts/setup-engine.mjs [--force] [--lite] [--from <folder>]
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceFolder } from './lib/dev-kit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'engine');

/** Bump these together when upgrading the engine. */
export const ENGINE = {
  version: '19.0.0',
  releaseBase: 'https://github.com/nmrugg/stockfish.js/releases/download/v19.0.0/',
  files: [
    {
      name: 'stockfish-19-lite-single.js',
      sha256: 'd3344124ab067fb0b90ee77873bb8e9fbf5fc01bc525fe714b0f942581e889e6',
      build: 'single',
    },
    {
      name: 'stockfish-19-lite-single.wasm',
      sha256: '57ac2d72312aba346760e3f173f687a8c211208e97a87268436f7f0e10bb5387',
      build: 'single',
    },
    {
      name: 'stockfish-19-lite.js',
      sha256: '2f98d35d20bf435c16925f8955fe4b0c2062e66962799a407667218ff9ea709d',
      build: 'multi',
    },
    {
      name: 'stockfish-19-lite.wasm',
      sha256: '18727c9ade11a8ca04391ab5a298232bc6fffebe2002e7cfffac82e7ad453447',
      build: 'multi',
    },
    {
      name: 'stockfish-19-single.js',
      sha256: '72772f8bdd7353e4e24245d946bb831f56bcccf02fa16a779c1b92a6c00e5cc2',
      build: 'full-single',
    },
    {
      name: 'stockfish-19-single.wasm',
      sha256: '8725c26572762617fd96b2ea83ff130e6640b85815890d682bf8c49db0820721',
      build: 'full-single',
    },
    {
      name: 'stockfish-19.js',
      sha256: '227b9317cb8fc347da722b3f6694c5f57eafe17842a8a1afbfe08c3aeeae5671',
      build: 'full-multi',
    },
    {
      name: 'stockfish-19.wasm',
      sha256: 'e0ef90031a310479e5b0c3692a9839118ed785535c306252e68ed3300a45b02d',
      build: 'full-multi',
    },
  ],
};

/** The lite builds: what `--lite` installs. */
export const LITE_BUILDS = new Set(['single', 'multi']);

const force = process.argv.includes('--force');
const liteOnly = process.argv.includes('--lite');

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function isValid(file) {
  const path = join(OUT_DIR, file.name);
  if (!(await exists(path))) return false;
  const data = await readFile(path);
  return sha256(data) === file.sha256;
}

/** Downloads `file` from the pinned release, or copies it from `from` when that names a folder. */
async function install(file, from) {
  const target = join(OUT_DIR, file.name);
  const tmp = `${target}.download`;

  let data;
  if (from) {
    process.stdout.write(`  ← ${file.name} … `);
    const source = join(from, file.name);
    if (!(await exists(source))) throw new Error(`${file.name} is not in ${from}`);
    data = await readFile(source);
  } else {
    const url = ENGINE.releaseBase + file.name;
    process.stdout.write(`  ↓ ${file.name} … `);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
    }
    data = Buffer.from(await res.arrayBuffer());
  }
  const digest = sha256(data);
  if (digest !== file.sha256) {
    throw new Error(
      `Checksum mismatch for ${file.name}\n  expected ${file.sha256}\n  received ${digest}\n` +
        (from ? 'It is not the pinned file.' : 'The upstream release may have been altered.') +
        ' Refusing to install.',
    );
  }
  await writeFile(tmp, data);
  await rename(tmp, target);
  process.stdout.write(`${(data.length / 1024).toFixed(0)} KiB ✓\n`);
}

/** What `version.json` says: the pinned engine and where its source lives. */
export function versionRecord() {
  return (
    JSON.stringify(
      {
        name: 'Stockfish.js',
        version: ENGINE.version,
        variants: ['lite-single', 'lite (pthreads)', 'full-single', 'full (pthreads)'],
        license: 'GPL-3.0-only',
        source: 'https://github.com/nmrugg/stockfish.js',
        files: ENGINE.files,
      },
      null,
      2,
    ) + '\n'
  );
}

/**
 * Writes `version.json` into `dir` unless it already says exactly that, so the
 * record is right whichever way the binaries arrived (downloaded here, or put
 * in place by hand when offline). Returns whether it wrote the file.
 */
export async function writeVersionFile(dir = OUT_DIR) {
  const path = join(dir, 'version.json');
  const wanted = versionRecord();
  let current = null;
  try {
    current = await readFile(path, 'utf8');
  } catch {
    // Missing: written below.
  }
  if (current === wanted) return false;
  await writeFile(path, wanted);
  return true;
}

async function main() {
  const from = sourceFolder(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  const wanted = ENGINE.files.filter((file) => !liteOnly || LITE_BUILDS.has(file.build));
  const missing = [];
  for (const file of wanted) {
    if (force || !(await isValid(file))) missing.push(file);
  }

  if (missing.length === 0) {
    console.log(
      `Engine v${ENGINE.version} already installed in public/engine/${liteOnly ? ' (lite builds)' : ''}`,
    );
  } else {
    console.log(
      `Installing Stockfish ${ENGINE.version} (${liteOnly ? 'lite builds' : 'lite and full builds, about 200 MB the first time'}) into public/engine/${from ? ` from ${from}` : ''}`,
    );
    for (const file of missing) {
      await rm(join(OUT_DIR, file.name), { force: true });
      await install(file, from);
    }
  }

  // A record for people (and the notices): nothing in the app reads it, so it is not precached.
  if (await writeVersionFile()) console.log('Wrote public/engine/version.json');
  if (missing.length) console.log('Done.');
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(`\nEngine setup failed: ${err.message}`);
    console.error(
      'Offline? Fetch the files public/engine/README.md lists by hand, then run this again with --from <their folder>.',
    );
    process.exit(1);
  });
}
