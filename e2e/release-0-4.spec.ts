import { expect, type Page, test } from '@playwright/test';
import {
  completeOnboarding,
  expectBoard,
  playMove,
  showAnswersToTheEnd,
  waitForBoardIdle,
} from './helpers';

const PROGRESS_KEY = 'open-file:progress';

/** Seeds a persisted store once per browser context (init scripts re-run on every navigation). */
async function seed(page: Page, key: string, state: Record<string, unknown>, version = 4) {
  await page.addInitScript(
    ([storageKey, value]) => {
      if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, value);
    },
    [key, JSON.stringify({ state, version })] as const,
  );
}
const seedProgress = (page: Page, state: Record<string, unknown>) =>
  seed(page, PROGRESS_KEY, state);
const seedSettings = (page: Page, state: Record<string, unknown>) =>
  seed(page, 'open-file:settings', state, 3);

const SCHOLAR =
  '[White "alice"]\n[Black "bob"]\n[Date "2026.09.29"]\n\n1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0';

/**
 * One blunder with one right answer: after the forced 1...Kg8, 2.Qg7# is the only
 * mate in one, so the review's best move (and the puzzle's solution) never varies.
 */
const MISSED_MATE =
  '[White "alice"]\n[Black "bob"]\n[Date "2026.09.29"]\n[SetUp "1"]\n[FEN "7k/8/6KQ/8/8/8/8/8 b - - 0 1"]\n\n1... Kg8 2. Qh8+ Kxh8 1/2-1/2';

