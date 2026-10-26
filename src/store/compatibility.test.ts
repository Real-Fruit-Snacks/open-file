import { beforeEach, describe, expect, it } from 'vitest';
import { decodeShare } from '@/lib/shareCodes';
import { parseShareFragment } from '@/lib/shareLink';
import { useAnalyses } from './analyses';
import { EXPORT_VERSION, validateBackupFile } from './backupSchema';
import backupV2 from './fixtures/backup-v2.json';
import backupV4 from './fixtures/backup-v4.json';
import backupV5 from './fixtures/backup-v5.json';
import backupV6 from './fixtures/backup-v6.json';
import backupV7 from './fixtures/backup-v7.json';
import backupV8 from './fixtures/backup-v8.json';
import backupV9 from './fixtures/backup-v9.json';
import backupV10 from './fixtures/backup-v10.json';
import backupV11 from './fixtures/backup-v11.json';
import backupV12 from './fixtures/backup-v12.json';
import { useGames } from './games';
import {
  type PersistedProgress,
  PROGRESS_STORAGE_KEY,
  PROGRESS_VERSION,
  useProgress,
  withRatingDefaults,
} from './progress';
import { useRepertoire } from './repertoire';
import {
  DEFAULT_SETTINGS,
  DEVICE_SETTINGS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  SETTINGS_VERSION,
  useSettings,
} from './settings';

/**
 * The compatibility promise: a backup made by any earlier version imports
 * into this one with nothing lost, a stored state from an earlier version
 * migrates on load, and a share link keeps opening the same game. These
 * fixtures are real export shapes from earlier releases — add a new one
 * whenever the export version changes, never edit an old one.
 */
const FIXTURES = [
  ['v2 (0.3)', backupV2],
  ['v4 (0.5)', backupV4],
  ['v5 (0.7)', backupV5],
  ['v6 (0.9)', backupV6],
  ['v7 (0.12)', backupV7],
  ['v8 (0.15)', backupV8],
  ['v9 (0.16)', backupV9],
  ['v10 (0.17)', backupV10],
  ['v11 (0.22)', backupV11],
  ['v12 (0.24)', backupV12],
] as const;

