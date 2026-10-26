import { expect, type Page, test } from '@playwright/test';
import { expectBoard, playMove } from './helpers';

/**
 * 0.27.1: a polish pass. Focus rings follow the keyboard, not a script's focus
 * after a click; course steps read without a doubled label; a lesson's buttons
 * share a phone's width two by two; the step on screen keeps its number when it
 * was done before; segmented controls wrap instead of running off the page.
 */
const PROGRESS_KEY = 'open-file:progress';

async function seedProgress(page: Page, state: Record<string, unknown>) {
  await page.addInitScript(
    ([storageKey, value]) => {
      if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, value);
    },
    [PROGRESS_KEY, JSON.stringify({ state, version: 8 })] as const,
  );
}

const outlineOf = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el ? getComputedStyle(el).outlineStyle : null;
  });

test.describe('0.27.1 polish', () => {
  test('a script’s focus after a click draws no ring; the keyboard brings it back', async ({
    page,
  }) => {
    await page.goto('/learn/basic-checkmates?step=2');
    const board = await expectBoard(page);
    await playMove(board, 'h1', 'h6');
    const playOn = page.getByTestId('lesson-play-on');
    // Enter still goes on from here: the focus is there, only the ring is left out.
    await expect(playOn).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.input))
      .toBe('pointer');
    expect(await outlineOf(page)).toBe('none');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(playOn).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.dataset.input)).toBe('keyboard');
    expect(await outlineOf(page)).toBe('solid');
  });

  test('course steps are named once, with their kind beside the details', async ({ page }) => {
    await seedProgress(page, { onboarded: true, puzzleRating: 1200 });
    await page.goto('/learn');
    await expect(page.getByTestId('course-first-steps')).toContainText(
      'Start: The board and the notation',
    );
    await expect(page.getByTestId('course-first-steps')).not.toContainText('Lesson:');

    await page.goto('/learn/course/first-steps');
    const row = page.getByRole('link', {
      // As the row shows it, title first (WCAG 2.5.3, Label in Name, since 0.32.1).
      name: /^The board and the notation, Lesson, \d+ min · Rules$/,
    });
    await expect(row.locator('.course__item-title')).toHaveText('The board and the notation');
    await expect(row).toContainText(/Lesson · \d+ min · Rules/);
    await expect(page.getByText('Up next: The board and the notation (The rules)')).toBeVisible();
  });

  test('the step on screen keeps its number when it was done before', async ({ page }) => {
    await seedProgress(page, {
      onboarded: true,
      puzzleRating: 1200,
      lessons: { 'basic-checkmates': { stepsDone: [0, 1], completedAt: null, lastVisitedAt: 1 } },
    });
    await page.goto('/learn/basic-checkmates?step=2');
    await expectBoard(page);
    const dot = page.locator('.lesson__stepdot[aria-current="step"]');
    await expect(dot).toHaveClass(/lesson__stepdot--done/);
    const { color, background } = await dot.evaluate((el) => {
      const style = getComputedStyle(el);
      return { color: style.color, background: style.backgroundColor };
    });
    expect(color).not.toBe(background);
  });

  test('on a phone, a lesson’s buttons share the width two by two', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'A phone layout');
    await page.goto('/learn/basic-checkmates?step=2');
    await expectBoard(page);
    const box = async (name: RegExp) =>
      (await page.locator('.lesson__actions').getByRole('button', { name }).boundingBox())!;
    const back = await box(/Back/);
    const hint = await box(/Hint/);
    const answer = await box(/Show answer/);
    const skip = await box(/Skip/);
    expect(Math.abs(back.y - hint.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(answer.y - skip.y)).toBeLessThanOrEqual(1);
    expect(answer.y).toBeGreaterThan(back.y);
    expect(Math.abs(back.width - hint.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(answer.width - back.width)).toBeLessThanOrEqual(1);
  });

  test('a segmented control wraps instead of running off a tablet’s page', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Sized here to a tablet');
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('/settings/lab');
    await expect(page.getByRole('radiogroup', { name: 'Piece set' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
