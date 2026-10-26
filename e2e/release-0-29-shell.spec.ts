import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * 0.29, the shell: quick search (Ctrl+K / Cmd+K or the header's magnifying glass: pages,
 * lessons, openings, puzzles, games, the reference and the Settings cards, by keyboard or
 * pointer) and "What's new" (Home's card for a returning learner after a new version, and the
 * releases in Settings → App).
 */

const VERSION = (
  JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')) as {
    version: string;
  }
).version;
/**
 * The release whose news the app shows, as it names it: "0.30" for 0.30.0, and for 0.30.1 too,
 * since a patch release has no highlights of its own (What's new shows its minor release's).
 */
const LABEL = VERSION.replace(/\.\d+$/, '');

const PROGRESS_KEY = 'open-file:progress';
const SEEN_KEY = 'open-file:seen-version';

/**
 * A returning learner (onboarded, the tour dismissed), with the version last seen: null for a
 * device from before the card. Set once, so reloads keep what the page saved.
 */
async function seed(page: Page, seen: string | null = VERSION) {
  await page.addInitScript(
    ([progressKey, progress, seenKey, seenVersion]) => {
      if (localStorage.getItem(progressKey)) return;
      localStorage.setItem(progressKey, progress);
      if (seenVersion) localStorage.setItem(seenKey, seenVersion);
    },
    [
      PROGRESS_KEY,
      JSON.stringify({
        state: { onboarded: true, puzzleRating: 1200, tourDismissed: true },
        version: 8,
      }),
      SEEN_KEY,
      seen ?? '',
    ] as const,
  );
}

const searchDialog = (page: Page) => page.getByRole('dialog', { name: 'Search' });
const searchField = (page: Page) => page.getByRole('combobox', { name: 'Search the app' });
const searchButton = (page: Page) => page.getByRole('button', { name: 'Search', exact: true });
/**
 * An option's name: its title, what it shows under the title if anything, then its kind
 * ("Puzzle Rush, Puzzles", or "Learn, Lessons and courses, Page").
 */