describe('backups from earlier versions', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgress.getState().resetAll();
  });

  it.each(FIXTURES)('the validator accepts the %s fixture with nothing dropped', (_, fixture) => {
    const checked = validateBackupFile(fixture);
    expect(checked.ok).toBe(true);
    if (checked.ok) {
      expect(checked.shape.dropped).toBe(0);
      expect(checked.warning).toBeUndefined();
    }
  });

  it.each(FIXTURES)('imports the %s fixture', (_, fixture) => {
    const result = useProgress.getState().importState(fixture);
    expect(result.ok).toBe(true);
    const s = useProgress.getState();
    expect(s.onboarded).toBe(true);
    expect(s.puzzleRating).toBe(1212);
    // Every game record has an id and a source, whatever the file carried.
    for (const game of s.games) {
      expect(game.id).toBeTruthy();
      expect(game.source).toBeTruthy();
    }
    expect(new Set(s.games.map((g) => g.id)).size).toBe(s.games.length);
    // Lifetime counters exist and never lag behind the attempt list.
    expect(s.lifetime.attempts).toBeGreaterThanOrEqual(s.attempts.length);
  });

  it('imports a 0.3-era backup (export v2, Elo rating, no theme statistics)', () => {
    expect(useProgress.getState().importState(backupV2).ok).toBe(true);
    const s = useProgress.getState();
    expect(s.onboarded).toBe(true);
    expect(s.puzzleRating).toBe(1212);
    expect(s.ratedAttempts).toBe(3);
    expect(s.attempts).toHaveLength(3);
    expect(s.ratingHistory).toHaveLength(4);
    expect(s.lessons['the-board']?.completedAt).toBe(1726990000000);
    expect(s.games[0]?.result).toBe('1-0');
    expect(s.games[0]?.source).toBe('play');
    expect(s.streak.best).toBe(4);
    // Glicko-2 fields are derived rather than defaulted blindly …
    expect(s.puzzleRd).toBe(200);
    expect(s.lastRatedAt).toBe(1727000200000);
    expect(s.calibration).toBeNull();
    // … theme statistics are rebuilt from the attempts …
    expect(s.themeStats.fork).toEqual({ solved: 2, failed: 0 });
    expect(s.themeStats.pin).toEqual({ solved: 0, failed: 1 });
    // … lifetime counters too …
    expect(s.lifetime).toMatchObject({ attempts: 3, solved: 2, failed: 1 });
    expect(s.lifetime.solvedByTheme.fork).toBe(2);
    // … and everything invented since starts empty rather than undefined.
    expect(s.puzzleReviews).toEqual({});
    expect(s.ownPuzzles).toEqual({});
    expect(s.arcade).toEqual({});
    expect(s.dailyOpening).toBeNull();
    expect(s.oddsLadder.rung).toBe(0);
    expect(s.lastBackupAt).toBeNull();
    expect(s.tourDismissed).toBe(false);
  });

  it('imports a 0.5-era backup (export v4, Glicko-2 and the review queue)', () => {
    expect(useProgress.getState().importState(backupV4).ok).toBe(true);
    const s = useProgress.getState();
    expect(s.puzzleRd).toBe(92.5);
    expect(s.puzzleVolatility).toBe(0.06);
    expect(s.themeStats.mateIn2).toEqual({ solved: 1, failed: 0 });
    expect(s.puzzleReviews.def34?.due).toBe(1727260100000);
    expect(s.trainingDays).toEqual(['2026-09-21', '2026-09-22']);
    expect(s.guessGames['opera-game']?.score).toBe(14);
    expect(s.placement).toBeNull();
    expect(s.studies).toEqual({});
  });

  it('imports a 0.7-era backup (export v5, studies, recall and placement)', () => {
    expect(useProgress.getState().importState(backupV5).ok).toBe(true);
    const s = useProgress.getState();
    expect(s.placement?.courseId).toBe('intermediate');
    expect(s.studies['reti-1921']?.attempts).toBe(2);
    expect(s.lessonRecall['forks:1']?.step).toBe(1);
    expect(s.woodpecker).toBeNull();
    expect(s.arcade).toEqual({});
  });

  it('imports a 0.9-era backup (export v6, arcade, daily opening, odds ladder, library)', () => {
    const result = useProgress.getState().importState(backupV6);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toMatchObject({ version: 6, analyses: 1, repertoires: 1, games: 0 });
    }
    const s = useProgress.getState();
    expect(s.woodpecker?.puzzleIds).toEqual(['abc12', 'def34', 'ghi56']);
    expect(s.games).toHaveLength(2);
    expect(s.games[0]?.book?.repertoireId).toBe('sicilian');
    expect(useRepertoire.getState().custom[0]?.name).toBe('My London');
    expect(Object.keys(useAnalyses.getState().items)).toHaveLength(1);
    // Imported games were not part of the format yet: the store starts empty.
    expect(useGames.getState().games).toEqual({});
  });

  it('imports a 0.12-era backup (export v7, imported games and lifetime counters)', () => {
    const result = useProgress.getState().importState(backupV7);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toMatchObject({
        version: 7,
        games: 2,
        analyses: 1,
        repertoires: 1,
        attempts: 8,
      });
    }
    const s = useProgress.getState();
    expect(s.lifetime.attempts).toBe(8);
    expect(s.games[0]).toMatchObject({ id: 'g-simul-1', source: 'simul', event: 'Simul board 2' });
    expect(s.lichessUsername).toBe('fixture_user');
    expect(s.tourDismissed).toBe(true);
    expect(s.lastBackupAt).toBe(1790700000000);
    const games = useGames.getState();
    expect(games.player).toBe('fixture_user');
    expect(games.games['https://lichess.org/abcd1234']?.review?.accuracy.white).toBe(91.2);
    expect(games.games['pgn-fixture']?.review).toBeNull();
  });

  it('imports a 0.15-era backup (export v8: blind puzzles, threats, self-review, blunder check)', () => {
    const result = useProgress.getState().importState(backupV8);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary.version).toBe(8);
    const s = useProgress.getState();
    expect(s.blind).toMatchObject({ levels: { short: 1150, long: 980 }, clean: 5, bestRun: 3 });
    expect(s.threatStats).toMatchObject({ found: 7, defended: 5, recent: ['tHr1a', 'tHr2b'] });
    expect(s.ownThreats['threat-fixture1']).toMatchObject({
      threat: 'h5f7',
      kind: 'mate',
      source: { ply: 6, played: 'Nf6', byLearner: true },
    });
    expect(s.selfReview).toMatchObject({ games: 2, found: 3, total: 5 });
    expect(s.selfReview.history).toHaveLength(2);
    expect(s.blunderChecks).toEqual({ stopped: 4, playedAnyway: 1 });
  });

  it('imports a 0.16-era backup (export v9: games against the human-like opponent)', () => {
    const result = useProgress.getState().importState(backupV9);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary.version).toBe(9);
    const game = useProgress.getState().games.find((g) => g.id === 'g-humanlike-1');
    expect(game).toMatchObject({ source: 'humanlike', opponentRating: 1500, level: 0 });
  });

  it('imports a 0.17-era backup (export v10: Lichess puzzles to review, games sent to Lichess)', () => {
    const result = useProgress.getState().importState(backupV10);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary.version).toBe(10);
    const s = useProgress.getState();
    expect(s.lichessPuzzles['6Mhmf']).toMatchObject({ moves: 'h5d1 c4f7 e8e7 c3d5', rating: 1369 });
    expect(s.puzzleReviews['6Mhmf']).toBeDefined();
    expect(s.games.find((g) => g.id === 'g-humanlike-1')?.lichessId).toBe('aBcD1234');
  });

  it('imports a 0.22-era backup (export v11: Lichess puzzle rounds, the history’s name)', () => {
    const result = useProgress.getState().importState(backupV11);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary).toMatchObject({ version: 11, settings: false });
    const s = useProgress.getState();
    expect(s.lichessRounds).toEqual([
      { id: 'k3Rt9', at: 1_790_950_000_000, win: true, themes: 'fork short' },
    ]);
    expect(s.lineage).toEqual(['M_a9sVHCgDIh']);
  });

  it('imports a 0.24-era backup (export v12: the settings), leaving the device’s own', () => {
    useSettings.setState({ engineThreads: false, engineFull: true });
    const result = useProgress.getState().importState(backupV12);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary).toMatchObject({ version: 12, settings: true });
    expect(useSettings.getState()).toMatchObject({
      colorScheme: 'dark',
      boardTheme: 'blue',
      pieceSet: 'merida',
      soundVolume: 0.6,
      playHumanRating: 1500,
      engineThreads: false,
      engineFull: true,
    });
    useSettings.setState({ ...DEFAULT_SETTINGS });
  });

  it('reads the black scheme of a backup, gone in 0.32, as the dark one', () => {
    const file = { ...backupV12, settings: { ...backupV12.settings, colorScheme: 'black' } };
    // A synced copy is read with the same check as an import.
    const checked = validateBackupFile(file);
    expect(checked.ok && checked.shape.settings?.colorScheme).toBe('dark');
    expect(useProgress.getState().importState(file).ok).toBe(true);
    expect(useSettings.getState().colorScheme).toBe('dark');
    useSettings.setState({ ...DEFAULT_SETTINGS });
  });

  it('gives an older backup the new records empty', () => {
    expect(useProgress.getState().importState(backupV7).ok).toBe(true);
    const s = useProgress.getState();
    expect(s.blind).toMatchObject({ levels: {}, solved: 0, lastAt: null });
    expect(s.threatStats.recent).toEqual([]);
    expect(s.ownThreats).toEqual({});
    expect(s.selfReview.games).toBe(0);
    expect(s.blunderChecks).toEqual({ stopped: 0, playedAnyway: 0 });
    expect(s.lichessPuzzles).toEqual({});
  });

  it('round-trips the current export through import unchanged', () => {
    useProgress.getState().importState(backupV7);
    useProgress.getState().recordArcade('fortress', 12, 'Held level 2');
    const exported = JSON.parse(useProgress.getState().exportState()) as {
      version: number;
      games: { games: Record<string, unknown>; player: string };
    };
    expect(exported.version).toBe(EXPORT_VERSION);
    expect(Object.keys(exported.games.games)).toHaveLength(2);
    expect(exported.games.player).toBe('fixture_user');
    useProgress.getState().resetAll();
    expect(useGames.getState().games).toEqual({});
    expect(useProgress.getState().importState(exported).ok).toBe(true);
    expect(useProgress.getState().arcade.fortress?.best).toBe(12);
    expect(useProgress.getState().studies['reti-1921']?.attempts).toBe(2);
    expect(Object.keys(useGames.getState().games)).toHaveLength(2);
  });

  it('rejects things that are not a backup without touching the state', () => {
    useProgress.getState().importState(backupV5);
    expect(useProgress.getState().importState({ hello: 'world' }).ok).toBe(false);
    expect(useProgress.getState().importState('nope').ok).toBe(false);
    expect(useProgress.getState().placement?.courseId).toBe('intermediate');
  });
});

