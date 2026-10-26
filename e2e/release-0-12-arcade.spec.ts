import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { Chess } from 'chess.js';

/**
 * 0.12: the arcade — fixes from the 0.11 review: the Play links on the hub
 * named after their games, the Odds Ladder's rungs as a readable list, the
 * Simul asking before it is left and keeping the keyboard on the board with N,
 * Engine Says keeping the moves of a finished line in the score, and the Daily
 * Opening's tiles saying what they mean in words as well as colour.
 */
const PROGRESS_KEY = 'open-file:progress';
const SETTINGS_KEY = 'open-file:settings';

// The routes below are mocked: nothing may come from a service worker's cache instead.
test.use({ serviceWorkers: 'block' });

async function seed(
  page: Page,
  state: Record<string, unknown> = {},
  settings: Record<string, unknown> | null = null,
) {
  await page.addInitScript(
    ([progressKey, progress, settingsKey, settingsJson]) => {
      // Seeded once; later pages keep what the test played.
      if (localStorage.getItem(progressKey)) return;
      localStorage.setItem(progressKey, progress);
      if (settingsJson) localStorage.setItem(settingsKey, settingsJson);
    },
    [
      PROGRESS_KEY,
      JSON.stringify({ state: { onboarded: true, puzzleRating: 1200, ...state }, version: 7 }),
      SETTINGS_KEY,
      settings ? JSON.stringify({ state: settings, version: 4 }) : '',
    ] as const,
  );
}

/** Fourteen moves: the shortest line Engine Says plays. */
const LINE = 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Nc3 Nxe4';
/** Engine Says: the same line under two names, so whichever comes first, the next is known. */
const ENGINE_SAYS_BOOK = [
  ['C54', 'Italian Game: Classical Variation', LINE],
  ['C54', 'Italian Game: Giuoco Piano, Main Line', LINE],
];
/** The Daily Opening: one possible answer (six moves), whatever the date, and two to guess. */
const DAILY_BOOK = [
  ['C70', 'Ruy Lopez: Morphy Defense', 'e4 e5 Nf3 Nc6 Bb5 a6'],
  ['C50', 'Italian Game', 'e4 e5 Nf3 Nc6 Bc4'],
  ['C45', 'Scotch Game', 'e4 e5 Nf3 Nc6 d4'],
];

async function mockOpeningBook(page: Page, book: string[][]) {
  await page.route('**/openings/lines.json', (route) => route.fulfill({ json: book }));
}

/** Sets up and starts a simul with clocks off, playing White on every board. */
async function startSimul(page: Page, boards: number) {
  await page.goto('/arcade/simul');
  await expect(page.getByTestId('simul-setup')).toBeVisible();
  await page
    .getByRole('radiogroup', { name: 'Boards' })
    .getByRole('radio', { name: String(boards), exact: true })
    .click();
  await page.getByLabel('Engine level', { exact: true }).selectOption('1');
  await page.getByTestId('simul-clock').selectOption('none');
  await page.getByTestId('simul-start').click();
  await expect(page.getByTestId('simul-status')).toHaveText('Board 1: Your move.');
}

test.describe('arcade hub', () => {
  test('every Play link is named after its game', async ({ page }) => {
    await seed(page);
    await page.goto('/arcade');
    for (const name of [
      'Hand & Brain',
      'Daily Opening',
      'Who Stands Better?',
      'Odds Ladder',
      'Army Draft',
      'Fortress',
      'Engine Says',
      'Blindfold',
      'Simul',
    ]) {
      await expect(page.getByRole('link', { name: `Play ${name}`, exact: true })).toBeVisible();
    }
    // No card link is a bare "Play" (the header's Play section link is another matter).
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Play', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('link', { name: 'Play Simul', exact: true }).click();
    await expect(page).toHaveURL(/\/arcade\/simul$/);
  });
});

