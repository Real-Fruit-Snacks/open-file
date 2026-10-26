import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Icon, Kbd } from '@/components/ui';
import { useRepertoire } from '@/store/repertoire';
import { highlightRanges, prepareEntries, search, tokenize } from './match';
import {
  customRepertoireEntries,
  KINDS,
  MAIN_DESTINATIONS,
  SEARCH_SOURCES,
  type SearchEntry,
  type SearchSource,
  STATIC_ENTRIES,
} from './searchIndex';
import './search.css';

/** How long the result count waits for typing to pause before a screen reader hears it. */
const ANNOUNCE_DELAY_MS = 450;

interface Group {
  id: string;
  title: string;
  entries: readonly SearchEntry[];
}

/** The title with the words the query found in it marked. */
function Highlighted({ text, tokens }: { text: string; tokens: readonly string[] }) {
  const ranges = highlightRanges(text, tokens);
  if (ranges.length === 0) return <>{text}</>;
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [from, to] of ranges) {
    if (from > at) parts.push(text.slice(at, from));
    parts.push(
      <mark key={from} className="search__mark">
        {text.slice(from, to)}
      </mark>,
    );
    at = to;
  }
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

/** "12 results", "30 of 57 results", or what to say when nothing matched. */
function describeCount(shown: number, matched: number, loading: boolean, query: string): string {
  if (shown === 0) return loading ? 'Searching…' : `No results for “${query.trim()}”`;
  if (matched > shown) return `${shown} of ${matched} results`;
  return `${shown} result${shown === 1 ? '' : 's'}`;
}

/**
 * Quick search: one field that finds pages and their sections, lessons, courses, openings,
 * puzzle themes and modes, drills, games, studies, mating patterns, the reference and the
 * Settings cards. Opened with Ctrl+K / Cmd+K or the header's magnifying glass. The field is a
 * combobox over a listbox of results grouped by kind: ↑ and ↓ move through them, Enter opens
 * one, Esc closes. The lists load the first time it opens.
 */
