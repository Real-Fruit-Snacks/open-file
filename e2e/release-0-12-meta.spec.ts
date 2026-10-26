import { expect, type Page, test } from '@playwright/test';

/**
 * 0.12: what the build itself promises — the licence texts and the credits it
 * owes (CC BY-SA for the classic pieces), the Content-Security-Policy, the
 * service worker's frame policy and the production base path.
 *
 * Every URL here is relative to the base URL, so the same tests run at "/" and,
 * in CI's production-path job, at "/open-file/" behind a server that answers
 * deep links with 404.html, as GitHub Pages does (scripts/serve-dist.mjs).
 */
async function seed(page: Page) {
  await page.addInitScript(
    (progress) => {
      if (!localStorage.getItem('open-file:progress')) {
        localStorage.setItem('open-file:progress', progress);
      }
    },
    JSON.stringify({ state: { onboarded: true, puzzleRating: 1200 }, version: 6 }),
  );
}

/** The path the site is served under ("/" or "/open-file/"). */
function basePath(baseURL: string | undefined): string {
  return new URL(baseURL ?? 'http://127.0.0.1/').pathname;
}

/** Records every Content-Security-Policy violation the page reports. */
async function watchViolations(page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { cspViolations: string[] }).cspViolations = seen;
    document.addEventListener('securitypolicyviolation', (event) => {
      seen.push(`${event.effectiveDirective} blocked ${event.blockedURI || 'inline'}`);
    });
  });
  return () =>
    page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations);
}

