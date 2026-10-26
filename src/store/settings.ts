import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import {
  keepCorruptBlob,
  rehydrateOnStorageChange,
  safeLocalStorage,
  warnNewerSave,
} from '@/lib/persistStorage';
import { storageKeyFor } from '@/store/profiles';
import { removeFullEngine } from '@/engine/fullEngine';
import { DEFAULT_HUMAN_RATING, isHumanRating } from '@/engine/maia/ratings';
import { BLIND_DEPTHS, type BlindDepth } from '@/features/puzzles/blind';
import { resetIsolationFlag } from '@/sw/isolation';

export const COLOR_SCHEMES = ['system', 'light', 'dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];
export const BOARD_THEMES = [
  'brown',
  'wood',
  'wood2',
  'wood3',
  'wood4',
  'maple',
  'maple2',
  'horsey',
  'leather',
  'blue',
  'blue2',
  'blue3',
  'canvas',
  'blue-marble',
  'ic',
  'green',
  'marble',
  'green-plastic',
  'olive',
  'grey',
  'metal',
  'newspaper',
  'purple',
  'purple-diag',
  'pink',
  'ice',
  'walnut',
  'contrast',
] as const;
export type BoardTheme = (typeof BOARD_THEMES)[number];
export const PLAY_COLORS = ['white', 'black', 'random'] as const;
export type PlayColor = (typeof PLAY_COLORS)[number];
/** Play's opponents: the engine's levels, the human-like opponent (Maia), a person at the device. */
export const PLAY_OPPONENTS = ['engine', 'humanlike', 'human'] as const;
export type PlayOpponent = (typeof PLAY_OPPONENTS)[number];
/** The games Play offers against the engine: standard chess, or Chess960 from a random start. */
export const PLAY_VARIANTS = ['standard', 'chess960'] as const;
export type PlayVariant = (typeof PLAY_VARIANTS)[number];
export const REVIEW_DEPTH_IDS = ['fast', 'balanced', 'thorough'] as const;
export type ReviewDepth = (typeof REVIEW_DEPTH_IDS)[number];
export const PIECE_SET_IDS = [
  'classic',
  'merida',
  'chessnut',
  'mpchess',
  'celtic',
  'california',
  'maestro',
  'staunty',
  'cardinal',
] as const;
export type PieceSet = (typeof PIECE_SET_IDS)[number];
export const SOUND_THEMES = ['standard', 'soft', 'retro'] as const;
export type SoundTheme = (typeof SOUND_THEMES)[number];
/** How moves are written: "Nf3" or with a piece figurine. */
export const NOTATIONS = ['figurine', 'letters'] as const;
export type Notation = (typeof NOTATIONS)[number];
/** How a piece is moved on the board. */
export const MOVE_METHODS = ['either', 'tap', 'drag'] as const;
export type MoveMethod = (typeof MOVE_METHODS)[number];
/** The mark under a dragged piece. */
export const DRAG_TARGETS = ['circle', 'square', 'none'] as const;
export type DragTarget = (typeof DRAG_TARGETS)[number];
/** Captured material beside the player bars. */
export const MATERIAL_DISPLAYS = ['difference', 'count', 'off'] as const;
export type MaterialDisplay = (typeof MATERIAL_DISPLAYS)[number];
/** The player's colour across a simul: the same on every board, or alternating. */
export const SIMUL_COLORS = ['white', 'black', 'alternate'] as const;
export type SimulColor = (typeof SIMUL_COLORS)[number];
export const EXPLORER_DATABASES = ['masters', 'lichess'] as const;
export type ExplorerDatabase = (typeof EXPLORER_DATABASES)[number];

/** The last simul set up, offered again next time. */
export interface SimulPrefs {
  boards: number;
  levelId: number;
  /** Each board one level stronger than the one before. */
  rising: boolean;
  color: SimulColor;
  /** A time control id from lib/clock.ts; 'none' plays without clocks. */
  timeControlId: string;
  /** After a move, bring up the next board waiting for one. */
  autoAdvance: boolean;
}

/** Search depth per review setting. */
export const REVIEW_DEPTHS: Record<ReviewDepth, number> = { fast: 10, balanced: 13, thorough: 16 };

/**
 * Device-wide preferences, shared by every profile. Anything about one
 * learner — backup reminders, remembered usernames, the first-run tour — lives
 * in the progress store instead (moved there in version 4).
 */
export interface SettingsState {
  colorScheme: ColorScheme;
  boardTheme: BoardTheme;
  /** Piece graphics: the classic figurines, the "Letters" tiles, the 8-bit set or the flat set. */
  pieceSet: PieceSet;
  showCoordinates: boolean;
  showLegalMoves: boolean;
  /** Mark the last move and a king in check on the board. */
  boardHighlights: boolean;
  animations: boolean;
  /** Moves written with piece figurines ("♘f3") or letters ("Nf3"). */
  notation: Notation;
  /** Enlarge the piece under the finger or pointer while it is dragged. */
  magnifyDrag: boolean;
  /** The mark on the square a dragged piece would land on. */
  dragTarget: DragTarget;
  /** Move by tapping two squares, by dragging, or either. */
  moveMethod: MoveMethod;
  /** Captured pieces beside the player bars: the imbalance, every capture, or nothing. */
  materialDisplay: MaterialDisplay;
  /** Hide the header and navigation while a game or simul against the engine is on. */
  playFocus: boolean;
  simul: SimulPrefs;
  sounds: boolean;
  /**
   * Which set of cues plays: the standard set, the same cues quieter and
   * rounder ('soft'), or the 8-bit set ('retro'). Also picks the vibration patterns.
   */
  soundTheme: SoundTheme;
  /** Master volume for the sound effects, 0–1. */
  soundVolume: number;
  /** Short vibrations on moves, solves and mistakes (phones with a vibration motor). */
  haptics: boolean;
  /** Show the number of due reviews on the installed app's icon (Badging API). */
  appBadge: boolean;
  /** Promote to a queen without asking. */
  autoQueen: boolean;
  /** Target depth for the analysis board. */
  analysisDepth: number;
  /** Number of engine lines (MultiPV) on the analysis board. */
  analysisLines: number;
  /** How deeply the game review searches each position. */
  reviewDepth: ReviewDepth;
  /** Engine strength offered for the next game (every game played updates it). */
  playLevel: number;
  /** Who the next game is against: the engine's levels, the human-like opponent, or a second person. */
  playOpponent: PlayOpponent;
  /** The rating the human-like opponent plays at (600–2600, in hundreds). */
  playHumanRating: number;
  playColor: PlayColor;
  /** Time control id for games against the engine (see lib/clock.ts); 'none' = no clock. */
  playTimeControl: string;
  /** Show the coordinates-style keyboard move input under boards. */
  moveInput: boolean;
  /** Hide the pieces while playing (blindfold training). */
  playBlindfold: boolean;
  /** Coach mode in untimed engine games: pause after a mistake and offer a take-back. */
  playCoach: boolean;
  /**
   * Blunder check in games against the engine: a move that hangs material or
   * allows mate is held back with "Checks, captures, threats?" before it is played.
   */
  playBlunderCheck: boolean;
  /** Query the Lichess tablebase API for positions with 7 or fewer pieces (network). */
  tablebase: boolean;
  /** Query the Lichess opening explorer for move statistics (network). */
  explorer: boolean;
  explorerDatabase: ExplorerDatabase;
  /**
   * Run the multi-threaded engine build (on by default). Needs cross-origin
   * isolation, which the service worker provides from the next load on.
   */
  engineThreads: boolean;
  /**
   * Use Stockfish's large network once it is downloaded (Settings → Engine).
   * Until then, or where it cannot start, the lite engine runs.
   */
  engineFull: boolean;
  /** Automatically load the next puzzle after a solve. */
  puzzleAutoNext: boolean;
  /** How long the lines of blind puzzles are. */
  blindDepth: BlindDepth;
  /** When the install banner was last dismissed (it stays away for a while), or never. */
  installDismissedAt: number | null;
  /** Single-key page shortcuts (H for a hint, arrows through moves…). */
  keyboardShortcuts: boolean;
  /** The kind of game offered for the next game against the engine: standard chess or Chess960. */
  playVariant: PlayVariant;
  /** In live games, a move made during the opponent's turn waits and is played at once. */
  livePremoves: boolean;
  /**
   * A system notification, while the app is in the background, when someone
   * takes this device's posted game, the opponent moves, or a game ends.
   */
  notifyLive: boolean;
  /** Correspondence games: the relay pushes "Your move" while this device is away from the game. */
  notifyCorrespondence: boolean;
  /** A daily reminder pushed by the relay at `notifyReminderMinute`, unless this device trained that day. */
  notifyReminder: boolean;
  /** The daily reminder's time: minutes after local midnight, in quarter hours. */
  notifyReminderMinute: number;
  /** Analyze shows what players of `analysisHumanRating` would play (needs the human-like model). */
  analysisHumanMoves: boolean;
  /** The rating whose moves Analyze shows (600–2600, in hundreds). */
  analysisHumanRating: number;

  update: (patch: Partial<PersistedSettings>) => void;
  /**
   * Back to the defaults; the service worker's isolation flag goes back to its
   * default too, and a downloaded full engine is deleted.
   */
  reset: () => void;
}

export const DEFAULT_SETTINGS = {
  colorScheme: 'system' as ColorScheme,
  boardTheme: 'brown' as BoardTheme,
  pieceSet: 'classic' as PieceSet,
  showCoordinates: true,
  showLegalMoves: true,
  boardHighlights: true,
  animations: true,
  notation: 'figurine' as Notation,
  magnifyDrag: true,
  dragTarget: 'circle' as DragTarget,
  moveMethod: 'either' as MoveMethod,
  materialDisplay: 'difference' as MaterialDisplay,
  playFocus: false,
  simul: {
    boards: 3,
    levelId: 2,
    rising: false,
    color: 'white',
    timeControlId: '15+10',
    autoAdvance: true,
  } as SimulPrefs,
  sounds: true,
  soundTheme: 'standard' as SoundTheme,
  soundVolume: 1,
  haptics: true,
  appBadge: true,
  autoQueen: false,
  analysisDepth: 18,
  analysisLines: 3,
  reviewDepth: 'balanced' as ReviewDepth,
  playLevel: 3,
  playOpponent: 'engine' as PlayOpponent,
  playHumanRating: DEFAULT_HUMAN_RATING,
  playColor: 'white' as PlayColor,
  playTimeControl: 'none',
  moveInput: false,
  playBlindfold: false,
  playCoach: true,
  playBlunderCheck: false,
  tablebase: false,
  explorer: false,
  explorerDatabase: 'masters' as ExplorerDatabase,
  engineThreads: true,
  engineFull: false,
  puzzleAutoNext: false,
  blindDepth: 'short' as BlindDepth,
  installDismissedAt: null as number | null,
  keyboardShortcuts: true,
  playVariant: 'standard' as PlayVariant,
  livePremoves: true,
  notifyLive: false,
  notifyCorrespondence: false,
  notifyReminder: false,
  notifyReminderMinute: 18 * 60,
  analysisHumanMoves: false,
  analysisHumanRating: 1500,
};

export type PersistedSettings = typeof DEFAULT_SETTINGS;

export const SETTINGS_STORAGE_KEY = 'open-file:settings';
export const SETTINGS_VERSION = 5;

/**
 * The settings that belong to the device rather than to a learner: the engine
 * build it runs (threads need the service worker's headers, the full engine a
 * download kept on the device), when its install prompt was dismissed, and its
 * notifications (each needs this browser's permission, and the relay knows the
 * device's push subscription). They are kept once for every profile, under a
 * key of their own, and never synced. Everything else is the learner's: each
 * profile keeps its own, and sync between devices can carry them.
 */
export const DEVICE_SETTING_KEYS = [
  'engineThreads',
  'engineFull',
  'installDismissedAt',
  'notifyLive',
  'notifyCorrespondence',
  'notifyReminder',
  'notifyReminderMinute',
] as const;
export type DeviceSettingKey = (typeof DEVICE_SETTING_KEYS)[number];
export const DEVICE_SETTINGS_STORAGE_KEY = 'open-file:device-settings';

/** The learner's settings: all but the device's. */
export type LearnerSettings = Omit<PersistedSettings, DeviceSettingKey>;

export const LEARNER_SETTING_KEYS = (
  Object.keys(DEFAULT_SETTINGS) as (keyof PersistedSettings)[]
).filter(
  (key): key is keyof LearnerSettings => !(DEVICE_SETTING_KEYS as readonly string[]).includes(key),
);

/** This profile's settings key (the main profile's is the one settings always had). */
export const settingsStorageKey = (): string => storageKeyFor(SETTINGS_STORAGE_KEY);

/* ------------------------------------------------------------------ */
/* Validation on load                                                 */
/* ------------------------------------------------------------------ */

type Check<T> = (value: unknown) => value is T;

const isBoolean: Check<boolean> = (value) => typeof value === 'boolean';
const isString: Check<string> = (value) => typeof value === 'string';
const oneOf =
  <const T extends readonly string[]>(values: T): Check<T[number]> =>
  (value): value is T[number] =>
    typeof value === 'string' && (values as readonly string[]).includes(value);
const numberIn =
  (min: number, max: number, integer = false): Check<number> =>
  (value): value is number =>
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    (!integer || Number.isInteger(value));

/** One check per flat setting; `simul` and the nullable numbers are handled apart. */
const CHECKS: {
  [K in Exclude<keyof PersistedSettings, 'simul' | 'installDismissedAt'>]: Check<
    PersistedSettings[K]
  >;
} = {
  colorScheme: oneOf(COLOR_SCHEMES),
  boardTheme: oneOf(BOARD_THEMES),
  pieceSet: oneOf(PIECE_SET_IDS),
  showCoordinates: isBoolean,
  showLegalMoves: isBoolean,
  boardHighlights: isBoolean,
  animations: isBoolean,
  notation: oneOf(NOTATIONS),
  magnifyDrag: isBoolean,
  dragTarget: oneOf(DRAG_TARGETS),
  moveMethod: oneOf(MOVE_METHODS),
  materialDisplay: oneOf(MATERIAL_DISPLAYS),
  playFocus: isBoolean,
  sounds: isBoolean,
  soundTheme: oneOf(SOUND_THEMES),
  soundVolume: numberIn(0, 1),
  haptics: isBoolean,
  appBadge: isBoolean,
  autoQueen: isBoolean,
  analysisDepth: numberIn(1, 99, true),
  analysisLines: numberIn(1, 10, true),
  reviewDepth: oneOf(REVIEW_DEPTH_IDS),
  playLevel: numberIn(1, 99, true),
  playOpponent: oneOf(PLAY_OPPONENTS),
  playHumanRating: isHumanRating,
  playColor: oneOf(PLAY_COLORS),
  playTimeControl: isString,
  moveInput: isBoolean,
  playBlindfold: isBoolean,
  playCoach: isBoolean,
  playBlunderCheck: isBoolean,
  tablebase: isBoolean,
  explorer: isBoolean,
  explorerDatabase: oneOf(EXPLORER_DATABASES),
  engineThreads: isBoolean,
  engineFull: isBoolean,
  puzzleAutoNext: isBoolean,
  blindDepth: oneOf(BLIND_DEPTHS),
  keyboardShortcuts: isBoolean,
  playVariant: oneOf(PLAY_VARIANTS),
  livePremoves: isBoolean,
  notifyLive: isBoolean,
  notifyCorrespondence: isBoolean,
  notifyReminder: isBoolean,
  notifyReminderMinute: (value): value is number =>
    numberIn(0, 24 * 60 - 15, true)(value) && value % 15 === 0,
  analysisHumanMoves: isBoolean,
  analysisHumanRating: isHumanRating,
};

const SIMUL_CHECKS: { [K in keyof SimulPrefs]: Check<SimulPrefs[K]> } = {
  boards: numberIn(1, 16, true),
  levelId: numberIn(1, 99, true),
  rising: isBoolean,
  color: oneOf(SIMUL_COLORS),
  timeControlId: isString,
  autoAdvance: isBoolean,
};

const nullableNumber = (min: number): Check<number | null> => {
  const inRange = numberIn(min, Number.MAX_SAFE_INTEGER);
  return (value): value is number | null => value === null || inRange(value);
};

/**
 * Keeps only the stored values that make sense: an unknown board theme or
 * piece set (from a hand-edited file or a future version) would otherwise
 * crash every board. Nested defaults are merged field by field, so a save
 * with half a `simul` block keeps the other half's defaults. Unknown keys are
 * passed through so a save from a newer version loses nothing. A value the app
 * no longer offers, but has a near match for, is read as that match: the black
 * scheme, gone in 0.32, is the dark one. Every save comes through here (a load,
 * a backup, a synced copy), so each reads it the same way.
 */
export function sanitizeSettings(
  stored: unknown,
): Partial<PersistedSettings> & Record<string, unknown> {
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return {};
  const input = stored as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, saved] of Object.entries(input)) {
    if (saved === undefined) continue;
    const value = key === 'colorScheme' && saved === 'black' ? 'dark' : saved;
    if (key in CHECKS) {
      const check = CHECKS[key as keyof typeof CHECKS] as Check<unknown>;
      if (check(value)) out[key] = value;
    } else if (key === 'simul') {
      if (typeof value !== 'object' || value === null) continue;
      const simul = { ...DEFAULT_SETTINGS.simul };
      for (const [field, check] of Object.entries(SIMUL_CHECKS) as [
        keyof SimulPrefs,
        Check<unknown>,
      ][]) {
        const candidate = (value as Record<string, unknown>)[field];
        if (candidate !== undefined && check(candidate)) {
          (simul as Record<string, unknown>)[field] = candidate;
        }
      }
      out.simul = simul;
    } else if (key === 'installDismissedAt') {
      if (nullableNumber(0)(value)) out[key] = value;
    } else if (!(key in DEFAULT_SETTINGS)) {
      out[key] = value;
    }
  }
  return out;
}

