import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { expectBoard } from './helpers';
import { type LiveRelay, livePlayer, startLiveRelay } from './live';

/**
 * 0.30.1, the online pages and the last of the 0.30 polish, on phones and desktops alike: a
 * game or room that is not there (or not yet) reads as every page does, its place in the app and
 * a title on the page's left edge; a race room says it is connecting and nothing else until it
 * has; an analysis room's board stays in view beside its long panel; and the simul's setup shows
 * its boards as they will start.
 *
 * Service workers are blocked: they would answer requests the routes must see.
 */
test.use({ serviceWorkers: 'block' });
test.describe.configure({ timeout: 120_000 });

const NOWHERE = 'AAAAAAAAAAAAAAAAAAAAAA';

let relay: LiveRelay | null = null;
test.afterEach(async () => {
  await relay?.stop();
  relay = null;
});

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('no box');
  return b;
}

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 600;

/** The page's header starts where the site's own does: the page grid's left edge. */
async function expectOnPageGrid(page: Page) {
  const brand = await box(page.locator('.shell__brand'));
  const title = await box(page.getByRole('heading', { level: 1 }));
  expect(Math.abs(title.x - brand.x)).toBeLessThanOrEqual(2);
}

const GONE = [
  { path: `/play/online/${NOWHERE}`, crumb: 'Play', title: 'Game not found', way: 'Back to Play' },
  { path: `/play/watch/${NOWHERE}`, crumb: 'Play', title: 'Game not found', way: 'Back to Play' },
  { path: `/play/race/${NOWHERE}`, crumb: 'Play', title: 'Room not found', way: 'Back to Play' },
  {
    path: `/play/duel/${NOWHERE}`,
    crumb: 'Play',
    title: 'No seat in this duel',
    way: 'Back to Play',
  },
  {
    path: `/analyze/together/${NOWHERE}`,
    crumb: 'Analyze',
    title: /^(Room not found|No such room)$/,
    way: 'Go to Analyze',
  },
];

test.describe('online pages with nothing to show', () => {
  for (const { path, crumb, title, way } of GONE) {
    test(`${path.split('/').slice(0, 3).join('/')}/… says so on the page grid`, async ({
      browser,
    }) => {
      relay = startLiveRelay();
      const page = await livePlayer(browser, relay, 'Quiet Rook');
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(
        page.locator('main').getByRole('link', { name: crumb, exact: true }),
      ).toBeVisible();
      const button = page.locator('main').getByRole('link', { name: way });
      await expect(button).toBeVisible();
      await expectOnPageGrid(page);
      // The way on lines up under the title, not centred in a card.
      const heading = await box(page.getByRole('heading', { level: 1 }));
      expect(Math.abs((await box(button)).x - heading.x)).toBeLessThanOrEqual(2);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    });
  }

  test('a race room says it is connecting, and offers nothing to join until it has', async ({
    page,
  }) => {
    // No relay: the connection never opens.
    await page.goto(`/play/race/${NOWHERE}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Puzzle race room' })).toBeVisible();
    await expect(page.getByText(/Connecting to the room…|Reconnecting…/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join the room' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Invite' })).toHaveCount(0);
    await expectOnPageGrid(page);
  });
});

test('an analysis room keeps its board in view beside the long panel, and says who is here', async ({
  browser,
}) => {
  relay = startLiveRelay();
  const host = await livePlayer(browser, relay, 'Patient Bishop');
  await host.goto(`/analyze?pgn=${encodeURIComponent('1. d4 d5 2. c4 e6')}`);
  await expect(host.getByRole('group', { name: 'Moves' })).toContainText('e6');
  await host.getByRole('button', { name: 'Analyse with a friend' }).click();
  await host
    .getByRole('dialog', { name: 'Analyse with a friend' })
    .getByRole('button', { name: 'Make the room' })
    .click();
  await expect(host.getByRole('button', { name: 'Leave the room' })).toBeVisible();
  // Alone, the news line says so rather than standing empty.
  await expect(host.getByTestId('together-news')).toHaveText('Nobody else is here yet.');
  if (isPhone(host)) return;
  // Wide screens: scrolled to the panel's end, the board is still on screen.
  await host.evaluate(() => {
    const scroller = document.querySelector('.shell__scroll');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
    else window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect(host.getByRole('region', { name: 'Messages' })).toBeInViewport();
  const board = await box(await expectBoard(host));
  const viewport = host.viewportSize();
  if (!viewport) throw new Error('no viewport');
  expect(board.y).toBeGreaterThanOrEqual(0);
  expect(board.y + board.height).toBeLessThanOrEqual(viewport.height);
});

test('the simul’s setup shows its boards as they will start', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('open-file:progress')) {
      localStorage.setItem(
        'open-file:progress',
        JSON.stringify({ state: { onboarded: true, puzzleRating: 1500 }, version: 8 }),
      );
    }
  });
  await page.goto('/arcade/simul');
  const preview = page.getByTestId('simul-preview');
  await expect(preview).toBeVisible();
  const setup = page.getByTestId('simul-setup');
  await setup.getByRole('radio', { name: '6' }).click();
  await expect(preview.getByRole('listitem')).toHaveCount(6);
  await setup.getByRole('radio', { name: 'Alternate' }).click();
  await expect(preview.getByRole('listitem').nth(0)).toContainText('you play white');
  await expect(preview.getByRole('listitem').nth(1)).toContainText('you play black');
  await setup.getByRole('radio', { name: '2' }).click();
  await expect(preview.getByRole('listitem')).toHaveCount(2);
});
