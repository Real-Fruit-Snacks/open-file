import { expect, type Page, test } from '@playwright/test';
import { Chess } from 'chess.js';
import { expectBoard, playMove, revealBoard } from './helpers';

const PROGRESS_KEY = 'open-file:progress';

async function seedProgress(page: Page, state: Record<string, unknown>, version = 6) {
  await page.addInitScript(
    ([storageKey, value]) => {
      if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, value);
    },
    [PROGRESS_KEY, JSON.stringify({ state, version })] as const,
  );
}

async function storedProgress(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { state: Record<string, unknown> }).state : {};
  }, PROGRESS_KEY);
}

test.describe('arcade hub', () => {
  test('lists the eleven games and is reachable from the More menu', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/');
    await page.getByRole('button', { name: /More/ }).click();
    await page
      .getByRole('region', { name: 'More sections' })
      .getByRole('link', { name: /Arcade/ })
      .click();
    await expect(page).toHaveURL(/\/arcade$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Arcade');
    await expect(page.locator('[data-testid^="arcade-"].arcade-card')).toHaveCount(11);
    await expect(page.getByTestId('arcade-best-fortress')).toHaveText('Not played yet');
  });
});

test.describe('who stands better', () => {
  test('scores ten judgements and keeps the best', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/who-stands-better');
    await page.getByTestId('wsb-start').click();
    await expectBoard(page);
    for (let i = 1; i <= 10; i++) {
      await expect(page.getByTestId('wsb-progress')).toHaveText(`Position ${i} of 10`);
      await page.getByTestId('wsb-slider').fill('1');
      await expect(page.getByTestId('wsb-guess')).toContainText('White is better');
      await page.getByTestId('wsb-lock').click();
      await expect(page.getByTestId('wsb-reveal')).toContainText(/points/);
      await expect(page.getByTestId('wsb-reveal')).toContainText(/The engine says/);
      await page.getByTestId('wsb-next').click();
    }
    await expect(page.getByTestId('wsb-result')).toBeVisible();
    const progress = await storedProgress(page);
    const arcade = progress.arcade as Record<string, { best: number; plays: number }>;
    expect(arcade['who-stands-better']?.plays).toBe(1);
    expect(arcade['who-stands-better']?.best).toBeGreaterThanOrEqual(0);
    await page.goto('/arcade');
    await expect(page.getByTestId('arcade-best-who-stands-better')).toContainText('points');
  });
});

test.describe('daily opening', () => {
  test('takes guesses with Wordle feedback, gives up, and offers practice', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/daily-opening');
    const input = page.getByTestId('daily-opening-input');
    await input.fill('italian');
    const matches = page.getByTestId('daily-opening-matches');
    await expect(matches).toBeVisible();
    await matches.getByRole('button').first().click();
    const guesses = page.getByTestId('daily-opening-guesses');
    await expect(guesses.locator('.arcade__guess')).toHaveCount(1);
    await expect(guesses.locator('.arcade__tile').first()).toBeVisible();
    // The day's state is remembered.
    await page.reload();
    await expect(page.getByTestId('daily-opening-guesses').locator('.arcade__guess')).toHaveCount(
      1,
    );
    await page.getByRole('button', { name: 'Give up' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Give up' }).click();
    const result = page.getByTestId('daily-opening-result');
    await expect(result).toContainText('Not this time');
    await expect(result).toContainText(/Days played/);
    const progress = await storedProgress(page);
    const daily = progress.dailyOpening as { result: string; history: Record<string, number> };
    expect(daily.result).toBe('failed');
    expect(Object.values(daily.history)).toEqual([0]);
    await page.getByRole('button', { name: 'Practise a random opening' }).click();
    await expect(page.getByTestId('daily-heading')).toHaveText('Practice opening');
    await expect(page.getByTestId('daily-opening-input')).toBeVisible();
  });
});

test.describe('engine says', () => {
  test('shows a sequence, accepts the replay and ends on a wrong move', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/engine-says');
    await page.getByTestId('engine-says-start').click();
    // Collect the moves as they are shown.
    const status = page.getByTestId('engine-says-status');
    await expect(status).toContainText('Move 1 of 3');
    const seen: string[] = [];
    for (let i = 0; i < 40 && seen.filter(Boolean).length < 3; i++) {
      const tiles = await page
        .getByTestId('engine-says-sequence')
        .locator('.arcade__sequence-move')
        .evaluateAll((items) => items.map((item) => item.getAttribute('data-san')));
      for (const [idx, san] of tiles.entries()) {
        if (san && seen[idx] === undefined) seen[idx] = san;
      }
      await page.waitForTimeout(150);
    }
    expect(seen.filter(Boolean)).toHaveLength(3);
    await expect(status).toContainText('0 of 3 replayed');
    const board = await expectBoard(page);
    const chess = new Chess();
    for (const san of seen) {
      const move = chess.move(san);
      await playMove(board, move.from, move.to);
    }
    // Round two: four moves are shown.
    await expect(status).toContainText('of 4', { timeout: 10_000 });
    await expect(page.getByTestId('engine-says-score')).toHaveText('3');
    await expect(status).toContainText('0 of 4 replayed', { timeout: 10_000 });
    // A wrong first move ends the run with the score of the completed round.
    const wrong = new Chess().moves({ verbose: true }).find((m) => m.san !== seen[0]);
    expect(wrong).toBeDefined();
    await playMove(board, wrong?.from ?? 'a2', wrong?.to ?? 'a3');
    await expect(page.getByTestId('engine-says-card')).toContainText('Run over');
    await expect(page.getByTestId('engine-says-score')).toHaveText('3');
  });
});

