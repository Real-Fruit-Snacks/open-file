import {
  type ComponentType,
  type KeyboardEvent,
  type FocusEvent,
  lazy,
  Suspense,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Spinner, Icon, type IconName } from '@/components/ui';
import { Toasts } from '@/components/ui/toast';
import { toast } from '@/components/ui/toastStore';
import { isReturningLearner, noteFirstVisit } from '@/features/home/seenVersion';
import { useQuickSearch } from '@/features/search/quickSearch';
import { siteConfig } from '@/site.config';
import { activeProfile, useProfiles } from '@/store/profiles';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { ErrorBoundary } from './ErrorBoundary';
import { InstallButton } from './InstallPrompt';
import { PlatformHooks } from './PlatformHooks';
import { ShortcutsDialog } from './ShortcutsDialog';
import { UpdatePrompt } from './UpdatePrompt';
import { SCHEME_NAMES, useColorScheme, usePieceSet } from './theme';
import { useShortcutsDialog } from './useShortcutsDialog';
import './shell.css';
import { useFocus } from './focus';
import { useLiveBar } from './liveBar';
import { navSection } from './navSection';

/**
 * The piece set's credit, in its own chunk: every set's author and licence. Until it arrives the
 * footer shows the default set's credit, the same words for most visitors, so nothing reflows.
 */
const PieceCredit = lazy(() => import('@/components/board/PieceCredit'));

/**
 * The live-games bar, in its own chunk and loaded only once live games turn it on: start-up
 * carries none of the feature. A chunk that cannot load leaves no bar rather than a crash page.
 */
const LiveBar = lazy(() =>
  import('@/features/live/LiveBar').catch(() => ({ default: () => null })),
);

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Quick search could not be loaded (offline before it was ever cached): say so, and close. */
function SearchUnavailable({ open, onClose }: SearchDialogProps) {
  useEffect(() => {
    if (!open) return;
    toast('Search could not be loaded. Reload the page to try again.', { tone: 'warning' });
    onClose();
  }, [open, onClose]);
  return null;
}

/**
 * Quick search, in its own chunk with every list it searches: loaded when it is first opened
 * (or when the pointer or the focus reaches its button), never at start-up.
 */
const loadSearch = () => import('@/features/search/SearchDialog');
const SearchDialog = lazy<ComponentType<SearchDialogProps>>(() =>
  loadSearch().catch(() => ({ default: SearchUnavailable })),
);

const CLASSIC_CREDIT = (
  <>
    Pieces (Classic): Colin M.L. Burnett,{' '}
    <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">
      CC BY-SA 3.0
    </a>
  </>
);

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  /** Short explanation shown in the "More" menus. */
  blurb?: string;
}

/** Desktop header links. */
const DESKTOP_NAV: NavItem[] = [
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/puzzles', label: 'Puzzles', icon: 'puzzles' },
  { to: '/drills', label: 'Drills', icon: 'drills' },
  { to: '/openings', label: 'Openings', icon: 'openings' },
  { to: '/play', label: 'Play', icon: 'play' },
  { to: '/analyze', label: 'Analyze', icon: 'analyze' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
];

/** A titled group of links in a "More" menu. */
interface NavGroup {
  title: string;
  items: NavItem[];
}

const ARCADE: NavItem = {
  to: '/arcade',
  label: 'Arcade',
  icon: 'gamepad',
  blurb: 'Eleven games, not puzzles',
};
const MY_GAMES: NavItem = {
  to: '/games',
  label: 'My games',
  icon: 'games',
  blurb: 'Your games, reviewed',
};
const CLASSICS: NavItem = {
  to: '/classics',
  label: 'Classic games',
  icon: 'classics',
  blurb: 'Guess the move',
};
const STUDIES: NavItem = {
  to: '/studies',
  label: 'Endgame studies',
  icon: 'studies',
  blurb: 'Find the only move',
};
const PATTERNS: NavItem = {
  to: '/patterns',
  label: 'Mating patterns',
  icon: 'patterns',
  blurb: 'The named mates',
};
const REFERENCE: NavItem = {
  to: '/reference',
  label: 'Reference',
  icon: 'reference',
  blurb: 'Rules and glossary',
};
const SETTINGS: NavItem = {
  to: '/settings',
  label: 'Settings',
  icon: 'settings',
  blurb: 'Appearance, engine, backups',
};

/**
 * Extra sections behind the desktop "More" menu, one column per group. The
 * groups carry the same names as the mobile sheet's; only the sections already
 * in the header are left out.
 */
const DESKTOP_MORE: NavGroup[] = [
  { title: 'Train', items: [STUDIES, PATTERNS] },
  { title: 'Games', items: [ARCADE, MY_GAMES, CLASSICS] },
  { title: 'Tools', items: [REFERENCE, SETTINGS] },
];

/** Mobile bottom bar. */
const MOBILE_NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/puzzles', label: 'Puzzles', icon: 'puzzles' },
  { to: '/play', label: 'Play', icon: 'play' },
];

