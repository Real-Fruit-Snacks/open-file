import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { Chess } from 'chess.js';
import { expectBoard, playMove } from './helpers';

/**
 * 0.29: the repertoire gap finder. It asks the opening explorer about each
 * position of a repertoire where the opponent is to move — one request at a
 * time — and lists the replies the repertoire has no answer to; a gap is
 * answered in the editor with the explorer's best answer or the learner's own
 * move, and a built-in repertoire is copied first. The explorer is stubbed
 * here: these tests never reach Lichess.
 *
 * The stub answers through page routes. Once the service worker controls the
 * page, WebKit sends every request through it, out of the routes' sight (the
 * worker leaves the explorer's requests to the network, so the app is the same
 * either way): it is kept out of this file.
 */
test.use({ serviceWorkers: 'block' });

const REPERTOIRE_KEY = 'open-file:repertoire';

/** The position as the explorer is asked about it: the FEN without its move counters. */
function keyAfter(line: string): string {
  const chess = new Chess();
  for (const san of line.split(' ').filter(Boolean)) chess.move(san);
  return chess.fen().split(' ').slice(0, 4).join(' ');
}

/** Games per move as [games, White's wins]; Black wins the rest. */
type Moves = Record<string, [number, number]>;

/**
 * Answers explorer requests from a table of positions (by the line that
 * reaches them), an empty answer elsewhere. `limitOnce` answers that
 * position's first request with a 429 asking for a two-second pause; `delayMs`
 * slows every answer down.
 */
async function stubExplorer(
  page: Page,
  table: Record<string, Moves>,
  { limitOnce, delayMs = 0 }: { limitOnce?: string; delayMs?: number } = {},
) {
  const answers = new Map(Object.entries(table).map(([line, moves]) => [keyAfter(line), moves]));
  const limited = limitOnce === undefined ? null : keyAfter(limitOnce);
  const asked: string[] = [];
  // Never the real explorer, whichever of its hosts.
  await page.route('https://explorer.lichess.ovh/**', (route) => route.abort());
  await page.route('https://explorer.lichess.org/**', async (route) => {
    const url = new URL(route.request().url());
    const key = (url.searchParams.get('fen') ?? '').split(' ').slice(0, 4).join(' ');
    const headers = { 'Access-Control-Allow-Origin': '*' };
    if (key === limited && !asked.includes(key)) {
      asked.push(key);
      // Exposed, so the page can read it (without, a browser sees no wait and takes a minute).
      await route.fulfill({
        status: 429,
        headers: { ...headers, 'Access-Control-Expose-Headers': 'Retry-After', 'Retry-After': '2' },
        body: '',
      });
      return;
    }
    // A request stopped by the page while it waited is gone: nothing to answer.
    const fulfill = (options: Parameters<typeof route.fulfill>[0]) =>
      route.fulfill(options).catch(() => undefined);
    asked.push(key);
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const rows = Object.entries(answers.get(key) ?? {}).map(([san, [games, whiteWins]]) => ({
      uci: '',
      san,
      white: whiteWins,
      draws: 0,
      black: games - whiteWins,
      averageRating: 1900,
    }));
    await fulfill({
      status: 200,
      contentType: 'application/json',
      headers,
      body: JSON.stringify({
        white: rows.reduce((sum, r) => sum + r.white, 0),
        draws: 0,
        black: rows.reduce((sum, r) => sum + r.black, 0),
        moves: rows,
        topGames: [],
        opening: null,
      }),
    });
  });
  return asked;
}

/** The learner's repertoires and progress, as the store keeps them. */
async function seedRepertoires(
  page: Page,
  custom: { id: string; name: string; color: 'white' | 'black'; pgn: string }[],
  cards: Record<string, unknown> = {},
) {
  const value = JSON.stringify({
    state: { cards, custom: custom.map((r) => ({ ...r, createdAt: 1 })), sessions: [] },
    version: 1,
  });
  await page.addInitScript(
    ([key, stored]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, stored);
    },
    [REPERTOIRE_KEY, value] as const,
  );
}