test.describe('own-game puzzles', () => {
  test('a reviewed blunder becomes a puzzle that can be solved in Mine mode', async ({ page }) => {
    await seedProgress(page, { onboarded: true, puzzleRating: 1200 });
    await page.goto('/analyze');
    await page.getByRole('button', { name: 'Import FEN / PGN' }).click();
    await page.locator('textarea').fill(MISSED_MATE);
    await page.getByRole('button', { name: 'Load', exact: true }).click();
    await page.getByRole('combobox', { name: 'Review depth' }).selectOption('fast');
    await page.getByRole('button', { name: 'Review game' }).click();
    await expect(page.locator('.evalgraph')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.moments__item').first()).toContainText('Qh8+');

    await page.getByRole('button', { name: /Add \d+ as puzzle/ }).click();
    await expect(page.getByRole('button', { name: 'All saved as puzzles' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Saved as a puzzle' })).toBeDisabled();

    await page.goto('/puzzles/mine');
    await completeOnboarding(page);
    const board = await expectBoard(page);
    await expect(page.locator('.puzzle-status')).toContainText(/Your move/i, { timeout: 20_000 });
    await expect(page.getByText('Blunder in your game')).toBeVisible();
    await expect(page.getByText(/you played/)).toContainText('Qh8+');
    await playMove(board, 'h6', 'g7', 'white');
    await expect(page.locator('.puzzle-status')).toContainText(/solved/i, { timeout: 20_000 });

    // Solving in Mine mode is unrated and the puzzle stays available.
    await expect(page.locator('.puzzle-stats')).toContainText('My puzzles');
    await page.getByRole('button', { name: 'Remove from my puzzles' }).click();
    await page.getByTestId('confirm-accept').click();
    await expect(page.getByText('No puzzles from your games yet')).toBeVisible();
  });

  test('bookmarking a puzzle puts it in the review queue', async ({ page }) => {
    await seedProgress(page, { onboarded: true, puzzleRating: 1200 });
    await page.goto('/puzzles');
    await completeOnboarding(page);
    await expectBoard(page);
    await expect(page.locator('.puzzle-status')).toContainText(/Your move/i, { timeout: 20_000 });
    await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Bookmarked' })).toBeVisible();
    await expect(page.locator('.segmented__option', { hasText: 'Due' })).toContainText('1');
    await page.getByRole('button', { name: 'Bookmarked' }).click();
    await expect(page.locator('.segmented__option', { hasText: 'Due' })).not.toContainText('1');
  });
});

test.describe('my games', () => {
  const pgn = (
    white: string,
    black: string,
    result: string,
    site: string,
    moves: string,
    date: string,
  ) =>
    `[Event "Rated Blitz game"]\n[Site "${site}"]\n[Date "${date}"]\n[White "${white}"]\n[Black "${black}"]\n[Result "${result}"]\n[UTCDate "${date}"]\n[UTCTime "12:00:00"]\n[TimeControl "300+0"]\n\n${moves} ${result}\n`;

  test('imports games, shows openings, deviations and turns mistakes into puzzles', async ({
    page,
  }) => {
    await seedProgress(page, { onboarded: true, puzzleRating: 1200 });
    const body = [
      pgn(
        'alice',
        'bob',
        '1-0',
        'https://lichess.org/g1',
        '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6',
        '2026.09.20',
      ),
      pgn(
        'carol',
        'alice',
        '0-1',
        'https://lichess.org/g2',
        '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#',
        '2026.09.21',
      ),
      pgn(
        'alice',
        'dave',
        '1/2-1/2',
        'https://lichess.org/g3',
        '1. d4 d5 2. Bf4 Nf6 3. e3 c5',
        '2026.09.22',
      ),
    ].join('\n');
    let requested = '';
    await page.route('https://lichess.org/api/games/user/**', (route) => {
      requested = route.request().url();
      return route.fulfill({
        status: 200,
        contentType: 'application/x-chess-pgn',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body,
      });
    });
    await page.goto('/games');
    await page.getByLabel('Lichess username').fill('alice');
    await page.getByLabel('Time control').selectOption('blitz');
    await page.getByText('Rated only', { exact: true }).click();
    await page.getByRole('button', { name: /Fetch 30 most recent/ }).click();

    await expect(page.getByTestId('games-overview')).toContainText('3');
    expect(requested).toContain('perfType=blitz');
    expect(requested).toContain('rated=true');
    await expect(page.getByLabel('Your name in the games')).toHaveValue('alice');
    await expect(page.getByTestId('openings-white')).toContainText('Ruy Lopez');
    await page
      .getByRole('radiogroup', { name: 'Colour' })
      .getByRole('radio', { name: 'As Black' })
      .click();
    await expect(page.getByTestId('openings-black')).toContainText('Bishop’s Opening');
    // 3. Bb5 now follows the Ruy Lopez repertoire; the Black games left the Caro-Kann on move one.
    await expect(page.getByTestId('deviations')).toContainText('e5 instead of c6');
    await expect(page.getByTestId('deviations')).toContainText('Caro-Kann');

    // Batch review at the fast depth, then save the learner's mistakes as puzzles.
    await page.goto('/settings#engine');
    await page.getByRole('combobox', { name: 'Game review depth' }).selectOption('fast');
    await page.goto('/games');
    await page.getByRole('button', { name: /Review all \(3\)/ }).click();
    await expect(page.getByRole('button', { name: 'Add as puzzles' })).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.getByTestId('game-accuracy').first()).toHaveText(/^accuracy \d/);
    await page.getByRole('button', { name: 'Add as puzzles' }).click();
    await page.goto('/puzzles/mine');
    await completeOnboarding(page);
    await expect(page.locator('.puzzle-status')).toContainText(/Your move/i, { timeout: 20_000 });
    await expect(page.getByText(/in your game/)).toBeVisible();
  });

  test('pages through chess.com archives with client-side filters', async ({ page }) => {
    const game = (n: number, month: string, endTime: number, timeClass: string, rated = true) => ({
      pgn: `[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "${month}.0${n}"]\n[White "dave"]\n[Black "opp${n}"]\n[Result "1-0"]\n[TimeControl "600"]\n\n1. e4 e5 1-0`,
      url: `https://www.chess.com/game/live/${n}`,
      end_time: endTime,
      time_class: timeClass,
      rated,
      white: { username: 'dave' },
      black: { username: `opp${n}` },
    });
    await page.route('https://api.chess.com/pub/player/dave/games/archives', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          archives: [
            'https://api.chess.com/pub/player/dave/games/2026/08',
            'https://api.chess.com/pub/player/dave/games/2026/09',
          ],
        }),
      }),
    );
    await page.route('https://api.chess.com/pub/player/dave/games/2026/09', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          games: Array.from({ length: 31 }, (_, i) =>
            game(i + 1, '2026.09', 1_000_000 + i, 'rapid'),
          ),
        }),
      }),
    );
    await page.route('https://api.chess.com/pub/player/dave/games/2026/08', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          games: [
            game(40, '2026.08', 900_000, 'bullet'),
            game(41, '2026.08', 900_001, 'rapid', false),
          ],
        }),
      }),
    );
    await page.goto('/games');
    await page
      .getByRole('radiogroup', { name: 'Import source' })
      .getByRole('radio', { name: 'chess.com' })
      .click();
    await page.getByLabel('chess.com username').fill('dave');
    await page.getByLabel('Time control').selectOption('rapid');
    await page.getByRole('button', { name: /Fetch 30 most recent/ }).click();
    await expect(page.getByTestId('games-overview')).toContainText('30');
    await page.getByRole('button', { name: 'Load older games' }).click();
    // One more rapid game from September plus the unrated rapid game from August (bullet is filtered out).
    await expect(page.getByTestId('games-overview')).toContainText('32');
  });
});