/** The learner's settings among `settings` (a store's state, or a save checked already). */
export function learnerSettingsOf(settings: Partial<PersistedSettings>): Partial<LearnerSettings> {
  const out: Record<string, unknown> = {};
  for (const key of LEARNER_SETTING_KEYS) {
    if (settings[key] !== undefined) out[key] = settings[key];
  }
  return out;
}

/** Settings from a file (a backup, a synced copy), checked as a load checks them: the learner's only. */
export const learnerSettingsFrom = (raw: unknown): Partial<LearnerSettings> =>
  learnerSettingsOf(sanitizeSettings(raw));

/* ------------------------------------------------------------------ */
/* Fields that moved to the progress store in version 4               */
/* ------------------------------------------------------------------ */

/** Learner-scoped values that lived here until 0.11 (settings version 3). */
export interface LegacyLearnerFields {
  lastBackupAt?: number | null;
  lastBackupAttempts?: number;
  tourDismissed?: boolean;
  lichessUsername?: string;
  chesscomUsername?: string;
}

const LEGACY_LEARNER_KEYS = [
  'lastBackupAt',
  'lastBackupAttempts',
  'tourDismissed',
  'lichessUsername',
  'chesscomUsername',
] as const;
/** Persisted once, read by nothing: dropped in version 4 (the lab's limit now lives under its own key). */
const DROPPED_KEYS = ['puzzleThemes', 'storageLimitBytes'] as const;

