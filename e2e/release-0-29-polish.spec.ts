import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { expectBoard } from './helpers';

/**
 * 0.29, polish from the live site, on phones and desktops alike: Progress's strengths and
 * weaknesses no longer run a theme's name into its bar, and its recent puzzles show whole
 * ratings; a dialog scrolls in one place, not two; and a game against the computer is set up on
 * a screen of its own rather than in a dialog.
 */

const PROGRESS_KEY = 'open-file:progress';
const DAY = 86_400_000;

/** A returning learner (onboarded, the tour dismissed), with whatever else the test needs. */
async function seed(page: Page, state: Record<string, unknown> = {}) {
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    [
      PROGRESS_KEY,
      JSON.stringify({
        state: { onboarded: true, puzzleRating: 1445.3, tourDismissed: true, ...state },
        version: 8,
      }),
    ] as const,
  );
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox();
  if (!found) throw new Error('not laid out');
  return found;
}

/** Nothing on the page is wider than the screen. */
async function expectNoSidewaysScroll(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
}

test.describe('Progress', () => {
  // Long names on both sides ("Capturing the defender", "Discovered attack"), as on the live site.
  const themeStats = {
    attraction: { solved: 0, failed: 5 },
    sacrifice: { solved: 3, failed: 6 },
    capturingDefender: { solved: 2, failed: 5 },
    opening: { solved: 3, failed: 3 },
    advantage: { solved: 11, failed: 9 },
    middlegame: { solved: 23, failed: 14 },
    mateIn1: { solved: 25, failed: 4 },
    advancedPawn: { solved: 4, failed: 1 },
    discoveredAttack: { solved: 9, failed: 1 },
    pin: { solved: 7, failed: 2 },
    endgame: { solved: 32, failed: 13 },
  };

  for (const width of [320, 390, 1024, 1440]) {
    test(`strengths and weaknesses: names, figures and bars keep apart at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await seed(page, { themeStats });
      await page.goto('/progress');
      const report = page.getByTestId('themes-report');
      await expect(report).toBeVisible();
      const rows = report.getByRole('listitem');
      await expect(rows).toHaveCount(10);
      const reportBox = await box(report);
      for (const row of await rows.all()) {
        const name = await box(row.getByRole('link'));
        const figure = await box(row.locator('.themes-report__figure'));
        const bar = await box(row.locator('.themes-report__bar'));
        expect(overlaps(name, bar), await row.innerText()).toBe(false);
        expect(overlaps(name, figure), await row.innerText()).toBe(false);
        expect(overlaps(figure, bar), await row.innerText()).toBe(false);
        // Inside the card, and the bar not squeezed to nothing.
        for (const part of [name, figure, bar]) {
          expect(part.x).toBeGreaterThanOrEqual(reportBox.x - 0.5);
          expect(part.x + part.width).toBeLessThanOrEqual(reportBox.x + reportBox.width + 0.5);
        }
        expect(bar.width).toBeGreaterThan(80);
      }
      await expectNoSidewaysScroll(page);
    });
  }

  test('recent puzzles show whole ratings, and changes that add up', async ({ page }) => {
    await seed(page, {
      attempts: [
        {
          id: 'KDLgJ',
          puzzleRating: 1360,
          outcome: 'solved',
          hintUsed: false,
          ratingBefore: 1431,
          ratingAfter: 1446.3100785634942,
          themes: 'fork middlegame',
          at: Date.now() - DAY,
          durationMs: 30_000,
        },
        {
          id: '10GIL',
          puzzleRating: 1500,
          outcome: 'failed',
          hintUsed: false,
          ratingBefore: 1441.0002,
          ratingAfter: 1425.125675719823,
          themes: 'pin endgame',
          at: Date.now() - 2 * DAY,
          durationMs: 30_000,
        },
      ],
    });
    await page.goto('/progress');
    const table = page.getByRole('region', { name: 'Recent puzzles' }).getByRole('table');
    const rows = table.getByRole('row');
    await expect(rows.nth(1)).toContainText('1,446');
    await expect(rows.nth(1)).toContainText('+15');
    await expect(rows.nth(2)).toContainText('1,425');
    await expect(rows.nth(2)).toContainText('-16');
    await expect(table).not.toContainText('.31');
    await expectNoSidewaysScroll(page);
  });
});

test.describe('dialogs', () => {
  test('a tall dialog scrolls in one place: its body, never the dialog around it', async ({
    page,
  }) => {
    // Short enough that the releases do not fit.
    await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 520 });
    await seed(page);
    await page.goto('/settings#app');
    await page.getByRole('button', { name: 'What’s new', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'What’s new' });
    await expect(dialog).toBeVisible();
    const scroll = await dialog.evaluate((el) => {
      const body = el.querySelector('.dialog__body');
      return {
        dialog: el.scrollHeight - el.clientHeight,
        body: body ? body.scrollHeight - body.clientHeight : 0,
        fits: el.getBoundingClientRect().bottom <= window.innerHeight,
      };
    });
    expect(scroll.dialog).toBe(0);
    expect(scroll.body).toBeGreaterThan(0);
    expect(scroll.fits).toBe(true);
    // The title and the close button stay put while the body scrolls.
    await dialog.locator('.dialog__body').evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(dialog.getByRole('heading', { level: 2, name: 'What’s new' })).toBeInViewport();
    await expect(dialog.locator('.dialog__close')).toBeInViewport();
  });
});

test.describe('the new game screen', () => {
  test('sets a game up in the page, with a preview on wide screens and Start in reach on phones', async ({
    page,
    isMobile,
  }) => {
    await seed(page);
    await page.goto('/play/computer');
    const setup = page.getByRole('region', { name: 'New game' });
    await expect(setup).toBeVisible();
    // A screen of the page, not a dialog over it.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const start = setup.getByRole('button', { name: 'Start', exact: true });
    // Start can be pressed without scrolling, whatever the screen.
    await expect(start).toBeInViewport();
    await expectNoSidewaysScroll(page);

    const preview = page.locator('.play__boardcol');
    if (isMobile) {
      // A phone shows the form alone; the board comes with the game.
      await expect(preview).toBeHidden();
    } else {
      await expect(preview).toBeVisible();
      // The preview follows the choices: the side you play at the bottom.
      await expect(page.locator('.play__boardcol .cg-wrap.orientation-white')).toHaveCount(1);
      await setup
        .getByRole('radiogroup', { name: 'Your colour' })
        .getByRole('radio', { name: 'Black' })
        .click();
      await expect(page.locator('.play__boardcol .cg-wrap.orientation-black')).toHaveCount(1);
      // A preview is a picture, not a board to play on.
      await expect(page.getByRole('application')).toHaveCount(0);
    }

    // The opponents are cards that say what they are.
    const twoPlayers = setup.getByRole('radio', { name: 'Two players' });
    await twoPlayers.check();
    await expect(setup.getByLabel('Engine level')).toHaveCount(0);
    await expect(setup.getByRole('radiogroup', { name: 'Board faces' })).toBeVisible();
    await setup.getByRole('radio', { name: 'Stockfish' }).check();
    await setup.getByLabel('Engine level').selectOption('1');

    // Chess960: the start is drawn on the screen, and another can be drawn.
    await setup
      .getByRole('radiogroup', { name: 'Game' })
      .getByRole('radio', { name: 'Chess960' })
      .click();
    const drawn = setup.getByTestId('newgame-chess960');
    await expect(drawn).toHaveText(/^Position \d+$/);
    await expect(setup.getByRole('radio', { name: 'Human-like (Maia)' })).toBeDisabled();
    await setup.getByRole('button', { name: 'Another position' }).click();
    await expect(drawn).toHaveText(/^Position \d+$/);
    const number = (await drawn.textContent())?.replace('Position ', '') ?? '';
    await setup
      .getByRole('radiogroup', { name: 'Your colour' })
      .getByRole('radio', { name: 'White' })
      .click();

    await start.click();
    await expect(setup).toBeHidden();
    await expect(page.getByTestId('play-variant')).toHaveText(`Chess960 · position ${number}`);
    // The game is on the board, which has the focus for keyboard play.
    await expectBoard(page);
    await expect(page.getByRole('application')).toBeFocused();

    // "New game" brings the screen back, with a way back to the game as it was.
    await page.getByRole('button', { name: 'New game' }).first().click();
    await expect(setup).toBeVisible();
    await expect(setup.getByRole('heading', { name: 'New game' })).toBeFocused();
    try {
      await expect(setup.getByRole('heading', { name: 'New game' })).toBeInViewport();
    } catch (error) {
      // Where everything was, for a failure that only CI has shown: scroll, the card, the title.
      const where = await page.evaluate(() => {
        const box = (selector: string) => {
          const b = document.querySelector(selector)?.getBoundingClientRect();
          return b ? `${Math.round(b.top)}..${Math.round(b.bottom)}` : 'none';
        };
        return [
          `scrollY ${Math.round(document.querySelector('.shell__scroll')?.scrollTop ?? window.scrollY)} of ${document.querySelector('.shell__scroll')?.scrollHeight ?? document.documentElement.scrollHeight}`,
          `viewport ${window.innerHeight}`,
          `header ${box('.shell__header')}`,
          `panel ${box('.trainer__panel')}`,
          `card ${box('section.setup')}`,
          `title ${box('.setup__title')}`,
          `board column ${box('.play__boardcol')}`,
          `focus ${document.activeElement?.className ?? 'none'}`,
        ].join(' · ');
      });
      throw new Error(`${(error as Error).message}\n\nOn the page: ${where}`, { cause: error });
    }
    await setup.getByRole('button', { name: 'Back to the game' }).click();
    await expect(setup).toBeHidden();
    await expect(page.getByTestId('play-variant')).toHaveText(`Chess960 · position ${number}`);
    await expectNoSidewaysScroll(page);

    // Last, as the scan scrolls the page about: the screen passes an accessibility check.
    await page.getByRole('button', { name: 'New game' }).first().click();
    await expect(setup).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('main')
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('fits a 320px phone held upright and one held sideways', async ({ page }) => {
    await seed(page);
    for (const size of [
      { width: 320, height: 568 },
      { width: 740, height: 360 },
    ]) {
      await page.setViewportSize(size);
      await page.goto('/play/computer');
      const setup = page.getByRole('region', { name: 'New game' });
      await expect(setup).toBeVisible();
      await expect(page.locator('.play__boardcol')).toBeHidden();
      await expect(setup.getByRole('button', { name: 'Start', exact: true })).toBeInViewport();
      await expectNoSidewaysScroll(page);
      // The form scrolls with the page: no box of its own to scroll.
      const panel = page.locator('.trainer__panel');
      expect(await panel.evaluate((el) => getComputedStyle(el).overflowY)).toBe('visible');
    }
  });

  test('a phone held sideways scrolls the page alone, with the board kept in view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 740, height: 360 });
    await seed(page);
    for (const path of ['/play/computer', '/analyze', '/puzzles']) {
      await page.goto(path);
      if (path === '/play/computer') {
        await page.getByRole('button', { name: 'Start', exact: true }).click();
      }
      const board = await expectBoard(page);
      // No box scrolls inside the page: the panel is as tall as what it holds.
      const boxes = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('main *')]
          .filter((el) => {
            const style = getComputedStyle(el);
            return (
              /(auto|scroll)/.test(style.overflowY) &&
              el.scrollHeight > el.clientHeight &&
              el.clientHeight > 0 &&
              // The move lists keep to their size beside the board, as anywhere.
              !el.matches('.movelist, .treemoves')
            );
          })
          .map((el) => el.className),
      );
      expect(boxes, path).toEqual([]);
      // At the foot of the panel the whole board is still on screen, under the header.
      await page.evaluate(() => {
        const panel = document.querySelector('.trainer__panel');
        const scroller = document.querySelector('.shell__scroll');
        if (panel) {
          const cur = scroller ? scroller.scrollTop : window.scrollY;
          const next = panel.getBoundingClientRect().bottom + cur - innerHeight + 60;
          if (scroller) scroller.scrollTop = next;
          else window.scrollTo({ top: next, behavior: 'instant' });
        }
      });
      await expect
        .poll(() =>
          page.evaluate(() => {
            const rect = document.querySelector('cg-board')?.getBoundingClientRect();
            const header = document.querySelector('header')?.getBoundingClientRect();
            return (
              !!rect && !!header && rect.top >= header.bottom - 1 && rect.bottom <= innerHeight + 1
            );
          }),
        )
        .toBe(true);
      await expect(board).toBeVisible();
    }
  });
});
