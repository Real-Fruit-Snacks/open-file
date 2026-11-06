#!/usr/bin/env node
/**
 * Builds the dev kit of a release: everything needed to build, test and change
 * Open File on Windows x64 with no internet connection, but Node and Go. It
 * unzips to one folder, release/open-file-<version>-dev/ before it is zipped:
 *
 *   the repository at HEAD (`git archive`: no .git), and
 *   offline/
 *     README.md       what is in the kit, what to install first, and the steps
 *                     (from scripts/dev-kit/README.md)
 *     setup.ps1       installs everything from the kit, with no network
 *                     (scripts/dev-kit/setup.ps1)
 *     kit.json        what the kit holds and asks for, for setup.ps1
 *     npm-cache/      every npm package `npm ci` installs on Windows, for the app
 *                     and for relay/ (an npm cache)
 *     files/engine/   the pinned Stockfish builds (scripts/setup-engine.mjs)
 *     files/maia/     the pinned Maia-3 model (scripts/setup-maia.mjs)
 *     files/ms-playwright/
 *                     the headless Chromium the end-to-end tests run in, for the
 *                     installed Playwright
 *     licences/       the licence and notices of each of them
 *
 * zipped as release/open-file-<version>-dev-windows-x64.zip, with its checksum
 * added to release/SHA256SUMS.txt. The release workflow builds it on Windows,
 * unzips it and tries it with the network cut off (.github/workflows/dev-kit.yml).
 *
 * The versions come from where CI reads them: the packages from the lockfiles,
 * the engine and the model from the setup scripts' pins, the browser from the
 * installed Playwright, and Node and Go from .nvmrc and launcher/go.mod — the
 * kit names the exact Node and Go it is built with, which must be the ones CI
 * picks from those files (`--any-toolchain` builds a trial kit with others).
 *
 * Usage:  node scripts/build-dev-kit.mjs [--worktree] [--any-toolchain]
 *
 *   --worktree       the files as they are in the working tree (tracked and new, not
 *                    ignored) instead of HEAD's
 *   --any-toolchain  build with a Node or Go other than CI's (the kit says which)
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  cpSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  declaredLicence,
  devKitFolderName,
  devKitZipName,
  redistributable,
  toolchains,
  withSha256Sums,
} from './lib/dev-kit.mjs';
import { fillTemplate } from './lib/offline.mjs';
import { ENGINE } from './setup-engine.mjs';
import { MAIA } from './setup-maia.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'release');
const TEMPLATES = join(ROOT, 'scripts', 'dev-kit');
/** The projects with a lockfile of their own, each installed with `npm ci`. */
const NPM_PROJECTS = ['.', 'relay'];

const args = process.argv.slice(2);
const fromWorktree = args.includes('--worktree');
const anyToolchain = args.includes('--any-toolchain');

const read = (path) => readFileSync(join(ROOT, path), 'utf8');

function fail(...lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

/** The SHA-256 of a file, read in chunks (the kit is about a gigabyte). */
function sha256Of(path) {
  return new Promise((done, failed) => {
    const hash = createHash('sha256');
    createReadStream(path)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => done(hash.digest('hex')))
      .on('error', failed);
  });
}