let legacyLearnerFields: LegacyLearnerFields | null = null;

/**
 * The learner fields found in a version-3 settings save, for the progress
 * store's migration (which runs after this module has loaded, since it
 * imports this one). Null when the settings were already version 4.
 */
export function takeLegacyLearnerFields(): LegacyLearnerFields | null {
  return legacyLearnerFields;
}

function pickLegacyLearnerFields(stored: Record<string, unknown>): LegacyLearnerFields {
  const picked: Record<string, unknown> = {};
  const check: Record<(typeof LEGACY_LEARNER_KEYS)[number], Check<unknown>> = {
    lastBackupAt: nullableNumber(0),
    lastBackupAttempts: numberIn(0, Number.MAX_SAFE_INTEGER),
    tourDismissed: isBoolean,
    lichessUsername: isString,
    chesscomUsername: isString,
  };
  for (const key of LEGACY_LEARNER_KEYS) {
    if (stored[key] !== undefined && check[key](stored[key])) picked[key] = stored[key];
  }
  return picked;
}

/* ------------------------------------------------------------------ */
/* Storage: the learner's settings per profile, the device's apart     */
/* ------------------------------------------------------------------ */

interface StoredSettings {
  state: Record<string, unknown>;
  version: number;
}

function readStored(key: string): StoredSettings | null {
  const raw = safeLocalStorage.getItem(key);
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as { state?: unknown; version?: unknown } | null;
    if (typeof parsed?.state !== 'object' || parsed.state === null) return null;
    return {
      state: parsed.state as Record<string, unknown>,
      version: typeof parsed.version === 'number' ? parsed.version : 0,
    };
  } catch {
    return null;
  }
}

