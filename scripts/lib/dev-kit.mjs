/**
 * The dev kit a release carries (scripts/build-dev-kit.mjs): its names, the
 * toolchains it asks for, the licences it may carry and the setup scripts'
 * `--from` option, as plain data and functions, so they can be tested without
 * a network, Windows or a zip.
 */
import { resolve } from 'node:path';

/**
 * The folder the kit unpacks to: the repository at the release, and offline/.
 * @param {string} version
 */
export function devKitFolderName(version) {
  return `open-file-${version}-dev`;
}

/**
 * The release's download. The npm packages and the browser in it are Windows x64 builds.
 * @param {string} version
 */
export function devKitZipName(version) {
  return `open-file-${version}-dev-windows-x64.zip`;
}

/**
 * The folder `--from <folder>` (or `--from=<folder>`) names in `args`, made
 * absolute, or null without one: where scripts/setup-engine.mjs and
 * scripts/setup-maia.mjs copy their pinned files from instead of downloading them.
 * @param {string[]} args
 */
export function sourceFolder(args) {
  const at = args.findIndex((arg) => arg === '--from' || arg.startsWith('--from='));
  if (at < 0) return null;
  const folder = args[at] === '--from' ? args[at + 1] : args[at].slice('--from='.length);
  if (!folder || folder.startsWith('--')) throw new Error('--from needs a folder');
  return resolve(folder);
}

/**
 * What the kit asks a developer to install, read from where CI reads it: Node
 * from .nvmrc (its major version; package.json's `engines` is the oldest that
 * works) and Go from launcher/go.mod. The versions are the exact ones the kit
 * is built and tried with, which are CI's: setup-node and setup-go pick them
 * from the same two files. Git is optional. Returns the rows, and what is wrong
 * with the versions at hand (none when they are the ones CI picks).
 * @param {{ nvmrc: string, engines: string, goMod: string, node: string, go: string | null, npm: string, git: string | null }} at
 */
export function toolchains({ nvmrc, engines, goMod, node, go, npm, git }) {
  const problems = [];
  const nodeSeries = nvmrc.trim().replace(/^v/, '');
  const nodeMinimum = /^>=\s*(\d+(?:\.\d+){0,2})$/.exec(engines.trim())?.[1];
  if (!nodeMinimum) problems.push(`package.json's engines.node is not ">=<version>": ${engines}`);
  if (node.split('.')[0] !== nodeSeries.split('.')[0]) {
    problems.push(`Node ${node} is running, but .nvmrc (CI's Node) says ${nodeSeries}`);
  }
  const goSeries = /^go\s+(\d+\.\d+(?:\.\d+)?)\s*$/m.exec(goMod)?.[1];
  if (!goSeries) problems.push('launcher/go.mod has no go line');
  const goVersion = go?.replace(/^go/, '') ?? null;
  if (!goVersion) {
    problems.push('Go is not installed: the kit names the Go it was tried with');
  } else if (
    goSeries &&
    goVersion.split('.').slice(0, 2).join('.') !== goSeries.split('.').slice(0, 2).join('.')
  ) {
    problems.push(`Go ${goVersion} is running, but launcher/go.mod (CI's Go) says ${goSeries}`);
  }
  const rows = [
    {
      name: 'Node.js',
      command: 'node',
      version: node,
      minimum: nodeMinimum ?? node,
      npm,
      url: `https://nodejs.org/dist/v${node}/node-v${node}-x64.msi`,
      for: 'everything: npm, the build, the tests and the dev server',
    },
    {
      name: 'Go',
      command: 'go',
      version: goVersion ?? goSeries ?? '',
      minimum: goSeries ?? '',
      url: `https://go.dev/dl/go${goVersion ?? goSeries}.windows-amd64.msi`,
      for: "the offline copy's launcher (launcher/): go vet, go test and npm run release:offline",
    },
  ];
  const gitVersion = (git && gitForWindows(git)) ?? {
    version: 'any',
    url: 'https://git-scm.com/downloads/win',
  };
  rows.push({
    name: 'Git for Windows',
    command: 'git',
    version: gitVersion.version,
    minimum: '',
    optional: true,
    url: gitVersion.url,
    for: "commits; and its sh, with which one unit test checks the launcher's shell scripts",
  });
  return { rows, problems };
}

/**
 * Git for Windows' version and installer from what `git --version` prints
 * ("git version 2.51.2.windows.1"), or null for another git.
 * @param {string} printed
 */
export function gitForWindows(printed) {
  const match = /(\d+\.\d+\.\d+)\.windows\.(\d+)/.exec(printed);
  if (!match) return null;
  const [, version, build] = match;
  const file = `Git-${version}${build === '1' ? '' : `.${build}`}-64-bit.exe`;
  return {
    version: build === '1' ? version : `${version} (build ${build})`,
    url: `https://github.com/git-for-windows/git/releases/download/v${version}.windows.${build}/${file}`,
  };
}

/**
 * The licences the kit may carry a package under: each lets anyone pass the
 * package on, with its notice. A package under any other is refused, so that
 * someone reads its terms before the kit ships it.
 */
export const REDISTRIBUTABLE = new Set([
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC-BY-4.0',
  'CC0-1.0',
  'GPL-3.0-only',
  'GPL-3.0-or-later',
  'ISC',
  'MIT',
  'MIT-0',
  'MPL-2.0',
  'Python-2.0',
  'Unlicense',
  'Zlib',
]);

/**
 * Whether an SPDX expression ("MIT", "(MIT OR CC0-1.0)", "MIT AND Zlib") lets
 * the kit carry the package: one side of an OR, every side of an AND.
 * @param {unknown} expression
 */
export function redistributable(expression) {
  if (typeof expression !== 'string' || expression.trim() === '') return false;
  const bare = expression.trim().replace(/^\((.*)\)$/, '$1');
  if (/\(/.test(bare)) return false;
  return bare
    .split(/\s+OR\s+/)
    .some((either) => either.split(/\s+AND\s+/).every((id) => REDISTRIBUTABLE.has(id.trim())));
}

/**
 * The licence a package.json declares: `license`, or the old `licenses` list.
 * @param {any} pkg
 * @returns {string | null}
 */
export function declaredLicence(pkg) {
  if (typeof pkg?.license === 'string') return pkg.license;
  if (typeof pkg?.license?.type === 'string') return pkg.license.type;
  if (Array.isArray(pkg?.licenses)) {
    const types = pkg.licenses.map((l) => (typeof l === 'string' ? l : l?.type)).filter(Boolean);
    if (types.length > 0) return types.length === 1 ? types[0] : `(${types.join(' OR ')})`;
  }
  return null;
}

/**
 * SHA256SUMS.txt with `entries` in it: their lines replace any for the same
 * names, the rest stay, sorted by name.
 * @param {string} existing
 * @param {{ sha256: string, name: string }[]} entries
 */
export function withSha256Sums(existing, entries) {
  const names = new Set(entries.map((entry) => entry.name));
  const kept = existing
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => /^([0-9a-f]{64})\s+\*?(.+)$/.exec(line.trim()))
    .filter((match) => match && !names.has(match[2]))
    .map((match) => ({ sha256: match[1], name: match[2] }));
  return [...kept, ...entries]
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map(({ sha256, name }) => `${sha256}  ${name}\n`)
    .join('');
}
