// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ENGINE_BUILDS,
  LAUNCHERS,
  OFFLINE_PORT,
  START_SCRIPTS,
  builtForRoot,
  fillTemplate,
  offlineFolderName,
  offlineZipName,
  pinnedFiles,
  sha256Sums,
} from './offline.mjs';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

/** Whether there is a POSIX shell to ask: always on Linux and macOS, on Windows only Git's on the PATH. */
const hasShell = !spawnSync('sh', ['-c', 'exit 0']).error;

const ENGINE = {
  files: ENGINE_BUILDS.flatMap((build, i) => [
    { name: `sf-${i}.js`, sha256: `js${i}`, build },
    { name: `sf-${i}.wasm`, sha256: `wasm${i}`, build },
  ]),
};
const MAIA = {
  model: { name: 'maia.onnx', sha256: 'model' },
  runtime: { name: 'ort.wasm', sha256: 'runtime' },
};

describe('the offline copy', () => {
  it('serves on the port the launcher asks for', () => {
    const port = /const DefaultPort = (\d+)/.exec(read('launcher/main.go'))?.[1];
    expect(Number(port)).toBe(OFFLINE_PORT);
  });

  it('is named after the version', () => {
    expect(offlineFolderName('0.27.0')).toBe('open-file-0.27.0');
    expect(offlineZipName('0.27.0')).toBe('open-file-0.27.0-offline.zip');
  });

  it('needs a build for the root of a site', () => {
    expect(builtForRoot('<script type="module" src="/assets/index-abc.js"></script>')).toBe(true);
    expect(builtForRoot('<link rel="stylesheet" href="/assets/index-abc.css">')).toBe(true);
    expect(
      builtForRoot('<script type="module" src="/open-file/assets/index-abc.js"></script>'),
    ).toBe(false);
  });

  it('carries every engine build and the human-like opponent, as pinned', () => {
    const { files, problems } = pinnedFiles(ENGINE, MAIA);
    expect(problems).toEqual([]);
    expect(files).toHaveLength(10);
    expect(files).toContainEqual({ path: 'engine/sf-3.wasm', sha256: 'wasm3' });
    expect(files).toContainEqual({ path: 'maia/maia.onnx', sha256: 'model' });
    expect(files).toContainEqual({ path: 'maia/ort.wasm', sha256: 'runtime' });
  });

  it('says what the manifests lack', () => {
    const lite = { files: ENGINE.files.filter((file) => !file.build.startsWith('full')) };
    expect(pinnedFiles(lite, { model: MAIA.model }).problems).toEqual([
      'engine/version.json lists no full-single build',
      'engine/version.json lists no full-multi build',
      'maia/version.json names no runtime',
    ]);
    expect(pinnedFiles(null, null).problems).toHaveLength(6);
  });

  it('fills its texts, and refuses to leave a slot empty', () => {
    expect(fillTemplate('Open File {{VERSION}} at {{PORT}}', { VERSION: '1.0.0', PORT: 1 })).toBe(
      'Open File 1.0.0 at 1',
    );
    expect(() => fillTemplate('{{VERSION}} {{NOPE}}', { VERSION: '1' })).toThrow('{{NOPE}}');
  });

  it('writes the checksum file as sha256sum reads it', () => {
    expect(sha256Sums([{ sha256: 'abc', name: 'open-file-1.0.0-offline.zip' }])).toBe(
      'abc  open-file-1.0.0-offline.zip\n',
    );
  });

  it('has a README that fills, and names every way to start it', () => {
    const readme = fillTemplate(read('launcher/bundle/README.txt'), {
      VERSION: '1.0.0',
      PORT: OFFLINE_PORT,
      SITE_URL: 'https://example.com/',
      RELEASES_URL: 'https://example.com/releases',
      REPOSITORY_URL: 'https://example.com/repo',
    });
    expect(readme).toContain(`http://localhost:${OFFLINE_PORT}/`);
    for (const { path } of [
      ...LAUNCHERS.filter((l) => !l.path.startsWith('bin/')),
      ...START_SCRIPTS,
    ]) {
      expect(readme).toContain(path);
    }
    expect(readme).toContain('licences/launcher.txt');
    // Plain text a terminal and Notepad show as written.
    expect(readme.split('\n').every((line) => line.length <= 80)).toBe(true);
  });

  it('starts the launchers the copy carries', () => {
    const scripts = Object.fromEntries(
      START_SCRIPTS.map(({ from }) => [from, read(`launcher/bundle/${from}`)]),
    );
    for (const { goos, path } of LAUNCHERS.filter((l) => l.goos !== 'windows')) {
      const script = goos === 'darwin' ? scripts['start.command'] : scripts['start.sh'];
      expect(script).toContain(`$here/${path}`);
    }
    for (const { from } of START_SCRIPTS) {
      expect(scripts[from]?.startsWith('#!/bin/sh\n')).toBe(true);
    }
  });

  it.skipIf(!hasShell)('starts them with valid shell', () => {
    for (const { from } of START_SCRIPTS) {
      // `sh -n` reads without running.
      execFileSync('sh', [
        '-n',
        fileURLToPath(new URL(`../../launcher/bundle/${from}`, import.meta.url)),
      ]);
    }
  });

  it('builds a launcher for each system once', () => {
    expect(LAUNCHERS.map((l) => `${l.goos}/${l.goarch}`)).toEqual([
      'windows/amd64',
      'darwin/arm64',
      'darwin/amd64',
      'linux/amd64',
      'linux/arm64',
    ]);
    expect(new Set(LAUNCHERS.map((l) => l.path)).size).toBe(LAUNCHERS.length);
  });

  it('has a licence notice to fill', () => {
    expect(
      fillTemplate(read('launcher/bundle/launcher-licence.txt'), {
        REPOSITORY_URL: 'https://example.com/repo',
        GO_VERSION: '1.24.7',
      }),
    ).toContain('built with Go 1.24.7');
  });
});