test.describe('adaptive plan and weekly summary', () => {
  test('the daily plan targets the weakest theme and Progress shows the week', async ({ page }) => {
    const day = 86_400_000;
    await seedSettings(page, { tourDismissed: true });
    // Weak means 20+ attempts and 15 points under the learner's own accuracy (64% here).
    await seedProgress(page, {
      onboarded: true,
      puzzleRating: 1200,
      themeStats: { fork: { solved: 5, failed: 15 }, pin: { solved: 40, failed: 10 } },
      attempts: [
        {
          id: 'a',
          puzzleRating: 1200,
          outcome: 'solved',
          hintUsed: false,
          ratingBefore: 1200,
          ratingAfter: 1210,
          themes: 'pin',
          at: Date.now() - day,
          durationMs: 3000,
        },
      ],
      ratingHistory: [
        { at: Date.now() - 10 * day, rating: 1150 },
        { at: Date.now() - day, rating: 1210 },
      ],
      trainingDays: [],
    });
    await page.goto('/');
    await expect(page.locator('.home__today')).toContainText('Solve 5 puzzles on Fork');
    await expect(page.locator('.home__today')).toContainText('25%');
    await page.getByRole('link', { name: /Solve 5 puzzles on Fork/ }).click();
    await expect(page).toHaveURL(/\/puzzles\/themes\?theme=fork/);

    await page.goto('/progress');
    const weekly = page.getByTestId('weekly-summary');
    await expect(weekly).toBeVisible();
    await expect(weekly.locator('tr', { hasText: 'Puzzles solved' })).toContainText('1');
    await expect(weekly.locator('tr', { hasText: 'Rating change' })).toContainText('60');
  });
});

test.describe('courses', () => {
  test('lists courses on Learn and tracks progress on the course page', async ({ page }) => {
    await seedSettings(page, { tourDismissed: true });
    await seedProgress(page, {
      onboarded: true,
      puzzleRating: 1200,
      lessons: {
        'the-board': { stepsDone: [0, 1, 2, 3], completedAt: Date.now() - 1000, lastVisitedAt: 1 },
      },
    });
    await page.goto('/learn');
    const card = page.getByTestId('course-first-steps');
    await expect(card).toContainText('First steps');
    await expect(card).toContainText('1/');
    await card.click();
    await expect(page.getByRole('heading', { level: 1, name: 'First steps' })).toBeVisible();
    await expect(page.getByTestId('unit-rules')).toContainText('The board');
    await expect(
      page.getByRole('link', { name: /^The board and the notation, Lesson, .*, done$/ }),
    ).toBeVisible();
    await expect(page.getByTestId('unit-material')).toHaveClass(/is-locked/);
    await expect(page.getByTestId('course-continue')).toHaveText('Continue');
    await page.getByTestId('course-continue').click();
    await expect(page).toHaveURL(/\/learn\/how-pieces-move/);

    // Home shows the active course under the plan.
    await page.goto('/');
    await expect(page.getByTestId('home-course')).toContainText('First steps');
    await expect(page.getByTestId('home-course')).toContainText('Continue');
  });
});