function pick(state: Record<string, unknown>, keys: readonly string[], keep: boolean) {
  return Object.fromEntries(Object.entries(state).filter(([key]) => keys.includes(key) === keep));
}

/**
 * The store's one saved value, made of two: the profile's settings, and the
 * device's (`DEVICE_SETTING_KEYS`) under their own key. A profile with no
 * settings of its own yet (made before settings were per profile) starts from
 * the main profile's, and saves made before the device's were kept apart give
 * theirs from the profile's save.
 */
const settingsStorage: StateStorage = {
  getItem: (name) => {
    const own = safeLocalStorage.getItem(name);
    const learner =
      readStored(name) ?? (name !== SETTINGS_STORAGE_KEY ? readStored(SETTINGS_STORAGE_KEY) : null);
    // A save that cannot be read goes to the store as it is, which keeps a copy of it.
    if (typeof own === 'string' && readStored(name) === null) return own;
    const device = readStored(DEVICE_SETTINGS_STORAGE_KEY);
    if (!learner && !device) return null;
    const state = {
      ...pick(learner?.state ?? {}, DEVICE_SETTING_KEYS, false),
      ...pick(device?.state ?? learner?.state ?? {}, DEVICE_SETTING_KEYS, true),
    };
    return JSON.stringify({
      state,
      version: learner?.version ?? device?.version ?? SETTINGS_VERSION,
    });
  },
  setItem: (name, value) => {
    const { state, version } = JSON.parse(value) as StoredSettings;
    safeLocalStorage.setItem(
      name,
      JSON.stringify({ state: pick(state, DEVICE_SETTING_KEYS, false), version }),
    );
    safeLocalStorage.setItem(
      DEVICE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ state: pick(state, DEVICE_SETTING_KEYS, true), version }),
    );
  },
  removeItem: (name) => safeLocalStorage.removeItem(name),
};

