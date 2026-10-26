/**
 * The app's icon set as data: simple 24×24 line icons, one path each, drawn
 * with the current text colour. The page never loads this module at start-up:
 * the build puts every icon into index.html as an SVG sprite (see
 * scripts/lib/iconSprite.ts), and `<Icon>` draws one with `<use>`. Only the
 * build, the test lab and the tests read the paths themselves.
 *
 * To add an icon: add its name to `IconName` and its path to `ICONS`, on the
 * same 24×24 grid, stroked unless `fill` is set.
 */
/** One icon: its path, stroked with the current colour unless `fill` draws it as a filled shape. */
export interface IconShape {
  d: string;
  fill?: boolean;
}

export type IconName =
  | 'home'
  | 'learn'
  | 'puzzles'
  | 'drills'
  | 'openings'
  | 'play'
  | 'analyze'
  | 'progress'
  | 'games'
  | 'studies'
  | 'classics'
  | 'patterns'
  | 'reference'
  | 'search'
  | 'sun'
  | 'moon'
  | 'auto'
  | 'more'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'skip-back'
  | 'skip-forward'
  | 'check'
  | 'circle'
  | 'close'
  | 'plus'
  | 'bookmark'
  | 'bookmark-filled'
  | 'trophy'
  | 'award'
  | 'star'
  | 'star-filled'
  | 'sparkle'
  | 'knight'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'flag'
  | 'download'
  | 'gamepad'
  | 'brain'
  | 'calendar'
  | 'scale'
  | 'ladder'
  | 'shield'
  | 'army'
  | 'repeat'
  | 'eye-off'
  | 'boards'
  | 'settings'
  | 'info'
  | 'warning'
  | 'alert'
  | 'swap'
  | 'whistle'
  | 'ghost'
  | 'palette'
  | 'chip'
  | 'sync'
  | 'device'
  | 'people'
  | 'stopwatch'
  | 'link'
  | 'eye'
  | 'bell'
  | 'mail'
  | 'shuffle'
  | 'pen';