test.describe('lesson recall', () => {
  test('a due lesson position is recalled and rescheduled', async ({ page }) => {
    await seedProgress(page, {
      onboarded: true,
      puzzleRating: 1200,
      lessonRecall: {
        'how-pieces-move:0': {
          id: 'how-pieces-move:0',
          rating: 0,
          themes: 'how-pieces-move',
          step: 1,
          due: Date.now() - 1000,
          lapses: 0,
          addedAt: 1,
        },
      },
    });
    await page.goto('/learn/recall');
    const board = await expectBoard(page);
    await expect(page.getByTestId('lesson-task')).toContainText('Slide the rook to h4');
    await playMove(board, 'd4', 'h4');
    await expect(page.getByTestId('recall-result')).toContainText('Recalled!');
    await page.getByRole('button', { name: /Next/ }).click();
    await expect(page.getByTestId('recall-empty')).toContainText('Nothing to recall right now');
    await expect(page.getByTestId('recall-empty')).toContainText('1 position scheduled');

    // The plan on Home knows about the recall deck.
    await page.goto('/');
    await expect(page.locator('.home__today')).toContainText('Recall lesson positions');
  });

  test('completing a lesson schedules its task positions', async ({ page }) => {
    await seedProgress(page, { onboarded: true, puzzleRating: 1200 });
    await page.goto('/learn/how-pieces-move');
    await expectBoard(page);
    // Use "Show answer" on every task and Continue through the lesson.
    await showAnswersToTheEnd(page);
    await expect(page.getByText('Lesson complete')).toBeVisible();
    const scheduled = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      const state = raw
        ? (JSON.parse(raw) as { state: { lessonRecall: Record<string, { due: number }> } }).state
        : null;
      return state ? Object.values(state.lessonRecall).map((c) => c.due > Date.now()) : [];
    }, PROGRESS_KEY);
    expect(scheduled.length).toBeGreaterThan(0);
    expect(scheduled.every(Boolean)).toBe(true);
  });
});

test.describe('endgame studies', () => {
  test('lists studies and records a solve', async ({ page }) => {
    await page.goto('/studies');
    await expect(page.getByTestId('studies-progress')).toContainText('0 of');
    await page.getByTestId('study-rook-pin-on-the-file').click();
    await expect(page.getByTestId('study-goal')).toHaveText('Black to play and draw');
    const board = await expectBoard(page);
    // A wrong move is taken back…
    await playMove(board, 'h1', 'g1', 'black');
    await expect(page.getByTestId('study-status')).toContainText('Not the study’s move');
    // …then the pin and the capture solve it. The Hint button is live again once the
    // study waits for a move, and the next click waits for the board to stop moving.
    const hint = page.getByRole('button', { name: /^Hint/ });
    await expect(hint).toBeEnabled();
    await waitForBoardIdle(page);
    await playMove(board, 'a2', 'b2', 'black');
    await expect(page.locator('.study__moves')).toContainText('Rb2+ Kc7', { timeout: 10_000 });
    await expect(hint).toBeEnabled();
    await waitForBoardIdle(page);
    await playMove(board, 'b2', 'b8', 'black');
    await expect(page.getByTestId('study-status')).toContainText(/Solved/);
    await expect(page.getByText('Why it works')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Play it out' })).toHaveAttribute(
      'href',
      /\/play\/computer\?fen=/,
    );

    await page.goto('/studies');
    await expect(page.getByTestId('studies-progress')).toContainText('1 of');
    await expect(page.getByTestId('study-rook-pin-on-the-file')).toContainText('Solved with help');
  });

  test('the hint and the solution work', async ({ page }) => {
    await page.goto('/studies/three-only-moves');
    await expectBoard(page);
    await page.keyboard.press('h');
    await expect(page.locator('cg-board')).toBeVisible();
    await page.getByRole('button', { name: /Show solution/ }).click();
    await expect(page.getByTestId('study-status')).toContainText('solution has been played', {
      timeout: 15_000,
    });
    await expect(page.locator('.study__moves')).toContainText('Kb3 Kc5 Kc3 Kd5 Kd3 Kd6');
  });
});

