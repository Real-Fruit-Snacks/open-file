import { expect, type Page, test } from '@playwright/test';
import { siteConfig } from '../src/site.config';
import { completeOnboarding, expectBoard } from './helpers';

/**
 * 0.12: the app shell — scrolling, the skip link, dialogs, toasts, the "More"
 * disclosure, the sideways-phone and 320px layouts, the 404 page and the
 * pre-paint theme.
 */
async function seed(page: Page, settings: Record<string, unknown> = {}) {
  await page.addInitScript(
    ([progress, settingsJson]) => {
      if (!localStorage.getItem('open-file:progress')) {
        localStorage.setItem('open-file:progress', progress);
      }
      if (settingsJson) localStorage.setItem('open-file:settings', settingsJson);
    },
    [
      JSON.stringify({ state: { onboarded: true, puzzleRating: 1200 }, version: 6 }),
      Object.keys(settings).length ? JSON.stringify({ state: settings, version: 3 }) : '',
    ] as const,
  );
}

test.describe('shell', () => {
  test('a new page opens at the top, and back restores the old offset', async ({ page }) => {
    await seed(page);
    await page.goto('/learn');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
    const scrolled = await page.evaluate(() => window.scrollY);
    expect(scrolled).toBeGreaterThan(400);

    // In-app navigation: the header link on a desktop, the bottom-bar one on a phone.
    await page.getByRole('link', { name: 'Puzzles', exact: true }).locator('visible=true').click();
    await expect(page).toHaveURL(/\/puzzles$/);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);

    await page.goBack();
    await expect(page).toHaveURL(/\/learn$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
  });

  test('the skip link focuses the page without touching the URL hash', async ({ page }) => {
    await seed(page);
    await page.goto('/analyze#z=abc');
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#z=abc');
    // The fragment was not re-parsed: one warning for the bad link, not two.
    await expect(page.locator('.toast--warning')).toHaveCount(1);
    // A focused <main> draws no ring round the whole page.
    const outline = await page
      .locator('main#main')
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe('none');
  });

  test('dialogs have a labelled close button', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await expect(page.locator('main h1, main h2').first()).toBeAttached();
    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog).toBeVisible();
    // The page behind it does not scroll.
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
    await dialog.getByRole('button', { name: 'Close', exact: true }).first().click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });

  test('toasts carry their tone and sit in a permanent live region', async ({ page }) => {
    await seed(page);
    await page.goto('/settings/lab');
    await expect(page.locator('main h1').first()).toBeVisible();
    // The live region is in the document before any toast, so the first one is announced.
    const region = page.getByTestId('toasts');
    await expect(region).toBeAttached();
    await expect(region).toHaveAttribute('aria-live', 'polite');
    await expect(region.locator('.toast')).toHaveCount(0);

    await page.getByTestId('toast-success').click();
    // (The service worker's own "Ready to work offline" toast may arrive meanwhile.)
    const success = page.locator('.toast--success', { hasText: 'A success toast.' });
    await expect(success).toBeVisible();
    await expect(success.locator('.toast__icon .icon--check')).toBeAttached();
    await expect(success).not.toHaveAttribute('role', 'alert');
    await page.getByTestId('toast-danger').click();
    const danger = page.locator('.toast--danger');
    await expect(danger).toBeVisible();
    await expect(danger).toHaveAttribute('role', 'alert');
    // The same message again refreshes the toast rather than stacking a copy.
    await page.getByTestId('toast-danger').click();
    await expect(page.locator('.toast--danger')).toHaveCount(1);
    await danger.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.locator('.toast--danger')).toHaveCount(0);
  });

  test('the More disclosure closes on Escape and returns focus to its button', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    const button = page.getByRole('button', { name: 'More' });
    await button.focus();
    await page.keyboard.press('Enter');
    const panel = page.getByRole('region', { name: 'More sections' });
    await expect(panel).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    // Plain links, grouped under headings; no menu roles.
    await expect(panel.getByRole('menuitem')).toHaveCount(0);
    await expect(panel.getByRole('link', { name: /Settings/ })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('link').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('the 404 page has an h1 and a way home', async ({ page }) => {
    await seed(page);
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();
  });

  // The black scheme went in 0.32: a save that still names it shows the dark one from the start.
  for (const saved of ['dark', 'black'] as const) {
    test(`a saved ${saved} scheme applies as Nightshift before the app chunk runs`, async ({
      page,
    }) => {
      await seed(page, { colorScheme: saved });
      // Block the app's own script: whatever is on <html> now came from the inline script.
      await page.route(/\/assets\/.*\.js$/, (route) => route.abort());
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      const themeColor = await page
        .locator('meta[name="theme-color"]')
        .first()
        .getAttribute('content');
      expect(themeColor).toBe(siteConfig.backgroundColor);
      await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
      await page.unroute(/\/assets\/.*\.js$/);
    });
  }

  test('the title and social tags come from one site config', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Open File — Learn, practise and solve at any level/);
    expect(await page.locator('meta[property="og:url"]').getAttribute('content')).toMatch(
      /^https:\/\//,
    );
    expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(
      /^https:\/\/.*icon-512\.png$/,
    );
    expect(await page.locator('meta[name="twitter:card"]').getAttribute('content')).toBe('summary');
  });
});

test.describe('sideways phone', () => {
  test.use({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });

  test('a large phone held sideways keeps the whole board on screen', async ({ page }) => {
    await seed(page);
    await page.goto('/puzzles');
    await completeOnboarding(page);
    await expectBoard(page);
    const layout = await page.evaluate(() => {
      const board = document.querySelector('cg-board')?.getBoundingClientRect();
      const header = document.querySelector('header')?.getBoundingClientRect();
      return {
        boardHeight: board?.height ?? -1,
        headerHeight: header?.height ?? -1,
        viewport: window.innerHeight,
      };
    });
    // The compact header, not the 60px desktop one; and the board fits under it.
    expect(layout.headerHeight).toBeLessThanOrEqual(48);
    expect(layout.boardHeight).toBeLessThan(layout.viewport - layout.headerHeight);
    expect(layout.boardHeight).toBeGreaterThan(200);
  });
});

test.describe('320px phone', () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });

  test('the bottom bar fits and nothing scrolls sideways', async ({ page }) => {
    await seed(page);
    for (const path of ['/', '/learn', '/settings']) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      const widths = await page.evaluate(() => ({
        nav: document.querySelector('.shell__bottomnav')?.getBoundingClientRect().width ?? -1,
        document: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      expect(widths.nav, path).toBeLessThanOrEqual(widths.viewport);
      expect(widths.document, path).toBeLessThanOrEqual(widths.viewport);
    }
    // Every bottom-bar label is still legible.
    const sizes = await page
      .locator('.shell__bottomlink')
      .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(12);
  });
});