test.describe('licence and credits', () => {
  test('the footer credits the pieces, the engine, the board and the data', async ({ page }) => {
    await seed(page);
    await page.goto('./');
    const credits = page.getByTestId('credits');
    await expect(credits).toContainText('Pieces (Classic): Colin M.L. Burnett');
    await expect(credits.getByRole('link', { name: 'CC BY-SA 3.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-sa/3.0/',
    );
    await expect(credits).toContainText('Stockfish (GPL-3.0)');
    await expect(credits).toContainText('Chessground (GPL-3.0)');
    await expect(credits).toContainText('Lichess (CC0)');
    await expect(credits).toContainText('Human-like opponent: Maia-3 (AGPL-3.0)');
    // 0.32: the brand's type, under its own licence, which ships with the site.
    await expect(credits).toContainText('Type: IBM Plex (OFL-1.1)');
  });

  test('the footer links the licence and the notices, which ship with the site', async ({
    page,
    baseURL,
  }) => {
    const base = basePath(baseURL);
    await seed(page);
    await page.goto('./');
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Licence', exact: true })).toHaveAttribute(
      'href',
      `${base}licence.txt`,
    );
    await expect(footer.getByRole('link', { name: 'Third-party notices' })).toHaveAttribute(
      'href',
      `${base}notices.txt`,
    );

    const licence = await page.request.get(`${base}licence.txt`);
    expect(licence.status()).toBe(200);
    expect(licence.headers()['content-type']).toMatch(/^text\/plain/);
    expect(await licence.text()).toContain('GNU GENERAL PUBLIC LICENSE');
    const notices = await page.request.get(`${base}notices.txt`);
    expect(notices.status()).toBe(200);
    const text = await notices.text();
    expect(text).toContain('Colin M.L. Burnett');
    expect(text).toContain('CC BY-SA 3.0');
    // 0.16: the human-like opponent's model is AGPL-3.0, and its licence ships too.
    await expect(footer.getByRole('link', { name: 'AGPL-3.0' })).toHaveAttribute(
      'href',
      `${base}licence-agpl.txt`,
    );
    const agpl = await page.request.get(`${base}licence-agpl.txt`);
    expect(agpl.status()).toBe(200);
    expect(await agpl.text()).toContain('GNU AFFERO GENERAL PUBLIC LICENSE');
    expect(text).toContain('Maia-3');
    // 0.32: IBM Plex is OFL-1.1, and its licence ships too.
    await expect(footer.getByRole('link', { name: 'OFL-1.1' })).toHaveAttribute(
      'href',
      `${base}licence-ofl.txt`,
    );
    const ofl = await page.request.get(`${base}licence-ofl.txt`);
    expect(ofl.status()).toBe(200);
    expect(await ofl.text()).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(text).toContain('IBM Plex');
  });
});

test.describe('content security policy', () => {
  test('the page carries its policy, and the app runs inside it', async ({ page }) => {
    const violations = await watchViolations(page);
    await seed(page);
    await page.goto('./');
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    // The pre-paint theme script is allowed by its hash (a blocked one would be a violation).
    expect(policy).toMatch(/script-src [^;]*'sha256-/);
    await expect(page.locator('main h1').first()).toBeVisible();
    // Each page starts its own list, so it is read before leaving the page.
    const found = (await violations()).map((v) => `home: ${v}`);

    // The engine (a WebAssembly worker), the puzzle data and the settings, under the policy.
    await page.goto('analyze');
    await expect(page.locator('.engine-status')).toContainText(/depth \d+/, { timeout: 30_000 });
    found.push(...(await violations()).map((v) => `analyze: ${v}`));
    await page.goto('puzzles');
    await expect(page.locator('main h1').first()).toBeVisible();
    found.push(...(await violations()).map((v) => `puzzles: ${v}`));
    await page.goto('settings');
    await expect(page.locator('main h1').first()).toBeVisible();
    found.push(...(await violations()).map((v) => `settings: ${v}`));
    expect(found).toEqual([]);
  });
});

test.describe('base path and service worker', () => {
  test('a deep link boots the app under the base path, and an unknown one says not found', async ({
    page,
    baseURL,
  }) => {
    const base = basePath(baseURL);
    await seed(page);
    const deep = await page.goto('learn');
    // GitHub Pages answers a deep link with 404.html and a 404; the app renders the route anyway.
    if (base !== '/') expect(deep?.status()).toBe(404);
    await expect(page).toHaveURL(new RegExp(`${base}learn$`));
    await expect(page.locator('main h1').first()).toBeVisible();
    expect(await page.title()).not.toMatch(/not found/i);
    const sources = await page
      .locator('script[src], link[rel="stylesheet"], link[rel="modulepreload"]')
      .evaluateAll((elements) =>
        elements.map((el) => el.getAttribute('src') ?? el.getAttribute('href') ?? ''),
      );
    expect(sources.length).toBeGreaterThan(0);
    // Absolute paths under the base, or full URLs on this origin (the preload helper
    // writes those for lazy chunks); never a relative path, which breaks on deep links.
    const origin = new URL(page.url()).origin;
    for (const source of sources) {
      const path = source.startsWith(origin) ? source.slice(origin.length) : source;
      expect(path.startsWith(base), source).toBe(true);
    }

    await page.goto('no-such-page');
    await expect(page).toHaveTitle(/not found/i);
  });

  test('the service worker takes the app’s scope and serves pages that refuse to be framed', async ({
    page,
    baseURL,
    browserName,
  }) => {
    const base = basePath(baseURL);
    await seed(page);
    await page.goto('./');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 30_000,
    });
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(new URL(scope).pathname).toBe(base);

    // A navigation the worker answers (the app shell for a deep link) carries the frame policy.
    const served = await page.goto('progress');
    await expect(page.locator('main h1').first()).toBeVisible();
    // Only Chromium reports a service worker's response to the test runner.
    if (browserName === 'chromium') {
      expect(served?.fromServiceWorker()).toBe(true);
      expect(served?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    }
  });
});

test.describe('install', () => {
  test('the manifest lists a monochrome icon and screenshots, each served at its stated size', async ({
    page,
  }) => {
    await page.goto('./');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifestUrl = new URL(href ?? '', page.url()).href;
    const manifest = (await (await page.request.get(manifestUrl)).json()) as {
      icons: { src: string; sizes: string; purpose?: string }[];
      screenshots: { src: string; sizes: string; form_factor?: string; label?: string }[];
    };
    expect(manifest.icons.map((i) => i.purpose ?? 'any')).toEqual(
      expect.arrayContaining(['any', 'maskable', 'monochrome']),
    );
    expect(manifest.screenshots.map((s) => s.form_factor)).toEqual(
      expect.arrayContaining(['wide', 'narrow']),
    );
    for (const image of [...manifest.icons, ...manifest.screenshots]) {
      const url = new URL(image.src, manifestUrl).href;
      const size = await page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        return `${img.naturalWidth}x${img.naturalHeight}`;
      }, url);
      expect(size, image.src).toBe(image.sizes);
    }
    for (const shot of manifest.screenshots) expect(shot.label, shot.src).toBeTruthy();
  });
});
