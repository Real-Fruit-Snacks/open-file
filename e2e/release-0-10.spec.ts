import { expect, type Page, test } from '@playwright/test';
import { siteConfig } from '../src/site.config';
import { clickSquare, expectBoard, playMove, revealBoard } from './helpers';

/**
 * 0.10: board and display preferences — figurine notation, the colour scheme
 * (0.10's black one went in 0.32; Nightshift, the dark one, is checked in its
 * place), board highlights, the drag feel, piece sets, captured material and
 * focus mode.
 */
async function seed(page: Page, settings: Record<string, unknown> = {}) {
  await page.addInitScript(
    ([settingsJson]) => {
      localStorage.setItem(
        'open-file:progress',
        JSON.stringify({ state: { onboarded: true, puzzleRating: 1200 }, version: 6 }),
      );
      // Seeded once; later pages keep what the test changed.
      if (!localStorage.getItem('open-file:settings')) {
        localStorage.setItem('open-file:settings', settingsJson);
      }
    },
    [JSON.stringify({ state: { playCoach: false, ...settings }, version: 3 })] as const,
  );
}

test.describe('notation', () => {
  test('moves are written with figurines by default, and with letters when asked', async ({
    page,
  }) => {
    await seed(page);
    await page.goto('/analyze');
    const board = await expectBoard(page);
    await playMove(board, 'e2', 'e4');
    await playMove(board, 'e7', 'e5');
    await playMove(board, 'g1', 'f3');
    const list = page.locator('.treemoves, .movelist').first();
    const knightMove = list.locator('.san', { hasText: 'f3' });
    await expect(knightMove).toBeVisible();
    await expect(knightMove.locator('piece.white.knight')).toHaveCount(1);
    // The letter is still there for screen readers, searches and copying.
    await expect(list).toContainText('Nf3');
    // The hidden letters in the engine lines must never widen the page (a phone
    // browser would zoom out to fit).
    await expect(page.locator('.line__pv .san').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    // (Less than none where the page keeps room for its scroll bar.)
    expect(overflow).toBeLessThanOrEqual(0);

    await page.goto('/settings');
    await page
      .getByRole('radiogroup', { name: 'Move notation' })
      .getByRole('radio', { name: 'Letters' })
      .click();
    await expect(page.getByTestId('notation-sample').locator('piece')).toHaveCount(0);
    await expect(page.getByTestId('notation-sample')).toContainText('2. Nf3 Nc6');
    await page.goto('/analyze');
    const board2 = await expectBoard(page);
    await playMove(board2, 'g1', 'f3');
    await expect(list).toContainText('Nf3');
    await expect(list.locator('piece')).toHaveCount(0);
  });
});

test.describe('colour scheme and board', () => {
  test('Nightshift, the piece sets and the palettes apply and persist', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    await page
      .getByRole('radiogroup', { name: 'Colour scheme' })
      .getByRole('radio', { name: 'Nightshift' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      siteConfig.backgroundColor,
    );
    // The page is the browser chrome's colour (the colours settle: their transitions are short).
    const [r, g, b] = [1, 3, 5].map((i) =>
      parseInt(siteConfig.backgroundColor.slice(i, i + 2), 16),
    );
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
      .toBe(`rgb(${r}, ${g}, ${b})`);

    // The picker shows every set at once, each drawn in its own style (the sets' stylesheets
    // load with the picker, so the strips are awaited).
    const picker = page.getByRole('group', { name: 'Piece set' });
    const sets = [
      'classic',
      'merida',
      'chessnut',
      'mpchess',
      'celtic',
      'california',
      'maestro',
      'staunty',
      'cardinal',
    ];
    await expect(picker.getByRole('button')).toHaveCount(sets.length);
    const strip = (set: string) => picker.locator(`.pieces-${set} piece.white.knight`);
    const knights = () =>
      Promise.all(
        sets.map((set) => strip(set).evaluate((el) => getComputedStyle(el).backgroundImage)),
      );
    await expect.poll(async () => new Set(await knights()).size).toBe(sets.length);
    const images = await knights();
    for (const image of images) expect(image).toContain('data:image/svg+xml');

    await page.getByTestId('pieces-merida').click();
    await expect(page.locator('html')).toHaveAttribute('data-pieces', 'merida');
    await page
      .getByRole('group', { name: 'Board theme' })
      .getByRole('button', { name: 'Ice' })
      .click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-pieces', 'merida');
    await expect(page.getByTestId('pieces-merida')).toHaveAttribute('aria-pressed', 'true');

    // The board shows the chosen set: the knight on the board is the Merida knight. (The board's
    // own stylesheet comes with its code-split chunk, so its styles are awaited, not read once.)
    await page.goto('/analyze');
    await expectBoard(page);
    const boardKnight = page.locator('cg-board piece.white.knight').first();
    await expect
      .poll(() => boardKnight.evaluate((el) => getComputedStyle(el).backgroundImage))
      .toBe(images[sets.indexOf('merida')]);
    await expect
      .poll(async () =>
        decodeURIComponent(
          await page
            .locator('cg-board')
            .first()
            .evaluate((el) => getComputedStyle(el).backgroundImage),
        ),
      )
      .toContain('#e8eef5');
  });

  test('board highlights can be turned off', async ({ page }) => {
    await seed(page, { boardHighlights: false });
    await page.goto('/analyze');
    const board = await expectBoard(page);
    await playMove(board, 'e2', 'e4');
    await expect(page.locator('cg-board piece.white.pawn').nth(4)).toBeVisible();
    const marked = await board.evaluate(
      (el) =>
        Array.from(el.querySelectorAll<HTMLElement>('square.last-move')).filter(
          (sq) => sq.style.display !== 'none',
        ).length,
    );
    expect(marked).toBe(0);
  });
});

test.describe('drag feel', () => {
  test('the dragged piece grows and a target marks its square; tap-only turns dragging off', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'a mouse drag; touch is covered by the unit tests');
    await seed(page);
    await page.goto('/analyze');
    const board = await expectBoard(page);
    const box = await revealBoard(board);
    const size = box.width / 8;
    const at = (file: number, rank: number) => ({
      x: box.x + file * size + size / 2,
      y: box.y + (8 - rank) * size + size / 2,
    });
    const e2 = at(4, 2);
    const e4 = at(4, 4);
    await page.mouse.move(e2.x, e2.y);
    await page.mouse.down();
    await page.mouse.move(e2.x + 10, e2.y - 10, { steps: 3 });
    await page.mouse.move(e4.x, e4.y, { steps: 8 });
    const dragging = page.locator('cg-board piece.dragging');
    await expect(dragging).toHaveCount(1);
    // The magnifier: the piece's own image is hidden and a bigger copy overflows its box.
    expect(
      await dragging.evaluate((el) => {
        const before = getComputedStyle(el, '::before');
        return [getComputedStyle(el).backgroundSize, before.backgroundSize, before.content];
      }),
    ).toEqual(['0px 0px', 'contain', '""']);
    const target = page.getByTestId('board-dragtarget');
    await expect(target).toBeVisible();
    await expect(target).toHaveClass(/board__dragtarget--circle/);
    expect(await target.evaluate((el) => el.style.left)).toBe('50%');
    expect(await target.evaluate((el) => el.style.top)).toBe('50%');
    await page.mouse.up();
    await expect(target).toBeHidden();
    await expect(page.locator('.treemoves, .movelist').first()).toContainText('e4');

    // Tap only: the same drag moves nothing; two taps still do.
    await page.goto('/settings');
    await page
      .getByRole('radiogroup', { name: 'Move pieces by' })
      .getByRole('radio', { name: 'Tap', exact: true })
      .click();
    await page.goto('/analyze');
    const board2 = await expectBoard(page);
    const box2 = await revealBoard(board2);
    const size2 = box2.width / 8;
    const from = { x: box2.x + 4 * size2 + size2 / 2, y: box2.y + 6 * size2 + size2 / 2 };
    const to = { x: from.x, y: from.y - 2 * size2 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator('cg-board piece.dragging')).toHaveCount(0);
    await expect(page.getByTestId('board-dragtarget')).toHaveCount(0);
    await expect(
      page.locator('.treemoves .treemoves__move, .movelist .movelist__move'),
    ).toHaveCount(0);
    // The press selected the pawn without dragging it; one tap on e4 completes the move.
    await clickSquare(board2, 'e4');
    await expect(page.locator('.treemoves, .movelist').first()).toContainText('e4');
  });
});

test.describe('play', () => {
  test('focus mode hides the chrome during a game and brings it back after', async ({ page }) => {
    await seed(page, { playFocus: true });
    await page.goto('/play/computer');
    await expect(page.locator('header.shell__header')).toBeVisible();
    await page.getByLabel('Engine level').selectOption('1');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expectBoard(page);
    await expect(page.locator('header.shell__header')).toBeHidden();
    await expect(page.locator('.shell')).toHaveClass(/shell--focus/);
    // The in-game toggle turns it off (and the setting with it).
    await page.getByTestId('focus-toggle').click();
    await expect(page.locator('header.shell__header')).toBeVisible();
    await page.getByTestId('focus-toggle').click();
    await expect(page.locator('header.shell__header')).toBeHidden();
    await page.getByRole('button', { name: 'Resign' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Resign' }).click();
    await expect(page.locator('header.shell__header')).toBeVisible();
    // Leaving the page never leaves the chrome hidden.
    await page.goto('/settings#play');
    await expect(page.locator('header.shell__header')).toBeVisible();
    await expect(page.getByRole('switch', { name: /^Focus mode/ })).toBeChecked();
  });
});
