import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRepertoire } from '@/store/repertoire';
import SearchDialog from './SearchDialog';
import type { SearchEntry, SearchSource } from './searchIndex';

// jsdom has no modal dialogs and no scrolling: enough of both for the dialog to run.
vi.hoisted(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  Element.prototype.scrollIntoView = () => undefined;
});

const lesson = (id: string, title: string, detail?: string): SearchEntry => ({
  key: `lesson:${id}`,
  kind: 'lesson',
  title,
  detail,
  icon: 'learn',
  to: `/learn/${id}`,
});

const LESSONS: SearchEntry[] = [
  lesson('zebra-one', 'Zebra openings', 'First of the zebras'),
  lesson('zebra-two', 'Zebra endgames', 'Second of the zebras'),
  lesson('zebra-three', 'Zebra tactics', 'Third of the zebras'),
];

const instant: SearchSource[] = [{ id: 'lessons', load: () => Promise.resolve(LESSONS) }];

/** The address, as the dialog leaves it. */
function Where() {
  const { pathname, search, hash } = useLocation();
  return <output data-testid="where">{pathname + search + hash}</output>;
}

/** The dialog with an opener, as the shell has it. */
function Harness({
  sources,
  onClose,
  startOpen = true,
}: {
  sources: readonly SearchSource[];
  onClose: () => void;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open search
      </button>
      <SearchDialog
        open={open}
        sources={sources}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      />
      <Where />
    </>
  );
}

function renderSearch(
  options: { sources?: readonly SearchSource[]; startOpen?: boolean; path?: string } = {},
) {
  const onClose = vi.fn();
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <Harness
            sources={options.sources ?? instant}
            onClose={onClose}
            startOpen={options.startOpen}
          />
        ),
      },
    ],
    { initialEntries: [options.path ?? '/'] },
  );
  render(<RouterProvider router={router} />);
  return { onClose, router };
}

const field = () => screen.getByRole('combobox', { name: 'Search the app' });
const optionNames = () => screen.getAllByRole('option').map((o) => o.getAttribute('aria-label'));
const activeOption = () => {
  const id = field().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
};
const type = (text: string) => fireEvent.change(field(), { target: { value: text } });
const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(field(), { key, ...init });

