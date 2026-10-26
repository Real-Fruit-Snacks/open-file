import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { useToasts } from '@/components/ui/toastStore';
import type { ImportedGame } from '@/lib/gameImport';
import type * as SoundModule from '@/lib/sound';
import { deviceSyncStorageKey } from '@/lib/sync/enabled';
import type * as IsolationModule from '@/sw/isolation';
import { useAnalyses } from '@/store/analyses';
import backupV6 from '@/store/fixtures/backup-v6.json';
import { useGames } from '@/store/games';
import { PRE_IMPORT_BACKUP_KEY, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { installFakeRelay } from '@/test/fakeRelay';

// jsdom has neither matchMedia (read when the install store is created) nor
// the dialog and scrolling APIs the page uses.
vi.hoisted(() => {
  window.matchMedia = () =>
    ({ matches: false, addEventListener: () => undefined }) as unknown as MediaQueryList;
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
  Element.prototype.scrollIntoView = vi.fn();
});

const played = vi.hoisted(() => vi.fn());
vi.mock('@/lib/sound', async (importOriginal) => {
  const actual = await importOriginal<typeof SoundModule>();
  return { ...actual, playSound: played };
});
const writeFlag = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));
const resetFlag = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));
vi.mock('@/sw/isolation', async (importOriginal) => {
  const actual = await importOriginal<typeof IsolationModule>();
  return { ...actual, writeIsolationFlag: writeFlag, resetIsolationFlag: resetFlag };
});

const importedGame = (n: string): ImportedGame => ({
  id: n,
  pgn: `1. e4 e5 ${n}`,
  white: 'a',
  black: 'b',
  result: '*',
  date: '',
  event: '',
  url: null,
  plies: 2,
  speed: null,
  rated: null,
  timestamp: 1,
});

import SettingsPage from './SettingsPage';

