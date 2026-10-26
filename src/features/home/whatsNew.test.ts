import { matchRoutes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '@/app/routes';
import { ICON_NAMES } from '@/components/ui/iconData';
import {
  CHANGELOG_URL,
  compareVersions,
  type Release,
  RELEASES,
  releaseDate,
  releasesUpTo,
  unseenRelease,
  versionLabel,
} from './whatsNew';

const release = (version: string): Release => ({ version, date: '2026-01-01', highlights: [] });
const TEST_RELEASES = [release('0.29.0'), release('0.28.1'), release('0.28.0'), release('0.30.0')];

describe('versions', () => {
  it('compare by their numbers, not as text', () => {
    expect(compareVersions('0.29.0', '0.28.0')).toBeGreaterThan(0);
    expect(compareVersions('0.9.0', '0.10.0')).toBeLessThan(0);
    expect(compareVersions('0.28.10', '0.28.9')).toBeGreaterThan(0);
    expect(compareVersions('v0.29.0', '0.29')).toBe(0);
    expect(compareVersions('0.29.0-beta.1', '0.29.0')).toBe(0);
    expect(compareVersions('1.0.0', '0.99.99')).toBeGreaterThan(0);
  });

  it('are named without a patch number of 0', () => {
    expect(versionLabel('0.29.0')).toBe('0.29');
    expect(versionLabel('0.28.1')).toBe('0.28.1');
    expect(versionLabel('1.0.0')).toBe('1.0');
  });
});

describe('releases', () => {
  it('up to the running version, newest first: a build never tells of a later one', () => {
    expect(releasesUpTo('0.29.0', TEST_RELEASES).map((r) => r.version)).toEqual([
      '0.29.0',
      '0.28.1',
      '0.28.0',
    ]);
    expect(releasesUpTo('0.28.0', TEST_RELEASES).map((r) => r.version)).toEqual(['0.28.0']);
    expect(releasesUpTo('0.27.0', TEST_RELEASES)).toEqual([]);
  });

  it('announce the newest one not seen yet', () => {
    // Nothing recorded: a learner from before the card; the newest release is news.
    expect(unseenRelease('0.29.0', null, TEST_RELEASES)?.version).toBe('0.29.0');
    expect(unseenRelease('0.29.0', '0.28.0', TEST_RELEASES)?.version).toBe('0.29.0');
    expect(unseenRelease('0.29.0', '0.29.0', TEST_RELEASES)).toBeNull();
    // A patch without highlights of its own announces nothing new.
    expect(unseenRelease('0.29.1', '0.29.0', TEST_RELEASES)).toBeNull();
    expect(unseenRelease('0.29.1', '0.28.1', TEST_RELEASES)?.version).toBe('0.29.0');
    // Back on an older build than the one seen: nothing.
    expect(unseenRelease('0.28.0', '0.29.0', TEST_RELEASES)).toBeNull();
    expect(unseenRelease('0.27.0', null, TEST_RELEASES)).toBeNull();
  });

  it('give their date as the day it was wherever the learner is', () => {
    expect(releaseDate({ ...release('0.29.0'), date: '2026-10-11' })).toBe('11 Oct 2026');
  });

  it('link to the changelog in the repository', () => {
    expect(CHANGELOG_URL).toMatch(/^https:\/\/github\.com\/.+\/blob\/main\/CHANGELOG\.md$/);
  });
});

describe('the highlights', () => {
  it('come newest first, each release dated, each item short and leading somewhere', () => {
    const versions = RELEASES.map((r) => r.version);
    expect([...versions].sort((a, b) => compareVersions(b, a))).toEqual(versions);
    expect(new Set(versions).size).toBe(versions.length);
    for (const { version, date, highlights } of RELEASES) {
      expect(date, version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(highlights.length, version).toBeGreaterThan(0);
      const titles = highlights.map((h) => h.title);
      expect(new Set(titles).size, version).toBe(titles.length);
      for (const highlight of highlights) {
        const where = `${version}: ${highlight.title}`;
        expect(ICON_NAMES, where).toContain(highlight.icon);
        expect(highlight.title.length, where).toBeLessThanOrEqual(32);
        // One plain sentence: a full stop, no exclamation marks, no emoji.
        expect(highlight.text, where).toMatch(/^[A-Z].*\.$/);
        expect(highlight.text, where).not.toMatch(/!|\p{Extended_Pictographic}/u);
        expect(highlight.text.length, where).toBeLessThanOrEqual(120);
        if (highlight.opensSearch) continue;
        const pathname = highlight.to.replace(/[?#].*$/, '');
        const leaf = (matchRoutes(routes, pathname) ?? []).at(-1);
        expect(leaf?.route.path, where).not.toBe('*');
        expect(leaf, where).toBeDefined();
      }
    }
  });

  it('give 0.32 the new look, and keep 0.31 its new name', () => {
    const release = RELEASES[0];
    expect(release?.version).toBe('0.32.0');
    expect(release?.highlights.map((h) => h.title)).toEqual([
      'A new look',
      'Nightshift and Dayshift',
    ]);
    expect(RELEASES.find((r) => r.version === '0.31.0')?.highlights.map((h) => h.title)).toEqual([
      'A new name: Open File',
    ]);
  });

  it('give 0.30 the polish pass: the setup screens, the searchable lists and the hidden themes', () => {
    const release = RELEASES.find((r) => r.version === '0.30.0');
    expect(release?.version).toBe('0.30.0');
    expect(release?.date).toBe('2026-10-12');
    expect(release?.highlights.map((h) => h.title)).toEqual([
      'A new game screen',
      'Arcade set-ups',
      'Searchable lists',
      'Themes after the solve',
      'Endgames in view',
      'Reference',
    ]);
  });

  it('give 0.29 its most notable features, the quick search among them, and keep 0.28', () => {
    const release = RELEASES.find((r) => r.version === '0.29.0');
    expect(release?.date).toBe('2026-10-12');
    expect(release?.highlights.map((h) => h.title)).toEqual([
      'Chess960',
      'Human moves',
      'Correspondence games',
      'Puzzle race rooms',
      'Analyse together',
      'Fix your mistakes',
      'Repertoire gaps',
      'Quick search',
      'Time management',
      'In your games',
      'Premoves',
      'Watch a game',
      'Notifications',
    ]);
    expect(release?.highlights.find((h) => h.title === 'Quick search')?.opensSearch).toBe(true);
    expect(RELEASES.some((r) => r.version === '0.28.0')).toBe(true);
  });
});
