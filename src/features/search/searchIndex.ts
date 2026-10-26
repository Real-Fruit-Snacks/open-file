import type { IconName } from '@/components/ui';
import { faqAnchor, glossaryAnchor } from '@/features/reference/anchors';
import type { CustomRepertoire } from '@/store/repertoire';

/**
 * What quick search can find. The pages, their sections and the Settings cards are listed here;
 * everything else (lessons, courses, repertoires, puzzle themes, drills, games, studies, patterns
 * and the reference) comes from the modules that hold it, each loaded when the dialog first
 * opens. This module is itself part of the dialog's chunk: none of it is start-up code.
 */
export type SearchKind =
  | 'page'
  | 'lesson'
  | 'course'
  | 'repertoire'
  | 'puzzles'
  | 'drill'
  | 'arcade'
  | 'play'
  | 'classic'
  | 'study'
  | 'pattern'
  | 'reference'
  | 'setting';

export interface SearchEntry {
  /** Unique in the index. */
  key: string;
  kind: SearchKind;
  title: string;
  /** One line under the title. */
  detail?: string;
  /** Other words it answers to, not shown: synonyms, what it holds. */
  keywords?: string;
  /** Longer text, not shown, searched last. */
  text?: string;
  icon: IconName;
  /** Where it opens: a path in the app, with any query and hash. */
  to: string;
}

/** Each kind: what one result is called, its group's heading, and the words that find it. */
export const KINDS: Record<SearchKind, { label: string; group: string; words: string }> = {
  page: { label: 'Page', group: 'Pages', words: 'page' },
  lesson: { label: 'Lesson', group: 'Lessons', words: 'lesson learn' },
  course: { label: 'Course', group: 'Courses', words: 'course learn' },
  repertoire: { label: 'Opening', group: 'Openings', words: 'opening openings repertoire' },
  puzzles: { label: 'Puzzles', group: 'Puzzles', words: 'puzzle puzzles tactics' },
  drill: { label: 'Drill', group: 'Drills', words: 'drill drills' },
  arcade: { label: 'Arcade game', group: 'Arcade', words: 'arcade game' },
  play: { label: 'Play', group: 'Play', words: 'play game' },
  classic: { label: 'Classic game', group: 'Classic games', words: 'classic game' },
  study: { label: 'Endgame study', group: 'Endgame studies', words: 'study studies endgame' },
  pattern: { label: 'Mating pattern', group: 'Mating patterns', words: 'mating pattern mate' },
  reference: { label: 'Reference', group: 'Reference', words: 'reference' },
  setting: { label: 'Settings', group: 'Settings', words: 'settings setting' },
};

/** Between equally good matches, the earlier kind first. */
export const KIND_ORDER: readonly SearchKind[] = [
  'page',
  'lesson',
  'course',
  'repertoire',
  'puzzles',
  'drill',
  'arcade',
  'play',
  'classic',
  'study',
  'pattern',
  'reference',
  'setting',
];

/** One list of entries of a kind, each written with its own id. */
type Row = Omit<SearchEntry, 'key' | 'kind'> & { id: string };

const rows = (kind: SearchKind, list: Row[]): SearchEntry[] =>
  list.map(({ id, ...entry }) => ({ key: `${kind}:${id}`, kind, ...entry }));