test.describe('two players and blindfold', () => {
  test('a hot-seat game turns the board and ends by resignation', async ({ page }) => {
    await page.goto('/play/computer');
    await page.getByRole('radio', { name: 'Two players' }).check();
    await page.getByText('Blindfold', { exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const board = await expectBoard(page);
    await expect(page.locator('.board').first()).toHaveClass(/board--blindfold/);
    await expect(page.getByTestId('blindfold-bar')).toContainText('0 peeks');

    await playMove(board, 'e2', 'e4', 'white');
    // The board now faces Black, and Black moves next — no engine involved.
    await expect(page.locator('.board').first()).toHaveAttribute('data-orientation', 'black');
    await waitForBoardIdle(page);
    await playMove(board, 'e7', 'e5', 'black');
    await expect(page.locator('.board').first()).toHaveAttribute('data-orientation', 'white');
    await expect(page.locator('.movelist')).toContainText('e5');

    await page.getByRole('button', { name: 'Peek' }).click();
    await expect(page.locator('.board').first()).not.toHaveClass(/board--blindfold/);
    await expect(page.getByTestId('blindfold-bar')).toContainText('1 peek');
    await expect(page.locator('.board').first()).toHaveClass(/board--blindfold/, {
      timeout: 5000,
    });

    await page.getByRole('button', { name: 'Resign' }).click();
    await expect(page.locator('dialog[open]')).toContainText('White (the side to move) resigns');
    await page.locator('dialog[open]').getByRole('button', { name: 'Resign' }).click();
    await expect(page.locator('dialog[open] h2')).toHaveText('Black wins');
    // Hot-seat games are not recorded as engine games.
    const games = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as { state: { games: unknown[] } }).state.games.length : 0;
    }, PROGRESS_KEY);
    expect(games).toBe(0);
  });
});

