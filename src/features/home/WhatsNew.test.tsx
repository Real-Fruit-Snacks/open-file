import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readSeenVersion, SEEN_VERSION_KEY, writeSeenVersion } from './seenVersion';
import { WhatsNewCard, WhatsNewDialog } from './WhatsNew';
import { CHANGELOG_URL, type Highlight, type Release } from './releases';

vi.hoisted(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

const openQuickSearch = vi.hoisted(() => vi.fn());
vi.mock('@/features/search/quickSearch', () => ({ openQuickSearch }));

const item = (title: string, to?: string): Highlight => ({
  icon: 'star',
  title,
  text: `${title}, in a sentence.`,
  ...(to ? { to } : { opensSearch: true as const }),
});

const RELEASES: Release[] = [
  {
    version: '0.31.0',
    date: '2026-12-01',
    highlights: [item('From the future', '/learn')],
  },
  {
    version: '0.30.0',
    date: '2026-11-02',
    highlights: [
      item('Premoves', '/play'),
      item('Watch a game', '/play'),
      item('Gap finder', '/openings'),
      item('Human moves', '/analyze'),
      item('Fix your mistakes', '/analyze'),
      item('Quick search'),
    ],
  },
  {
    version: '0.29.0',
    date: '2026-10-11',
    highlights: [item('Puzzle race', '/play?play=race')],
  },
];

function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}

function renderCard(returning = true, version = '0.30.0') {
  return render(
    <MemoryRouter>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <WhatsNewCard returning={returning} version={version} releases={RELEASES} />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

const card = () => screen.queryByTestId('whats-new');

describe('WhatsNewCard', () => {
  beforeEach(() => {
    localStorage.clear();
    openQuickSearch.mockClear();
  });

  it('tells a learner from before the card about the newest release', () => {
    renderCard();
    expect(screen.getByRole('heading', { level: 2, name: 'What’s new in 0.30' })).toBeVisible();
    expect(screen.getByText('Released 2 Nov 2026')).toBeInTheDocument();
    // Nothing is recorded until it is dismissed.
    expect(readSeenVersion()).toBeNull();
    // A release after the running version is never told of.
    expect(card()).not.toHaveTextContent('From the future');
  });

  it('shows four highlights, and all of them on request', () => {
    renderCard();
    const list = within(card() as HTMLElement).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    const more = screen.getByRole('button', { name: 'Show all 6' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveAttribute('aria-controls', list.id);
    fireEvent.click(more);
    expect(within(list).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('leads each highlight to its feature', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Show all 6' }));
    expect(screen.getByRole('link', { name: /^Gap finder/ })).toHaveAttribute('href', '/openings');
    // Quick search lives in the header: its highlight opens it.
    fireEvent.click(screen.getByRole('button', { name: /^Quick search/ }));
    expect(openQuickSearch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('link', { name: /^Premoves/ }));
    expect(screen.getByTestId('where')).toHaveTextContent('/play');
  });

  it('goes for good when dismissed, until the next release', () => {
    const { unmount } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss what’s new in 0.30' }));
    expect(card()).toBeNull();
    expect(readSeenVersion()).toBe('0.30.0');
    unmount();
    renderCard();
    expect(card()).toBeNull();
  });

  it('comes back for a newer release', () => {
    writeSeenVersion('0.29.0');
    renderCard();
    expect(screen.getByRole('heading', { name: 'What’s new in 0.30' })).toBeInTheDocument();
  });

  it('is not news on a first visit: the version counts as seen', () => {
    renderCard(false);
    expect(card()).toBeNull();
    expect(readSeenVersion()).toBe('0.30.0');
  });

  it('shows nothing to a newcomer, even with a version recorded', () => {
    writeSeenVersion('0.29.0');
    renderCard(false);
    expect(card()).toBeNull();
    expect(readSeenVersion()).toBe('0.29.0');
  });

  it('goes when it is dismissed in another tab', () => {
    renderCard();
    expect(card()).not.toBeNull();
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: SEEN_VERSION_KEY, newValue: '0.30.0' }),
      );
    });
    expect(card()).toBeNull();
  });

  it('opens the earlier releases', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Earlier releases' }));
    const dialog = screen.getByRole('dialog', { name: 'What’s new' });
    expect(
      within(dialog)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['0.30 · 2 Nov 2026', '0.29 · 11 Oct 2026']);
  });
});

describe('WhatsNewDialog', () => {
  function renderDialog(onClose = vi.fn()) {
    render(
      <MemoryRouter>
        <WhatsNewDialog onClose={onClose} version="0.30.0" releases={RELEASES} />
        <Where />
      </MemoryRouter>,
    );
    return onClose;
  }

  it('lists the releases up to this one, newest first, with the full changelog', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'What’s new' });
    const sections = within(dialog).getAllByRole('region');
    expect(sections.map((s) => s.getAttribute('aria-labelledby') !== null)).toEqual([true, true]);
    expect(within(sections[0] as HTMLElement).getAllByRole('listitem')).toHaveLength(6);
    expect(within(sections[1] as HTMLElement).getByRole('link')).toHaveAttribute(
      'href',
      '/play?play=race',
    );
    const changelog = within(dialog).getByRole('link', { name: 'Full changelog' });
    expect(changelog).toHaveAttribute('href', CHANGELOG_URL);
    expect(changelog).toHaveAttribute('target', '_blank');
  });

  it('closes with its buttons', () => {
    const onClose = renderDialog();
    // The one at the foot, and the one pinned to the title row (last in the document).
    const [foot, corner] = screen.getAllByRole('button', { name: 'Close' });
    expect(foot).toHaveClass('btn--primary');
    expect(corner).toHaveClass('dialog__close');
    fireEvent.click(foot as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('follows a highlight to its page and closes', () => {
    const onClose = renderDialog();
    fireEvent.click(screen.getByRole('link', { name: /^Puzzle race/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('where')).toHaveTextContent('/play?play=race');
  });
});