/** The sections of the app, in the order of the navigation, and a few pages inside them. */
const PAGES = rows('page', [
  {
    id: 'home',
    title: 'Home',
    detail: 'Today’s plan and your progress',
    keywords: 'start today plan streak',
    icon: 'home',
    to: '/',
  },
  {
    id: 'learn',
    title: 'Learn',
    detail: 'Lessons and courses',
    keywords: 'lessons courses curriculum',
    icon: 'learn',
    to: '/learn',
  },
  {
    id: 'puzzles',
    title: 'Puzzles',
    detail: 'Tactics from real games',
    keywords: 'tactics rated',
    icon: 'puzzles',
    to: '/puzzles',
  },
  {
    id: 'drills',
    title: 'Drills',
    detail: 'Vision and endgames',
    keywords: 'endgame library ladder calculation',
    icon: 'drills',
    to: '/drills',
  },
  {
    id: 'openings',
    title: 'Openings',
    detail: 'Repertoire trainer',
    keywords: 'repertoires',
    icon: 'openings',
    to: '/openings',
  },
  {
    id: 'play',
    title: 'Play',
    detail: 'A person online, a friend by link or the computer',
    keywords: 'game online engine computer',
    icon: 'play',
    to: '/play',
  },
  {
    id: 'analyze',
    title: 'Analyze',
    detail: 'Engine analysis board',
    keywords: 'analyse analysis engine stockfish review pgn fen board editor evaluation',
    icon: 'analyze',
    to: '/analyze',
  },
  {
    id: 'progress',
    title: 'Progress',
    detail: 'Stats and records',
    keywords: 'statistics rating history',
    icon: 'progress',
    to: '/progress',
  },
  {
    id: 'arcade',
    title: 'Arcade',
    detail: 'Eleven games, not puzzles',
    keywords: 'games',
    icon: 'gamepad',
    to: '/arcade',
  },
  {
    id: 'games',
    title: 'My games',
    detail: 'Your games, reviewed',
    keywords: 'import lichess chess.com insights history',
    icon: 'games',
    to: '/games',
  },
  {
    id: 'classics',
    title: 'Classic games',
    detail: 'Guess the move',
    keywords: 'famous masters',
    icon: 'classics',
    to: '/classics',
  },
  {
    id: 'studies',
    title: 'Endgame studies',
    detail: 'Find the only move',
    keywords: 'compositions',
    icon: 'studies',
    to: '/studies',
  },
  {
    id: 'patterns',
    title: 'Mating patterns',
    detail: 'The named mates',
    keywords: 'checkmates',
    icon: 'patterns',
    to: '/patterns',
  },
  {
    id: 'reference',
    title: 'Reference',
    detail: 'Rules and glossary',
    keywords: 'notation faq questions',
    icon: 'reference',
    to: '/reference',
  },
  {
    id: 'settings',
    title: 'Settings',
    detail: 'Appearance, engine, backups',
    keywords: 'preferences options',
    icon: 'settings',
    to: '/settings',
  },
  {
    id: 'placement',
    title: 'Placement quiz',
    detail: 'Your level and a course in two minutes',
    keywords: 'level test starting rating',
    icon: 'award',
    to: '/placement',
  },
  {
    id: 'recall',
    title: 'Lesson recall',
    detail: 'Lesson positions come back to practise',
    keywords: 'review spaced repetition',
    icon: 'repeat',
    to: '/learn/recall',
  },
  {
    id: 'lab',
    title: 'Test lab',
    detail: 'Every sound, icon and control on one page',
    keywords: 'diagnostics sounds icons',
    icon: 'chip',
    to: '/settings/lab',
  },
]);

/** What the dialog offers before anything is typed: the sections of the navigation. */
export const MAIN_DESTINATIONS: readonly SearchEntry[] = PAGES.filter(
  (entry) => !['page:home', 'page:placement', 'page:recall', 'page:lab'].includes(entry.key),
);

/** What the analysis board leads to beyond itself. */
const ANALYZE_SECTIONS = rows('page', [
  {
    id: 'analyse-together',
    title: 'Analyse together',
    detail: 'One board for you and your friends, by link',
    keywords:
      'analyse analyze analysis together friend friends shared share room group coach class study',
    icon: 'analyze',
    to: '/analyze?together=1',
  },
]);

