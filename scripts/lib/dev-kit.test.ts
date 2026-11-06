// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  declaredLicence,
  devKitFolderName,
  devKitZipName,
  gitForWindows,
  redistributable,
  sourceFolder,
  toolchains,
  withSha256Sums,
} from './dev-kit.mjs';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const AT = {
  nvmrc: '22\n',
  engines: '>=22.22',
  goMod: 'module example.com/launcher\n\ngo 1.24\n',
  node: '22.23.4',
  go: 'go1.24.13',
  npm: '10.9.9',
  git: 'git version 2.51.2.windows.1',
};

describe('the dev kit', () => {
  it('is named after the version, and says what it is for', () => {
    expect(devKitFolderName('0.33.0')).toBe('open-file-0.33.0-dev');
    expect(devKitZipName('0.33.0')).toBe('open-file-0.33.0-dev-windows-x64.zip');
  });

  it('asks for the Node and Go CI uses, with their offline installers', () => {
    const { rows, problems } = toolchains(AT);
    expect(problems).toEqual([]);
    expect(rows.map((row) => [row.command, row.version, row.minimum])).toEqual([
      ['node', '22.23.4', '22.22'],
      ['go', '1.24.13', '1.24'],
      ['git', '2.51.2', ''],
    ]);
    expect(rows[0]?.url).toBe('https://nodejs.org/dist/v22.23.4/node-v22.23.4-x64.msi');
    expect(rows[1]?.url).toBe('https://go.dev/dl/go1.24.13.windows-amd64.msi');
    expect(rows[2]?.url).toBe(
      'https://github.com/git-for-windows/git/releases/download/v2.51.2.windows.1/Git-2.51.2-64-bit.exe',
    );
  });

  it('reads them from where CI does', () => {
    const nvmrc = read('.nvmrc');
    const goMod = read('launcher/go.mod');
    const { problems } = toolchains({
      ...AT,
      nvmrc,
      engines: (JSON.parse(read('package.json')) as { engines: { node: string } }).engines.node,
      goMod,
      // A patch release of each, as setup-node and setup-go pick.
      node: `${nvmrc.trim()}.99.1`,
      go: `go${/^go (\d+\.\d+)/m.exec(goMod)?.[1]}.99`,
    });
    expect(problems).toEqual([]);
  });

  it('refuses to name a Node or Go other than CI’s', () => {
    expect(toolchains({ ...AT, node: '24.20.0' }).problems).toEqual([
      "Node 24.20.0 is running, but .nvmrc (CI's Node) says 22",
    ]);
    expect(toolchains({ ...AT, go: 'go1.25.1' }).problems).toEqual([
      "Go 1.25.1 is running, but launcher/go.mod (CI's Go) says 1.24",
    ]);
    expect(toolchains({ ...AT, go: null }).problems).toHaveLength(1);
    expect(toolchains({ ...AT, engines: '^22' }).problems).toHaveLength(1);
  });

  it('finds Git for Windows’ installer, builds after the first included', () => {
    expect(gitForWindows('git version 2.51.0.windows.2')).toEqual({
      version: '2.51.0 (build 2)',
      url: 'https://github.com/git-for-windows/git/releases/download/v2.51.0.windows.2/Git-2.51.0.2-64-bit.exe',
    });
    expect(gitForWindows('git version 2.43.0')).toBeNull();
    expect(toolchains({ ...AT, git: 'git version 2.43.0' }).rows[2]?.url).toBe(
      'https://git-scm.com/downloads/win',
    );
  });

  it('reads the folder the setup scripts copy from', () => {
    expect(sourceFolder(['--force'])).toBeNull();
    expect(sourceFolder(['--from', 'offline/files/engine'])).toBe(resolve('offline/files/engine'));
    expect(sourceFolder(['--lite', '--from=kit/maia'])).toBe(resolve('kit/maia'));
    expect(() => sourceFolder(['--from'])).toThrow(/needs a folder/);
    expect(() => sourceFolder(['--from', '--force'])).toThrow(/needs a folder/);
  });

  it('carries a package only under a licence that lets it be passed on', () => {
    expect(redistributable('MIT')).toBe(true);
    expect(redistributable('(MIT OR CC0-1.0)')).toBe(true);
    expect(redistributable('GPL-3.0-or-later')).toBe(true);
    expect(redistributable('MIT AND Zlib')).toBe(true);
    expect(redistributable('MIT AND SEE LICENSE IN EULA.txt')).toBe(false);
    expect(redistributable('UNLICENSED')).toBe(false);
    expect(redistributable('(MIT OR (Apache-2.0 AND BSD-3-Clause))')).toBe(false);
    expect(redistributable(null)).toBe(false);
    expect(declaredLicence({ license: 'ISC' })).toBe('ISC');
    expect(declaredLicence({ license: { type: 'MIT' } })).toBe('MIT');
    expect(declaredLicence({ licenses: [{ type: 'MIT' }, { type: 'Apache-2.0' }] })).toBe(
      '(MIT OR Apache-2.0)',
    );
    expect(declaredLicence({})).toBeNull();
  });

  it('adds its checksum beside the offline copy’s, replacing its own', () => {
    const offline = `${'a'.repeat(64)}  open-file-1.0.0-offline.zip\n`;
    const kit = { sha256: 'b'.repeat(64), name: 'open-file-1.0.0-dev-windows-x64.zip' };
    const both = withSha256Sums(offline, [kit]);
    expect(both).toBe(`${'b'.repeat(64)}  ${kit.name}\n${offline}`);
    expect(withSha256Sums(both, [{ ...kit, sha256: 'c'.repeat(64) }])).toBe(
      `${'c'.repeat(64)}  ${kit.name}\n${offline}`,
    );
    expect(withSha256Sums('', [kit])).toBe(`${'b'.repeat(64)}  ${kit.name}\n`);
  });

  it('sets up with a script Windows PowerShell 5.1 reads alike in any code page', () => {
    const script = readFileSync(new URL('../dev-kit/setup.ps1', import.meta.url));
    expect(
      [...script].every((byte) => byte === 0x0a || byte === 0x09 || (byte >= 0x20 && byte < 0x7f)),
    ).toBe(true);
  });
});