/** Writes a `{state, version}` blob the way zustand's persist middleware does, then reloads the store. */
async function rehydrate(
  store: { persist: { rehydrate: () => unknown } },
  key: string,
  state: unknown,
  version: number,
) {
  localStorage.setItem(key, JSON.stringify({ state, version }));
  // Saves from before 0.24 kept the device's settings with the rest.
  if (key === SETTINGS_STORAGE_KEY) localStorage.removeItem(DEVICE_SETTINGS_STORAGE_KEY);
  await store.persist.rehydrate();
}

describe('stored state from earlier versions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates a version-1 save: rating defaults and rebuilt theme statistics', () => {
    const migrated = withRatingDefaults(backupV2.progress as unknown as Partial<PersistedProgress>);
    expect(migrated.puzzleRd).toBe(200);
    expect(migrated.puzzleVolatility).toBeGreaterThan(0);
    expect(migrated.placement).toBeNull();
    expect(migrated.woodpecker).toBeNull();
    expect(migrated.arcade).toEqual({});
    expect(migrated.lifetime.attempts).toBe(3);
  });

  it.each([
    ['v1', backupV2.progress, 1],
    ['v4', backupV4.progress, 4],
    ['v5', backupV5.progress, 5],
    ['v6', backupV6.progress, 6],
    ['v7', backupV7.progress, 7],
    ['v8', backupV8.progress, 8],
    ['v8 (0.16)', backupV9.progress, 8],
    ['v8 (0.17)', backupV10.progress, 8],
  ] as const)(
    'rehydrates a %s progress blob through the persist path',
    async (_, state, version) => {
      await rehydrate(useProgress, PROGRESS_STORAGE_KEY, state, version);
      const s = useProgress.getState();
      expect(s.puzzleRating).toBe(1212);
      expect(s.onboarded).toBe(true);
      expect(Number.isFinite(s.puzzleRd)).toBe(true);
      expect(s.lifetime.attempts).toBeGreaterThanOrEqual(s.attempts.length);
      for (const game of s.games) expect(game.source).toBeTruthy();
      expect(typeof s.lichessUsername).toBe('string');
      // The next write stores the current version.
      useProgress.getState().touchTraining();
      const stored = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? '{}') as {
        version: number;
      };
      expect(stored.version).toBe(PROGRESS_VERSION);
    },
  );

  it('rehydrates the repertoire, library and games blobs of every version that had them', async () => {
    await rehydrate(
      useRepertoire,
      'open-file:repertoire',
      {
        ...backupV4.repertoire,
        cards: {
          'italian|e2e4': { ease: 2.5, interval: 1, due: 1, reps: 1, lapses: 0, lastReviewed: 0 },
        },
      },
      1,
    );
    expect(useRepertoire.getState().cards['italian|e2e4']?.reps).toBe(1);
    await rehydrate(useRepertoire, 'open-file:repertoire', backupV7.repertoire, 1);
    expect(useRepertoire.getState().custom[0]?.name).toBe('My London');
    await rehydrate(useAnalyses, 'open-file:analyses', backupV5.analyses, 1);
    expect(useAnalyses.getState().items).toEqual({});
    await rehydrate(useAnalyses, 'open-file:analyses', backupV6.analyses, 1);
    expect(Object.keys(useAnalyses.getState().items)).toHaveLength(1);
    await rehydrate(useGames, 'open-file:games', backupV7.games, 1);
    expect(useGames.getState().player).toBe('fixture_user');
    expect(Object.keys(useGames.getState().games)).toHaveLength(2);
  });

  it('moves the learner fields of a version-3 settings save into the progress store', async () => {
    await rehydrate(
      useSettings,
      SETTINGS_STORAGE_KEY,
      {
        colorScheme: 'dark',
        lastBackupAt: 1790000000000,
        lastBackupAttempts: 12,
        tourDismissed: true,
        lichessUsername: 'oldname',
        chesscomUsername: 'oldcc',
        puzzleThemes: ['fork'],
      },
      3,
    );
    const settings = useSettings.getState() as unknown as Record<string, unknown>;
    expect(settings.colorScheme).toBe('dark');
    expect(settings.lastBackupAt).toBeUndefined();
    expect(settings.puzzleThemes).toBeUndefined();
    await rehydrate(useProgress, PROGRESS_STORAGE_KEY, backupV6.progress, 6);
    const s = useProgress.getState();
    expect(s.lastBackupAt).toBe(1790000000000);
    expect(s.lastBackupAttempts).toBe(12);
    expect(s.tourDismissed).toBe(true);
    expect(s.lichessUsername).toBe('oldname');
    expect(s.chesscomUsername).toBe('oldcc');
  });

  it('switches threads on for a settings save from before they were the default', async () => {
    await rehydrate(
      useSettings,
      SETTINGS_STORAGE_KEY,
      { colorScheme: 'black', engineThreads: false, soundVolume: 0.4 },
      4,
    );
    expect(useSettings.getState()).toMatchObject({
      // The black scheme went in 0.32: the dark one, the nearest, takes its place.
      colorScheme: 'dark',
      soundVolume: 0.4,
      engineThreads: true,
      engineFull: false,
    });
    // From this version on, the learner's choice stands.
    await rehydrate(
      useSettings,
      SETTINGS_STORAGE_KEY,
      { engineThreads: false, engineFull: true },
      5,
    );
    expect(useSettings.getState()).toMatchObject({ engineThreads: false, engineFull: true });
    // A value of the wrong type falls back to the default.
    useSettings.getState().reset();
    await rehydrate(useSettings, SETTINGS_STORAGE_KEY, { engineFull: 'yes' }, 5);
    expect(useSettings.getState().engineFull).toBe(false);
  });

  it('reads the black scheme, gone in 0.32, as the dark one in a save of this version', async () => {
    await rehydrate(
      useSettings,
      SETTINGS_STORAGE_KEY,
      { colorScheme: 'black', boardTheme: 'blue' },
      SETTINGS_VERSION,
    );
    expect(useSettings.getState()).toMatchObject({ colorScheme: 'dark', boardTheme: 'blue' });
    useSettings.getState().reset();
  });

  it('remembers the human-like opponent and its rating, and drops what it does not offer', async () => {
    useSettings.getState().reset();
    // Saves from before 0.16 have neither: the engine stays the opponent, and 1200 the rating.
    await rehydrate(useSettings, SETTINGS_STORAGE_KEY, { colorScheme: 'dark' }, 5);
    expect(useSettings.getState()).toMatchObject({ playOpponent: 'engine', playHumanRating: 1200 });
    await rehydrate(
      useSettings,
      SETTINGS_STORAGE_KEY,
      { playOpponent: 'humanlike', playHumanRating: 1900 },
      5,
    );
    expect(useSettings.getState()).toMatchObject({
      playOpponent: 'humanlike',
      playHumanRating: 1900,
    });
    useSettings.getState().reset();
    await rehydrate(
      useSettings,
      SETTINGS_STORAGE_KEY,
      { playOpponent: 'robot', playHumanRating: 1250 },
      5,
    );
    expect(useSettings.getState()).toMatchObject({ playOpponent: 'engine', playHumanRating: 1200 });
    await rehydrate(useSettings, SETTINGS_STORAGE_KEY, { playHumanRating: 3000 }, 5);
    expect(useSettings.getState().playHumanRating).toBe(1200);
  });

  it('keeps the unknown fields of a save from a newer version', async () => {
    await rehydrate(
      useProgress,
      PROGRESS_STORAGE_KEY,
      { ...backupV7.progress, futureField: { answer: 42 } },
      PROGRESS_VERSION + 5,
    );
    expect(useProgress.getState().puzzleRating).toBe(1212);
    useProgress.getState().touchTraining();
    const stored = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? '{}') as {
      state: Record<string, unknown>;
    };
    expect(stored.state.futureField).toEqual({ answer: 42 });
  });
});

