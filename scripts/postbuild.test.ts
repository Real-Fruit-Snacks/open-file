// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { postbuild } from './postbuild.mjs';

const work = mkdtempSync(join(tmpdir(), 'postbuild-test-'));
afterAll(() => rmSync(work, { recursive: true, force: true }));

describe('postbuild', () => {
  it('ships the licence and notices, adds the Pages files and moves the source maps out', async () => {
    const dist = join(work, 'dist');
    const maps = join(work, 'sourcemaps');
    mkdirSync(join(dist, 'assets'), { recursive: true });
    writeFileSync(join(dist, 'index.html'), '<!doctype html><title>app</title>');
    writeFileSync(join(dist, 'assets', 'index-abc.js'), 'console.log(1);');
    writeFileSync(join(dist, 'assets', 'index-abc.js.map'), '{"version":3}');
    writeFileSync(join(dist, 'sw.js.map'), '{"version":3}');
    // A stale map from an earlier build must not survive.
    mkdirSync(maps);
    writeFileSync(join(maps, 'stale.js.map'), '{}');

    const result = await postbuild({ dist, maps, root: process.cwd() });

    expect(readFileSync(join(dist, '404.html'), 'utf8')).toBe('<!doctype html><title>app</title>');
    expect(existsSync(join(dist, '.nojekyll'))).toBe(true);
    expect(readFileSync(join(dist, 'licence.txt'), 'utf8')).toBe(readFileSync('LICENSE', 'utf8'));
    expect(readFileSync(join(dist, 'licence.txt'), 'utf8')).toContain('GNU GENERAL PUBLIC LICENSE');
    // The human-like opponent's model is AGPL-3.0: its licence ships too.
    expect(readFileSync(join(dist, 'licence-agpl.txt'), 'utf8')).toContain(
      'GNU AFFERO GENERAL PUBLIC LICENSE',
    );
    // The Chessnut piece set is Apache-2.0, which asks for its licence to travel with it.
    expect(readFileSync(join(dist, 'licence-apache.txt'), 'utf8')).toContain(
      'Apache License\n                           Version 2.0',
    );
    // So are the fonts, IBM Plex, under the SIL Open Font License.
    expect(readFileSync(join(dist, 'licence-ofl.txt'), 'utf8')).toContain(
      'SIL OPEN FONT LICENSE Version 1.1',
    );
    expect(readFileSync(join(dist, 'notices.txt'), 'utf8')).toContain('Colin M.L. Burnett');
    expect(readFileSync(join(dist, 'notices.txt'), 'utf8')).toContain('IBM Plex');
    expect(readFileSync(join(dist, 'notices.txt'), 'utf8')).toContain('Maia-3');
    expect(readFileSync(join(dist, 'notices.txt'), 'utf8')).toContain('CC BY-NC-SA 4.0');
    expect(result.licences).toEqual([
      'licence.txt',
      'licence-agpl.txt',
      'licence-apache.txt',
      'licence-ofl.txt',
      'notices.txt',
    ]);

    expect(result.maps.sort()).toEqual([join('assets', 'index-abc.js.map'), 'sw.js.map']);
    expect(existsSync(join(dist, 'assets', 'index-abc.js.map'))).toBe(false);
    expect(existsSync(join(maps, 'assets', 'index-abc.js.map'))).toBe(true);
    expect(existsSync(join(maps, 'stale.js.map'))).toBe(false);
    expect(existsSync(join(dist, 'assets', 'index-abc.js'))).toBe(true);
  });

  it('refuses to run before a build', async () => {
    await expect(postbuild({ dist: join(work, 'nothing'), maps: join(work, 'm') })).rejects.toThrow(
      /run `vite build` first/,
    );
  });
});