describe('SearchDialog', () => {
  beforeEach(() => {
    useRepertoire.setState({ custom: [] });
  });

  it('opens on the field, a combobox over the places to go', async () => {
    renderSearch();
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    expect(field()).toHaveFocus();
    const listbox = screen.getByRole('listbox', { name: 'Places to go' });
    expect(field()).toHaveAttribute('aria-controls', listbox.id);
    expect(field()).toHaveAttribute('aria-expanded', 'true');
    expect(field()).toHaveAttribute('aria-autocomplete', 'list');
    expect(within(listbox).getByRole('group', { name: 'Go to' })).toBeInTheDocument();
    expect(optionNames().slice(0, 3)).toEqual([
      'Learn, Lessons and courses, Page',
      'Puzzles, Tactics from real games, Page',
      'Drills, Vision and endgames, Page',
    ]);
    // The first place is the one Enter opens.
    expect(activeOption()).toHaveAccessibleName('Learn, Lessons and courses, Page');
    expect(activeOption()).toHaveAttribute('aria-selected', 'true');
    await screen.findByRole('dialog');
  });

  it('finds as you type, groups by kind and says how many once typing pauses', async () => {
    renderSearch();
    type('zebra');
    await waitFor(() =>
      expect(optionNames()).toContain('Zebra openings, First of the zebras, Lesson'),
    );
    const group = screen.getByRole('group', { name: 'Lessons' });
    expect(within(group).getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('listbox', { name: 'Results' })).toBeInTheDocument();
    // The words found are marked in the title.
    expect(within(group).getAllByRole('option')[0]?.querySelector('mark')).toHaveTextContent(
      'Zebra',
    );
    expect(screen.getByTestId('search-count')).toHaveTextContent('3 results');
    const status = within(screen.getByRole('dialog')).getByRole('status');
    // The live region waits for typing to pause.
    expect(status).toHaveTextContent('');
    await waitFor(() => expect(status).toHaveTextContent('3 results'));
  });

  it('moves with the arrows, round the ends, and opens the result with Enter', async () => {
    const { onClose } = renderSearch();
    type('zebra');
    await waitFor(() => expect(optionNames()).toHaveLength(3));
    // Equal matches: the shorter title first.
    expect(optionNames()).toEqual([
      'Zebra tactics, Third of the zebras, Lesson',
      'Zebra endgames, Second of the zebras, Lesson',
      'Zebra openings, First of the zebras, Lesson',
    ]);
    expect(activeOption()).toHaveAccessibleName('Zebra tactics, Third of the zebras, Lesson');
    press('ArrowDown');
    expect(activeOption()).toHaveAccessibleName('Zebra endgames, Second of the zebras, Lesson');
    expect(activeOption()).toHaveAttribute('aria-selected', 'true');
    press('ArrowDown');
    press('ArrowDown');
    // Past the last, back to the first; and up from the first, the last.
    expect(activeOption()).toHaveAccessibleName('Zebra tactics, Third of the zebras, Lesson');
    press('ArrowUp');
    expect(activeOption()).toHaveAccessibleName('Zebra openings, First of the zebras, Lesson');
    expect(screen.getAllByRole('option', { selected: true })).toHaveLength(1);
    press('Enter');
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/learn/zebra-one'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('quick-search')).not.toHaveAttribute('open');
  });

  it('starts each new query at its best result', async () => {
    renderSearch();
    type('zebra');
    await waitFor(() => expect(optionNames()).toHaveLength(3));
    press('ArrowDown');
    press('ArrowDown');
    expect(activeOption()).toHaveAccessibleName('Zebra openings, First of the zebras, Lesson');
    type('zebr');
    expect(activeOption()).toHaveAccessibleName('Zebra tactics, Third of the zebras, Lesson');
  });

  it('opens a result that is clicked, and the pointer chooses as it moves', async () => {
    const { onClose } = renderSearch();
    type('zebra');
    await waitFor(() => expect(optionNames()).toHaveLength(3));
    const tactics = screen.getByRole('option', {
      name: 'Zebra tactics, Third of the zebras, Lesson',
    });
    fireEvent.pointerMove(tactics, { clientX: 10, clientY: 20 });
    expect(activeOption()).toBe(tactics);
    fireEvent.click(tactics);
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent('/learn/zebra-three'),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes with its button or the shortcut again, giving the focus back', async () => {
    const { onClose } = renderSearch({ startOpen: false });
    const opener = screen.getByRole('button', { name: 'Open search' });
    opener.focus();
    fireEvent.click(opener);
    await waitFor(() => expect(field()).toHaveFocus());
    press('k', { ctrlKey: true });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();

    fireEvent.click(opener);
    await waitFor(() => expect(field()).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(opener).toHaveFocus();
    // Nothing navigated.
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/);
  });

  it('keeps the last search, selected, for the next time it opens', async () => {
    renderSearch({ startOpen: false });
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }));
    type('zebra');
    press('k', { metaKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }));
    await waitFor(() => expect(field()).toHaveFocus());
    expect(field()).toHaveValue('zebra');
    const input = field() as HTMLInputElement;
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 5]);
  });

  it('loads its lists once, when it first opens, and shows them as they arrive', async () => {
    let resolve: (entries: SearchEntry[]) => void = () => undefined;
    const load = vi.fn(
      () =>
        new Promise<SearchEntry[]>((done) => {
          resolve = done;
        }),
    );
    renderSearch({ sources: [{ id: 'slow', load }], startOpen: false });
    expect(load).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }));
    expect(load).toHaveBeenCalledTimes(1);

    type('zebra');
    expect(screen.getByText('Searching…', { selector: 'p' })).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    await act(async () => {
      resolve(LESSONS);
      await Promise.resolve();
    });
    await waitFor(() => expect(optionNames()).toHaveLength(3));

    press('Escape');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('searches without a list that could not load', async () => {
    renderSearch({
      sources: [{ id: 'broken', load: () => Promise.reject(new Error('offline')) }, ...instant],
    });
    type('zebra');
    await waitFor(() => expect(optionNames()).toHaveLength(3));
  });

  it('says when nothing matches', async () => {
    renderSearch();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await act(async () => {
      await Promise.resolve();
    });
    type('xyzzy');
    expect(await screen.findByText('Nothing found for “xyzzy”')).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(field()).not.toHaveAttribute('aria-activedescendant');
    // The list says it; the foot counts nothing, and a screen reader hears it.
    expect(screen.getByTestId('search-count')).toBeEmptyDOMElement();
    await waitFor(() =>
      expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent(
        'No results for “xyzzy”',
      ),
    );
    press('Enter');
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/);
  });

  it('finds the learner’s own repertoires', async () => {
    useRepertoire.setState({
      custom: [{ id: 'custom-7', name: 'Zebra Gambit', color: 'black', pgn: '', createdAt: 1 }],
    });
    renderSearch();
    type('zebra gambit');
    await waitFor(() =>
      expect(optionNames()[0]).toBe('Zebra Gambit, Your repertoire · Black, Opening'),
    );
    expect(screen.getByText('Your repertoire · Black')).toBeInTheDocument();
    press('Enter');
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent('/openings/custom-7'),
    );
  });

  it('tells the shell it closed at once, not when the browser’s close event comes', async () => {
    // A browser fires "close" a task after close(), later still while a page opened from a result
    // is arriving: a shortcut pressed in between must find the search closed, and open it again.
    const syncClose = HTMLDialogElement.prototype.close;
    const late: (() => void)[] = [];
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      late.push(() => this.dispatchEvent(new Event('close')));
    };
    const fireLateEvents = () =>
      act(() => {
        for (const fire of late.splice(0)) fire();
      });
    try {
      const { onClose } = renderSearch();
      const dialog = screen.getByTestId('quick-search');
      type('zebra');
      await waitFor(() => expect(optionNames()).toHaveLength(3));
      press('Enter');
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(dialog).not.toHaveAttribute('open');

      // Opened again before that event: it closes nothing, and counts for nothing.
      fireEvent.click(screen.getByRole('button', { name: 'Open search' }));
      await waitFor(() => expect(dialog).toHaveAttribute('open'));
      fireLateEvents();
      expect(dialog).toHaveAttribute('open');
      expect(onClose).toHaveBeenCalledTimes(1);

      // Closed by the browser itself (Esc): its event tells the shell, once.
      act(() => {
        (dialog as HTMLDialogElement).close();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      fireLateEvents();
      expect(onClose).toHaveBeenCalledTimes(2);
      fireEvent.click(screen.getByRole('button', { name: 'Open search' }));
      await waitFor(() => expect(dialog).toHaveAttribute('open'));
    } finally {
      HTMLDialogElement.prototype.close = syncClose;
    }
  });

  it('closes on the browser’s back button, but not for a page still arriving', async () => {
    const { router, onClose } = renderSearch();
    await waitFor(() => expect(field()).toHaveFocus());
    // A link followed before the search was opened, its page arriving late: the search stays.
    await act(() => router.navigate('/learn'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('quick-search')).toHaveAttribute('open');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