const optionName = (title: string, kind: string) => {
  const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${literal(title)}, (.+, )?${literal(kind)}$`);
};

/** The option the field's aria-activedescendant points at. */
async function activeOptionName(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const field = document.querySelector('[role="combobox"]');
    const id = field?.getAttribute('aria-activedescendant');
    return id ? (document.getElementById(id)?.getAttribute('aria-label') ?? null) : null;
  });
}

test.describe('quick search', () => {
  test('Ctrl+K opens it on any page; Enter opens a lesson, an opening, a Settings card', async ({
    page,
  }) => {
    await seed(page);
    await page.goto('/learn');
    await expect(page.locator('main h1').first()).toBeVisible();

    await page.keyboard.press('Control+K');
    await expect(searchDialog(page)).toBeVisible();
    await expect(searchField(page)).toBeFocused();
    await searchField(page).fill('castling lesson');
    await expect(
      page.getByRole('option', {
        name: optionName('Castling, en passant and promotion', 'Lesson'),
      }),
    ).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/learn\/special-moves$/);
    await expect(searchDialog(page)).toBeHidden();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Castling, en passant and promotion' }),
    ).toBeVisible();
    // The new page takes the focus, as after any navigation.
    await expect(page.locator('main#main')).toBeFocused();

    await page.keyboard.press('Control+K');
    await searchField(page).fill('caro');
    await expect(
      page.getByRole('option', { name: optionName('Caro-Kann Defence', 'Opening') }),
    ).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/openings\/caro-kann$/);

    await page.keyboard.press('Meta+K');
    await expect(searchDialog(page)).toBeVisible();
    await searchField(page).fill('backups');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/settings#backups$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Backups' })).toBeInViewport();
  });

  test('the header button opens it; arrows, Enter and the pointer choose', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await expect(page.getByTestId('home-today')).toBeVisible();
    await searchButton(page).click();
    await expect(searchDialog(page)).toBeVisible();
    // Before anything is typed: the places to go.
    const places = page.getByRole('listbox', { name: 'Places to go' });
    await expect(places.getByRole('option', { name: optionName('Learn', 'Page') })).toBeVisible();
    await expect(places.getByRole('option')).toHaveCount(14);

    await searchField(page).fill('rush');
    await expect(page.getByRole('listbox', { name: 'Results' })).toBeVisible();
    // The results grow as the lists arrive (the puzzle themes wait for the puzzle index): the
    // arrows move through what is shown, so wait for the second result before moving to it.
    await expect(
      page.getByRole('option', { name: optionName('Crushing', 'Puzzles') }),
    ).toBeVisible();
    await expect.poll(() => activeOptionName(page)).toMatch(optionName('Puzzle Rush', 'Puzzles'));
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(() => activeOptionName(page))
      .not.toMatch(optionName('Puzzle Rush', 'Puzzles'));
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => activeOptionName(page)).toMatch(optionName('Puzzle Rush', 'Puzzles'));
    await expect(
      page.getByRole('option', { name: optionName('Puzzle Rush', 'Puzzles') }),
    ).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/puzzles\/rush$/);

    // The last search is still there, selected: typing replaces it.
    await searchButton(page).click();
    await expect(searchField(page)).toHaveValue('rush');
    await page.keyboard.type('ghost');
    await expect(searchField(page)).toHaveValue('ghost');
    await page.getByRole('option', { name: optionName('Ghost Knight', 'Arcade game') }).click();
    await expect(page).toHaveURL(/\/arcade\/ghost-knight$/);
    await expect(searchDialog(page)).toBeHidden();
  });

  test('finds a glossary term and lands on it', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await expect(page.getByTestId('home-today')).toBeVisible();
    await page.keyboard.press('Control+K');
    await searchField(page).fill('zugzwang');
    await page.getByRole('option', { name: optionName('Zugzwang', 'Reference') }).click();
    await expect(page).toHaveURL(/\/reference#glossary-zugzwang$/);
    await expect(page.locator('#glossary-zugzwang')).toBeInViewport();
  });

  test('Esc closes it and gives the focus back; text fields keep their own Ctrl+K', async ({
    page,
  }) => {
    await seed(page);
    await page.goto('/reference');
    await expect(page.locator('main h1').first()).toBeVisible();
    await searchButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(searchField(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(searchDialog(page)).toBeHidden();
    await expect(searchButton(page)).toBeFocused();

    await page.getByPlaceholder('Search terms…').focus();
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(300);
    await expect(searchDialog(page)).toBeHidden();
  });

  test('tells a screen reader what it found, and passes an accessibility check', async ({
    page,
  }) => {
    await seed(page);
    await page.goto('/');
    // The shortcut is the app's once it has started: a key pressed while the page is still
    // starting up (as soon as `load`, in a busy WebKit) goes to the browser instead.
    await expect(page.getByTestId('home-today')).toBeVisible();
    await page.keyboard.press('Control+K');
    const field = searchField(page);
    await field.fill('fork');
    const listbox = page.getByRole('listbox', { name: 'Results' });
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-controls', (await listbox.getAttribute('id')) ?? '');
    await expect(listbox.getByRole('group', { name: 'Puzzles' })).toBeVisible();
    await expect(searchDialog(page).getByRole('status')).toHaveText(/^\d+ results?$/);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('dialog.search')
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);

    await field.fill('xyzzy');
    await expect(searchDialog(page).getByText('Nothing found for “xyzzy”')).toBeVisible();
    await expect(field).toHaveAttribute('aria-expanded', 'false');
  });

  test('is listed with the keyboard shortcuts', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the shortcut list is for keyboards');
    await seed(page);
    await page.goto('/');
    await expect(page.getByTestId('home-today')).toBeVisible();
    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog.getByText(/^Search lessons, openings, puzzles and settings/)).toBeVisible();
  });

  test('costs nothing at start-up: its code arrives when it is first wanted', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await expect(page.getByTestId('home-today')).toBeVisible();
    const loaded = () =>
      page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .some((entry) => /\/SearchDialog-[\w-]+\.js$/.test(entry.name)),
      );
    expect(await loaded()).toBe(false);
    await searchButton(page).click();
    await expect(searchDialog(page)).toBeVisible();
    expect(await loaded()).toBe(true);
  });
});

test.describe('in Nightshift, the dark scheme', () => {
  test('the search results and the card read clearly', async ({ page }) => {
    await seed(page, '0.0.1');
    await page.addInitScript(
      (value) => {
        localStorage.setItem('open-file:settings', value);
      },
      JSON.stringify({ state: { colorScheme: 'dark' }, version: 3 }),
    );
    await page.goto('/');
    await expect(page.getByTestId('whats-new')).toBeVisible();
    await page.keyboard.press('Control+K');
    await searchField(page).fill('mate');
    await expect(page.getByRole('listbox', { name: 'Results' })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('dialog.search')
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    await page.keyboard.press('Escape');
    const card = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('[data-testid="whats-new"]')
      .analyze();
    expect(card.violations, JSON.stringify(card.violations, null, 2)).toEqual([]);
  });
});

test.describe('quick search on a 320px phone', () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });

  test('the header keeps its search and theme buttons, and nothing scrolls sideways', async ({
    page,
  }) => {
    await seed(page);
    for (const path of ['/', '/settings']) {
      await page.goto(path);
      await expect(page.locator('main h1, main h2').first()).toBeAttached();
      const layout = await page.evaluate(() => {
        const box = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
        return {
          brand: box('.shell__brand'),
          search: box('[data-testid="search-button"]'),
          header: box('.shell__header-inner'),
          documentWidth: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
        };
      });
      expect(layout.documentWidth, path).toBeLessThanOrEqual(layout.viewport);
      expect(layout.search?.right ?? Infinity, path).toBeLessThanOrEqual(layout.viewport);
      expect(layout.search?.left ?? 0, path).toBeGreaterThanOrEqual(layout.brand?.right ?? 0);
      expect(layout.search?.width, path).toBeGreaterThanOrEqual(38);
    }
    await expect(searchButton(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /Switch theme/ })).toBeVisible();

    await searchButton(page).tap();
    const dialog = searchDialog(page);
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 999)).toBeLessThanOrEqual(320);
    await searchField(page).fill('daily');
    await page.getByRole('option', { name: optionName('Daily puzzle', 'Puzzles') }).tap();
    await expect(page).toHaveURL(/\/puzzles\/daily$/);
  });
});

test.describe('what’s new', () => {
  test('a returning learner hears about a new version after "Today", until it is dismissed', async ({
    page,
  }) => {
    await seed(page, '0.0.1');
    await page.goto('/');
    const card = page.getByTestId('whats-new');
    await expect(card.getByRole('heading', { level: 2 })).toHaveText(`What’s new in ${LABEL}`);
    // The day still comes first.
    const today = page.getByTestId('home-today');
    const firstHeading = await page
      .locator('main :is(h1, h2):visible')
      .evaluateAll(
        (els) => els.find((el) => el.getBoundingClientRect().width > 1)?.textContent?.trim() ?? '',
      );
    expect(firstHeading).toBe('Today');
    // A gap on both sides: the card does not touch "Today" above or "Your progress" below.
    const todayBox = await today.boundingBox();
    const cardBox = await card.boundingBox();
    // The next thing shown: an empty box for notices (nothing to say) takes no room.
    const nextTop = await card
      .locator('xpath=following-sibling::*')
      .evaluateAll(
        (els) => els.find((el) => el.getBoundingClientRect().height > 0)?.getBoundingClientRect().y,
      );
    const cardBottom = (cardBox?.y ?? 0) + (cardBox?.height ?? 0);
    expect((cardBox?.y ?? 0) - ((todayBox?.y ?? 0) + (todayBox?.height ?? 0))).toBeGreaterThan(8);
    expect((nextTop ?? 0) - cardBottom).toBeGreaterThan(8);

    // Each highlight leads to its feature; a long list opens in full on request.
    const items = card.getByRole('listitem');
    expect(await items.count()).toBeGreaterThan(0);
    const showAll = card.getByRole('button', { name: /^Show all \d+$/ });
    if (await showAll.isVisible()) {
      const total = Number((await showAll.textContent())?.replace(/\D/g, ''));
      await showAll.click();
      await expect(items).toHaveCount(total);
      await expect(card.getByRole('button', { name: 'Show fewer' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('[data-testid="whats-new"]')
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);

    await card.getByRole('button', { name: `Dismiss what’s new in ${LABEL}` }).click();
    await expect(card).toBeHidden();
    expect(await page.evaluate((key) => localStorage.getItem(key), SEEN_KEY)).toBe(VERSION);
    await page.reload();
    await expect(page.getByTestId('home-today')).toBeVisible();
    await expect(page.getByTestId('whats-new')).toHaveCount(0);
  });

  test('a learner from before the card hears about this version', async ({ page }) => {
    await seed(page, null);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: `What’s new in ${LABEL}` })).toBeVisible();
  });

  test('a first visit counts this version as seen: a newcomer gets no news', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), SEEN_KEY))
      .toBe(VERSION);
    // Later in the same visit they have started: still nothing new for them.
    await page.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({ state: { onboarded: true, puzzleRating: 1200 }, version: 8 }),
      );
    }, PROGRESS_KEY);
    await page.goto('/');
    await expect(page.getByTestId('home-today')).toBeVisible();
    await expect(page.getByTestId('whats-new')).toHaveCount(0);
  });

  test('Settings → App lists the recent releases, with the full changelog', async ({ page }) => {
    await seed(page);
    await page.goto('/settings#app');
    await page.getByRole('button', { name: 'What’s new', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'What’s new' });
    await expect(dialog).toBeVisible();
    const releases = dialog.getByRole('heading', { level: 3 });
    await expect(releases.first()).toHaveText(new RegExp(`^${LABEL.replace('.', '\\.')} · `));
    if (LABEL !== '0.28')
      await expect(dialog.getByRole('heading', { name: /^0\.28 · / })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Full changelog' })).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\/.+\/blob\/main\/CHANGELOG\.md$/,
    );
    // A highlight leads to its feature, closing the dialog on the way.
    await dialog.getByRole('link', { name: /^One page to play/ }).click();
    await expect(page).toHaveURL(/\/play$/);
    await expect(dialog).toBeHidden();
  });

  test('the quick search highlight opens quick search', async ({ page }) => {
    test.skip(Number(LABEL.split('.')[1]) < 29, 'quick search is news from 0.29 on');
    await seed(page, '0.28.0');
    await page.goto('/');
    // The card has the newest release; 0.29's highlights are among the earlier ones.
    const card = page.getByTestId('whats-new');
    await card.getByRole('button', { name: 'Earlier releases' }).click();
    const releases = page.getByTestId('whats-new-releases');
    await releases.getByRole('button', { name: /^Quick search/ }).click();
    await expect(searchDialog(page)).toBeVisible();
    await expect(searchField(page)).toBeFocused();
  });
});