/** Everything else, in the mobile "More" sheet. */
const MOBILE_MORE: NavGroup[] = [
  {
    title: 'Train',
    items: [
      { to: '/drills', label: 'Drills', icon: 'drills', blurb: 'Vision and endgames' },
      { to: '/openings', label: 'Openings', icon: 'openings', blurb: 'Repertoire trainer' },
      STUDIES,
      PATTERNS,
    ],
  },
  { title: 'Games', items: [ARCADE, MY_GAMES, CLASSICS] },
  {
    title: 'Tools',
    items: [
      { to: '/analyze', label: 'Analyze', icon: 'analyze', blurb: 'Engine analysis board' },
      { to: '/progress', label: 'Progress', icon: 'progress', blurb: 'Stats and records' },
      REFERENCE,
      SETTINGS,
    ],
  },
];

const MORE_PATHS = new Set(
  [...DESKTOP_MORE, ...MOBILE_MORE].flatMap((group) => group.items.map((i) => i.to)),
);

/** Whether a nav link to `to` is the current section (the home link only matches exactly). */
function isSectionActive(to: string, pathname: string, end?: boolean): boolean {
  if (end) return pathname === to;
  return navSection(pathname) === to;
}

/** The mark: a rook on an open file (the lane down the middle), in the theme's accent. */
function Logo() {
  // The rook tile: the brand's Caps Tile (RFS BRAND.md) with the rook where the mark's letters
  // stand, always white, and the Ember rule beneath (scripts/icons/logo.svg draws the same).
  return (
    <svg viewBox="0 0 512 512" width="28" height="28" aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="112" fill="var(--logo-tile)" />
      <g fill="#ffffff" transform="translate(149.48 88) scale(0.85906) translate(-132 -156)">
        <path d="M176 156h36v28h22v-28h44v28h22v-28h36v64c0 8-6 14-14 14H190c-8 0-14-6-14-14z" />
        <path d="M200 246h112l12 118H188z" />
        <path d="M172 376h168c10 0 18 8 18 18v4c0 6-4 10-10 10H164c-6 0-10-4-10-10v-4c0-10 8-18 18-18z" />
        <path d="M150 420h212c10 0 18 8 18 18v6c0 6-4 10-10 10H142c-6 0-10-4-10-10v-6c0-10 8-18 18-18z" />
      </g>
      <rect x="112" y="384" width="288" height="32" rx="16" fill="var(--logo-rule)" />
    </svg>
  );
}

/** The active profile's name, shown only once a second profile exists. */
function ProfileBadge() {
  const profiles = useProfiles((s) => s.profiles);
  const activeId = useProfiles((s) => s.activeId);
  if (profiles.length < 2) return null;
  const current = activeProfile({ profiles, activeId });
  return (
    <Link
      to="/settings#profiles"
      className="shell__profile"
      title="Switch profile"
      data-testid="profile-badge"
    >
      {current.name}
    </Link>
  );
}

/** The way into quick search on every screen size; Ctrl+K (Cmd+K on a Mac) does the same. */
function SearchButton({ onOpen }: { onOpen: () => void }) {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
  const preload = () => void loadSearch().catch(() => undefined);
  return (
    <button
      type="button"
      className="shell__iconbtn"
      aria-label="Search"
      aria-keyshortcuts="Control+K Meta+K"
      title={`Search (${mac ? '⌘K' : 'Ctrl+K'})`}
      data-testid="search-button"
      onClick={onOpen}
      onPointerEnter={preload}
      onFocus={preload}
    >
      <Icon name="search" size={18} />
    </button>
  );
}

