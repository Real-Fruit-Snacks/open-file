#!/usr/bin/env node
/**
 * Post-build steps for GitHub Pages.
 *
 * 1. `404.html` — Pages serves this file for any unknown path. Making it a copy
 *    of `index.html` lets deep links such as /puzzles or /learn/forks boot the
 *    SPA, which then reads the URL and renders the right route.
 * 2. `.nojekyll` — tells Pages not to run Jekyll, which would otherwise ignore
 *    files and folders that start with an underscore (Vite's asset hashes can
 *    produce those) and slow down deployments.
 * 3. `licence.txt`, `licence-agpl.txt`, `licence-apache.txt`, `licence-ofl.txt` and `notices.txt`
 *    — the project's licence (`LICENSE`), the licence of the human-like opponent's model (Maia-3,
 *    AGPL-3.0: `LICENSES/AGPL-3.0.txt`), the licence of the Chessnut piece set (Apache-2.0:
 *    `LICENSES/Apache-2.0.txt`), the fonts' (IBM Plex, OFL-1.1: `LICENSES/OFL-1.1.txt`, which
 *    asks for its licence to travel with the fonts) and the third-party notices (`THIRD_PARTY_NOTICES.md`) ship
 *    with the site, and the footer links to them (the Apache licence while Chessnut is chosen). They are not precached:
 *    they are small and rarely opened, and the service worker leaves them to the
 *    network.
 * 4. Source maps — the build writes hidden maps (no `sourceMappingURL` comment);
 *    they are moved out of `dist/` into `sourcemaps/`, so they are never deployed
 *    or precached. CI keeps them as an artifact for reading crash-report stacks.
 *
 * Usage:  node scripts/postbuild.mjs
 */
import { copyFile, mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Files copied from the repository into the site, as [source, published name]. */
export const LICENCE_FILES = [
  ['LICENSE', 'licence.txt'],
  ['LICENSES/AGPL-3.0.txt', 'licence-agpl.txt'],
  ['LICENSES/Apache-2.0.txt', 'licence-apache.txt'],
  ['LICENSES/OFL-1.1.txt', 'licence-ofl.txt'],
  ['THIRD_PARTY_NOTICES.md', 'notices.txt'],
];

/** Every file below `dir`, as paths relative to it. */
async function filesBelow(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)));
}

/**
 * Runs the post-build steps on `dist` and returns what it did.
 * @param {{ dist?: string, root?: string, maps?: string }} [options]
 */
export async function postbuild({
  dist = join(ROOT, 'dist'),
  root = ROOT,
  maps = join(ROOT, 'sourcemaps'),
} = {}) {
  try {
    await stat(join(dist, 'index.html'));
  } catch {
    throw new Error(`${join(dist, 'index.html')} not found — run \`vite build\` first.`);
  }

  await copyFile(join(dist, 'index.html'), join(dist, '404.html'));
  await writeFile(join(dist, '.nojekyll'), '');
  for (const [source, target] of LICENCE_FILES) {
    await copyFile(join(root, source), join(dist, target));
  }

  await rm(maps, { recursive: true, force: true });
  const moved = [];
  for (const file of await filesBelow(dist)) {
    if (!file.endsWith('.map')) continue;
    await mkdir(dirname(join(maps, file)), { recursive: true });
    await rename(join(dist, file), join(maps, file));
    moved.push(file);
  }
  return { licences: LICENCE_FILES.map(([, target]) => target), maps: moved };
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  postbuild()
    .then(({ licences, maps }) => {
      console.log(
        `postbuild: wrote dist/404.html, dist/.nojekyll, ${licences.map((f) => `dist/${f}`).join(', ')}` +
          `; moved ${maps.length} source map${maps.length === 1 ? '' : 's'} to sourcemaps/`,
      );
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
