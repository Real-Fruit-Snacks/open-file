import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { randomId } from '../relay/src/live/shared.mjs';
import { type LiveRelay, startLiveRelay } from './live';

/**
 * An automated accessibility sweep (axe-core, WCAG 2.1 A/AA) over every page —
 * the top-level ones and one of each parameterised route — in both colour
 * schemes. It catches the mechanical slips — missing labels, bad contrast,
 * invalid ARIA — that the hand-written accessibility tests do not look for.
 *
 * Each page loads once and is checked in full in Nightshift (the dark scheme), then switched
 * to Dayshift (the light one) with the header's own theme button (which goes System,
 * Nightshift, Dayshift) and checked for what a scheme can change: the colours (contrast, and
 * links told apart from the text around them). Labels, roles and structure are the same in
 * every scheme, so one page costs one load and one full check rather than two of each. The
 * pages are independent: they run in parallel, and CI's shards share them out rather than one
 * shard taking the whole sweep.
 */
test.describe.configure({ mode: 'parallel' });
const PAGES = [
  '/',
  '/learn',
  '/learn/how-pieces-move',
  '/learn/course/first-steps',
  '/learn/recall',
  '/placement',
  '/puzzles',
  '/puzzles/themes',
  '/puzzles/daily',
  '/puzzles/rush',
  '/puzzles/blind',
  '/puzzles/openings',
  '/puzzles/review',
  '/puzzles/mine',
  '/puzzles/woodpecker',
  '/drills',
  '/drills/coordinates',
  '/drills/vision',
  '/drills/threats',
  '/drills/endgame/mate-kq',
  '/openings',
  '/openings/italian',
  '/play',
  '/play/computer',
  '/play/online/AAAAAAAAAAAAAAAAAAAAAA',
  '/play/duel/AAAAAAAAAAAAAAAAAAAAAA',
  '/analyze',
  '/games',
  '/studies',
  '/studies/reti-1921',
  '/classics',
  '/classics/opera-game',
  '/patterns',
  '/reference',
  '/progress',
  '/settings',
  '/settings#play',
  '/settings#engine',
  '/settings#data',
  '/settings#app',
  '/settings/lab',
  '/no-such-page',
  '/arcade',
  '/arcade/hand-and-brain',
  '/arcade/daily-opening',
  '/arcade/who-stands-better',
  '/arcade/odds-ladder',
  '/arcade/army-draft',
  '/arcade/fortress',
  '/arcade/engine-says',
  '/arcade/blindfold',
  '/arcade/simul',
  '/arcade/arbiter',
  '/arcade/ghost-knight',
];

type Scheme = 'light' | 'dark';

async function seed(page: Page, scheme: Scheme) {
  await page.addInitScript(
    ([progress, settings]) => {
      if (!localStorage.getItem('open-file:progress')) {
        localStorage.setItem('open-file:progress', progress);
      }
      localStorage.setItem('open-file:settings', settings);
    },
    [
      JSON.stringify({ state: { onboarded: true, puzzleRating: 1200 }, version: 6 }),
      JSON.stringify({ state: { colorScheme: scheme }, version: 3 }),
    ] as const,
  );
}

/** The rules a colour scheme can pass or fail: everything else is the same in each. */
const COLOUR_RULES = ['color-contrast', 'link-in-text-block'];

async function audit(page: Page, coloursOnly = false) {
  const builder = new AxeBuilder({ page });
  if (coloursOnly) builder.withRules(COLOUR_RULES);
  else builder.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  const results = await builder
    // The chessground board draws pieces as CSS backgrounds inside custom
    // elements; its DOM is not something axe can judge.
    .exclude('cg-board')
    // Toasts fade in; a contrast check mid-animation says nothing about the design.
    .exclude('.toasts')
    .analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));
}

/**
 * The waiting room's sockets go to the relay's own code in this process, with a
 * game posted by someone else, so the list the sweep sees has a game in it.
 */
let relay: LiveRelay | null = null;
test.beforeAll(async () => {
  relay = startLiveRelay();
  const other = relay.hub.openLobby({ send: () => undefined, close: () => undefined });
  await other.message(
    JSON.stringify({
      t: 'seek',
      tc: '10+5',
      color: 'random',
      name: 'Patient Bishop',
      rating: 1500,
      private: false,
      secret: randomId(32),
    }),
  );
  // And a duel, which the list shows with its own icon and words.
  const duel = relay.hub.openLobby({ send: () => undefined, close: () => undefined });
  await duel.message(
    JSON.stringify({
      t: 'seek',
      game: 'race',
      opts: { format: 'best3', level: 1500 },
      name: 'Swift Knight',
      rating: null,
      private: false,
      secret: randomId(32),
    }),
  );
});
test.afterAll(async () => {
  await relay?.stop();
  relay = null;
});

/** The schemes in the order the theme button goes through them, each with the name it shows. */
const SCHEMES = ['dark', 'light'] as const satisfies readonly Scheme[];
const NAMES: Record<Scheme, string> = { dark: 'Nightshift', light: 'Dayshift' };

test.describe('axe sweep', () => {
  for (const path of PAGES) {
    test(`${path} has no WCAG A/AA violations in any colour scheme`, async ({ page }) => {
      if (relay) await relay.attach(page.context());
      await seed(page, SCHEMES[0]);
      await page.goto(path);
      // Code-split pages: wait for the page's own heading, then for the engine or
      // boards to settle so what is audited is what a visitor sees.
      await expect(page.locator('main h1').first()).toBeVisible();
      await page.waitForTimeout(400);
      const found: Partial<Record<Scheme, Awaited<ReturnType<typeof audit>>>> = {};
      for (const [i, scheme] of SCHEMES.entries()) {
        if (i > 0) {
          // The next scheme, as a visitor would switch to it; the colours settle (their
          // transitions are short) before the check.
          const before = SCHEMES[i - 1];
          await page
            .getByRole('button', { name: `Theme: ${NAMES[before]} (${before}). Switch theme` })
            .click();
          await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
          await page.waitForTimeout(300);
        }
        const violations = await audit(page, i > 0);
        if (violations.length) found[scheme] = violations;
      }
      expect(found, JSON.stringify(found, null, 2)).toEqual({});
    });
  }
});