test.describe('odds ladder', () => {
  test('the rungs are the setup’s choice: name, results and a badge, one card each', async ({
    page,
  }) => {
    await seed(page, {
      oddsLadder: { rung: 1, best: 1, results: { 0: { wins: 1, losses: 2, draws: 1 } } },
    });
    await page.goto('/arcade/odds-ladder');
    const rungs = page.getByRole('group', { name: 'Rung' }).locator('.setup__choice');
    await expect(rungs).toHaveCount(6);
    let bottom = 0;
    for (let i = 0; i < 6; i++) {
      const box = await rungs.nth(i).boundingBox();
      if (!box) throw new Error(`rung ${i} is not visible`);
      // A full-width row, stacked under the one before.
      expect(box.width).toBeGreaterThan(200);
      expect(box.height).toBeGreaterThan(30);
      expect(box.y).toBeGreaterThanOrEqual(bottom - 1);
      bottom = box.y + box.height;
    }
    await expect(page.getByTestId('odds-rung-0')).toContainText('Queen odds');
    await expect(page.getByTestId('odds-rung-0')).toContainText('1 win · 1 draw · 2 losses');
    const current = page.getByTestId('odds-rung-1');
    await expect(current).toContainText('Rook odds');
    // The badge sits inside its own row, not floating over the card.
    const badge = await current.locator('.badge').boundingBox();
    const row = await current.boundingBox();
    if (!badge || !row) throw new Error('the current rung is not visible');
    expect(badge.y).toBeGreaterThanOrEqual(row.y);
    expect(badge.y + badge.height).toBeLessThanOrEqual(row.y + row.height + 1);
    expect(badge.x + badge.width).toBeLessThanOrEqual(row.x + row.width + 1);
    await expect(current.locator('.badge')).toHaveText('Current');
    // The current rung is chosen; a climbed one can be chosen to replay; a locked one cannot.
    await expect(page.getByRole('radio', { name: 'Rook odds' })).toBeChecked();
    await page.getByRole('radio', { name: 'Queen odds' }).check();
    await expect(page.locator('.play__boardcol cg-board piece.black.queen')).toHaveCount(0);
    await expect(page.getByTestId('odds-rung-2')).toContainText('Locked');
    await expect(page.getByRole('radio', { name: 'Knight odds' })).toBeDisabled();
  });
});