/** Puzzles' modes, as on the mode bar. */
const PUZZLE_MODES = rows('puzzles', [
  {
    id: 'rated',
    title: 'Rated puzzles',
    detail: 'Puzzles at your rating that move it',
    keywords: 'glicko',
    icon: 'puzzles',
    to: '/puzzles',
  },
  {
    id: 'daily',
    title: 'Daily puzzle',
    detail: 'One puzzle a day',
    keywords: 'today',
    icon: 'calendar',
    to: '/puzzles/daily',
  },
  {
    id: 'themes',
    title: 'Puzzles by theme',
    detail: 'One tactical idea at a time',
    keywords: 'themes motifs',
    icon: 'puzzles',
    to: '/puzzles/themes',
  },
  {
    id: 'openings',
    title: 'Puzzles by opening',
    detail: 'Tactics from the openings you play',
    keywords: 'repertoire',
    icon: 'openings',
    to: '/puzzles/openings',
  },
  {
    id: 'rush',
    title: 'Puzzle Rush',
    detail: 'As many as you can solve in three minutes',
    keywords: 'speed timed',
    icon: 'stopwatch',
    to: '/puzzles/rush',
  },
  {
    id: 'blind',
    title: 'Blind puzzles',
    detail: 'The whole line seen in your head',
    keywords: 'visualisation visualization blindfold',
    icon: 'eye-off',
    to: '/puzzles/blind',
  },
  {
    id: 'review',
    title: 'Due puzzles',
    detail: 'Puzzles you missed, back for another try',
    keywords: 'review missed spaced repetition',
    icon: 'repeat',
    to: '/puzzles/review',
  },
  {
    id: 'mine',
    title: 'My puzzles',
    detail: 'From the mistakes in your own games',
    keywords: 'own games mistakes',
    icon: 'bookmark',
    to: '/puzzles/mine',
  },
  {
    id: 'woodpecker',
    title: 'Woodpecker',
    detail: 'One set solved again and again, faster',
    keywords: 'method cycles',
    icon: 'sync',
    to: '/puzzles/woodpecker',
  },
]);

/** The drills that are not in the endgame library (which is loaded with the dialog). */
const SKILL_DRILLS = rows('drill', [
  {
    id: 'coordinates',
    title: 'Coordinates',
    detail: 'Click the square that is named',
    keywords: 'board vision squares notation',
    icon: 'drills',
    to: '/drills/coordinates',
  },
  {
    id: 'vision-moves',
    title: 'Piece movement',
    detail: 'Every square a piece can reach',
    keywords: 'board vision',
    icon: 'drills',
    to: '/drills/vision?mode=moves',
  },
  {
    id: 'vision-captures',
    title: 'Find every capture',
    detail: 'Every legal capture, against the clock',
    keywords: 'calculation board vision',
    icon: 'drills',
    to: '/drills/vision?mode=captures',
  },
  {
    id: 'vision-checks',
    title: 'Find every check',
    detail: 'Every check, against the clock',
    keywords: 'calculation forcing moves',
    icon: 'drills',
    to: '/drills/vision?mode=checks',
  },
  {
    id: 'vision-recall',
    title: 'Guess the position',
    detail: 'Rebuild a famous game’s position from its moves',
    keywords: 'visualisation visualization memory',
    icon: 'drills',
    to: '/drills/vision?mode=recall',
  },
  {
    id: 'threats',
    title: 'What’s the threat?',
    detail: 'Name what your opponent threatens, then meet it',
    keywords: 'threats defence defense',
    icon: 'drills',
    to: '/drills/threats',
  },
]);

/** Play's own sections; the games for two come from the live games' list. */
const PLAY_SECTIONS = rows('play', [
  {
    id: 'person',
    title: 'Play a person',
    detail: 'Chess online at a tap, or a friend by link',
    keywords: 'online live human opponent invite friend correspondence lichess',
    icon: 'people',
    to: '/play',
  },
  {
    id: 'race-room',
    title: 'Race room',
    detail: 'A puzzle race for up to eight, by link',
    keywords: 'puzzle race room group friends party class club several multiplayer eight',
    icon: 'stopwatch',
    to: '/play?play=race-room',
  },
  {
    id: 'computer',
    title: 'Play the computer',
    detail: 'Stockfish at eight levels',
    keywords: 'engine stockfish bot levels chess960 fischer random',
    icon: 'chip',
    to: '/play/computer',
  },
  {
    id: 'humanlike',
    title: 'Human-like opponent',
    detail: 'Maia plays the moves people of a rating play',
    keywords: 'maia human bot rating',
    icon: 'brain',
    to: '/play/computer?opponent=humanlike',
  },
  {
    id: 'pass',
    title: 'Pass and play',
    detail: 'Two players at one device',
    keywords: 'over the board friend local hotseat',
    icon: 'device',
    to: '/play/computer?opponent=human',
  },
]);