const replies = (page: Page) => page.locator('.gaps__item .gaps__reply');

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe('repertoire gap finder', () => {
  test('finds the gaps in your own repertoire, most often met first, and answers them', async ({
    page,
  }) => {
    await seedRepertoires(page, [
      {
        id: 'custom-italian',
        name: 'My Italian',
        color: 'white',
        pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 (3... Nf6 4. d3) 4. c3 *',
      },
    ]);
    const asked = await stubExplorer(page, {
      e4: { e5: [500, 250], c5: [300, 150], e6: [120, 60], c6: [60, 30], d5: [20, 10] },
      'e4 e5 Nf3': { Nc6: [700, 350], Nf6: [150, 75], d6: [80, 40], a6: [40, 20], Bc5: [30, 15] },
      'e4 e5 Nf3 Nc6 Bc4': { Bc5: [400, 200], Nf6: [450, 225], Be7: [100, 50], d6: [50, 0] },
      // White's answers to 1...c5: Nf3 scores best.
      'e4 c5': { Nf3: [600, 330], c3: [200, 104], Nc3: [150, 75] },
    });
    await page.goto('/openings/custom-italian');
    await page.getByRole('button', { name: 'Find gaps' }).click();

    // Off by default: it asks first, and says what goes over the network.
    const finder = page.getByTestId('gap-finder');
    await expect(finder).toContainText('Only the positions are sent.');
    await expect(finder).toContainText('3 positions, under a minute');
    await expect(finder.getByRole('radio', { name: 'Lichess players' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(asked).toHaveLength(0);
    await finder.getByRole('button', { name: 'Turn on the explorer and find gaps' }).click();

    const results = page.getByTestId('gap-results');
    await expect(results).toContainText('7 gaps up to move 12');
    expect(asked).toEqual([keyAfter('e4'), keyAfter('e4 e5 Nf3'), keyAfter('e4 e5 Nf3 Nc6 Bc4')]);
    await expect(results).toContainText('An answer is ready in 30% of games up to move 12.');
    await expect(replies(page)).toHaveText([
      '1... c5',
      '1... e6',
      '2... Nf6',
      '1... c6',
      '2... d6',
      '3... Be7',
      '3... d6',
    ]);
    await expect(page.locator('.gaps__item').first()).toContainText(
      'Played in 30% of 1,000 games · comes up in about 1 game in 3',
    );
    await expectNoSidewaysScroll(page);

    // The explorer's best answer, in one tap.
    await page
      .locator('.gaps__item')
      .first()
      .getByRole('button', { name: 'Add an answer' })
      .click();
    const card = page.getByTestId('gap-answer');
    await expect(card.getByRole('heading')).toHaveText('Your answer to 1... c5');
    await expect(card).toContainText(
      'Best results in Lichess games: White scores 55% with it, in 600 games.',
    );
    await expectNoSidewaysScroll(page);
    await card.getByRole('button', { name: /^Add 1\.\.\. c5 2\. N ?f3$/ }).click();
    await expect(page.locator('.toast').filter({ hasText: 'Added 1... c5 2. Nf3.' })).toBeVisible();
    await expect(replies(page)).toHaveCount(6);
    await expect(replies(page).first()).toHaveText('1... e6');

    // Or the learner's own move, on the board.
    await page
      .locator('.gaps__item')
      .first()
      .getByRole('button', { name: 'Add an answer' })
      .click();
    await expect(page.getByTestId('gap-answer').getByRole('heading')).toHaveText(
      'Your answer to 1... e6',
    );
    const board = await expectBoard(page);
    await playMove(board, 'd2', 'd4');
    await expect(page.locator('.toast').filter({ hasText: 'Added 1... e6 2. d4.' })).toBeVisible();
    await expect(replies(page)).toHaveCount(5);

    // Both answers are in the repertoire now.
    await page.getByRole('button', { name: 'Back to training' }).click();
    await page.getByRole('button', { name: 'Edit lines' }).click();
    const moves = page.getByTestId('explore-panel').locator('.treemoves');
    await expect(moves).toContainText('c5');
    await expect(moves).toContainText('Nf3');
    await expect(moves).toContainText('e6');
    await expect(moves).toContainText('d4');
  });

  test('waits out a 429 as asked, and stops when told', async ({ page }) => {
    await seedRepertoires(page, [
      {
        id: 'custom-kia',
        name: 'My KIA',
        color: 'white',
        pgn: '1. Nf3 d5 2. g3 Nf6 3. Bg2 c5 4. O-O *',
      },
      {
        id: 'custom-qg',
        name: 'My Queen’s Gambit',
        color: 'white',
        pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 (3... c5 4. cxd5) 4. Bg5 *',
      },
    ]);
    await stubExplorer(
      page,
      {
        Nf3: { d5: [800, 400], Nf6: [200, 100] },
        'Nf3 d5 g3': { Nf6: [900, 450], c6: [100, 50] },
        'Nf3 d5 g3 Nf6 Bg2': { c5: [800, 400], e6: [200, 100] },
      },
      { limitOnce: 'Nf3 d5 g3' },
    );
    await page.goto('/openings/custom-kia');
    await page.getByRole('button', { name: 'Find gaps' }).click();
    await page.getByRole('button', { name: 'Turn on the explorer and find gaps' }).click();
    const finder = page.getByTestId('gap-finder');
    await expect(finder).toContainText(/Lichess asked for a pause: going on in [12] s\./);
    await expect(page.getByTestId('gap-results')).toContainText('3 gaps up to move 12');

    // A slow explorer, and a stop half-way.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await stubExplorer(
      page,
      {
        d4: { d5: [500, 250], Nf6: [500, 250] },
        'd4 d5 c4': { e6: [600, 300], c6: [300, 150], dxc4: [100, 50] },
        'd4 d5 c4 e6 Nc3': { Nf6: [700, 350], c5: [200, 100], Be7: [100, 50] },
      },
      { delayMs: 700 },
    );
    await page.goto('/openings/custom-qg');
    await page.getByRole('button', { name: 'Find gaps' }).click();
    await page.getByRole('button', { name: 'Find gaps' }).click();
    await expect(finder).toContainText('1 of 3 positions');
    await finder.getByRole('button', { name: 'Stop' }).click();
    await expect(finder).toContainText('Stopped after 1 of 3 positions.');
    await expect(page.getByTestId('gap-results')).toContainText(
      'Gaps so far, from 1 of 3 positions.',
    );
    await finder.getByRole('button', { name: 'Check the other 2 positions' }).click();
    await expect(page.getByTestId('gap-results')).toContainText('4 gaps up to move 12');
  });

  test('a built-in repertoire is copied first, taking its progress, and the copy gets the answer', async ({
    page,
  }) => {
    await seedRepertoires(page, [], {
      'qgd|d2d4 d7d5': {
        ease: 2.5,
        interval: 4,
        due: Date.now() + 4 * 86_400_000,
        reps: 2,
        lapses: 0,
        lastReviewed: Date.now(),
      },
    });
    await stubExplorer(page, {
      'd4 d5': { c4: [600, 300], Nf3: [200, 100], Bf4: [150, 75], e3: [40, 20] },
      // Black's answers to the London: Nf6 scores best for Black.
      'd4 d5 Bf4': { Nf6: [500, 230], c5: [300, 150], e6: [200, 100] },
    });
    await page.goto('/openings/qgd');
    await page.getByRole('button', { name: 'Find gaps' }).click();
    await page.getByRole('radio', { name: '8' }).click();
    await page.getByRole('button', { name: 'Turn on the explorer and find gaps' }).click();
    const results = page.getByTestId('gap-results');
    await expect(results).toContainText('2 gaps up to move 8', { timeout: 40_000 });
    await expect(results).toContainText('Only lines after 1. d4 are checked');
    await expect(replies(page)).toHaveText(['2. Nf3', '2. Bf4']);

    await page.locator('.gaps__item').nth(1).getByRole('button', { name: 'Add an answer' }).click();
    const dialog = page.getByRole('dialog', { name: 'Make your own copy?' });
    await expect(dialog).toContainText('“Queen’s Gambit Declined (my copy)”');
    await expect(dialog).toContainText('The 1 move you have learned here move to the copy');
    await dialog.getByRole('button', { name: 'Make a copy' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Queen’s Gambit Declined (my copy)',
    );
    const card = page.getByTestId('gap-answer');
    await expect(card.getByRole('heading')).toHaveText('Your answer to 2. Bf4');
    await card.getByRole('button', { name: /^Add 2\. B ?f4 N ?f6$/ }).click();
    await expect(page.locator('.toast').filter({ hasText: 'Added 2. Bf4 Nf6.' })).toBeVisible();
    await expect(page.getByTestId('gap-results')).toContainText('1 gap up to move 8');
    await expect(replies(page)).toHaveText(['2. Nf3']);

    // The copy is among the learner's repertoires, with the progress; the built-in starts afresh.
    await page.goto('/openings');
    const copy = page.locator('.repertoire-card').filter({
      hasText: 'Queen’s Gambit Declined (my copy)',
    });
    await expect(copy).toContainText('Your own');
    await expect(copy).toContainText('1/');
    const builtIn = page
      .locator('.repertoire-card')
      .filter({ has: page.getByRole('link', { name: 'Queen’s Gambit Declined', exact: true }) });
    await expect(builtIn).toContainText('0/');
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`its panel, results and answer card pass the WCAG A/AA checks (${scheme})`, async ({
      page,
    }) => {
      await page.addInitScript(
        (settings) => localStorage.setItem('open-file:settings', settings),
        JSON.stringify({ state: { colorScheme: scheme }, version: 3 }),
      );
      await seedRepertoires(page, [
        {
          id: 'custom-scotch',
          name: 'My Scotch',
          color: 'white',
          pgn: '1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 *',
        },
      ]);
      await stubExplorer(page, {
        e4: { e5: [600, 300], c5: [250, 125], e6: [150, 75] },
        'e4 e5 Nf3': { Nc6: [800, 400], Nf6: [200, 100] },
        'e4 e5 Nf3 Nc6 d4': { exd4: [900, 450], Nxd4: [100, 50] },
        'e4 c5': { Nf3: [700, 380], c3: [300, 150] },
      });
      const audit = async () => {
        await page.waitForTimeout(300);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .exclude('cg-board')
          .exclude('.toasts')
          .analyze();
        return results.violations.map((v) => ({
          id: v.id,
          help: v.help,
          nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        }));
      };
      await page.goto('/openings/custom-scotch');
      await page.getByRole('button', { name: 'Find gaps' }).click();
      await expect(page.getByTestId('gap-finder')).toContainText('Only the positions are sent.');
      let violations = await audit();
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);

      await page.getByRole('button', { name: 'Turn on the explorer and find gaps' }).click();
      await expect(page.getByTestId('gap-results')).toContainText('4 gaps up to move 12');
      violations = await audit();
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);

      await page
        .locator('.gaps__item')
        .first()
        .getByRole('button', { name: 'Add an answer' })
        .click();
      await expect(page.getByTestId('gap-answer')).toContainText('Best results');
      violations = await audit();
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});
