import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { expectBoard, playMove, waitForBoardIdle } from './helpers';

/**
 * 0.26.1: the learner sets the pace of a lesson. The coach's words stay up
 * until the learner goes on (the opponent's reply and the next question wait
 * for Continue), nothing scrolls them out of sight on its own — no page jump to
 * a button that takes the focus, no box scrolled back over what is being read
 * — and a hint asked for comes into view.
 */
const PROGRESS_KEY = 'open-file:progress';

/** A recall card for one lesson step ("lessonId:stepKey"), due a minute ago. */
async function seedDueRecallCard(page: Page, id: string) {
  await page.addInitScript(
    ([storageKey, cardId]) => {
      if (localStorage.getItem(storageKey)) return;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: {
            onboarded: true,
            puzzleRating: 1200,
            lessonRecall: {
              [cardId]: {
                id: cardId,
                rating: 0,
                themes: cardId.slice(0, cardId.lastIndexOf(':')),
                step: 1,
                due: Date.now() - 60_000,
                lapses: 0,
                addedAt: 1,
              },
            },
          },
          version: 8,
        }),
      );
    },
    [PROGRESS_KEY, id] as const,
  );
}

const scrollY = (page: Page) =>
  page.evaluate(() =>
    Math.round(document.querySelector('.shell__scroll')?.scrollTop ?? window.scrollY),
  );

/** Continue in a line: under the board on a phone (where the learner reads), in the panel otherwise. */
async function goOn(page: Page, isMobile: boolean, testId = 'lesson-play-on') {
  if (isMobile) {
    await page.getByTestId('coach-latest').locator('button', { hasText: 'Continue' }).click();
  } else {
    await page.getByTestId(testId).click();
  }
}

