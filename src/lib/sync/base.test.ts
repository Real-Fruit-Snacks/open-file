import { afterEach, describe, expect, it, vi } from 'vitest';
import { storageKeyFor } from '@/store/profiles';
import { fakeCaches } from '@/test/fakeCaches';
import { emptySnapshot, fixtureSnapshot } from '@/test/syncFixtures';
import { BASE_MARK_KEY, baseMark, dropCopies, forgetBase, loadCopy, saveCopy } from './base';

afterEach(async () => {
  await dropCopies();
  await dropCopies('other');
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.resetModules();
});

const copy = (generation: number) => ({
  snapshot: generation === 1 ? fixtureSnapshot() : emptySnapshot(),
  writes: { 'device-abc-123': generation },
});

describe('the copies merges are measured against', () => {
  it('are kept by id, compressed in the Cache API, and read back by another tab', async () => {
    const caches = fakeCaches();
    vi.stubGlobal('caches', caches.api);
    await saveCopy('copy-one-1234', copy(1));
    expect(caches.entries.size).toBe(1);
    // Another tab: no copy in its memory, the same Cache API.
    vi.resetModules();
    const other = await import('./base');
    expect(await other.loadCopy('copy-one-1234')).toEqual(copy(1));
    expect(await other.loadCopy('copy-two-1234')).toBeNull();
  });

  it('read their settings as a load does: a Black scheme kept by 0.31 is Nightshift', async () => {
    const caches = fakeCaches();
    vi.stubGlobal('caches', caches.api);
    const old = copy(1);
    await saveCopy('copy-old-1234', {
      ...old,
      snapshot: { ...old.snapshot, settings: { colorScheme: 'black', notation: 'letters' } },
    } as never);
    vi.resetModules();
    const other = await import('./base');
    expect((await other.loadCopy('copy-old-1234'))?.snapshot.settings).toEqual({
      colorScheme: 'dark',
      notation: 'letters',
    });
  });

  it('serve from this tab’s memory when the Cache API refuses them', async () => {
    const caches = fakeCaches();
    caches.failPuts = true;
    vi.stubGlobal('caches', caches.api);
    await saveCopy('copy-one-1234', copy(1));
    expect(caches.entries.size).toBe(0);
    expect(await loadCopy('copy-one-1234')).toEqual(copy(1));
  });

  it('go, all but the ones kept, for this profile only', async () => {
    const caches = fakeCaches();
    vi.stubGlobal('caches', caches.api);
    await saveCopy('copy-one-1234', copy(1));
    await saveCopy('copy-two-1234', copy(2));
    await saveCopy('copy-one-1234', copy(1), 'other');
    await dropCopies(undefined, ['copy-two-1234']);
    expect(await loadCopy('copy-one-1234')).toBeNull();
    expect(await loadCopy('copy-two-1234')).toEqual(copy(2));
    expect(await loadCopy('copy-one-1234', 'other')).toEqual(copy(1));
  });

  it('cannot lose a copy saved after a deletion was asked for', async () => {
    const caches = fakeCaches();
    vi.stubGlobal('caches', caches.api);
    await saveCopy('copy-one-1234', copy(1));
    const dropping = dropCopies(undefined, ['copy-one-1234']);
    const saving = saveCopy('copy-two-1234', copy(2));
    await Promise.all([dropping, saving]);
    vi.resetModules();
    const other = await import('./base');
    expect(await other.loadCopy('copy-two-1234')).toEqual(copy(2));
  });
});

describe('the base mark', () => {
  it('changes when the base is forgotten, and the copies go with it', async () => {
    const caches = fakeCaches();
    vi.stubGlobal('caches', caches.api);
    expect(baseMark()).toBe('');
    await saveCopy('copy-one-1234', copy(1));
    expect(forgetBase()).toBe(true);
    const mark = baseMark();
    expect(mark).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(localStorage.getItem(storageKeyFor(BASE_MARK_KEY))).toBe(mark);
    await vi.waitFor(() => expect(caches.entries.size).toBe(0));
    forgetBase();
    expect(baseMark()).not.toBe(mark);
  });
});
