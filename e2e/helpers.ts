import { expect, type Locator, type Page } from '@playwright/test';

const FILES = 'abcdefgh';

/**
 * Scrolls so that the board sits between the sticky header and the bottom
 * navigation (which overlay the page), and returns its bounding box.
 */
export async function revealBoard(board: Locator) {
  // A board is re-created when it switches between view-only and interactive
  // (for example once the engine is ready); if that happens mid-scroll, try again.
  try {
    await board.scrollIntoViewIfNeeded();
  } catch {
    await board.page().waitForTimeout(300);
    await board.scrollIntoViewIfNeeded();
  }
  const adjusted = await board.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    const nav = document.querySelector('.shell__bottomnav');
    const navTop =
      nav && getComputedStyle(nav).display !== 'none'
        ? nav.getBoundingClientRect().top
        : window.innerHeight;
    const free = navTop - header;
    // Centre the board in the free area when it fits, otherwise align its top under the header.
    const target = rect.height <= free ? header + (free - rect.height) / 2 : header + 8;
    const delta = rect.top - target;
    // Instant, not smooth: the click coordinates are measured right after this.
    const scroller = document.querySelector('.shell__scroll');
    if (Math.abs(delta) > 1) {
      if (scroller) scroller.scrollTop += delta;
      else window.scrollBy({ top: delta, behavior: 'instant' });
    }
    return delta;
  });
  // Let the scroll event reach chessground, which recomputes its cached bounds on it.
  if (Math.abs(adjusted) > 1) await board.page().waitForTimeout(150);
  // Any scroll above is delivered as an event on the next frame; wait for it either way.
  await board.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  const box = await board.boundingBox();
  if (!box) throw new Error('Board is not visible');
  return box;
}

/** Closes every toast currently on screen. */
export async function dismissToasts(page: Page) {
  const buttons = page.locator('.toast button[aria-label="Dismiss"]');
  const count = await buttons.count();
  for (let i = 0; i < count; i += 1) {
    await buttons
      .first()
      .click({ timeout: 2000 })
      .catch(() => undefined);
  }
}

/**
 * Clicks a square on a chessground board, taking the board orientation into
 * account. Chessground supports click-to-move, so two calls make a move.
 */
export async function clickSquare(
  board: Locator,
  square: string,
  orientation: 'white' | 'black' = 'white',
) {
  // A toast (for example "Ready to work offline") can float over the bottom of
  // the board and swallow the click, so dismiss any first.
  await dismissToasts(board.page());
  // Clicks land at viewport coordinates, so the board must be fully on screen
  // and clear of the sticky header and the mobile bottom navigation.
  const box = await revealBoard(board);
  const file = FILES.indexOf(square[0] ?? '');
  const rank = Number(square[1]) - 1;
  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;
  const size = box.width / 8;
  await board.page().mouse.click(box.x + col * size + size / 2, box.y + row * size + size / 2);
}

export async function playMove(
  board: Locator,
  from: string,
  to: string,
  orientation: 'white' | 'black' = 'white',
) {
  await clickSquare(board, from, orientation);
  await clickSquare(board, to, orientation);
}

/**
 * Dismisses the puzzle onboarding (if shown) with a self-assessed level, so
 * tests get the ordinary rated mode rather than a calibration run.
 */
export async function completeOnboarding(page: Page) {
  // The page is code-split, so wait until either the onboarding or a board is on screen.
  await page.locator('cg-board, button:has-text("Start")').first().waitFor();
  const option = page.getByText('I know the rules and play occasionally');
  if (await option.isVisible()) {
    await option.click();
    await page.getByRole('button', { name: /Start solving/ }).click();
  }
}

export async function expectBoard(page: Page): Promise<Locator> {
  const board = page.locator('cg-board').first();
  await expect(board).toBeVisible();
  return board;
}

/**
 * Clicks a lesson's Continue button (the one to the next step) and waits for the
 * next step to render, so the caller never reads the previous step's buttons by
 * mistake.
 */
export async function continueLesson(page: Page) {
  const current = page.locator('.lesson__stepdot[aria-current="step"]');
  const before = await current.getAttribute('aria-label');
  await page.getByTestId('lesson-continue').click();
  await expect(current).not.toHaveAttribute('aria-label', before ?? '');
}

/**
 * Goes on in a lesson's line once the coach has explained a move: Continue
 * plays the opponent's reply and asks the next question (or ends the line).
 */
export async function playOnInLesson(page: Page) {
  const playOn = page.getByTestId('lesson-play-on');
  await playOn.click();
  await expect(playOn).toHaveCount(0);
}

/**
 * Works through a lesson from the current step to its end: "Show answer" for
 * every move of every line, Continue to the opponent's reply and the next
 * question after each, Continue between steps, "Finish" at the end. `solve`
 * plays a move by hand instead whenever its question is the one waiting.
 */
export async function showAnswersToTheEnd(
  page: Page,
  solve?: { prompt: string; play: () => Promise<void> },
) {
  const question = page.getByTestId('lesson-task');
  const playOn = page.getByTestId('lesson-play-on');
  const next = page.getByTestId('lesson-continue');
  const action = page.locator(
    '[data-testid="lesson-play-on"], button:has-text("Show answer"):enabled, [data-testid="lesson-continue"]',
  );
  for (let i = 0; i < 120; i++) {
    await action.first().waitFor();
    if (await playOn.isVisible()) {
      await playOnInLesson(page);
      continue;
    }
    if (await next.isVisible()) {
      if (((await next.textContent()) ?? '').includes('Finish')) {
        await next.click();
        return;
      }
      await continueLesson(page);
      continue;
    }
    // The question waiting now; the next one only comes after the opponent's reply.
    const asked = (await question.textContent()) ?? '';
    if (solve && asked.includes(solve.prompt)) await solve.play();
    else await page.getByRole('button', { name: 'Show answer' }).click();
    await expect(question.filter({ hasText: asked })).toHaveCount(0);
  }
  throw new Error('The lesson did not come to an end');
}

/**
 * Waits until no piece on the board is moving or fading out: chessground marks
 * those with the `anim` and `fading` classes for the length of the animation.
 * Use it, after the app's own signal that a move was made or taken back, in
 * place of a fixed wait before the next click on a piece.
 */
export async function waitForBoardIdle(page: Page) {
  // chessground draws on the next animation frame: let a pending redraw start first.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await expect(page.locator('cg-board piece.anim, cg-board piece.fading')).toHaveCount(0);
}