/** Path data per icon; `fill` marks icons drawn as filled shapes. */
export const ICONS: Record<IconName, IconShape> = {
  home: { d: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  learn: {
    d: 'M2 5a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3 3 3 0 0 1 3-3h5a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 2 3 3 0 0 0-3-2H3a1 1 0 0 1-1-1zM12 6v14',
  },
  puzzles: {
    d: 'M10 3.5a2 2 0 0 1 4 0V5h3a1 1 0 0 1 1 1v3h1.5a2 2 0 0 1 0 4H18v3a1 1 0 0 1-1 1h-3v1.5a2 2 0 0 1-4 0V17H7a1 1 0 0 1-1-1v-3H4.5a2 2 0 0 1 0-4H6V6a1 1 0 0 1 1-1h3z',
  },
  drills: {
    d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  },
  openings: { d: 'M4 4h3v16H4zM9 4h3v16H9zM14.5 4.6l2.9-.8 4.1 15.3-2.9.8z' },
  // A pawn: head, collar, bell and plinth.
  play: {
    d: 'M12 3.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM9.2 9.7h5.6M10.2 9.7c.3 3.5-.8 6.3-2.6 8.3h8.8c-1.8-2-2.9-4.8-2.6-8.3M7.6 18l-1.4 2.6h11.6L16.4 18',
  },
  analyze: { d: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5' },
  progress: { d: 'M4 4v16h16M8 15l4-5 3 3 5-6' },
  games: {
    d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  },
  studies: {
    d: 'M12 3v4M10 5h4M8 21h8M9 21c-1-2-3-5-3-8a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 3-2 6-3 8',
  },
  classics: { d: 'M3 21h18M5 21v-9M9 21v-9M15 21v-9M19 21v-9M3 11l9-6 9 6z' },
  patterns: { d: 'M3 19h18M4 16l1-9 5 4.5 2-6 2 6 5-4.5 1 9z' },
  reference: {
    d: 'M6 3h13a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM6 17h14M9 3v7l2-1.5 2 1.5V3',
  },
  // A magnifying glass with a long handle: quick search (smaller than Analyze's lens).
  search: { d: 'M10 4.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM14 14l6 6' },
  sun: {
    d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  },
  moon: { d: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z' },
  auto: { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 3v12a6 6 0 0 0 0-12z' },
  more: {
    d: 'M5 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
    fill: true,
  },
  'chevron-down': { d: 'M6 9l6 6 6-6' },
  'chevron-left': { d: 'M15 6l-6 6 6 6' },
  'chevron-right': { d: 'M9 6l6 6-6 6' },
  'skip-back': { d: 'M18 6l-9 6 9 6zM6 6v12' },
  'skip-forward': { d: 'M6 6l9 6-9 6zM18 6v12' },
  check: { d: 'M5 12.5l4.5 4.5L19 7' },
  circle: { d: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z' },
  close: { d: 'M6 6l12 12M18 6L6 18' },
  plus: { d: 'M12 5v14M5 12h14' },
  bookmark: { d: 'M6 3h12v18l-6-4-6 4z' },
  'bookmark-filled': { d: 'M6 3h12v18l-6-4-6 4z', fill: true },
  trophy: {
    d: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 21h6M10 17h4v4h-4z',
  },
  award: { d: 'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v5' },
  star: { d: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z' },
  'star-filled': {
    d: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    fill: true,
  },
  // Two four-pointed sparkles, a large and a small one: what is new.
  sparkle: {
    d: 'M10 5.5c.9 4.8 2.7 6.6 7.5 7.5-4.8.9-6.6 2.7-7.5 7.5-.9-4.8-2.7-6.6-7.5-7.5 4.8-.9 6.6-2.7 7.5-7.5zM18.5 3c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z',
  },
  // A knight in profile: forehead, ear, muzzle, eye, neck and plinth.
  knight: {
    d: 'M7.6 18c.6-2.2 1.6-3.8 2.4-5.4-1.4 0-2.8-.3-3.8-1-1.3-.8-1.2-2-.2-2.8 1.8-1.6 3.8-2.8 5.8-3.8L13.6 3.2c.8 1.6 1.2 3.2 1.6 4.8 1.2 2.8 1.6 6.4 1.2 10M7.6 18h8.8l1.4 2.6H6.2L7.6 18M11 8.8h.01',
  },
  'arrow-right': { d: 'M4 12h16M13 5l7 7-7 7' },
  'arrow-left': { d: 'M20 12H4M11 5l-7 7 7 7' },
  'arrow-up': { d: 'M12 20V4M5 11l7-7 7 7' },
  'arrow-down': { d: 'M12 4v16M5 13l7 7 7-7' },
  // A flag on a pole: the end of a lesson that is not complete yet.
  flag: { d: 'M5 21V4M5 4h11l-2 4 2 4H5' },
  download: { d: 'M12 4v11M7 10l5 5 5-5M4 19h16' },
  gamepad: {
    d: 'M7 6h10a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4h-1.5l-2-2h-3l-2 2H7a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4zM6.5 11.5h4M8.5 9.5v4M15 10.5h.01M17.5 12.5h.01',
  },
  brain: {
    d: 'M12 5v14M12 5a3 3 0 0 0-5.5 1.5A3 3 0 0 0 5 12a3 3 0 0 0 1 5.5A2.5 2.5 0 0 0 12 19M12 5a3 3 0 0 1 5.5 1.5A3 3 0 0 1 19 12a3 3 0 0 1-1 5.5A2.5 2.5 0 0 1 12 19M6.5 6.5a3 3 0 0 0 2 2.5M17.5 6.5a3 3 0 0 1-2 2.5M5.5 12.5c1.5 0 2.5-.5 3-1.5M18.5 12.5c-1.5 0-2.5-.5-3-1.5',
  },
  calendar: { d: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  scale: {
    d: 'M12 4v17M7 21h10M12 6L5 8M12 6l7 2M2 14l3-6 3 6a3 3 0 0 1-6 0zM16 14l3-6 3 6a3 3 0 0 1-6 0z',
  },
  ladder: { d: 'M7 3v18M17 3v18M7 7.5h10M7 12h10M7 16.5h10' },
  shield: { d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
  // A pawn with a plus: build your own army.
  army: {
    d: 'M9.5 4.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zM7.3 9.6h4.4M8.1 9.6c.2 2.8-.6 5-2 6.6h6.8c-1.4-1.6-2.2-3.8-2-6.6M6.1 16.2l-1.1 2.3h9l-1.1-2.3M18 4v6M15 7h6',
  },
  repeat: {
    d: 'M17 2l4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3',
  },
  settings: {
    d: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  },
  'eye-off': {
    d: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10 10 0 0 1 12 5c5 0 8.5 3.5 10 7a12 12 0 0 1-2.6 3.6M6.5 6.5A12 12 0 0 0 2 12c1.5 3.5 5 7 10 7a9.6 9.6 0 0 0 4-.9',
  },
  // A board with a second one behind it: several games at once.
  boards: {
    d: 'M16 6V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2M9 8h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM8 14.5h13M14.5 8v13',
  },
  // Message tones: an "i" in a circle, a "!" in a triangle, a "!" in a circle.
  info: { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01' },
  warning: { d: 'M12 4l9.5 16.5H2.5zM12 10v4.5M12 17.5h.01' },
  alert: { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16.5h.01' },
  // Two arrows passing each other: in the line, but in another place (Daily Opening).
  swap: { d: 'M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3' },
  // A referee's whistle: body, mouthpiece, the pea inside and the lanyard ring (Arbiter).
  whistle: {
    d: 'M9.5 8H21v4h-6.2A5.5 5.5 0 1 1 9.5 8zM9.5 11.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM5.6 9.6 3.4 7.4',
  },
  // A sheet ghost with a ragged hem (Ghost Knight).
  ghost: {
    d: 'M6 20.5V10a6 6 0 0 1 12 0v10.5l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5zM10 10.5h.01M14 10.5h.01',
  },
  // A painter's palette with four dabs of paint (Settings: appearance).
  palette: {
    d: 'M12 3a9 9 0 0 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3zM7.5 11.5h.01M9.5 7.5h.01M14.5 7.5h.01M17 11h.01',
  },
  // A chip with its pins: the engine.
  chip: {
    d: 'M7 7h10v10H7zM10 10h4v4h-4zM9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4',
  },
  // Two arrows chasing each other round: sync.
  sync: {
    d: 'M20 11a8 8 0 0 0-14.6-4.4L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.6 4.4l1.4-1.9M20 20v-4.5h-4.5',
  },
  // A phone: the device the app is installed on.
  device: {
    d: 'M8 2.5h8a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM11 18h2',
  },
  // Two people, one behind the other: playing someone online.
  people: {
    d: 'M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3.5 19.5a5.5 5.5 0 0 1 11 0M16 5.5a2.5 2.5 0 0 1 0 5M17 14a5 5 0 0 1 4 5.5',
  },
  // A stopwatch: its face, the hand, the crown on top (the puzzle race).
  stopwatch: {
    d: 'M12 6a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM12 10v3.5l2.5 1.5M10 2.5h4M12 2.5V6M18.5 6.5l1.5-1.5',
  },
  // Two links of a chain: a link to share.
  link: {
    d: 'M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2',
  },
  // An open eye with its pupil: watching a game.
  eye: {
    d: 'M2 12c1.5-3.5 5-7 10-7s8.5 3.5 10 7c-1.5 3.5-5 7-10 7S3.5 15.5 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  },
  // A bell with its clapper below: notifications.
  bell: {
    d: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0M12 3v2',
  },
  // An envelope, its flap folded down: correspondence games.
  mail: {
    d: 'M3.5 6h17a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3 7l9 6.5L21 7',
  },
  // Two arrows crossing on their way: the pieces shuffled (Chess960).
  shuffle: {
    d: 'M3 7h3.5c1.6 0 3 .8 3.9 2.1l3.2 5.8c.9 1.3 2.3 2.1 3.9 2.1H21M18 14l3 3-3 3M3 17h3.5c1.6 0 3-.8 3.9-2.1l3.2-5.8c.9-1.3 2.3-2.1 3.9-2.1H21M18 4l3 3-3 3',
  },
  // A pencil, its point at the bottom left: drawing arrows and circles on the board.
  pen: {
    d: 'M4 20l1-4.5L15.5 5a2.5 2.5 0 0 1 3.5 3.5L8.5 19zM13.5 7l3.5 3.5M5 15.5l3.5 3.5',
  },
};

/** Every icon name, for the test lab and the tests. */
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