test.describe('odds ladder', () => {
  test('starts with queen odds and records a loss on resignation', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/odds-ladder');
    await expect(page.getByTestId('odds-rung-0')).toContainText('Current');
    await page.getByTestId('odds-start').click();
    const board = await expectBoard(page);
    // Black has no queen.
    await expect(page.locator('cg-board piece.black.queen')).toHaveCount(0);
    await playMove(board, 'e2', 'e4');
    await expect(page.locator('.movelist')).toContainText('e4', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Resign' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Resign' }).click();
    await expect(page.getByTestId('odds-result')).toContainText('The engine wins');
    await page.getByTestId('odds-choose').click();
    await expect(page.getByTestId('odds-rung-0')).toContainText('1 loss');
    const progress = await storedProgress(page);
    expect((progress.oddsLadder as { rung: number }).rung).toBe(0);
  });
});

test.describe('army draft', () => {
  test('buys an army within the budget and fights with it', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/army-draft');
    await expect(page.getByTestId('army-budget')).toHaveText('30 / 30');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByTestId('army-budget')).toHaveText('0 / 30');
    await expect(page.getByTestId('army-start')).toBeDisabled();
    await page.getByRole('button', { name: 'Cavalry' }).click();
    await expect(page.getByTestId('army-count-n')).toHaveText('4');
    await expect(page.getByTestId('army-budget')).toHaveText('28 / 30');
    // A queen does not fit the budget; a fifth knight does once a pawn goes.
    await expect(page.getByRole('button', { name: 'Add a queen' })).toBeDisabled();
    await page.getByRole('button', { name: 'Remove a pawn' }).click();
    await page.getByRole('button', { name: 'Add a knight' }).click();
    await expect(page.getByTestId('army-budget')).toHaveText('30 / 30');
    await page.getByTestId('army-level').selectOption('1');
    await page.getByTestId('army-start').click();
    await expectBoard(page);
    await expect(page.locator('cg-board piece.white.knight')).toHaveCount(5);
    await expect(page.locator('cg-board piece.white.pawn')).toHaveCount(7);
    await page.getByRole('button', { name: 'Resign' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Resign' }).click();
    await expect(page.getByTestId('army-result')).toContainText('The engine wins');
    await page.getByRole('button', { name: 'New game' }).click();
    await expect(page.getByTestId('army-shop')).toBeVisible();
  });
});