test.describe('simul', () => {
  test('leaving a simul in play asks first; staying keeps every board', async ({ page }) => {
    await seed(page);
    await startSimul(page, 2);
    const crumb = page.locator('.arcade__eyebrow').getByRole('link', { name: 'Arcade' });
    await crumb.click();
    const dialog = page.getByRole('dialog', { name: 'Leave the simul?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('resigned and count as losses');
    await dialog.getByRole('button', { name: 'Stay' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/arcade\/simul$/);
    await expect(page.getByTestId('simul-status')).toHaveText('Board 1: Your move.');
    await expect(page.locator('.simul-thumb')).toHaveCount(2);

    // Leaving for real resigns what is still in play, so the record adds up.
    await crumb.click();
    await page
      .getByRole('dialog', { name: 'Leave the simul?' })
      .getByRole('button', { name: 'Leave and resign' })
      .click();
    await expect(page).toHaveURL(/\/arcade$/);
    await expect(page.getByTestId('arcade-best-simul')).toHaveText(
      '0/2 · Newcomer · no clock · 1 play',
    );
  });

  test('N moves on to the next board and keeps the keyboard on the big board', async ({ page }) => {
    await seed(page);
    await startSimul(page, 2);
    const first = page.getByRole('application', { name: /^Board 1 of 2/ });
    await first.focus();
    await page.keyboard.press('n');
    await expect(page.getByTestId('simul-status')).toHaveText('Board 2: Your move.');
    // The big board is a new one for board 2, and the keyboard is on it.
    await expect(page.getByRole('application', { name: /^Board 2 of 2/ })).toBeFocused();
    await page.keyboard.press('N');
    await expect(page.getByTestId('simul-status')).toHaveText('Board 1: Your move.');
    await expect(page.getByRole('application', { name: /^Board 1 of 2/ })).toBeFocused();
  });
});

test.describe('engine says', () => {
  test('replaying a whole line keeps its moves in the score', async ({ page }) => {
    // 102 moves are replayed through the board's keyboard interface.
    test.setTimeout(150_000);
    await seed(page);
    await mockOpeningBook(page, ENGINE_SAYS_BOOK);
    await page.clock.install();
    await page.goto('/arcade/engine-says');
    const start = page.getByTestId('engine-says-start');
    await expect(start).toBeEnabled();
    // The slow pace: 1.4 s a move, plenty of time to read the first one.
    await page
      .getByRole('radiogroup', { name: 'Pace' })
      .getByRole('radio', { name: 'Slow' })
      .click();
    await start.click();
    const status = page.getByTestId('engine-says-status');
    const squares = (() => {
      const chess = new Chess();
      return LINE.split(' ').map((san) => {
        const move = chess.move(san);
        return [move.from, move.to] as const;
      });
    })();

    // The engine names the moves as it shows them.
    await page.clock.runFor(1_400);
    await expect(status).toContainText('Move 1 of 3: e4');

    /** Skips the showing, then replays the first `length` moves with the keyboard. */
    const replay = async (length: number) => {
      await page.clock.runFor(30_000);
      await expect(status).toHaveText(`0 of ${length} replayed`);
      const board = page.getByRole('application', { name: 'Engine Says board, replay' });
      await board.focus();
      for (const [i, [from, to]] of squares.slice(0, length).entries()) {
        await page.keyboard.type(from);
        await page.keyboard.press('Enter');
        await page.keyboard.type(to);
        await page.keyboard.press('Enter');
        if (i + 1 < length) await expect(status).toHaveText(`${i + 1} of ${length} replayed`);
      }
    };
    for (let length = 3; length <= squares.length; length++) await replay(length);

    // The whole line is banked; a fresh line starts at three moves.
    await expect(page.getByTestId('engine-says-score')).toHaveText('14');
    await page.clock.runFor(30_000);
    await expect(status).toHaveText('0 of 3 replayed');
    const board = page.getByRole('application', { name: 'Engine Says board, replay' });
    await board.focus();
    // A wrong first move ends the run — at 14, not 0.
    await page.keyboard.type('d2');
    await page.keyboard.press('Enter');
    await page.keyboard.type('d4');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('engine-says-card')).toContainText('Run over');
    await expect(page.getByTestId('engine-says-score')).toHaveText('14');
  });
});

test.describe('daily opening', () => {
  test('the tiles say what they mean in words and glyphs, with AA contrast (Nightshift)', async ({
    page,
  }) => {
    await seed(page, {}, { colorScheme: 'dark' });
    await mockOpeningBook(page, DAILY_BOOK);
    await page.goto('/arcade/daily-opening');
    const input = page.getByTestId('daily-opening-input');
    await input.fill('italian game');
    await page
      .getByTestId('daily-opening-matches')
      .getByRole('button', { name: /^Italian Game C\d\d/ })
      .click();
    const tiles = page.getByTestId('daily-opening-guesses').locator('li.arcade__tile');
    await expect(tiles).toHaveCount(5);
    // Every tile carries words for screen readers and a glyph, not just a tint.
    await expect(tiles.nth(0)).toHaveText('e4: in the right place');
    await expect(tiles.nth(4)).toContainText(': not in the line');
    for (let i = 0; i < 5; i++) {
      // One spoken state per tile (a figurine move adds its own hidden letter as well).
      await expect(
        tiles.nth(i).locator('.sr-only', { hasText: /right place|in the line/ }),
      ).toHaveCount(1);
      await expect(tiles.nth(i).locator('svg')).toHaveCount(1);
    }
    await expect(page.getByRole('list', { name: 'What the marks mean' })).toBeVisible();
    // White on the green and amber tiles was about 2.2:1 in the dark schemes of 0.12.
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .include('[data-testid="daily-opening-guesses"]')
      .analyze();
    expect(results.violations.map((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([]);
  });
});
