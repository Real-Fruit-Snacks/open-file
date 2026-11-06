import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import { Button, Dialog, Icon } from '@/components/ui';
import { openQuickSearch } from '@/features/search/quickSearch';
import { readSeenVersion, SEEN_VERSION_KEY, writeSeenVersion } from './seenVersion';
import {
  CHANGELOG_URL,
  type Highlight,
  type Release,
  RELEASES,
  releaseDate,
  releasesUpTo,
  unseenRelease,
  versionLabel,
} from './releases';
import './whats-new.css';

/** How many of a release's highlights the card shows before "Show all". */
const FIRST_SHOWN = 4;

/** One highlight: its icon, its name and a sentence, leading to where the feature is. */
function HighlightItem({ highlight, onFollow }: { highlight: Highlight; onFollow?: () => void }) {
  const body = (
    <>
      <span className="whatsnew__icon" aria-hidden="true">
        <Icon name={highlight.icon} size={20} />
      </span>
      <span className="whatsnew__text">
        <span className="whatsnew__title">{highlight.title}</span>
        <span className="whatsnew__line">{highlight.text}</span>
      </span>
    </>
  );
  if (highlight.opensSearch) {
    return (
      <button
        type="button"
        className="whatsnew__item"
        onClick={() => {
          onFollow?.();
          openQuickSearch();
        }}
      >
        {body}
      </button>
    );
  }
  return (
    <Link to={highlight.to} className="whatsnew__item" onClick={onFollow}>
      {body}
    </Link>
  );
}

/**
 * The recent releases' highlights, newest first, and the way to the full changelog: Settings →
 * App's "What's new", and the card's "Earlier releases". Mounted only while open.
 */
export function WhatsNewDialog({
  onClose,
  version = __APP_VERSION__,
  releases = RELEASES,
}: {
  onClose: () => void;
  /** The running version (tests give their own). */
  version?: string;
  releases?: readonly Release[];
}) {
  const shown = releasesUpTo(version, releases);
  const id = useId();
  return (
    <Dialog
      open
      onClose={onClose}
      title="What’s new"
      actions={(close) => (
        <>
          <a className="btn btn--secondary" href={CHANGELOG_URL} target="_blank" rel="noreferrer">
            Full changelog
          </a>
          <Button variant="primary" onClick={close}>
            Close
          </Button>
        </>
      )}
    >
      <div className="whatsnew__releases" data-testid="whats-new-releases">
        {shown.map((release) => {
          const headingId = `${id}-${release.version}`;
          return (
            <section key={release.version} aria-labelledby={headingId}>
              <h3 className="whatsnew__release" id={headingId}>
                {versionLabel(release.version)}
                <span className="whatsnew__date"> · {releaseDate(release)}</span>
              </h3>
              <ul className="whatsnew__list whatsnew__list--single" role="list">
                {release.highlights.map((highlight) => (
                  <li key={highlight.title}>
                    <HighlightItem highlight={highlight} onFollow={onClose} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Dialog>
  );
}

/**
 * Home's news for a returning learner: the highlights of the newest release they have not seen,
 * until they dismiss it; then nothing until the next release. A first visit counts the version
 * as seen instead — a newcomer gets the introduction, not news. The version seen is kept on the
 * device (the shell records a first visit too, whichever page it starts on).
 */
export function WhatsNewCard({
  returning,
  version: current = __APP_VERSION__,
  releases = RELEASES,
}: {
  returning: boolean;
  /** The running version (tests give their own). */
  version?: string;
  releases?: readonly Release[];
}) {
  const [seen, setSeen] = useState(() => readSeenVersion());
  const [expanded, setExpanded] = useState(false);
  const [releasesOpen, setReleasesOpen] = useState(false);
  const titleId = useId();
  const listId = useId();

  useEffect(() => {
    if (seen !== null || returning) return;
    writeSeenVersion(current);
    setSeen(current);
  }, [seen, returning, current]);

  // Dismissed in another tab: gone from this one too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SEEN_VERSION_KEY) setSeen(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const release = returning ? unseenRelease(current, seen, releases) : null;
  if (!release) return null;

  const label = versionLabel(release.version);
  const count = release.highlights.length;
  const shown = expanded ? release.highlights : release.highlights.slice(0, FIRST_SHOWN);
  const dismiss = () => {
    writeSeenVersion(current);
    // The button goes with the card: the page keeps the focus rather than losing it.
    document.getElementById('main')?.focus({ preventScroll: true });
    setSeen(current);
  };

  return (
    <section className="whatsnew card" aria-labelledby={titleId} data-testid="whats-new">
      <div className="whatsnew__head">
        <span className="whatsnew__badge" aria-hidden="true">
          <Icon name="sparkle" size={22} />
        </span>
        <div className="whatsnew__heading">
          <h2 id={titleId}>What’s new in {label}</h2>
          <p className="small muted">Released {releaseDate(release)}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={dismiss}
          aria-label={`Dismiss what’s new in ${label}`}
          data-testid="whats-new-dismiss"
        >
          Dismiss
        </Button>
      </div>
      <ul className="whatsnew__list" id={listId} role="list">
        {shown.map((highlight) => (
          <li key={highlight.title}>
            <HighlightItem highlight={highlight} />
          </li>
        ))}
      </ul>
      <div className="whatsnew__foot">
        {count > FIRST_SHOWN ? (
          <Button
            size="sm"
            variant="ghost"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? 'Show fewer' : `Show all ${count}`}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => setReleasesOpen(true)}>
          Earlier releases
        </Button>
      </div>
      {releasesOpen ? (
        <WhatsNewDialog
          onClose={() => setReleasesOpen(false)}
          version={current}
          releases={releases}
        />
      ) : null}
    </section>
  );
}