test.describe('the learner sets the pace', () => {
  test('the coach’s words stay up until Continue, then the reply and the next question', async ({
    page,
    isMobile,
  }) => {
    // The ladder mate: three rook moves, Black's king stepping back after each check.
    await page.goto('/learn/basic-checkmates?step=2');
    const board = await expectBoard(page);
    await playMove(board, 'h1', 'h6');
    // On a phone the words are read under the board; on a wide screen, in the panel beside it.
    const words = isMobile ? page.getByTestId('coach-latest') : page.getByTestId('coach-why');
    await expect(words).toContainText('So it has to step back');
    await expect(page.getByTestId('lesson-play-on')).toBeFocused();

    // Time to read: nothing moves on by itself, and the words stay in sight.
    await page.waitForTimeout(2500);
    await expect(page.getByTestId('coach-note')).toHaveCount(0);
    await expect(page.getByTestId('lesson-task')).toHaveCount(0);
    await expect(words).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Show answer' })).toHaveCount(0);

    await goOn(page, isMobile);
    await expect(page.getByTestId('coach-note')).toContainText('The king steps back');
    await expect(page.getByTestId('lesson-task')).toContainText('Now the rooks swap roles');
    await expect(page.getByTestId('lesson-play-on')).toHaveCount(0);
    if (isMobile) {
      // Under the board now: the reply's note and the new question, with the board in view.
      const latest = page.getByTestId('coach-latest');
      await expect(latest).toContainText('Now the rooks swap roles');
      await expect(latest).not.toContainText('So it has to step back');
      await expect(page.locator('.trainer__board')).toBeInViewport({ ratio: 0.95 });
    } else {
      // The box starts at the reply, with the coach's word on it and the question below.
      await expect(page.locator('.coach__move--them').last()).toBeInViewport();
      await expect(page.getByTestId('coach-note')).toBeInViewport();
      await expect(page.getByTestId('lesson-task')).toBeInViewport();
    }

    // → goes on too.
    await waitForBoardIdle(page);
    await playMove(board, 'a5', 'a7');
    await expect(page.getByTestId('lesson-play-on')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('lesson-task')).toContainText('checkmate in one');
  });

  test('a punished wrong move keeps the page where it is, with the words in sight', async ({
    page,
    isMobile,
  }) => {
    // "Is it really free?": the knight takes a pawn the d6 pawn protects.
    await page.goto('/learn/piece-values?step=4');
    const board = await expectBoard(page);
    await playMove(board, 'f3', 'e5');
    const before = await scrollY(page);
    const words = isMobile ? page.getByTestId('coach-latest') : page.getByTestId('coach-log');
    await expect(words).toContainText('That is the trap');
    // "Take back" has the focus (Enter takes the move back) without the page jumping to it.
    await expect(page.getByTestId('lesson-take-back')).toBeFocused();
    expect(Math.abs((await scrollY(page)) - before)).toBeLessThanOrEqual(2);
    await expect(page.locator('.trainer__board')).toBeInViewport({ ratio: 0.9 });
    await expect(words.getByText('That is the trap')).toBeInViewport();

    if (isMobile) await words.locator('button', { hasText: 'Take back' }).click();
    else await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Show answer' })).toBeEnabled();
    // Still what the coach said about it, under the board on a phone.
    await expect(words).toContainText('That is the trap');
  });

  test('a hint asked for comes into view, with the question', async ({ page, isMobile }) => {
    await page.goto('/learn/basic-checkmates?step=2');
    await expectBoard(page);
    await page.getByRole('button', { name: /Hint/ }).click();
    if (isMobile) {
      // Shown under the board too, where the move is made.
      await expect(page.getByTestId('coach-latest')).toContainText(
        'Which rook can check it there?',
      );
    }
    await expect(page.getByTestId('coach-hint')).toBeInViewport();
    await expect(page.getByTestId('lesson-task')).toBeInViewport();
  });

  test('the conversation box holds still while the words are read', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Phones show the whole conversation in the page, under the board');
    await page.goto('/learn/basic-checkmates?step=2');
    const board = await expectBoard(page);
    await playMove(board, 'h1', 'h6');
    const box = page.locator('.lesson__panel .coach');
    // The answer to the move starts in view: the move, what it does and why.
    await expect(page.locator('.coach__move--you').last()).toBeInViewport();
    await expect(page.getByTestId('coach-good')).toBeInViewport();
    const top = await box.evaluate((el) => el.scrollTop);
    await page.waitForTimeout(1500);
    expect(await box.evaluate((el) => el.scrollTop)).toBe(top);
  });

  test('recall waits on a line too, and grades without moving the page', async ({
    page,
    isMobile,
  }) => {
    await seedDueRecallCard(page, 'basic-checkmates:1');
    await page.goto('/learn/recall');
    const board = await expectBoard(page);
    await expect(page.getByTestId('lesson-task')).toContainText('Where does the other rook check?');
    await playMove(board, 'h1', 'h6');
    await expect(page.getByTestId('recall-play-on')).toBeFocused();
    await goOn(page, isMobile, 'recall-play-on');
    await expect(page.getByTestId('lesson-task')).toContainText('Climb one more rank');
    await waitForBoardIdle(page);
    await playMove(board, 'a5', 'a7');
    await goOn(page, isMobile, 'recall-play-on');
    await expect(page.getByTestId('lesson-task')).toContainText('checkmate in one');
    await waitForBoardIdle(page);
    await playMove(board, 'h6', 'h8');
    const before = await scrollY(page);
    await expect(page.getByTestId('recall-result')).toContainText('Recalled!');
    await expect(page.getByRole('button', { name: /Next/ })).toBeFocused();
    expect(Math.abs((await scrollY(page)) - before)).toBeLessThanOrEqual(2);
    await expect(page.locator('.trainer__board')).toBeInViewport({ ratio: 0.9 });
  });

  test('a lesson waiting for Continue has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/learn/basic-checkmates?step=2');
    const board = await expectBoard(page);
    await playMove(board, 'h1', 'h6');
    await expect(page.getByTestId('lesson-play-on')).toBeFocused();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // The chessground board draws pieces as CSS backgrounds inside custom elements.
      .exclude('cg-board')
      .exclude('.toasts')
      .analyze();
    const violations = results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
    }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