export const useSettings = create<SettingsState>()(
  persist<SettingsState, [], [], PersistedSettings>(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      reset: () => {
        set({ ...DEFAULT_SETTINGS });
        void resetIsolationFlag();
        // The full engine is off by default: its download goes with the switch.
        void removeFullEngine();
      },
    }),
    {
      name: settingsStorageKey(),
      version: SETTINGS_VERSION,
      storage: createJSONStorage(() => settingsStorage),
      migrate: (stored, version): PersistedSettings => {
        const input =
          typeof stored === 'object' && stored !== null
            ? { ...(stored as Record<string, unknown>) }
            : {};
        if (version > SETTINGS_VERSION) {
          warnNewerSave(settingsStorageKey(), version, SETTINGS_VERSION);
          return { ...DEFAULT_SETTINGS, ...sanitizeSettings(input) };
        }
        if (version < 4) {
          legacyLearnerFields = pickLegacyLearnerFields(input);
          for (const key of [...LEGACY_LEARNER_KEYS, ...DROPPED_KEYS]) delete input[key];
        }
        // 0.14: the multi-threaded engine became the default, for everyone.
        if (version < 5) input.engineThreads = true;
        return { ...DEFAULT_SETTINGS, ...sanitizeSettings(input) };
      },
      merge: (persisted, current): SettingsState => ({
        ...current,
        ...sanitizeSettings(persisted),
      }),
      partialize: (state) => {
        const { update: _u, reset: _r, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: keepCorruptBlob(settingsStorageKey()),
    },
  ),
);

rehydrateOnStorageChange(useSettings, settingsStorageKey());
// The device's settings changed in another tab (of any profile).
rehydrateOnStorageChange(useSettings, DEVICE_SETTINGS_STORAGE_KEY);