test.describe('guess the position drill', () => {
  test('asks where pieces stand after the shown moves', async ({ page }) => {
    await page.goto('/drills/vision?mode=recall');
    await page.getByRole('button', { name: /Start · 90 seconds/ }).click();
    const status = page.getByTestId('vision-status');
    await expect(status).toContainText(/Where is the/);
    const moves = (await page.getByTestId('recall-moves').textContent()) ?? '';
    const sans = moves.split(/\s+/).filter((t) => t && !/^\d+\.$/.test(t));
    // Track the pieces exactly as the drill does.
    const { Chess } = await import('chess.js');
    const chess = new Chess();
    const at = new Map<string, string | null>();
    const byOrigin = new Map<string, string>();
    for (const row of chess.board()) {
      for (const cell of row) {
        if (cell) {
          at.set(cell.square, cell.square);
          byOrigin.set(cell.square, cell.square);
        }
      }
    }
    const move = (from: string, to: string) => {
      const id = byOrigin.get(from);
      if (!id) return;
      byOrigin.delete(from);
      byOrigin.set(to, id);
      at.set(id, to);
    };
    const capture = (sq: string) => {
      const id = byOrigin.get(sq);
      if (!id) return;
      byOrigin.delete(sq);
      at.set(id, null);
    };
    for (const san of sans) {
      const m = chess.move(san);
      if (m.isEnPassant()) capture(`${m.to[0]}${m.from[1]}`);
      else if (m.isCapture()) capture(m.to);
      move(m.from, m.to);
      const rank = m.color === 'w' ? '1' : '8';
      if (m.isKingsideCastle()) move(`h${rank}`, `f${rank}`);
      if (m.isQueensideCastle()) move(`a${rank}`, `d${rank}`);
    }
    for (let i = 0; i < 3; i++) {
      const text = (await status.textContent()) ?? '';
      const origin = /started on ([a-h][1-8])/.exec(text)?.[1];
      expect(origin).toBeTruthy();
      const answer = at.get(origin ?? '');
      if (answer === null) {
        await page.getByRole('button', { name: 'It was captured' }).click();
      } else {
        await page.getByRole('button', { name: `${answer}, empty`, exact: true }).click();
      }
      await expect(page.locator('.drill__hud')).toContainText(`${i + 1}Found`);
      if (i < 2) await expect(status).toContainText(/Question|Where is/);
    }
    // The next position loads after the third correct answer.
    await expect(page.locator('.drill__hud')).toContainText('3Found');
    await expect(page.getByText('Position 2', { exact: false })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('keyboard board control', () => {
  test('moves a piece with the arrow keys and Enter, and describes the position', async ({
    page,
  }) => {
    await page.goto('/play/computer');
    await page.getByRole('radio', { name: 'Two players' }).check();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expectBoard(page);
    const board = page.locator('.board__cg').first();
    await board.focus();
    await expect(page.getByTestId('board-cursor')).toBeVisible();
    // e4 -> e3 -> e2, select the pawn, jump to e4 and confirm.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('.board__cursor-announce')).toContainText('e2, white pawn selected');
    await page.keyboard.press('e');
    await page.keyboard.press('4');
    await page.keyboard.press('Enter');
    await expect(page.locator('.movelist')).toContainText('e4');

    await page.getByRole('button', { name: 'Describe position' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.board__cursor-announce')).toContainText(
      /Black to move\. White: king e1, queen d1/,
    );
  });
});

test.describe('shareable analysis links', () => {
  test('copies a link that reopens the game at the same move', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (text: string) => {
            (window as unknown as { __copied: string }).__copied = text;
            return Promise.resolve();
          },
        },
        configurable: true,
      });
    });
    await page.goto('/analyze');
    await page.getByRole('button', { name: 'Import FEN / PGN' }).click();
    await page.locator('textarea').fill(SCHOLAR);
    await page.getByRole('button', { name: 'Load', exact: true }).click();
    await expect(page.locator('.movelist, .treemoves').first()).toContainText('Qxf7#');
    // Step back two plies so the link carries a ply.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.getByRole('button', { name: 'Copy link' }).click();
    const link = await page.evaluate(() => (window as unknown as { __copied: string }).__copied);
    expect(link).toMatch(/\/analyze#z=[A-Za-z0-9_-]+&ply=5$/);

    await page.goto(link);
    await expect(page.locator('.movelist, .treemoves').first()).toContainText('Qxf7#');
    // The board shows the position after 3.Qh5 (ply 5): the queen is on h5.
    await expect(page.locator('cg-board piece.queen.white').first()).toBeVisible();
    await expect(page.locator('[aria-current="true"]').first()).toContainText('Qh5');
  });
});

test.describe('settings: piece set, sound theme and engine diagnostics', () => {
  test('a chosen piece set applies everywhere and persists', async ({ page }) => {
    await page.goto('/settings');
    await page
      .getByRole('group', { name: 'Piece set' })
      .getByRole('button', { name: 'California' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-pieces', 'california');
    await page
      .getByRole('radiogroup', { name: 'Sound theme' })
      .getByRole('radio', { name: 'Soft' })
      .click();
    await page.goto('/analyze');
    await expectBoard(page);
    await expect(page.locator('html')).toHaveAttribute('data-pieces', 'california');
    // California's own king, not the Classic one the board shows until its stylesheet is in
    // (Classic's pieces are base64 data URIs, the other sets' plain SVG).
    await expect
      .poll(() =>
        page
          .locator('cg-board piece.white.king')
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundImage),
      )
      .toContain('data:image/svg+xml,');
    const settings = await page.evaluate(() => {
      const raw = localStorage.getItem('open-file:settings');
      return raw
        ? (JSON.parse(raw) as { state: { pieceSet: string; soundTheme: string } }).state
        : null;
    });
    expect(settings).toMatchObject({ pieceSet: 'california', soundTheme: 'soft' });
  });

  test('the diagnostics panel reports the environment and benchmarks the engine', async ({
    page,
  }) => {
    await page.goto('/settings#engine');
    const panel = page.getByTestId('engine-diagnostics');
    await panel.locator('summary').click();
    await expect(panel).toContainText('Build selected');
    await expect(panel).toContainText('Stockfish 19 lite');
    await expect(panel).toContainText('WebAssembly');
    await page.getByRole('button', { name: 'Test the engine' }).click();
    await expect(page.getByTestId('engine-benchmark')).toContainText(/depth \d+ in [\d.]+ s/, {
      timeout: 90_000,
    });
  });
});