/** What a program prints, trimmed, or null when it cannot run. */
function output(command, commandArgs, options = {}) {
  try {
    return execFileSync(command, commandArgs, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      ...options,
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Runs npm with this Node: npm-cli.js beside it, as setup-node and the Windows
 * installer put it, else through the shell (npm.cmd).
 */
function npm(npmArgs, options = {}) {
  const cli =
    process.env.npm_execpath?.endsWith('.js') && existsSync(process.env.npm_execpath)
      ? process.env.npm_execpath
      : join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (existsSync(cli)) return execFileSync(process.execPath, [cli, ...npmArgs], options);
  const quoted = npmArgs.map((arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg));
  return execFileSync('npm', quoted, { ...options, shell: true });
}

/** Every file under dir, as paths relative to it with forward slashes, sorted. */
function filesUnder(dir) {
  const out = [];
  const walk = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = join(at, entry.name);
      if (entry.isDirectory()) walk(path);
      else out.push(relative(dir, path).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** The total size of the files under dir, in bytes. */
function sizeOf(dir) {
  return filesUnder(dir).reduce((sum, path) => sum + statSync(join(dir, path)).size, 0);
}

const megabytes = (bytes) => `${(bytes / 1_000_000).toFixed(1)} MB`;

// ---------------------------------------------------------------------------------------------

if (process.platform !== 'win32' || process.arch !== 'x64') {
  fail(
    'The dev kit is for Windows x64, and is built there: its npm packages and its browser are',
    "the ones npm and Playwright install on Windows. The release workflow builds it on GitHub's",
    'windows-latest runner (.github/workflows/dev-kit.yml).',
  );
}

const pkg = JSON.parse(read('package.json'));
const version = pkg.version;
const commit = output('git', ['rev-parse', 'HEAD'], { cwd: ROOT });
if (!commit) fail('The kit is made from a git checkout: git rev-parse HEAD failed.');

const tools = toolchains({
  nvmrc: read('.nvmrc'),
  engines: pkg.engines?.node ?? '',
  goMod: read('launcher/go.mod'),
  node: process.versions.node,
  go: output('go', ['env', 'GOVERSION']),
  npm: String(npm(['--version'], { encoding: 'utf8' })).trim(),
  git: output('git', ['--version']),
});
if (tools.problems.length > 0) {
  const lines = tools.problems.map((p) => `  - ${p}`);
  if (!anyToolchain) {
    fail(
      "The kit names the Node and Go it is built with, so they must be CI's:",
      ...lines,
      'Use them, or --any-toolchain for a trial kit.',
    );
  }
  console.warn('A trial kit, with other toolchains than CI\u2019s:', ...lines);
}

const folderName = devKitFolderName(version);
const kit = join(OUT, folderName);
const offline = join(kit, 'offline');
const work = join(OUT, 'dev-kit-work');
const zipName = devKitZipName(version);
const zip = join(OUT, zipName);
rmSync(kit, { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
rmSync(zip, { force: true });
mkdirSync(offline, { recursive: true });
mkdirSync(work, { recursive: true });

console.log(`Building the Open File ${version} dev kit in release/${folderName}/`);

// The source: HEAD as git archives it (the working tree's files with --worktree).
if (fromWorktree) {
  const listed = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: ROOT, encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
  for (const path of listed) {
    const from = join(ROOT, path);
    if (!existsSync(from)) continue; // Deleted, not yet committed.
    mkdirSync(dirname(join(kit, path)), { recursive: true });
    copyFileSync(from, join(kit, path));
  }
  console.log(`  source: the working tree at ${commit.slice(0, 12)}, ${listed.length} files`);
} else {
  const tar = join(work, 'source.tar');
  execFileSync('git', ['archive', '--format=tar', '-o', tar, 'HEAD'], { cwd: ROOT });
  // Windows' own tar (bsdtar), with a relative archive path, which every tar reads alike.
  execFileSync(windowsTar(), ['-x', '-f', relative(kit, tar)], { cwd: kit });
  rmSync(tar);
  console.log(`  source: ${commit.slice(0, 12)} (git archive HEAD)`);
}

// The npm packages: `npm ci` for each project into a cache of the kit's own, so the cache holds
// exactly what an install on Windows fetches, downloaded fresh. Installed beside the kit, in
// release/dev-kit-work/, for the licences and Playwright below.
const cache = join(offline, 'npm-cache');
for (const project of NPM_PROJECTS) {
  const at = join(work, project);
  mkdirSync(at, { recursive: true });
  for (const file of ['package.json', 'package-lock.json']) {
    copyFileSync(join(kit, project, file), join(at, file));
  }
  npm(['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', cache], {
    cwd: at,
    stdio: 'inherit',
  });
}
console.log(`  offline/npm-cache/: ${megabytes(sizeOf(cache))}`);

// The engine and the model, as the setup scripts pin them: from public/ when it holds them at
// their checksums (CI's setup put them there), otherwise downloaded.
async function pinnedFile({ name, sha256: wanted, url, installed, to }) {
  let data = existsSync(installed) ? readFileSync(installed) : null;
  if (!data || sha256(data) !== wanted) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) fail(`Failed to download ${url}: HTTP ${res.status}`);
    data = Buffer.from(await res.arrayBuffer());
  }
  if (sha256(data) !== wanted) fail(`${name} does not match its pinned SHA-256: ${url}`);
  mkdirSync(to, { recursive: true });
  writeFileSync(join(to, name), data);
}
for (const file of ENGINE.files) {
  await pinnedFile({
    ...file,
    url: ENGINE.releaseBase + file.name,
    installed: join(ROOT, 'public', 'engine', file.name),
    to: join(offline, 'files', 'engine'),
  });
}
await pinnedFile({
  ...MAIA.model,
  installed: join(ROOT, 'public', 'maia', MAIA.model.name),
  to: join(offline, 'files', 'maia'),
});
console.log(
  `  offline/files/engine/: Stockfish ${ENGINE.version}, ${ENGINE.files.length} files; offline/files/maia/: ${MAIA.model.name}`,
);

// The browser: Chromium's headless shell, which Playwright runs the tests in (headless), for
// the Playwright the lockfile installs. Playwright also fetches FFmpeg (for videos, which the
// tests do not record) and winldd (for checking a browser's DLLs, which Chromium does without);
// the kit leaves them out.
const playwrightCore = join(work, 'node_modules', 'playwright-core');
const playwrightVersion = JSON.parse(
  readFileSync(join(playwrightCore, 'package.json'), 'utf8'),
).version;
const shell = JSON.parse(readFileSync(join(playwrightCore, 'browsers.json'), 'utf8')).browsers.find(
  (browser) => browser.name === 'chromium-headless-shell',
);
if (!shell) fail('playwright-core/browsers.json names no chromium-headless-shell');
const shellFolder = `chromium_headless_shell-${shell.revision}`;
const downloads = join(work, 'ms-playwright');
execFileSync(
  process.execPath,
  [
    join(work, 'node_modules', '@playwright', 'test', 'cli.js'),
    'install',
    '--only-shell',
    'chromium',
  ],
  { cwd: work, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: downloads } },
);
if (!existsSync(join(downloads, shellFolder, 'INSTALLATION_COMPLETE'))) {
  fail(`Playwright did not install ${shellFolder}`);
}
const browsers = join(offline, 'files', 'ms-playwright');
cpSync(join(downloads, shellFolder), join(browsers, shellFolder), { recursive: true });
console.log(
  `  offline/files/ms-playwright/${shellFolder}: Chrome Headless Shell ${shell.browserVersion}, for Playwright ${playwrightVersion}`,
);

// The licences. npm packages: each one installed, under a licence that lets the kit pass it on.
const licences = join(offline, 'licences');
mkdirSync(join(licences, 'npm'), { recursive: true });
const LICENCE_FILE = /^(?:licen[cs]e|copying|notice|copyright)(?:[-._].*)?$/i;
const packages = new Map();
const findPackages = (modules) => {
  if (!existsSync(modules)) return;
  for (const entry of readdirSync(modules, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    if (entry.name.startsWith('@')) {
      findPackages(join(modules, entry.name));
      continue;
    }
    const dir = join(modules, entry.name);
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      const meta = JSON.parse(readFileSync(manifest, 'utf8'));
      if (meta.name && meta.version) packages.set(`${meta.name}@${meta.version}`, { meta, dir });
    }
    findPackages(join(dir, 'node_modules'));
  }
};
for (const project of NPM_PROJECTS) findPackages(join(work, project, 'node_modules'));
const refused = [];
const npmRows = [];
for (const [id, { meta, dir }] of [...packages].sort(([a], [b]) => (a < b ? -1 : 1))) {
  const licence = declaredLicence(meta);
  if (!redistributable(licence)) refused.push(`${id}: ${licence ?? '(no licence named)'}`);
  const texts = readdirSync(dir)
    .filter((name) => LICENCE_FILE.test(name) && statSync(join(dir, name)).isFile())
    .sort()
    .map((name) => `----- ${name} -----\n\n${readFileSync(join(dir, name), 'utf8').trim()}\n`);
  const file = `${id.replace(/^@/, '').replace(/\//g, '+')}.txt`;
  writeFileSync(
    join(licences, 'npm', file),
    `${id}\nLicence: ${licence}\n${meta.homepage ? `Home: ${meta.homepage}\n` : ''}\n` +
      (texts.length > 0
        ? texts.join('\n')
        : `The package carries no licence file; its package.json names ${licence}.\n`),
  );
  npmRows.push(`| \`${id}\` | ${licence} | [npm/${file}](npm/${file}) |`);
}
if (refused.length > 0) {
  fail(
    'These packages name a licence the kit has not been cleared to pass on (REDISTRIBUTABLE,',
    'scripts/lib/dev-kit.mjs). Read their terms, then add the licence there if it allows it:',
    ...refused.map((line) => `  - ${line}`),
  );
}

// The engine (GPL-3.0), the model (AGPL-3.0) and the browser (Chromium's licences, in the file
// its download carries), with where their source is: as THIRD_PARTY_NOTICES.md says for the app.
writeFileSync(
  join(licences, 'stockfish.txt'),
  `Stockfish ${ENGINE.version}, as built by Stockfish.js (offline/files/engine/)
Licence: GPL-3.0-only

The engine builds are the files of the Stockfish.js v${ENGINE.version} release, unmodified:
${ENGINE.releaseBase.replace('/download/', '/tag/').replace(/\/$/, '')}
Their source code is that release's (https://github.com/nmrugg/stockfish.js), built from the
Stockfish sources it names (https://github.com/official-stockfish/Stockfish). Their SHA-256
checksums are pinned in scripts/setup-engine.mjs.

The GNU General Public License, version 3, follows.

${read('LICENSE').trim()}
`,
);
writeFileSync(
  join(licences, 'maia3.txt'),
  `Maia-3, 5M parameters, half-precision weights (offline/files/maia/${MAIA.model.name})
Licence: AGPL-3.0, by the University of Toronto's Computational Social Science Lab

The model is the file at ${MAIA.model.url}
unmodified (bqrio's browser-ready ONNX export at a pinned revision); the original checkpoints
are at ${MAIA.model.source}. Its SHA-256 is pinned in scripts/setup-maia.mjs.

The GNU Affero General Public License, version 3, follows.

${read('LICENSES/AGPL-3.0.txt').trim()}
`,
);
const shellLicence = join(
  browsers,
  shellFolder,
  'chrome-headless-shell-win64',
  'LICENSE.headless_shell',
);
if (!existsSync(shellLicence)) fail(`${shellFolder} carries no LICENSE.headless_shell`);
writeFileSync(
  join(licences, 'chrome-headless-shell.txt'),
  `Chrome Headless Shell ${shell.browserVersion} (offline/files/ms-playwright/${shellFolder}/)
Licence: BSD-3-Clause (the Chromium project), and the licences of the components in it, below

Chromium's headless shell, built by Google for Chrome for Testing and served by Playwright
${playwrightVersion} as its revision ${shell.revision}, unmodified. Its source code is Chromium's, at
https://chromium.googlesource.com/chromium/src/+/refs/tags/${shell.browserVersion}
The text below is the LICENSE.headless_shell file it comes with (also in its folder).

${readFileSync(shellLicence, 'utf8').trim()}
`,
);

// What the kit holds and asks for, for setup.ps1 (ASCII, which Windows PowerShell 5.1 reads alike
// in every code page).
const manifest = {
  name: 'open-file',
  version,
  commit,
  source: fromWorktree ? 'worktree' : 'HEAD',
  toolchains: tools.rows,
  npm: { cache: 'npm-cache', projects: NPM_PROJECTS },
  files: { engine: 'files/engine', maia: 'files/maia' },
  playwright: {
    version: playwrightVersion,
    browsersPath: 'files/ms-playwright',
    browsers: [{ name: 'chromium-headless-shell', folder: shellFolder }],
  },
};
writeFileSync(join(offline, 'kit.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'ascii');

const setup = readFileSync(join(TEMPLATES, 'setup.ps1'));
if (
  setup.some(
    (byte) => byte > 0x7e || (byte < 0x20 && byte !== 0x0a && byte !== 0x0d && byte !== 0x09),
  )
) {
  fail(
    'scripts/dev-kit/setup.ps1 must be plain ASCII: Windows PowerShell 5.1 reads it in the code page.',
  );
}
writeFileSync(join(offline, 'setup.ps1'), setup);

writeFileSync(
  join(licences, 'README.md'),
  `# Licences

What the kit carries besides Open File itself (GPL-3.0-or-later: \`LICENSE\` at the top of the
kit), each with its licence and notices in the file named.

| Component | Licence | File |
| --- | --- | --- |
| Stockfish ${ENGINE.version} (\`offline/files/engine/\`) | GPL-3.0-only | [stockfish.txt](stockfish.txt) |
| Maia-3 (\`offline/files/maia/\`) | AGPL-3.0 | [maia3.txt](maia3.txt) |
| Chrome Headless Shell ${shell.browserVersion} (\`offline/files/ms-playwright/\`) | BSD-3-Clause and others | [chrome-headless-shell.txt](chrome-headless-shell.txt) |
${npmRows.map((row) => row.replace(/^\| `/, '| npm: `')).join('\n')}
`,
);

// The longest path in the kit, for the README: Windows' Extract All stops at 260 characters.
const longest = Math.max(
  ...filesUnder(kit).map((path) => `${folderName}/${path}`.length),
  `${folderName}/offline/README.md`.length,
);

const [node, go, git] = tools.rows;
writeFileSync(
  join(offline, 'README.md'),
  fillTemplate(readFileSync(join(TEMPLATES, 'README.md'), 'utf8'), {
    VERSION: version,
    COMMIT: commit.slice(0, 12),
    NODE_VERSION: node.version,
    NODE_MINIMUM: node.minimum,
    NPM_VERSION: node.npm,
    NODE_URL: node.url,
    GO_VERSION: go.version,
    GO_MINIMUM: go.minimum,
    GO_URL: go.url,
    GIT_VERSION: git.version,
    GIT_URL: git.url,
    ENGINE_VERSION: ENGINE.version,
    MAIA_MODEL: MAIA.model.name,
    PLAYWRIGHT_VERSION: playwrightVersion,
    BROWSER_VERSION: shell.browserVersion,
    BROWSER_FOLDER: shellFolder,
    PACKAGES: packages.size,
    LONGEST_PATH: longest,
    FOLDER: folderName,
    ZIP: zipName,
  }),
);

rmSync(work, { recursive: true, force: true });

// The zip, by Windows' own tar (bsdtar), which writes zips that Windows, macOS and Linux unzip.
const entries = filesUnder(kit).length;
execFileSync(windowsTar(), ['-a', '-c', '-f', zipName, folderName], {
  cwd: OUT,
  stdio: 'inherit',
});
rmSync(kit, { recursive: true, force: true });

const sums = join(OUT, 'SHA256SUMS.txt');
const digest = await sha256Of(zip);
writeFileSync(
  sums,
  withSha256Sums(existsSync(sums) ? readFileSync(sums, 'utf8') : '', [
    { sha256: digest, name: zipName },
  ]),
);
console.log(
  `release/${zipName}: ${megabytes(statSync(zip).size)}, ${entries} files, the longest path ${longest} characters\nSHA-256 ${digest} (release/SHA256SUMS.txt)`,
);

/** Windows' own tar.exe (bsdtar), not another tar on the PATH (Git's GNU tar reads C: as a host). */
function windowsTar() {
  return join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
}
