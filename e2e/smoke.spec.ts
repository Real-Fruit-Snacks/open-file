import { expect, test } from '@playwright/test';
import { completeOnboarding, expectBoard, playMove, waitForBoardIdle } from './helpers';

test.describe('shell', () => {
  test('home page renders and navigation works', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Open File/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Learn chess');
    // Desktop shows the header nav, phones the bottom bar — click whichever is visible.
    await page
      .getByRole('link', { name: 'Learn', exact: true })
      .locator('visible=true')
      .first()
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Learn' })).toBeVisible();
  });

  test('deep links resolve (SPA fallback)', async ({ page }) => {
    await page.goto('/learn/how-pieces-move');
    await expect(
      page.getByRole('heading', { level: 1, name: 'How the pieces move' }),
    ).toBeVisible();
  });

  test('unknown routes show the not-found page', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByText('That square is off the board')).toBeVisible();
  });

  test('serves a web app manifest and registers the service worker', async ({ page }) => {
    await page.goto('/');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();
    const manifest = await page.request.get(manifestHref as string);
    expect(manifest.ok()).toBeTruthy();
    const json = (await manifest.json()) as { name: string; display: string; icons: unknown[] };
    expect(json.name).toBe('Open File');
    expect(json.display).toBe('standalone');
    expect(json.icons.length).toBeGreaterThanOrEqual(3);

    const registered = await page.evaluate(async (): Promise<string> => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const reg = await navigator.serviceWorker.ready;
      return reg.active ? 'active' : 'inactive';
    });
    expect(['active', 'unsupported']).toContain(registered);
  });
});

test.describe('learn', () => {
  test('a lesson task answers a wrong move, then accepts the right one and says why', async ({
    page,
  }) => {
    await page.goto('/learn/how-pieces-move');
    const board = await expectBoard(page);
    const coach = page.getByTestId('coach-log');

    // Step 1 asks for Rh4. A wrong move first: the king takes the rook, and the coach says so.
    await playMove(board, 'd4', 'd8');
    await expect(coach).toContainText('Black simply takes it with Kxd8');
    await page.getByTestId('lesson-take-back').click();

    // Taken back: once the task waits for a move again, play the right one.
    await expect(page.getByRole('button', { name: 'Show answer' })).toBeEnabled();
    await waitForBoardIdle(page);
    await playMove(board, 'd4', 'h4');
    await expect(page.getByTestId('coach-good')).toContainText('fourth rank');
    await expect(page.getByTestId('coach-why')).toContainText('open lines');
    await expect(page.getByRole('button', { name: /Continue/ })).toBeVisible();
  });
});

test.describe('puzzles', () => {
  test('loads a rated puzzle after onboarding', async ({ page }) => {
    await page.goto('/puzzles');
    await completeOnboarding(page);
    await expectBoard(page);
    await expect(page.locator('.puzzle-status')).toContainText(/Your move/i, { timeout: 20_000 });
    await expect(page.getByText(/Puzzle rating/)).toBeVisible();
  });

  test('theme catalogue lists tactical motifs', async ({ page }) => {
    await page.goto('/puzzles');
    await completeOnboarding(page);
    await page.goto('/puzzles/themes');
    await expect(page.getByRole('link', { name: /^Fork/ })).toBeVisible();
    await page.getByRole('link', { name: /^Fork/ }).click();
    await expect(page.locator('.puzzle-status')).toContainText(/Your move|Watch/i, {
      timeout: 20_000,
    });
  });
});

test.describe('play', () => {
  test('the engine answers a move', async ({ page }) => {
    await page.goto('/play/computer');
    // The setup dialog opens automatically.
    await page.getByLabel('Engine level').selectOption('1');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const board = await expectBoard(page);
    await playMove(board, 'e2', 'e4');
    const list = page.getByLabel('Move list');
    await expect(list).toContainText('e4');
    // Engine reply appears as Black's first move.
    await expect(list.locator('.movelist__move')).toHaveCount(2, { timeout: 30_000 });
  });
});

test.describe('analyze', () => {
  test('shows engine lines for the start position', async ({ page }) => {
    await page.goto('/analyze');
    await expectBoard(page);
    await expect(page.locator('.line__score').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/depth \d+/)).toBeVisible({ timeout: 30_000 });
  });

  test('imports a FEN from the URL', async ({ page }) => {
    await page.goto('/analyze?fen=' + encodeURIComponent('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1'));
    const board = await expectBoard(page);
    await playMove(board, 'a1', 'a8');
    await expect(page.locator('.treemoves')).toContainText('Ra8#');
  });
});

test.describe('progress', () => {
  test('settings persist across reloads', async ({ page }) => {
    await page.goto('/settings');
    await page
      .getByRole('radiogroup', { name: 'Colour scheme' })
      .getByRole('radio', { name: 'Nightshift' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