describe('share links from earlier versions', () => {
  it('still opens a game link made by 0.4', async () => {
    const parsed = await parseShareFragment(
      '#z=i3YtS80rUVByy6woKS1KVYrl4jLUU0g1UUg1VTDSU_BLM1bwSzZTMNZTcEoyVUg0U9ACAA&ply=4',
    );
    expect(parsed?.pgn).toContain('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6');
    expect(parsed?.ply).toBe(4);
  });

  it('still opens a repertoire link and a Woodpecker link made by 0.6', async () => {
    const rep = await decodeShare(
      '#rep=q1bKS8xNVbJScsusKCktSlXSUUrOz8kvUrJSKs_ILAHxC9LzlKyUDPUUUk0UUk0VjPQU_NKMFbSUagE',
    );
    expect(rep).toEqual({
      kind: 'repertoire',
      name: 'Fixture',
      color: 'white',
      pgn: '1. e4 e5 2. Nf3 *',
    });
    const wp = await decodeShare(
      '#wp=q1YqKK2qykn1TClWsopWSkxKNjRS0lFKSU0zNlGK1VEqSizJzEtXsjI0NTCoBQA',
    );
    expect(wp).toEqual({ kind: 'woodpecker', puzzleIds: ['abc12', 'def34'], rating: 1500 });
  });
});