/** The address, as the page leaves it. */
function Where() {
  const { pathname, hash } = useLocation();
  return <output data-testid="where">{pathname + hash}</output>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsPage />
      <Where />
    </MemoryRouter>,
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });
const headings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettings.getState().reset();
    useProgress.getState().resetAll();
    useToasts.setState({ toasts: [] });
    writeFlag.mockClear();
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
  });

  it('puts the settings in tabs, each card on its own tab', () => {
    renderAt('/settings');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Settings');
    expect(document.title).toMatch(/^Settings · /);
    const tabs = screen.getByRole('tablist', { name: 'Settings sections' });
    expect(
      within(tabs)
        .getAllByRole('tab')
        .map((t) => t.textContent),
    ).toEqual(['Appearance', 'Play', 'Engine', 'Sync & data', 'App']);
    // The first tab is open, and its panel is the one shown.
    expect(tab('Appearance')).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tab('Appearance').id);
    expect(tab('Appearance')).toHaveAttribute('aria-controls', panel.id);
    expect(headings()).toEqual(['Board', 'Display', 'Sound & vibration']);

    fireEvent.click(tab('Play'));
    expect(headings()).toEqual(['Play', 'Puzzle rating', 'Human-like opponent']);
    fireEvent.click(tab('Engine'));
    expect(headings()).toEqual(['Engine & analysis']);
    fireEvent.click(tab('Sync & data'));
    expect(headings()).toEqual([
      'Sync between devices',
      'Backups',
      'Storage',
      'Lichess account',
      'Profiles',
    ]);
    fireEvent.click(tab('App'));
    expect(headings()).toEqual(['App', 'Notifications']);
    expect(tab('App')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Appearance')).toHaveAttribute('aria-selected', 'false');
  });

  it('names the open tab in the address, and opens the tab an address names', () => {
    renderAt('/settings#engine');
    expect(tab('Engine')).toHaveAttribute('aria-selected', 'true');
    // A tab is not a card: nothing scrolls.
    expect(vi.mocked(Element.prototype.scrollIntoView)).not.toHaveBeenCalled();
    fireEvent.click(tab('Sync & data'));
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/settings#data$/);
    // The first tab needs no name: the address goes back to plain /settings.
    fireEvent.click(tab('Appearance'));
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/settings$/);
  });

  it('moves between the tabs with the arrow keys, Home and End', () => {
    renderAt('/settings');
    const tabs = screen.getByRole('tablist');
    // One tab stop: the open tab.
    expect(tab('Appearance')).toHaveAttribute('tabindex', '0');
    expect(tab('Play')).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(tabs, { key: 'ArrowRight' });
    expect(tab('Play')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Play')).toHaveFocus();
    fireEvent.keyDown(tabs, { key: 'End' });
    expect(tab('App')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tabs, { key: 'ArrowRight' });
    expect(tab('Appearance')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tabs, { key: 'ArrowLeft' });
    expect(tab('App')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tabs, { key: 'Home' });
    expect(tab('Appearance')).toHaveAttribute('aria-selected', 'true');
    expect(headings()).toContain('Board');
  });

  it('changes a setting from its switch', () => {
    renderAt('/settings');
    const dots = screen.getByRole('switch', { name: 'Show legal move dots' });
    expect(dots).toBeChecked();
    fireEvent.click(dots);
    expect(useSettings.getState().showLegalMoves).toBe(false);
    expect(dots).not.toBeChecked();
  });

  it('offers three sound themes and a volume slider, each previewed with a move', () => {
    vi.useFakeTimers();
    try {
      renderAt('/settings');
      const themes = screen.getByRole('radiogroup', { name: 'Sound theme' });
      expect(
        within(themes)
          .getAllByRole('radio')
          .map((b) => b.textContent),
      ).toEqual(['Standard', 'Soft', 'Retro']);
      fireEvent.click(within(themes).getByRole('radio', { name: 'Retro' }));
      expect(useSettings.getState().soundTheme).toBe('retro');
      expect(within(themes).getByRole('radio', { name: 'Retro' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(played).toHaveBeenCalledTimes(1);

      const slider = screen.getByRole('slider', { name: 'Volume' });
      expect(slider).toHaveValue('100');
      fireEvent.change(slider, { target: { value: '25' } });
      expect(useSettings.getState().soundVolume).toBeCloseTo(0.25, 5);
      expect(slider).toHaveAttribute('aria-valuetext', '25%');
      vi.advanceTimersByTime(200);
      expect(played).toHaveBeenCalledTimes(2);
      expect(played).toHaveBeenLastCalledWith('move');

      // The slider belongs to the sounds switch; the theme picker stays while
      // vibration is on, because it also picks the vibration patterns.
      Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), configurable: true });
      fireEvent.click(screen.getByRole('switch', { name: /^Sound effects/ }));
      expect(screen.queryByRole('slider', { name: 'Volume' })).not.toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: 'Sound theme' })).toBeInTheDocument();
      expect(screen.getByText(/Also picks the vibration patterns/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('switch', { name: /^Vibration/ }));
      expect(screen.queryByRole('radiogroup', { name: 'Sound theme' })).not.toBeInTheDocument();
    } finally {
      Reflect.deleteProperty(navigator, 'vibrate');
      useSettings.getState().update({ sounds: true, haptics: true });
      vi.useRealTimers();
    }
  });

  it('drops the sound theme with the sounds where the browser cannot vibrate', () => {
    expect('vibrate' in navigator).toBe(false);
    renderAt('/settings');
    expect(screen.getByRole('radiogroup', { name: 'Sound theme' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: /^Sound effects/ }));
    expect(useSettings.getState().haptics).toBe(true);
    expect(screen.queryByRole('radiogroup', { name: 'Sound theme' })).not.toBeInTheDocument();
    useSettings.getState().update({ sounds: true });
  });

  it('offers the board and display preferences and keeps them', () => {
    renderAt('/settings');
    // The colour schemes go by the brand's names, with a line that says which is which;
    // notation shows a sample in the chosen style.
    const schemes = screen.getByRole('radiogroup', { name: 'Colour scheme' });
    expect(
      within(schemes)
        .getAllByRole('radio')
        .map((b) => b.textContent),
    ).toEqual(['System', 'Nightshift', 'Dayshift']);
    expect(
      screen.getByText('Nightshift is dark, Dayshift is light. System follows your device.'),
    ).toBeInTheDocument();
    fireEvent.click(within(schemes).getByRole('radio', { name: 'Nightshift' }));
    expect(useSettings.getState().colorScheme).toBe('dark');
    fireEvent.click(within(schemes).getByRole('radio', { name: 'Dayshift' }));
    expect(useSettings.getState().colorScheme).toBe('light');
    expect(within(schemes).getByRole('radio', { name: 'Dayshift' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    const sample = screen.getByTestId('notation-sample');
    expect(sample.querySelectorAll('piece')).toHaveLength(4);
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Move notation' })).getByRole('radio', {
        name: 'Letters',
      }),
    );
    expect(useSettings.getState().notation).toBe('letters');
    expect(sample.querySelectorAll('piece')).toHaveLength(0);
    expect(sample).toHaveTextContent('2. Nf3 Nc6 3. Bb5');

    // The piece-set picker shows every set and selects one, crediting its author and licence.
    const pieces = screen.getByRole('group', { name: 'Piece set' });
    expect(within(pieces).getAllByRole('button')).toHaveLength(9);
    expect(within(pieces).getByRole('button', { name: 'Classic' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(within(pieces).getByRole('button', { name: 'Merida' }));
    expect(useSettings.getState().pieceSet).toBe('merida');
    expect(
      screen.getByText(/Merida chess font\. By Armando Hernandez Marroquin/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GPL-2.0+' })).toHaveAttribute(
      'href',
      'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html',
    );

    // Every board theme: Lichess's 25 and the app's own three. A textured board's swatch shows
    // its small preview, and choosing it credits the picture's authors and licence.
    const boards = screen.getByRole('group', { name: 'Board theme' });
    expect(within(boards).getAllByRole('button')).toHaveLength(28);
    const wood = within(boards).getByRole('button', { name: 'Wood' });
    expect(wood).toHaveClass('swatch--texture');
    expect(wood.style.getPropertyValue('--sw-image')).toBe('url("/boards/thumbs/wood.jpg")');
    expect(within(boards).getByRole('button', { name: 'Brown' })).not.toHaveClass(
      'swatch--texture',
    );
    fireEvent.click(wood);
    expect(useSettings.getState().boardTheme).toBe('wood');
    expect(screen.getByText(/by the lila authors and pirouetti/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AGPL-3.0' })).toHaveAttribute(
      'href',
      '/licence-agpl.txt',
    );

    // The board switches and segmented controls.
    fireEvent.click(screen.getByRole('switch', { name: 'Highlight the last move and check' }));
    expect(useSettings.getState().boardHighlights).toBe(false);
    fireEvent.click(screen.getByRole('switch', { name: /^Magnify the dragged piece/ }));
    expect(useSettings.getState().magnifyDrag).toBe(false);
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Drag target' })).getByRole('radio', {
        name: 'None',
      }),
    );
    expect(useSettings.getState().dragTarget).toBe('none');
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Move pieces by' })).getByRole('radio', {
        name: 'Tap',
      }),
    );
    expect(useSettings.getState().moveMethod).toBe('tap');
    // In Tap mode the two drag-only controls are inert, with a hint saying why.
    expect(screen.getByTestId('drag-settings')).toBeDisabled();
    expect(screen.getByRole('switch', { name: /^Magnify the dragged piece/ })).toBeDisabled();
    expect(screen.getByText(/apply to dragging only/)).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Captured material' })).getByRole('radio', {
        name: 'Off',
      }),
    );
    expect(useSettings.getState().materialDisplay).toBe('off');
    expect(screen.getByText('Nothing beside the player bars.')).toBeInTheDocument();

    // Focus mode lives with the other play settings.
    fireEvent.click(tab('Play'));
    fireEvent.click(screen.getByRole('switch', { name: /^Focus mode/ }));
    expect(useSettings.getState().playFocus).toBe(true);

    // Single-key shortcuts can be turned off (speech input, switch devices).
    const shortcuts = screen.getByRole('switch', { name: /^Single-key shortcuts/ });
    expect(shortcuts).toBeChecked();
    fireEvent.click(shortcuts);
    expect(useSettings.getState().keyboardShortcuts).toBe(false);
  });

  it('opens the tab of the card a link points at, and scrolls to the card', () => {
    renderAt('/settings#profiles');
    expect(tab('Sync & data')).toHaveAttribute('aria-selected', 'true');
    const scroll = vi.mocked(Element.prototype.scrollIntoView);
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.instances[0]).toBe(screen.getByTestId('profiles'));
    // At once: a click right after the page opens lands where it is aimed.
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
  });

  it('keeps the sync tab open once a join link has left the address', async () => {
    installFakeRelay();
    onTestFinished(() => {
      vi.unstubAllGlobals();
    });
    renderAt('/settings#sync=legal-winner-thank');
    expect(tab('Sync & data')).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/settings$/));
    expect(tab('Sync & data')).toHaveAttribute('aria-selected', 'true');
    await waitFor(() =>
      expect(screen.getByTestId('sync-join-phrase')).toHaveValue('legal winner thank'),
    );
  });

  it('opens the tab of every card that links point at', () => {
    for (const [hash, name] of [
      ['#board', 'Appearance'],
      ['#rating', 'Play'],
      ['#lichess', 'Sync & data'],
      ['#backups', 'Sync & data'],
      ['#storage', 'Sync & data'],
      ['#unknown', 'Appearance'],
    ] as const) {
      const { unmount } = renderAt(`/settings${hash}`);
      expect(tab(name)).toHaveAttribute('aria-selected', 'true');
      unmount();
    }
  });

  it('asks before resetting, says what is kept, then clears progress, games, settings and the flag', () => {
    useProgress.getState().completeOnboarding(1800);
    useSettings.getState().update({ showCoordinates: false, engineThreads: false });
    resetFlag.mockClear();
    useGames.getState().setPlayer('me');
    useGames.getState().addGames([importedGame('a')], 'pgn');
    localStorage.setItem(PRE_IMPORT_BACKUP_KEY, '{}');
    renderAt('/settings#storage');

    fireEvent.click(screen.getByRole('button', { name: 'Reset everything' }));
    expect(screen.getByRole('heading', { name: 'Reset everything?' })).toBeInTheDocument();
    expect(screen.getByText(/imported games and settings of this profile/)).toBeInTheDocument();
    expect(screen.getByText(/Kept:/)).toHaveTextContent('the profile list');
    expect(useProgress.getState().puzzleRating).toBe(1800);

    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }));
    expect(useProgress.getState().onboarded).toBe(false);
    expect(useSettings.getState().showCoordinates).toBe(true);
    // Threads are back on, and the service worker's flag back to that default.
    expect(useSettings.getState().engineThreads).toBe(true);
    expect(useGames.getState().games).toEqual({});
    expect(useGames.getState().player).toBe('');
    expect(resetFlag).toHaveBeenCalled();
    expect(writeFlag).not.toHaveBeenCalled();
    expect(localStorage.getItem(PRE_IMPORT_BACKUP_KEY)).toBeNull();
  });

  it('resets the puzzle rating from a button with a confirmation, keeping the history', () => {
    useProgress.getState().completeOnboarding(1800);
    renderAt('/settings#rating');
    const choice = screen.getByLabelText('Start again from');
    fireEvent.change(choice, { target: { value: 'casual' } });
    // Changing the choice alone changes nothing.
    expect(useProgress.getState().puzzleRating).toBe(1800);
    fireEvent.click(screen.getByTestId('rating-reset'));
    expect(screen.getByRole('heading', { name: 'Reset your puzzle rating?' })).toBeInTheDocument();
    expect(screen.getByText(/set to about 1200/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confirm-cancel'));
    expect(useProgress.getState().puzzleRating).toBe(1800);
    fireEvent.click(screen.getByTestId('rating-reset'));
    fireEvent.click(screen.getByTestId('confirm-accept'));
    expect(useProgress.getState().puzzleRating).toBe(1200);
    expect(useProgress.getState().ratingHistory.map((p) => p.rating)).toEqual([1800, 1200]);
  });

  it('imports a backup only after a confirmation that shows what it holds, with undo', async () => {
    useProgress.getState().completeOnboarding(1800);
    useProgress.getState().recordDrill('lab-drill', 7);
    renderAt('/settings#backups');
    const input = screen.getByTestId<HTMLInputElement>('import-file');
    expect(input).toHaveAttribute('accept', '.json,application/json');

    const pick = async (content: string, name = 'backup.json') => {
      const file = new File([content], name, { type: 'application/json' });
      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
        // file.text() resolves on a later tick.
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    };

    // A PGN is told apart from a backup; nothing opens.
    await pick('[Event "x"]\n\n1. e4 e5 *', 'game.pgn');
    expect(screen.queryByRole('heading', { name: /Replace your data/ })).not.toBeInTheDocument();
    expect(useToasts.getState().toasts.some((t) => t.message.includes('looks like a PGN'))).toBe(
      true,
    );

    // A damaged backup is refused by name of the field.
    await pick(JSON.stringify({ progress: { onboarded: true, attempts: {} } }));
    expect(screen.queryByRole('heading', { name: /Replace your data/ })).not.toBeInTheDocument();
    expect(useToasts.getState().toasts.some((t) => t.message.includes('progress.attempts'))).toBe(
      true,
    );
    expect(useProgress.getState().puzzleRating).toBe(1800);

    // A good one opens the confirmation with the summary; Cancel keeps everything.
    await pick(JSON.stringify(backupV6));
    expect(screen.getByRole('heading', { name: /Replace your data/ })).toBeInTheDocument();
    expect(screen.getByTestId('import-summary')).toHaveTextContent('1 saved analysis');
    expect(screen.getByTestId('import-summary')).toHaveTextContent('1 custom repertoire');
    expect(screen.getByTestId('import-export-first')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('import-cancel'));
    expect(useProgress.getState().puzzleRating).toBe(1800);
    expect(useProgress.getState().drills['lab-drill']?.best).toBe(7);

    // Confirm replaces, and the toast offers to undo.
    await pick(JSON.stringify(backupV6));
    fireEvent.click(screen.getByTestId('import-confirm'));
    expect(useProgress.getState().puzzleRating).toBe(1212);
    expect(useProgress.getState().drills['lab-drill']).toBeUndefined();
    const undo = useToasts.getState().toasts.find((t) => t.actionLabel === 'Undo import');
    expect(undo).toBeDefined();
    undo?.onAction?.();
    expect(useProgress.getState().puzzleRating).toBe(1800);
    expect(useProgress.getState().drills['lab-drill']?.best).toBe(7);
  });

  it('does not undo an import once sync between devices is on', async () => {
    renderAt('/settings#backups');
    const file = new File([JSON.stringify(backupV6)], 'backup.json', { type: 'application/json' });
    await act(async () => {
      fireEvent.change(screen.getByTestId('import-file'), { target: { files: [file] } });
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('import-confirm'));
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(useProgress.getState().puzzleRating).toBe(1212);
    const undo = useToasts.getState().toasts.find((t) => t.actionLabel === 'Undo import');
    // Sync is turned on (here or in another tab) before the learner taps Undo.
    localStorage.setItem(
      deviceSyncStorageKey(),
      JSON.stringify({ state: { secret: 'AAAAAAAAAAAAAAAAAAAAAA' }, version: 1 }),
    );
    act(() => undo?.onAction?.());
    expect(useProgress.getState().puzzleRating).toBe(1212);
    expect(
      useToasts.getState().toasts.some((t) => t.message.includes('cannot be undone here')),
    ).toBe(true);
  });

  it('with device sync on, an import joins this device’s data, with no undo to promise', async () => {
    useProgress.getState().recordDrill('lab-drill', 7);
    installFakeRelay();
    const { stopSync, turnOnSync } = await import('@/lib/sync/deviceSync');
    expect((await turnOnSync()).ok).toBe(true);
    onTestFinished(async () => {
      await stopSync();
      vi.unstubAllGlobals();
    });
    renderAt('/settings#backups');
    const file = new File([JSON.stringify(backupV6)], 'backup.json', { type: 'application/json' });
    await act(async () => {
      fireEvent.change(screen.getByTestId('import-file'), { target: { files: [file] } });
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(
      screen.getByRole('heading', { name: 'Add this backup to your synced data?' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('import-synced')).toHaveTextContent('nothing is replaced or deleted');
    const analyses = Object.keys(useAnalyses.getState().items).length;
    act(() => {
      fireEvent.click(screen.getByTestId('import-confirm'));
    });
    // The device syncs first, then the backup joins: nothing here is replaced, the drill
    // stays, and the backup's analysis joins the library.
    await waitFor(() =>
      expect(
        useToasts.getState().toasts.some((t) => t.message.includes('joined your synced data')),
      ).toBe(true),
    );
    expect(useProgress.getState().drills['lab-drill']?.best).toBe(7);
    expect(Object.keys(useAnalyses.getState().items)).toHaveLength(analyses + 1);
    const toast = useToasts
      .getState()
      .toasts.find((t) => t.message.includes('joined your synced data'));
    // What it added, counted.
    expect(toast?.message).toMatch(/^Backup imported: .*1 analysis.* joined your synced data\.$/);
    expect(toast?.actionLabel).toBeUndefined();
  });
});