/** The Settings cards, by the links Settings understands (`/settings#lichess`). */
const SETTINGS = rows('setting', [
  {
    id: 'board',
    title: 'Board',
    detail: 'Board theme, pieces, coordinates and move dots',
    keywords:
      'piece set pieces colours colors coordinates legal moves dots highlights animation drag magnify tap',
    icon: 'palette',
    to: '/settings#board',
  },
  {
    id: 'display',
    title: 'Display',
    detail: 'Colour scheme and move notation',
    keywords:
      'dark mode light nightshift dayshift night day theme colour color scheme notation figurines material',
    icon: 'palette',
    to: '/settings#display',
  },
  {
    id: 'sound',
    title: 'Sound & vibration',
    detail: 'Sound effects, volume and vibration',
    keywords: 'sounds audio volume mute haptics vibrate',
    icon: 'palette',
    to: '/settings#sound',
  },
  {
    id: 'play',
    title: 'Play settings',
    detail: 'Promotion, shortcuts, focus mode and the coach',
    keywords:
      'queen promotion auto advance keyboard move entry single key shortcuts focus mode coach blunder check premoves engine level',
    icon: 'play',
    to: '/settings#play',
  },
  {
    id: 'rating',
    title: 'Puzzle rating',
    detail: 'Start your puzzle rating again',
    keywords: 'reset glicko',
    icon: 'play',
    to: '/settings#rating',
  },
  {
    id: 'human-opponent',
    title: 'Human-like opponent',
    detail: 'Download the human-like opponent',
    keywords: 'maia download model',
    icon: 'play',
    to: '/settings#human-opponent',
  },
  {
    id: 'engine',
    title: 'Engine & analysis',
    detail: 'Depth, threads, tablebase and explorer lookups',
    keywords: 'stockfish threads full engine depth review tablebase explorer lines diagnostics',
    icon: 'chip',
    to: '/settings#engine',
  },
  {
    id: 'sync',
    title: 'Sync between devices',
    detail: 'Your progress on all your devices',
    keywords: 'devices phone computer recovery phrase',
    icon: 'sync',
    to: '/settings#sync',
  },
  {
    id: 'backups',
    title: 'Backups',
    detail: 'Export and import a backup file',
    keywords: 'backup export import restore save file',
    icon: 'sync',
    to: '/settings#backups',
  },
  {
    id: 'storage',
    title: 'Storage',
    detail: 'Space used on this device, and resetting everything',
    keywords: 'reset delete clear data space',
    icon: 'sync',
    to: '/settings#storage',
  },
  {
    id: 'lichess',
    title: 'Lichess account',
    detail: 'Sign in to Lichess',
    keywords: 'lichess sign in login account import games',
    icon: 'sync',
    to: '/settings#lichess',
  },
  {
    id: 'profiles',
    title: 'Profiles',
    detail: 'Several learners on one device',
    keywords: 'family children switch users',
    icon: 'sync',
    to: '/settings#profiles',
  },
  {
    id: 'app',
    title: 'App',
    detail: 'Install, the icon badge, offline puzzles and the version',
    keywords: 'install badge offline download version',
    icon: 'device',
    to: '/settings#app',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    detail: 'Your move, joined games and a daily reminder',
    keywords: 'notify push reminder alerts',
    icon: 'bell',
    to: '/settings#notifications',
  },
  {
    id: 'whats-new',
    title: 'What’s new',
    detail: 'The highlights of the recent releases',
    keywords: 'release notes changelog version updates',
    icon: 'sparkle',
    to: '/settings#app',
  },
]);

/** Everything the dialog can find without loading anything. */
export const STATIC_ENTRIES: readonly SearchEntry[] = [
  ...PAGES,
  ...ANALYZE_SECTIONS,
  ...PUZZLE_MODES,
  ...SKILL_DRILLS,
  ...PLAY_SECTIONS,
  ...SETTINGS,
];

