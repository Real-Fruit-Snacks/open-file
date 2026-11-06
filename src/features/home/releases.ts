import type { IconName } from '@/components/ui';
import { formatDate } from '@/lib/dates';
import { siteConfig } from '@/site.config';

/**
 * What each release brought, in a few lines: Home's "What's new" card shows the newest release a
 * returning learner has not seen yet, and Settings → App lists the recent ones. The changelog
 * (CHANGELOG.md, linked below) has everything else.
 */
export type Highlight = {
  icon: IconName;
  /** A few words. */
  title: string;
  /** One short sentence. */
  text: string;
} & (
  | {
      /** Where the feature is: a page of the app. */
      to: string;
      opensSearch?: never;
    }
  | {
      /** The quick search dialog instead of a page (it lives in the header, not on a page). */
      opensSearch: true;
      to?: never;
    }
);

export interface Release {
  /** As in package.json: "0.29.0". */
  version: string;
  /** The day it came out, yyyy-mm-dd. */
  date: string;
  highlights: Highlight[];
}

/** Newest first. */
export const RELEASES: readonly Release[] = [
  {
    version: '0.32.0',
    date: '2026-10-26',
    highlights: [
      {
        icon: 'palette',
        title: 'A new look',
        text: 'IBM Plex type, warmer colours, and one Ember button on each screen for what to do next.',
        to: '/settings',
      },
      {
        icon: 'moon',
        title: 'Nightshift and Dayshift',
        text: 'The two colour schemes: Nightshift, dark, unless your device asks for light; Dayshift, light.',
        to: '/settings',
      },
    ],
  },
  {
    version: '0.31.0',
    date: '2026-10-12',
    highlights: [
      {
        icon: 'sparkle',
        title: 'A new name: Open File',
        text: 'Chess Trainer is now Open File, with a new icon: an open file is the road a rook takes into the game.',
        to: '/reference#faq',
      },
    ],
  },
  {
    version: '0.30.0',
    date: '2026-10-12',
    highlights: [
      {
        icon: 'play',
        title: 'A new game screen',
        text: 'Set up a game against the computer in the page, with the board as it will start beside it.',
        to: '/play',
      },
      {
        icon: 'gamepad',
        title: 'Arcade set-ups',
        text: 'Every arcade game starts from the same screen as Play, its choices on cards and Start in reach.',
        to: '/arcade',
      },
      {
        icon: 'search',
        title: 'Searchable lists',
        text: 'Find a lesson, classic game, puzzle theme, opening or endgame drill by typing a few words.',
        to: '/learn',
      },
      {
        icon: 'eye-off',
        title: 'Themes after the solve',
        text: 'A puzzle’s themes stay hidden while you solve it, so they no longer say what to look for.',
        to: '/puzzles',
      },
      {
        icon: 'drills',
        title: 'Endgames in view',
        text: 'An endgame drill shows its position and its task beside the board before you start.',
        to: '/drills',
      },
      {
        icon: 'reference',
        title: 'Reference',
        text: 'The sections follow you down the page, and the glossary and questions read as one card each.',
        to: '/reference',
      },
    ],
  },
  {
    version: '0.29.0',
    date: '2026-10-12',
    highlights: [
      {
        icon: 'shuffle',
        title: 'Chess960',
        text: 'Play a person or the computer from one of 960 start positions; the games load and analyse too.',
        to: '/play?play=chess960',
      },
      {
        icon: 'brain',
        title: 'Human moves',
        text: 'See what players of a chosen rating play in a position, and which of their favourite moves are traps.',
        to: '/analyze',
      },
      {
        icon: 'mail',
        title: 'Correspondence games',
        text: 'Days a move instead of minutes: invite a friend, and move whenever it suits you.',
        to: '/play',
      },
      {
        icon: 'stopwatch',
        title: 'Puzzle race rooms',
        text: 'Up to eight players race through the same puzzles, all from one link.',
        to: '/play?play=race-room',
      },
      {
        icon: 'people',
        title: 'Analyse together',
        text: 'Go over a finished game with your opponent, or a game with friends, on one shared board.',
        to: '/analyze?together=1',
      },
      {
        icon: 'repeat',
        title: 'Fix your mistakes',
        text: 'After a review, go back to each of your mistakes and find a better move.',
        to: '/analyze',
      },
      {
        icon: 'openings',
        title: 'Repertoire gaps',
        text: 'Find the common replies a repertoire has no answer to yet, and add an answer in a tap.',
        to: '/openings',
      },
      {
        icon: 'search',
        title: 'Quick search',
        text: 'Find any lesson, opening, puzzle theme or setting from the magnifying glass at the top, or with Ctrl+K.',
        opensSearch: true,
      },
      {
        icon: 'progress',
        title: 'Time management',
        text: 'Reviewed games with clock times show the time each move took, and when the mistakes came.',
        to: '/games',
      },
      {
        icon: 'games',
        title: 'In your games',
        text: 'The analysis board lists your games that reached its position, and what came next.',
        to: '/analyze',
      },
      {
        icon: 'skip-forward',
        title: 'Premoves',
        text: 'In a live game, play your next move while your opponent thinks: it goes the moment they move.',
        to: '/play',
      },
      {
        icon: 'eye',
        title: 'Watch a game',
        text: 'Send a watch link, and friends follow a live game move by move.',
        to: '/play',
      },
      {
        icon: 'bell',
        title: 'Notifications',
        text: 'A note when it is your move or someone takes your game, and a daily reminder to train.',
        to: '/settings#notifications',
      },
    ],
  },
  {
    version: '0.28.0',
    date: '2026-10-11',
    highlights: [
      {
        icon: 'play',
        title: 'One page to play',
        text: 'A person online, a friend by link or the computer: every game starts from Play.',
        to: '/play',
      },
      {
        icon: 'stopwatch',
        title: 'Puzzle race',
        text: 'The same puzzle on both boards at the same moment: the first clean solve takes the round.',
        to: '/play?play=race',
      },
      {
        icon: 'whistle',
        title: 'Duels',
        text: 'Arbiter and Who Stands Better? against a person: call the illegal move first, or judge closer to the engine.',
        to: '/play',
      },
      {
        icon: 'army',
        title: 'Army Draft and blindfold online',
        text: 'Draft an army in secret against a person, or play a real game with the pieces hidden.',
        to: '/play',
      },
    ],
  },
];

