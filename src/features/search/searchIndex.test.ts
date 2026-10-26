import { matchRoutes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/routes';
import { ICON_NAMES } from '@/components/ui/iconData';
import { BUILT_IN_REPERTOIRES } from '@/features/openings/repertoires';
import { LESSON_META } from '@/features/learn/lessonMeta';
import { ARCADE_GAMES } from '@/features/arcade/games';
import { GLOSSARY } from '@/features/reference/content';
import { tabForHash } from '@/features/settings/settingsTabs';
import { prepareEntries, search } from './match';
import {
  customRepertoireEntries,
  KIND_ORDER,
  KINDS,
  MAIN_DESTINATIONS,
  SEARCH_SOURCES,
  type SearchEntry,
  STATIC_ENTRIES,
} from './searchIndex';

// The theme list asks the puzzle index which themes have puzzles enough to practise.
vi.mock('@/features/puzzles/puzzleService', () => ({
  loadPuzzleIndex: () =>
    Promise.resolve({ themes: { fork: 500, pin: 400, equality: 2, backRankMate: 90 } }),
}));

async function loadAll(): Promise<Record<string, SearchEntry[]>> {
  const lists = await Promise.all(SEARCH_SOURCES.map((source) => source.load()));
  return Object.fromEntries(SEARCH_SOURCES.map((source, i) => [source.id, lists[i] ?? []]));
}

/** Whether a link leads to a page of the app rather than the not-found page. */
function leadsToAPage(to: string): boolean {
  const pathname = to.replace(/[?#].*$/, '');
  const matches = matchRoutes(routes, pathname) ?? [];
  const leaf = matches[matches.length - 1];
  return leaf !== undefined && leaf.route.path !== '*';
}

function checkEntries(entries: readonly SearchEntry[]) {
  for (const entry of entries) {
    expect(entry.title.trim(), entry.key).not.toBe('');
    expect(ICON_NAMES, entry.key).toContain(entry.icon);
    expect(leadsToAPage(entry.to), `${entry.key} → ${entry.to}`).toBe(true);
    expect(KIND_ORDER).toContain(entry.kind);
  }
}

describe('the search index', () => {
  it('lists the pages, their sections and the Settings cards, each leading somewhere', () => {
    checkEntries(STATIC_ENTRIES);
    const keys = STATIC_ENTRIES.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    // Every Settings result opens a tab of Settings (a card's tab, or the tab itself).
    for (const entry of STATIC_ENTRIES.filter((e) => e.kind === 'setting')) {
      expect(tabForHash(entry.to.replace(/^[^#]*/, '')), entry.to).not.toBeNull();
    }
  });

  it('offers the sections of the navigation before anything is typed', () => {
    expect(MAIN_DESTINATIONS.map((e) => e.title)).toEqual([
      'Learn',
      'Puzzles',
      'Drills',
      'Openings',
      'Play',
      'Analyze',
      'Progress',
      'Arcade',
      'My games',
      'Classic games',
      'Endgame studies',
      'Mating patterns',
      'Reference',
      'Settings',
    ]);
  });

  it('names every kind for its group and its results', () => {
    for (const kind of KIND_ORDER) {
      expect(KINDS[kind].label).toBeTruthy();
      expect(KINDS[kind].group).toBeTruthy();
    }
    expect(new Set(KIND_ORDER).size).toBe(Object.keys(KINDS).length);
  });

  it('loads the content lists, each entry leading to its page', async () => {
    const lists = await loadAll();
    const all = Object.values(lists).flat();
    checkEntries(all);
    const keys = [...STATIC_ENTRIES, ...all].map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);

    expect(lists.lessons).toHaveLength(LESSON_META.length);
    expect(lists.repertoires).toHaveLength(BUILT_IN_REPERTOIRES.length);
    expect(lists.arcade).toHaveLength(ARCADE_GAMES.length);
    expect(lists.courses?.length).toBeGreaterThan(0);
    expect(lists.endgames?.length).toBeGreaterThan(20);
    expect(lists.classics?.length).toBeGreaterThan(20);
    expect(lists.studies?.length).toBeGreaterThan(0);
    expect(lists.patterns?.length).toBeGreaterThan(10);
    expect(lists['games-for-two']?.map((e) => e.to)).toContain('/play?play=race');

    // Themes: only those with puzzles enough to practise.
    expect(lists.themes?.map((e) => e.title).sort()).toEqual(['Back-rank mate', 'Fork', 'Pin']);
    expect(lists.themes?.find((e) => e.title === 'Fork')?.to).toBe('/puzzles/themes?theme=fork');

    // The reference: rules, notation, every glossary term and every question, by its anchor.
    const reference = lists.reference ?? [];
    expect(reference.filter((e) => e.to.startsWith('/reference#glossary-'))).toHaveLength(
      GLOSSARY.length,
    );
    expect(reference.find((e) => e.title === 'Zugzwang')?.to).toBe('/reference#glossary-zugzwang');
    expect(reference.some((e) => e.to.startsWith('/reference#rules-'))).toBe(true);
    expect(reference.some((e) => e.to.startsWith('/reference#faq-'))).toBe(true);
  });

  it('adds the learner’s own repertoires', () => {
    const [own] = customRepertoireEntries([
      { id: 'custom-1', name: 'My Scotch', color: 'white', pgn: '1. e4 e5', createdAt: 1 },
    ]);
    expect(own).toMatchObject({
      key: 'repertoire:custom-1',
      kind: 'repertoire',
      title: 'My Scotch',
      detail: 'Your repertoire · White',
      to: '/openings/custom-1',
    });
  });

  it('puts the obvious answer first', async () => {
    const prepared = prepareEntries([...STATIC_ENTRIES, ...Object.values(await loadAll()).flat()]);
    const best = (query: string) => search(prepared, query).groups[0]?.results[0]?.entry;
    expect(best('italian')?.to).toBe('/openings/italian');
    expect(best('backup')?.to).toBe('/settings#backups');
    expect(best('rush')?.to).toBe('/puzzles/rush');
    expect(best('ghost')?.to).toBe('/arcade/ghost-knight');
    expect(best('settings')?.to).toBe('/settings');
    expect(best('caro kann')?.to).toBe('/openings/caro-kann');
    expect(best('lucena')?.to).toBe('/drills/endgame/lucena');
    expect(best('opera game')?.to).toBe('/classics/opera-game');
    expect(best('dark mode')?.to).toBe('/settings#display');
    // The colour schemes by their names, and by the plain words for them.
    for (const query of ['nightshift', 'dayshift', 'night', 'day', 'dark', 'light']) {
      expect(best(query)?.to, query).toBe('/settings#display');
    }
    expect(best('puzzle race')?.to).toBe('/play?play=race');
    expect(best('race room')?.to).toBe('/play?play=race-room');
    expect(best('analyse together')?.to).toBe('/analyze?together=1');
    expect(best('analyze with a friend')?.to).toBe('/analyze?together=1');
    expect(best('castling lesson')?.title).toBe('Castling, en passant and promotion');
  });
});