/** The learner's own repertoires, from the repertoire store. */
export function customRepertoireEntries(custom: readonly CustomRepertoire[]): SearchEntry[] {
  return custom.map((rep) => ({
    key: `repertoire:${rep.id}`,
    kind: 'repertoire',
    title: rep.name,
    detail: `Your repertoire · ${rep.color === 'white' ? 'White' : 'Black'}`,
    keywords: 'mine own custom',
    icon: 'openings',
    to: `/openings/${rep.id}`,
  }));
}

/** Markdown of the lessons' kind (**bold**, *italic*, `code`, [links](…)) as plain text. */
function plain(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

/** Resolves to null after `ms`, so one slow source cannot hold its list back for long. */
function within<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/** A list the dialog loads when it first opens. */
export interface SearchSource {
  id: string;
  load: () => Promise<SearchEntry[]>;
}

export const SEARCH_SOURCES: readonly SearchSource[] = [
  {
    id: 'lessons',
    load: async () => {
      const { LESSON_META } = await import('@/features/learn/lessonMeta');
      return LESSON_META.map((lesson) => ({
        key: `lesson:${lesson.id}`,
        kind: 'lesson',
        title: lesson.title,
        detail: `${LEVELS[lesson.level]} · ${lesson.summary}`,
        keywords: lesson.category,
        icon: 'learn',
        to: `/learn/${lesson.id}`,
      }));
    },
  },
  {
    id: 'courses',
    load: async () => {
      const { COURSES } = await import('@/features/learn/courses');
      return COURSES.map((course) => ({
        key: `course:${course.id}`,
        kind: 'course',
        title: course.title,
        detail: `${LEVELS[course.level]} · ${course.blurb}`,
        text: course.units.map((unit) => unit.title).join(' '),
        icon: 'award',
        to: `/learn/course/${course.id}`,
      }));
    },
  },
  {
    id: 'repertoires',
    load: async () => {
      const { BUILT_IN_REPERTOIRES } = await import('@/features/openings/repertoires');
      return BUILT_IN_REPERTOIRES.map((rep) => ({
        key: `repertoire:${rep.id}`,
        kind: 'repertoire',
        title: rep.name,
        detail: `${rep.color === 'white' ? 'White' : 'Black'} · ${rep.line}`,
        keywords: rep.openingTags.join(' ').replace(/_/g, ' '),
        text: rep.description,
        icon: 'openings',
        to: `/openings/${rep.id}`,
      }));
    },
  },
  {
    id: 'themes',
    load: async () => {
      const [{ THEMES, PRACTICE_GROUPS }, { loadPuzzleIndex }] = await Promise.all([
        import('@/features/puzzles/themes'),
        import('@/features/puzzles/puzzleService'),
      ]);
      // Only the themes the theme catalogue offers: those with enough puzzles to practise.
      // Without the index (offline before it was cached) every theme is offered.
      const index = await within(loadPuzzleIndex(), 1500);
      return Object.entries(THEMES)
        .filter(([, info]) => PRACTICE_GROUPS.includes(info.group))
        .filter(([tag]) => !index || (index.themes[tag] ?? 0) >= 10)
        .map(([tag, info]) => ({
          key: `theme:${tag}`,
          kind: 'puzzles',
          title: info.name,
          detail: info.description,
          keywords: `${info.group} theme`,
          icon: 'puzzles',
          to: `/puzzles/themes?theme=${encodeURIComponent(tag)}`,
        }));
    },
  },
  {
    id: 'endgames',
    load: async () => {
      const { ENDGAME_DRILLS } = await import('@/features/drills/endgameDrills');
      return ENDGAME_DRILLS.map((drill) => ({
        key: `endgame:${drill.id}`,
        kind: 'drill',
        title: drill.title,
        detail: `${drill.group} · ${drill.description}`,
        keywords: 'endgame',
        icon: 'drills',
        to: `/drills/endgame/${drill.id}`,
      }));
    },
  },
  {
    id: 'arcade',
    load: async () => {
      const { ARCADE_GAMES } = await import('@/features/arcade/games');
      return ARCADE_GAMES.map((game) => ({
        key: `arcade:${game.id}`,
        kind: 'arcade',
        title: game.name,
        detail: game.tagline,
        keywords: game.trains,
        text: game.description,
        icon: game.icon,
        to: `/arcade/${game.id}`,
      }));
    },
  },
  {
    id: 'games-for-two',
    load: async () => {
      const { ONLINE_GAMES } = await import('@/features/live/onlineGames');
      return ONLINE_GAMES.map((game) => ({
        key: `play:${game.kind}`,
        kind: 'play',
        // "Army Draft online", beside the arcade's Army Draft against the engine.
        title: game.duel ? game.name : `${game.name} online`,
        detail: game.tagline,
        keywords: 'online person friend',
        text: game.description,
        icon: game.icon,
        to: `/play?play=${game.kind}`,
      }));
    },
  },
  {
    id: 'classics',
    load: async () => {
      const { CLASSIC_GAMES } = await import('@/features/classics/games');
      return CLASSIC_GAMES.map((game) => ({
        key: `classic:${game.id}`,
        kind: 'classic',
        title: game.title,
        detail: `${game.white} – ${game.black} · ${game.event} ${game.year}`,
        keywords: `${game.white} ${game.black} ${game.year}`,
        icon: 'classics',
        to: `/classics/${game.id}`,
      }));
    },
  },
  {
    id: 'studies',
    load: async () => {
      const { STUDIES } = await import('@/features/studies/studies');
      return STUDIES.map((study) => ({
        key: `study:${study.id}`,
        kind: 'study',
        title: study.title,
        detail: `${study.composer}${study.year ? `, ${study.year}` : ''} · ${study.goal === 'win' ? 'Win' : 'Draw'}`,
        keywords: `${study.composer} ${study.themes.join(' ')}`,
        icon: 'studies',
        to: `/studies/${study.id}`,
      }));
    },
  },
  {
    id: 'patterns',
    load: async () => {
      const { MATING_PATTERNS } = await import('@/features/patterns/matingPatterns');
      return MATING_PATTERNS.map((pattern) => ({
        key: `pattern:${pattern.id}`,
        kind: 'pattern',
        title: pattern.name,
        detail: `${pattern.pieces} · White to play and mate`,
        keywords: 'checkmate',
        icon: 'patterns',
        to: `/patterns?drill=${pattern.id}`,
      }));
    },
  },
  {
    id: 'reference',
    load: async () => {
      const { RULES, NOTATION, GLOSSARY, FAQ } = await import('@/features/reference/content');
      return [
        ...RULES.map((section) => ({
          key: `reference:rules-${section.id}`,
          kind: 'reference' as const,
          title: section.title,
          detail: 'Rules of the game',
          text: plain(section.body),
          icon: 'reference' as const,
          to: `/reference#rules-${section.id}`,
        })),
        ...NOTATION.map((section) => ({
          key: `reference:notation-${section.id}`,
          kind: 'reference' as const,
          title: section.title,
          detail: 'Notation',
          text: plain(section.body),
          icon: 'reference' as const,
          to: `/reference#notation-${section.id}`,
        })),
        ...GLOSSARY.map((term) => ({
          key: `reference:${glossaryAnchor(term.term)}`,
          kind: 'reference' as const,
          title: term.term,
          detail: plain(term.definition),
          keywords: 'glossary term definition',
          icon: 'reference' as const,
          to: `/reference#${glossaryAnchor(term.term)}`,
        })),
        ...FAQ.map((item) => ({
          key: `reference:${faqAnchor(item.question)}`,
          kind: 'reference' as const,
          title: item.question,
          detail: 'Frequently asked question',
          keywords: 'faq question help',
          text: plain(item.answer),
          icon: 'reference' as const,
          to: `/reference#${faqAnchor(item.question)}`,
        })),
      ];
    },
  },
];