export default function SearchDialog({
  open,
  onClose,
  sources = SEARCH_SOURCES,
}: {
  open: boolean;
  onClose: () => void;
  /** Where the lists come from (tests give their own). */
  sources?: readonly SearchSource[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const id = useId();
  const listId = `${id}-results`;
  const [query, setQuery] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<string, SearchEntry[]>>({});
  const [pending, setPending] = useState(sources.length);
  const custom = useRepertoire((s) => s.custom);
  /** Where the pointer went down: a click only dismisses when it began on the backdrop too. */
  const pressedBackdrop = useRef(false);
  /** The last pointer position over the results, to tell a real move from a scroll under it. */
  const pointer = useRef<{ x: number; y: number } | null>(null);
  /** What had the focus before it opened, to give it back when it closes. */
  const restoreTo = useRef<HTMLElement | null>(null);
  /** Whether the last closing has been seen to: the focus given back, the shell told. */
  const settled = useRef(true);

  /**
   * Gives the focus back and tells the shell, once per closing. The browser's `close` event comes
   * a task after `close()` (later still while a page opened from a result is arriving), so the
   * search reports a closing of its own at once: a Ctrl+K pressed in between must find it closed,
   * and open it again.
   */
  const settle = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    // Back where the learner was; a page opened from a result takes the focus after this.
    const back = restoreTo.current;
    restoreTo.current = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
    onClose();
  }, [onClose]);

  // The lists arrive one by one the first time the dialog opens; results grow as they come.
  const started = useRef(false);
  useEffect(() => {
    if (!open || started.current) return;
    started.current = true;
    for (const source of sources) {
      source
        .load()
        .then(
          (entries) => setLoaded((prev) => ({ ...prev, [source.id]: entries })),
          // A list that cannot load (offline before it was cached) is simply not searched.
          () => undefined,
        )
        .finally(() => setPending((n) => n - 1));
    }
  }, [open, sources]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      restoreTo.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      settled.current = false;
      el.showModal();
      // Typing replaces the last search; Enter opens its best result again.
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    if (!open && el.open) el.close();
  }, [open]);

  // The browser's back and forward buttons take the dialog with them. (Only those: a page still
  // arriving from an earlier link must not close the search opened over it.)
  useEffect(() => {
    if (!open) return;
    const onPopState = () => {
      const el = ref.current;
      if (!el?.open) return;
      el.close();
      settle();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [open, settle]);

  const { pathname } = useLocation();

  const prepared = useMemo(
    () =>
      prepareEntries([
        ...STATIC_ENTRIES,
        ...Object.values(loaded).flat(),
        ...customRepertoireEntries(custom),
      ]),
    [loaded, custom],
  );
  const tokens = useMemo(() => tokenize(query), [query]);
  const outcome = useMemo(
    () => (tokens.length > 0 ? search(prepared, query) : null),
    [prepared, query, tokens],
  );
  const groups: Group[] = outcome
    ? outcome.groups.map((group) => ({
        id: group.kind,
        title: KINDS[group.kind].group,
        entries: group.results.map((result) => result.entry),
      }))
    : [{ id: 'go', title: 'Go to', entries: MAIN_DESTINATIONS }];
  const options = groups.flatMap((group) => group.entries);
  const activeIndex = Math.max(
    0,
    options.findIndex((entry) => entry.key === activeKey),
  );
  const active = options[activeIndex];
  const optionId = (entry: SearchEntry) => `${id}-${entry.key.replace(/[^\w-]/g, '_')}`;

  const status = outcome ? describeCount(outcome.shown, outcome.matched, pending > 0, query) : '';
  // Shown in the foot only when there are results: an empty list says so itself.
  const counted = (outcome?.shown ?? 0) > 0;
  // Announced once typing pauses, not at every key.
  const [announced, setAnnounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(status), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const close = () => {
    const el = ref.current;
    if (el?.open) el.close();
    settle();
  };

  /**
   * Closes on the way to a result. A result on another page needs no focus from here: the shell
   * moves it to the new page. One on this page (another card of Settings) gives it to the page.
   */
  const leaveFor = (entry: SearchEntry) => {
    const target = entry.to.replace(/[?#].*$/, '') || '/';
    restoreTo.current = target === pathname ? document.getElementById('main') : null;
    close();
  };

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    void navigate(entry.to);
    leaveFor(entry);
  };

  const move = (step: number) => {
    if (options.length === 0) return;
    const next = options[(activeIndex + step + options.length) % options.length];
    if (!next) return;
    setActiveKey(next.key);
    document.getElementById(optionId(next))?.scrollIntoView({ block: 'nearest' });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      // The shortcut again closes it, as it opened it.
      event.preventDefault();
      close();
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Enter':
        event.preventDefault();
        go(active);
        break;
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLAnchorElement>, entry: SearchEntry) => {
    const last = pointer.current;
    pointer.current = { x: event.clientX, y: event.clientY };
    // A list scrolling under a still pointer is not the pointer choosing.
    if (last?.x === event.clientX && last.y === event.clientY) return;
    if (entry.key !== active?.key) setActiveKey(entry.key);
  };

  return (
    <dialog
      ref={ref}
      className="dialog search"
      aria-label="Search"
      data-testid="quick-search"
      onClose={(event) => {
        if (event.target !== event.currentTarget) return;
        // Closed by the browser (Esc, a phone's back gesture). A late event for a closing already
        // seen to, or for one the search has been opened again after, changes nothing.
        if (!ref.current?.open) settle();
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === ref.current;
      }}
      onClick={(event) => {
        // A drag from the results that ends on the backdrop (selecting text) is no dismissal.
        const pressed = pressedBackdrop.current;
        pressedBackdrop.current = false;
        if (pressed && event.target === ref.current) close();
      }}
    >
      <div className="search__panel" ref={panelRef}>
        <div className="search__bar">
          <Icon name="search" size={20} className="search__glass" />
          <input
            ref={inputRef}
            className="search__input"
            type="text"
            role="combobox"
            aria-label="Search the app"
            aria-autocomplete="list"
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-activedescendant={active ? optionId(active) : undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="Lessons, openings, puzzles…"
            value={query}
            onChange={(event) => {
              // A new query starts at the top of its results.
              setQuery(event.target.value);
              setActiveKey(null);
              if (panelRef.current) panelRef.current.scrollTop = 0;
            }}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="search__close" aria-label="Close" onClick={close}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="search__results">
          <div
            role="listbox"
            id={listId}
            aria-label={outcome ? 'Results' : 'Places to go'}
            hidden={options.length === 0}
          >
            {groups.map((group) => {
              const headingId = `${id}-group-${group.id}`;
              return (
                <div key={group.id} role="group" aria-labelledby={headingId}>
                  <div role="presentation" id={headingId} className="search__group">
                    {group.title}
                  </div>
                  {group.entries.map((entry) => {
                    const isActive = entry.key === active?.key;
                    return (
                      <Link
                        key={entry.key}
                        to={entry.to}
                        id={optionId(entry)}
                        role="option"
                        aria-selected={isActive}
                        // What the option shows, in its order (WCAG 2.5.3, Label in Name), then
                        // what kind of place it is.
                        aria-label={`${entry.title}${entry.detail ? `, ${entry.detail.replace(/\.$/, '')}` : ''}, ${KINDS[entry.kind].label}`}
                        tabIndex={-1}
                        className={isActive ? 'search__option is-active' : 'search__option'}
                        onClick={() => leaveFor(entry)}
                        onPointerMove={(event) => onPointerMove(event, entry)}
                      >
                        <span className="search__icon" aria-hidden="true">
                          <Icon name={entry.icon} size={18} />
                        </span>
                        <span className="search__text">
                          <span className="search__title">
                            <Highlighted text={entry.title} tokens={tokens} />
                          </span>{' '}
                          {entry.detail ? (
                            <span className="search__detail">{entry.detail}</span>
                          ) : null}
                        </span>
                        {/* The key that opens the active option, drawn by CSS: a hint beside
                            the option, not part of what it is called. */}
                        <span className="search__enter" aria-hidden="true">
                          <kbd className="kbd" data-key="Enter" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {options.length === 0 ? (
            <div className="search__empty">
              {pending > 0 ? (
                <p>Searching…</p>
              ) : (
                <>
                  <p className="search__empty-title">Nothing found for “{query.trim()}”</p>
                  <p>Try fewer words, or the start of a word: “sicil”, “fork”, “backup”.</p>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* The count, for a screen reader: in the document even while the foot is hidden. */}
        <span className="sr-only" role="status">
          {announced}
        </span>
        <div className={counted ? 'search__foot' : 'search__foot search__foot--quiet'}>
          <span className="search__keys keyboard-only">
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move · <Kbd>Enter</Kbd> to open · <Kbd>Esc</Kbd> to close
          </span>
          <span className="search__count" aria-hidden="true" data-testid="search-count">
            {counted ? status : null}
          </span>
        </div>
      </div>
    </dialog>
  );
}