function ThemeToggle() {
  const scheme = useSettings((s) => s.colorScheme);
  const update = useSettings((s) => s.update);
  // Round in the order Settings lists them: System, Nightshift, Dayshift.
  const next = scheme === 'system' ? 'dark' : scheme === 'dark' ? 'light' : 'system';
  // The brand's name, with the plain word beside it so nobody has to guess what it is.
  const label =
    scheme === 'system'
      ? `Theme: ${SCHEME_NAMES.system}`
      : `Theme: ${SCHEME_NAMES[scheme]} (${scheme})`;
  const icon: IconName = scheme === 'system' ? 'auto' : scheme === 'light' ? 'sun' : 'moon';
  return (
    <button
      type="button"
      className="shell__iconbtn"
      onClick={() => update({ colorScheme: next })}
      aria-label={`${label}. Switch theme`}
      title={label}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

/**
 * A "More" button that discloses the extra sections: a dropdown (desktop) or a
 * bottom sheet (mobile). It is a disclosure of plain lists of links, not an
 * ARIA menu — Tab moves through the links as anywhere else. It closes on a
 * link, on Escape (focus back on the button), when focus leaves it, on an
 * outside tap and on navigation.
 */
function MoreMenu({
  groups,
  variant,
  active,
}: {
  groups: NavGroup[];
  variant: 'dropdown' | 'sheet';
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const location = useLocation();

  // Close on navigation and on an outside tap.
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || !open) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Tabbing out of the disclosure closes it. A null relatedTarget (a click on
  // something that takes no focus, the window losing focus) is left alone: the
  // outside-tap listener handles clicks, and a link's own click must still land.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget;
    if (next && ref.current && !ref.current.contains(next)) setOpen(false);
  };

  return (
    <div className={`more more--${variant}`} ref={ref} onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        className={
          variant === 'dropdown'
            ? `shell__navlink${active ? ' is-active' : ''}`
            : `shell__bottomlink${active ? ' is-active' : ''}`
        }
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {variant === 'sheet' ? (
          <span className="shell__bottomicon" aria-hidden="true">
            <Icon name="more" size={22} />
          </span>
        ) : null}
        <span>More</span>
        {variant === 'dropdown' ? <Icon name="chevron-down" size={14} /> : null}
      </button>
      {open && variant === 'sheet' ? (
        // Dims the page behind the sheet; a tap on it closes the sheet without
        // landing on whatever is underneath.
        <div className="more__scrim" aria-hidden="true" onClick={() => setOpen(false)} />
      ) : null}
      {open ? (
        <div
          className="more__menu"
          id={panelId}
          data-testid="more-menu"
          role="region"
          aria-label="More sections"
        >
          {groups.map((group) => {
            const headingId = `${panelId}-${group.title}`;
            return (
              <div
                key={group.title}
                className="more__group"
                role="group"
                aria-labelledby={headingId}
              >
                <span className="more__heading" id={headingId}>
                  {group.title}
                </span>
                <ul className="more__list" role="list">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) => `more__item${isActive ? ' is-active' : ''}`}
                        onClick={() => setOpen(false)}
                      >
                        <span className="more__icon" aria-hidden="true">
                          <Icon name={item.icon} size={20} />
                        </span>
                        <span className="more__text">
                          <span className="more__label">{item.label}</span>
                          {item.blurb ? <span className="more__blurb">{item.blurb}</span> : null}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Route changes land at their scroll position at once. The stylesheet gives the
 * page smooth scrolling for in-page links, which would otherwise turn every
 * navigation's scroll-to-top (ScrollRestoration) into a glide through the new
 * page. Rendered just before <ScrollRestoration /> so its effect runs first.
 */
function InstantRouteScroll() {
  const { key } = useLocation();
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.scrollBehavior = 'auto';
    const frame = requestAnimationFrame(() => {
      root.style.scrollBehavior = '';
    });
    return () => {
      cancelAnimationFrame(frame);
      root.style.scrollBehavior = '';
    };
  }, [key]);
  return null;
}

export function Shell() {
  useColorScheme();
  usePieceSet();
  const location = useLocation();
  const section = navSection(location.pathname);
  const inMore = MORE_PATHS.has(section);
  const shortcuts = useShortcutsDialog();
  const search = useQuickSearch();
  const mainRef = useRef<HTMLElement>(null);

  // A newcomer's first visit counts this version's news as seen (Home's "What's new").
  useEffect(() => noteFirstVisit(isReturningLearner(useProgress.getState())), []);

  // After in-app navigation, move keyboard focus (and the screen reader's
  // reading position) to the new page rather than leaving it on the old link.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  const focus = useFocus((s) => s.active);
  const liveBar = useLiveBar((s) => s.active);

  // Focus the page directly: following the fragment would rewrite the URL hash,
  // which carries shared positions and openings (/analyze#z=…).
  const skipToContent = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <div className={focus ? 'shell shell--focus' : 'shell'} data-focus={focus || undefined}>
      <InstantRouteScroll />
      <ScrollRestoration />
      <PlatformHooks />
      <a className="skip-link" href="#main" onClick={skipToContent}>
        Skip to content
      </a>
      <header className="shell__header">
        <div className="container shell__header-inner">
          <NavLink to="/" className="shell__brand" aria-label={`${siteConfig.name} home`}>
            <Logo />
            <span>{siteConfig.name}</span>
          </NavLink>
          <nav className="shell__nav" aria-label="Primary">
            {DESKTOP_NAV.map((item) => {
              const active = isSectionActive(item.to, location.pathname, item.end);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`shell__navlink${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <MoreMenu
              groups={DESKTOP_MORE}
              variant="dropdown"
              active={DESKTOP_MORE.some((g) => g.items.some((i) => i.to === section))}
            />
          </nav>
          <div className="shell__actions">
            <div className="shell__install">
              <InstallButton size="sm" variant="ghost" />
            </div>
            <ProfileBadge />
            <SearchButton onOpen={search.show} />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {liveBar ? (
        <Suspense fallback={null}>
          <LiveBar />
        </Suspense>
      ) : null}

      <main id="main" className="shell__main container" tabIndex={-1} ref={mainRef}>
        {/* A page that crashes takes only the page with it: the header and the
            navigation stay, and the next route starts afresh. */}
        <ErrorBoundary resetKey={location.pathname} inline>
          <Suspense
            fallback={
              <div className="shell__loading">
                <Spinner label="Loading…" />
              </div>
            }
          >
            <Outlet key={location.pathname.split('/')[1]} />
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="shell__footer">
        <div className="container shell__footer-inner">
          {/* The licence texts are copied into the build by scripts/postbuild.mjs. */}
          <span>
            {/* A no-break space keeps each dot at the end of a line, never at the start. */}
            {siteConfig.name} v{__APP_VERSION__} · Free and open source (GPL-3.0-or-later)
            {'\u00a0· '}
            <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
            {'\u00a0· '}
            <a href={`${import.meta.env.BASE_URL}licence.txt`} target="_blank" rel="noreferrer">
              Licence
            </a>
            {'\u00a0· '}
            <a href={`${import.meta.env.BASE_URL}notices.txt`} target="_blank" rel="noreferrer">
              Third-party notices
            </a>
          </span>
          <span className="faint" data-testid="credits">
            Engine: Stockfish (GPL-3.0) · Human-like opponent: Maia-3 (
            <a
              href={`${import.meta.env.BASE_URL}licence-agpl.txt`}
              target="_blank"
              rel="noreferrer"
            >
              AGPL-3.0
            </a>
            ) · Board: Chessground (GPL-3.0) ·{' '}
            <Suspense fallback={CLASSIC_CREDIT}>
              <PieceCredit />
            </Suspense>{' '}
            · Puzzles and openings: Lichess (CC0) · Type: IBM Plex (
            <a href={`${import.meta.env.BASE_URL}licence-ofl.txt`} target="_blank" rel="noreferrer">
              OFL-1.1
            </a>
            ) · Runs entirely in your browser
            {/* Touch screens have no keyboard to take shortcuts from. */}
            <span className="keyboard-only">
              {'\u00a0· '}
              <button type="button" className="linklike" onClick={() => shortcuts.setOpen(true)}>
                Keyboard shortcuts
              </button>
            </span>
          </span>
        </div>
      </footer>
      <ShortcutsDialog open={shortcuts.open} onClose={() => shortcuts.setOpen(false)} />
      {search.mounted ? (
        <Suspense fallback={null}>
          <SearchDialog open={search.open} onClose={search.close} />
        </Suspense>
      ) : null}

      <nav className="shell__bottomnav" aria-label="Primary (mobile)">
        {MOBILE_NAV.map((item) => {
          const active = isSectionActive(item.to, location.pathname, item.end);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`shell__bottomlink${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="shell__bottomicon" aria-hidden="true">
                <Icon name={item.icon} size={22} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <MoreMenu groups={MOBILE_MORE} variant="sheet" active={inMore} />
      </nav>

      <Toasts />
      {import.meta.env.PROD ? <UpdatePrompt /> : null}
    </div>
  );
}