test.describe('fortress', () => {
  test('loads a worse position, counts lives and ends the run', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/fortress');
    await page.getByTestId('fortress-level').selectOption('1');
    await page.getByTestId('fortress-start').click();
    await expectBoard(page);
    await expect(page.getByTestId('fortress-health')).toBeVisible();
    await expect(page.getByTestId('fortress-status')).toContainText(/Your move|attacker/);
    for (let life = 3; life >= 1; life--) {
      await page.getByRole('button', { name: 'Give up this position' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Give up', exact: true }).click();
      if (life > 1) {
        await expect(page.getByTestId('fortress-outcome')).toContainText(`${life - 1} li`);
        await page.getByTestId('fortress-next').click();
        await expect(page.getByTestId('fortress-status')).toContainText(/Your move|attacker/);
      }
    }
    await expect(page.getByTestId('fortress-result')).toContainText('Run over');
    const progress = await storedProgress(page);
    const arcade = progress.arcade as Record<string, { best: number; plays: number }>;
    expect(arcade.fortress?.plays).toBe(1);
    expect(arcade.fortress?.best).toBe(0);
  });
});

test.describe('hand and brain', () => {
  test('the brain calls a piece and the partner plays it', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/hand-and-brain');
    await page.getByTestId('hb-level').selectOption('1');
    await page.getByTestId('hb-start').click();
    await expectBoard(page);
    const pawn = page.getByTestId('hb-call-p');
    await expect(pawn).toBeEnabled({ timeout: 20_000 });
    await pawn.click();
    // Every grade names the piece, the engine or how close the call was.
    await expect(page.getByTestId('hb-last-call')).toContainText(/Pawn|engine|nearly/, {
      timeout: 20_000,
    });
    await expect(page.locator('.movelist')).toContainText(/1\./);
    await expect(page.getByTestId('hb-accuracy')).toContainText('%');
    // The opponent replies and it is our call again.
    await expect(page.getByTestId('hb-call-n')).toBeEnabled({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Resign' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Resign' }).click();
    await expect(page.getByTestId('hb-result')).toContainText('The engine wins');
    await expect(page.getByTestId('hb-result')).toContainText('accuracy');
  });

  test('the hand is told the piece and must move it', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/hand-and-brain');
    await page.getByRole('radio', { name: 'Hand' }).click();
    await page.getByTestId('hb-level').selectOption('1');
    await page.getByTestId('hb-start').click();
    const board = await expectBoard(page);
    const status = page.getByTestId('hb-status');
    await expect(status).toContainText(/Your partner says: (Pawn|Knight)!/, { timeout: 20_000 });
    const text = await status.textContent();
    const knight = (text ?? '').includes('Knight');
    await playMove(board, knight ? 'g1' : 'e2', knight ? 'f3' : 'e4');
    await expect(page.getByTestId('hb-last-call')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.movelist')).toContainText(knight ? 'Nf3' : 'e4');
  });
});