/** Every change, release by release. */
export const CHANGELOG_URL = `${siteConfig.repositoryUrl}/blob/main/CHANGELOG.md`;

/** "11 Oct 2026": the day it came out, the same day wherever the learner is. */
export function releaseDate(release: Release, locale: string = siteConfig.locale): string {
  // Noon, local time: a bare date would be midnight UTC, the day before west of Greenwich.
  return formatDate(`${release.date}T12:00:00`, locale);
}

/** The numbers of a version ("0.29.1" → [0, 29, 1]); anything unreadable counts as 0. */
function parts(version: string): number[] {
  const core = version.trim().replace(/^v/, '').split('-')[0] ?? '';
  return core.split('.').map((part) => {
    const n = Number.parseInt(part, 10);
    return Number.isFinite(n) ? n : 0;
  });
}

/** Negative, zero or positive as `a` came before, is or came after `b`. */
export function compareVersions(a: string, b: string): number {
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length, 3); i++) {
    const diff = (x[i] ?? 0) - (y[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** How a version is named to people: "0.29" for 0.29.0, "0.29.1" for a patch release. */
export function versionLabel(version: string): string {
  const [major = 0, minor = 0, patch = 0] = parts(version);
  return patch === 0 ? `${major}.${minor}` : `${major}.${minor}.${patch}`;
}

/** The releases up to the running version, newest first: a build never tells of a later one. */
export function releasesUpTo(current: string, releases: readonly Release[] = RELEASES): Release[] {
  return releases
    .filter((release) => compareVersions(release.version, current) <= 0)
    .sort((a, b) => compareVersions(b.version, a.version));
}

/**
 * What Home announces: the newest release after the one last seen, up to the running version.
 * `seen` null means no version was ever recorded on this device — a learner from before the card
 * existed — so the newest release is news. Null when there is nothing new.
 */
export function unseenRelease(
  current: string,
  seen: string | null,
  releases: readonly Release[] = RELEASES,
): Release | null {
  const newest = releasesUpTo(current, releases)[0];
  if (!newest) return null;
  if (seen !== null && compareVersions(newest.version, seen) <= 0) return null;
  return newest;
}
