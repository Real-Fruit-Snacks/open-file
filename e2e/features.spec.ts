import { expect, test } from '@playwright/test';
import { completeOnboarding, expectBoard, playMove } from './helpers';

test.describe('navigation', () => {
  test('the More menu reaches the secondary sections', async ({ page, isMobile }) => {
    await page.goto('/');
    const more = page.getByRole('region', { name: 'More sections' });
    await page.getByRole('button', { name: /More/ }).click();
    await more.getByRole('link', { name: /Reference/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Reference' })).toBeVisible();
    if (isMobile) {
      await page.getByRole('button', { name: /More/ }).click();
      await more.getByRole('link', { name: /Drills/ }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Drills' })).toBeVisible();
    }
  });
});

test.describe('play with a clock', () => {
  test('clocks appear and count for the side to move', async ({ page }) => {
    await page.goto('/play/computer');
    await page.getByLabel('Engine level').selectOption('1');
    await page.getByLabel('Time control').selectOption('3+2');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const board = await expectBoard(page);
    await expect(page.locator('.clock')).toHaveCount(2);
    await expect(page.locator('.clock').first()).toHaveText('3:00');
    await playMove(board, 'e2', 'e4');
    // After the engine replies White's clock is running.
    await expect(page.locator('.clock--running')).toHaveCount(1, { timeout: 30_000 });
  });

  test('keyboard move entry plays a move', async ({ page }) => {
    await page.goto('/play/computer');
    await page.getByLabel('Engine level').selectOption('1');
    await page.getByText('Keyboard move entry', { exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expectBoard(page);
    const input = page.getByPlaceholder(/Type a move/);
    await input.fill('Kd8');
    await input.press('Enter');
    await expect(page.locator('.moveinput__error')).toContainText(/not a legal move/);
    await input.fill('e4');
    await input.press('Enter');
    await expect(page.getByLabel('Move list')).toContainText('e4');
  });
});

test.describe('analysis board', () => {
  test('imports a PGN with variations and names the opening', async ({ page }) => {
    await page.goto('/analyze');
    await page.getByRole('button', { name: 'Import FEN / PGN' }).click();
    await page
      .locator('textarea')
      .fill('1. e4 e5 2. Nf3 (2. Bc4 Nf6) Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *');
    await page.getByRole('button', { name: 'Load', exact: true }).click();
    await expect(page.locator('.analyze__opening')).toContainText('Ruy Lopez');
    await expect(page.locator('.treemoves')).toContainText('Bc4');
    // Moves are buttons named as written, then in words ("2. Bc4, bishop f1 to c4"); find this
    // one by its notation.
    await page.locator('.treemoves__move').filter({ hasText: 'Bc4' }).click();
    await expect(page.locator('.analyze__opening')).toContainText('Bishop’s Opening');
    await page.getByRole('button', { name: 'Make main line' }).click();
    await expect(page.locator('.treemoves__move').nth(2)).toContainText('Bc4');
  });

  test('board editor sets up a position', async ({ page }) => {
    await page.goto('/analyze');
    await expectBoard(page);
    await page.getByRole('button', { name: 'Board editor' }).click();
    await page.getByRole('button', { name: 'Clear board' }).click();
    await expect(page.getByText(/exactly one king/)).toBeVisible();
    await page.getByRole('button', { name: 'White king' }).click();
    await page.getByRole('button', { name: 'e1, empty', exact: true }).click();
    await page.getByRole('button', { name: 'Black king' }).click();
    await page.getByRole('button', { name: 'e8, empty', exact: true }).click();
    await page.getByRole('button', { name: 'White queen' }).click();
    await page.getByRole('button', { name: 'd1, empty', exact: true }).click();
    await expect(page.locator('.editor__fen')).toHaveText('4k3/8/8/8/8/8/8/3QK3 w - - 0 1');
    await page.getByRole('button', { name: 'Analyze this position' }).click();
    const board = await expectBoard(page);
    await playMove(board, 'd1', 'd8');
    await expect(page.locator('.treemoves')).toContainText('Qd8+');
  });
});

test.describe('puzzle rush', () => {
  test('starts a timed run', async ({ page }) => {
    await page.goto('/puzzles');
    await completeOnboarding(page);
    await page.goto('/puzzles/rush');
    await page.getByRole('button', { name: '3 minutes' }).click();
    await expect(page.locator('.puzzle-status')).toContainText(/Your move|Watch/i, {
      timeout: 20_000,
    });
    await expect(page.locator('.rush__hud')).toContainText('Time left');
    await page.getByRole('button', { name: 'End run' }).click();
    await expect(page.locator('.rush__start')).toContainText(/solved/);
  });
});

test.describe('drills', () => {
  test('coordinates drill scores a correct click', async ({ page }) => {
    await page.goto('/drills/coordinates');
    await page.getByRole('button', { name: /Start · 30/ }).click();
    const target = (await page.locator('.drill__prompt').textContent())?.trim() ?? '';
    expect(target).toMatch(/^[a-h][1-8]$/);
    await page.getByRole('button', { name: target, exact: true }).click();
    await expect(page.locator('.drill__hud')).toContainText('1');
  });

  test('an endgame drill starts against the engine', async ({ page }) => {
    await page.goto('/drills/endgame/mate-kq');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const board = await expectBoard(page);
    await expect(board).toBeVisible();
    await expect(page.getByRole('button', { name: 'Give up' })).toBeEnabled();
    await page.getByRole('button', { name: 'Give up' }).click();
    await expect(page.locator('.summary')).toContainText(/Given up/);
  });
});

test.describe('openings', () => {
  test('lists repertoires and starts learning one', async ({ page }) => {
    await page.goto('/openings');
    await expect(page.getByRole('link', { name: 'Italian Game' })).toBeVisible();
    await page.goto('/openings/italian');
    await page.getByRole('button', { name: /Start learning/ }).click();
    await expect(page.locator('.puzzle-status')).toContainText(/New move/);
    const board = await expectBoard(page);
    await playMove(board, 'e2', 'e4');
    // The opponent answers from the repertoire and it is our move again.
    await expect(page.locator('.puzzle-status')).toContainText(/New move|Your move/, {
      timeout: 10_000,
    });
    await expect(page.locator('.openings__line')).toContainText('e4');
  });
});

test.describe('classic games', () => {
  test('replays the opening and accepts the game move', async ({ page }) => {
    await page.goto('/classics/reti-tartakower');
    await page.getByRole('button', { name: 'Skip the opening' }).click();
    await expect(page.locator('.puzzle-status')).toContainText(/Move 5/);
    const board = await expectBoard(page);
    await playMove(board, 'd1', 'd3');
    await expect(page.locator('.puzzle-status')).toContainText(/3 points/);
  });
});

test.describe('reference', () => {
  test('glossary search filters terms', async ({ page }) => {
    await page.goto('/reference');
    await page.getByPlaceholder('Search terms…').fill('zwischen');
    await expect(page.locator('.reference__entry')).toHaveCount(1);
    await expect(page.locator('.reference__entry')).toContainText('Zwischenzug');
  });
});