test.describe('blindfold', () => {
  test('hides the pieces, allows three peeks and scores the game', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/arcade/blindfold');
    await page.getByTestId('blindfold-level').selectOption('1');
    await page.getByTestId('blindfold-start').click();
    await expectBoard(page);
    await expect(page.locator('.board').first()).toHaveClass(/board--blindfold/);
    await expect(page.getByTestId('blindfold-bar')).toContainText('3 peeks left');
    await page.getByTestId('blindfold-peek').click();
    await expect(page.locator('.board').first()).not.toHaveClass(/board--blindfold/);
    await expect(page.getByTestId('blindfold-bar')).toContainText('2 peeks left');
    await expect(page.locator('.board').first()).toHaveClass(/board--blindfold/, {
      timeout: 5000,
    });
    await page.getByRole('button', { name: 'Resign' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Resign' }).click();
    const result = page.getByTestId('blindfold-result');
    await expect(result).toContainText('The engine wins');
    await expect(result).toContainText('Score');
    const progress = await storedProgress(page);
    const arcade = progress.arcade as Record<string, { best: number; detail?: string }>;
    // A loss scores nothing, however many peeks were left (it used to be worth 30 here).
    expect(arcade.blindfold?.best).toBe(0);
    expect(arcade.blindfold?.detail).toBe('Lost vs Level 1');
  });
});

test.describe('settings', () => {
  test('has its own page, reachable from More and from Progress', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/progress');
    await page.getByRole('link', { name: 'Settings' }).click();
    // From Progress, Settings opens where sync and backups are.
    await expect(page).toHaveURL(/\/settings#data$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
    await expect(page.getByRole('tab', { name: 'Sync & data' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    for (const [tab, headings] of [
      ['Appearance', ['Board', 'Display', 'Sound & vibration']],
      ['Play', ['Play', 'Puzzle rating']],
      ['Engine', ['Engine & analysis']],
      ['Sync & data', ['Backups', 'Storage', 'Profiles']],
      ['App', ['App']],
    ] as const) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      for (const name of headings) {
        await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
      }
    }

    // Progress keeps the statistics only.
    await page.goto('/progress');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Progress');
    await expect(page.getByRole('switch')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Appearance' })).toHaveCount(0);

    await page.getByRole('button', { name: /More/ }).click();
    await page
      .getByRole('region', { name: 'More sections' })
      .getByRole('link', { name: /Settings/ })
      .click();
    await expect(page).toHaveURL(/\/settings$/);

    // A change is kept.
    const dots = page.getByRole('switch', { name: 'Show legal move dots' });
    await expect(dots).toBeChecked();
    await page.getByText('Show legal move dots', { exact: true }).click();
    await expect(dots).not.toBeChecked();
    await page.reload();
    await expect(page.getByRole('switch', { name: 'Show legal move dots' })).not.toBeChecked();
  });

  test('the profile badge opens the profiles card in Settings', async ({ page }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/settings#profiles');
    await page.getByLabel('New profile name').fill('Ada');
    await page.getByRole('button', { name: 'Add profile' }).click();
    await page.goto('/');
    await page.getByTestId('profile-badge').click();
    await expect(page).toHaveURL(/\/settings#profiles$/);
    await expect(page.getByRole('heading', { name: 'Profiles' })).toBeInViewport();
  });
});

test.describe('playing on from a position on a phone', () => {
  test('moves never scroll the board away', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'the move list sits beside the board on desktop');
    await seedProgress(page, { onboarded: true });
    // No coach: a "mistake" would pause the game before the engine replies.
    await page.addInitScript(() => {
      localStorage.setItem(
        'open-file:settings',
        JSON.stringify({ state: { playCoach: false }, version: 3 }),
      );
    });
    // A puzzle's final position, handed off the way "Play it out" does.
    const fen = 'r1bqk2r/1pppbppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 2 6';
    await page.goto(`/play/computer?fen=${encodeURIComponent(fen)}&color=white`);
    await page.getByLabel('Engine level').selectOption('1');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const board = await expectBoard(page);
    await revealBoard(board);
    const getScroll = () =>
      page.evaluate(() => document.querySelector('.shell__scroll')?.scrollTop ?? window.scrollY);
    const before = await getScroll();
    const moves = page.locator('.movelist .movelist__move');

    await playMove(board, 'a4', 'b3');
    await expect(moves).toHaveCount(2, { timeout: 30_000 });
    await page.waitForTimeout(250);
    expect(await getScroll()).toBe(before);
    await expect(board).toBeInViewport({ ratio: 1 });

    await playMove(board, 'd2', 'd3');
    await expect(moves).toHaveCount(4, { timeout: 30_000 });
    await page.waitForTimeout(250);
    expect(await getScroll()).toBe(before);
    await expect(board).toBeInViewport({ ratio: 1 });
  });
});

test.describe('small phones', () => {
  test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });

  test('a board page keeps a compact title so the whole board stays on screen', async ({
    page,
  }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/play/computer');
    await page.getByLabel('Engine level').selectOption('1');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expectBoard(page);
    // The description is dropped (the way back to Play stays) and the title shrinks …
    await expect(page.locator('.page-header p:not(.card__eyebrow)')).toBeHidden();
    await expect(page.locator('.page-header .card__eyebrow')).toBeVisible();
    const titleSize = await page
      .locator('.page-header h1')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(titleSize).toBeLessThan(24);
    // … so the board and both player bars sit above the bottom navigation without scrolling.
    expect(
      await page.evaluate(
        () => document.querySelector('.shell__scroll')?.scrollTop ?? window.scrollY,
      ),
    ).toBe(0);
    const layout = await page.evaluate(() => {
      const bars = Array.from(
        document.querySelectorAll<HTMLElement>('.playerbar'),
        (el) => el.getBoundingClientRect().bottom,
      );
      return {
        header: document.querySelector('header')?.getBoundingClientRect().bottom ?? 0,
        boardTop: document.querySelector('cg-board')?.getBoundingClientRect().top ?? 0,
        lastBar: Math.max(...bars),
        navTop: document.querySelector('.shell__bottomnav')?.getBoundingClientRect().top ?? 0,
      };
    });
    expect(layout.boardTop).toBeGreaterThan(layout.header);
    expect(layout.lastBar).toBeLessThan(layout.navTop);

    // A drill explains its goal in the header, so that text stays.
    await page.goto('/drills/endgame/mate-kq');
    await expectBoard(page);
    await expect(page.locator('.page-header p').last()).toBeVisible();
  });
});

test.describe('more menu', () => {
  test('is grouped by what the sections are for', async ({ page, isMobile }) => {
    await seedProgress(page, { onboarded: true });
    await page.goto('/');
    await page.getByRole('button', { name: /More/ }).click();
    // A disclosure over plain lists of links, not an ARIA menu.
    const menu = page.getByRole('region', { name: 'More sections' });
    const games = menu.getByRole('group', { name: 'Games' });
    await expect(games.getByRole('link', { name: /Arcade/ })).toBeVisible();
    await expect(games.getByRole('link', { name: /Classic games/ })).toBeVisible();
    await expect(menu.getByRole('group', { name: 'Train' }).getByRole('link')).toHaveCount(
      isMobile ? 4 : 2,
    );
    const app = menu.getByRole('group', { name: 'Tools' });
    await expect(app.getByRole('link', { name: /Settings/ })).toBeVisible();
    if (isMobile) {
      // The sheet never grows past the space between the app header and the bottom bar.
      const fits = await menu.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
        const nav = document.querySelector('.shell__bottomnav')?.getBoundingClientRect().top ?? 0;
        return rect.top >= header && rect.bottom <= nav;
      });
      expect(fits).toBe(true);
    }
    await app.getByRole('link', { name: /Settings/ }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });
});
