// @vitest-environment node
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
/** Installed, built or generated, not the project's own files. */
const SKIP = new Set([
  '.git',
  '.wrangler',
  'blob-report',
  'coverage',
  'dev-dist',
  'dist',
  'node_modules',
  'offline',
  'playwright-report',
  'release',
  'sourcemaps',
  'test-results',
]);

const MODULE = /\.(?:[cm]?[jt]sx?)$/;

/**
 * The names in each folder that the file systems of Windows and macOS, which ignore case, take
 * for one: two names that differ only in case (`Notes.md` and `notes.md`), and two modules whose
 * names do once their extension is gone (`Material.tsx` and `material.ts`). There, `./Material`
 * imports `material.ts`, and TypeScript leaves `Material.tsx` out of the project as a
 * lower-priority twin of `material.ts`, so it is neither linted nor type-checked.
 */
function caseTwins(dir: string, out: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const twins = (names: string[]) => {
    const seen = new Map<string, Set<string>>();
    for (const name of names)
      seen.set(name.toLowerCase(), (seen.get(name.toLowerCase()) ?? new Set()).add(name));
    for (const same of seen.values()) {
      if (same.size > 1) out.push(`${relative(ROOT, dir) || '.'}: ${[...same].sort().join(', ')}`);
    }
  };
  twins(entries.map((entry) => entry.name));
  twins(
    entries.filter((e) => e.isFile() && MODULE.test(e.name)).map((e) => e.name.replace(MODULE, '')),
  );
  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP.has(entry.name)) caseTwins(join(dir, entry.name), out);
  }
  return out;
}

describe('file names', () => {
  it('can all be told apart where case is ignored (Windows, macOS)', () => {
    expect(caseTwins(ROOT)).toEqual([]);
  });
});
