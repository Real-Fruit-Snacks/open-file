import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults, defineConfig } from 'vitest/config';
import {
  fillSitePlaceholders,
  relayOrigins,
  sitePlaceholders,
  withContentSecurityPolicy,
} from './scripts/lib/html.ts';
import { iconSprite, withIconSprite } from './scripts/lib/iconSprite.ts';
import { ICONS } from './src/components/ui/iconData.ts';
import { siteConfig } from './src/site.config.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/**
 * Unit tests that run in a process of their own (forks) rather than in a vm context: the build
 * scripts' and the relay's, which run under Node (`@vitest-environment node`), need no DOM and
 * run Node code at full speed outside one; two that replace `window.location`, which jsdom's
 * own context keeps fixed; one that tells errors apart with `instanceof Error`, which Node's
 * abort reasons fail in a vm context (they come from another realm); and the engine checks of
 * the content (run on request), which drive Stockfish in a child process with Node's own timers.
 */
const FORKED_TEST_FILES = [
  'scripts/**/*.test.ts',
  'relay/**/*.test.ts',
  'src/**/*.engine.test.ts',
  'src/app/UpdatePrompt.test.tsx',
  'src/lib/fetchWithTimeout.test.ts',
  'src/store/profiles.test.ts',
];

/** What git prints for `args`, or '' outside a checkout. */
function git(...args: string[]): string {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * The build date the app shows (Settings, the test lab, crash reports). It is
 * the date of the commit being built, not the clock's, so rebuilding a commit
 * gives byte-identical files: the same hashes, and no "new version" toast for
 * anyone after a redeploy that changed nothing. `SOURCE_DATE_EPOCH` (the
 * reproducible-builds convention) wins; outside a git checkout the build falls
 * back to the current time.
 */
function buildDate(): string {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) return new Date(Number(epoch) * 1000).toISOString();
  const committed = new Date(git('log', '-1', '--format=%cI'));
  return (Number.isNaN(committed.getTime()) ? new Date() : committed).toISOString();
}

/** The commit being built: crash reports name it, so a stack can be read with CI's source maps. */
function buildCommit(): string {
  return git('rev-parse', '--short=12', 'HEAD') || (process.env.GITHUB_SHA ?? '').slice(0, 12);
}

/**
 * `VITE_BASE_PATH` is the URL prefix the site is served from.
 *   - user/organisation pages (https://you.github.io)       → "/"
 *   - project pages         (https://you.github.io/<repo>/) → "/<repo>/"
 * The deploy workflow sets it automatically from the repository name.
 */
function resolveBase(mode: string): string {
  const env = loadEnv(mode, process.cwd(), '');
  const raw = env.VITE_BASE_PATH || '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

/**
 * Fills the `%SITE_…%` placeholders in index.html from site.config.ts, so the
 * title, description, social-card tags and the pre-paint theme script all say
 * the same thing as the running app.
 */
function siteMetadataHtml(): Plugin {
  const values = sitePlaceholders(siteConfig);
  return {
    name: 'open-file:site-metadata',
    transformIndexHtml: (html) => fillSitePlaceholders(html, values),
  };
}

/**
 * Puts the icons into the page as an SVG sprite (scripts/lib/iconSprite.ts):
 * `<Icon>` draws each with `<use>`, so their paths stay out of the start-up
 * JavaScript. In the dev server too, so icons show there the same way.
 */
function iconSpriteHtml(): Plugin {
  const sprite = iconSprite(ICONS);
  return {
    name: 'open-file:icon-sprite',
    transformIndexHtml: (html) => withIconSprite(html, sprite),
  };
}

/**
 * Adds the Content-Security-Policy meta tag to the built page (and so to
 * 404.html), with the hash of the pre-paint theme script computed from the
 * final HTML (scripts/lib/html.ts). Build only: the dev server injects inline
 * scripts of its own (React refresh) that no fixed policy could list.
 */
function contentSecurityPolicyHtml(): Plugin {
  return {
    name: 'open-file:content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => withContentSecurityPolicy(html, relayOrigins(siteConfig.syncRelay)),
    },
  };
}

/**
 * ONNX Runtime's bundle names its WebAssembly with `new URL('…wasm', import.meta.url)`, which
 * Vite would copy into the build as an asset — 14 MB, a second copy. The app never uses that
 * URL: the human-like opponent's worker hands the runtime the binary itself, from the device's
 * own download (public/maia/). Splitting the literal keeps Vite from collecting the file; the
 * reference stays for the runtime, which never fetches it.
 */
function ortWasmReference(): Plugin {
  const literal = '"ort-wasm-simd-threaded.wasm",import.meta.url';
  return {
    name: 'open-file:ort-wasm-reference',
    enforce: 'pre',
    transform(code, id) {
      if (
        !/onnxruntime-web[\\/]dist[\\/]ort\.wasm\.bundle\.min\.mjs$/.test(id.split('?')[0] ?? '')
      ) {
        return null;
      }
      if (!code.includes(literal)) {
        this.error(
          'onnxruntime-web no longer names its binary as expected: update ortWasmReference.',
        );
      }
      return {
        code: code.replaceAll(literal, '"ort-wasm-simd-threaded"+".wasm",import.meta.url'),
        map: null,
      };
    },
  };
}

export default defineConfig(({ mode }) => {
  const base = resolveBase(mode);

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_DATE__: JSON.stringify(buildDate()),
      __BUILD_COMMIT__: JSON.stringify(buildCommit()),
    },
    plugins: [
      react(),
      siteMetadataHtml(),
      iconSpriteHtml(),
      contentSecurityPolicyHtml(),
      VitePWA({
        // A hand-written Workbox service worker (src/sw.ts): precaching plus the
        // opt-in COOP/COEP headers for the multi-threaded engine.
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: false, // we register from src/app/UpdatePrompt.tsx to control the UX
        // No `includeAssets`: the glob below already precaches every icon and the
        // favicon, and listing them again duplicated the manifest entries.
        manifest: {
          id: base,
          name: siteConfig.name,
          short_name: siteConfig.shortName,
          description: siteConfig.description,
          start_url: base,
          scope: base,
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'any',
          // A link or shortcut opened while the app is running focuses the
          // existing window and navigates it, instead of opening a second one.
          launch_handler: { client_mode: 'navigate-existing' },
          // The splash screen and the title bar take the page background, so the
          // app's own header carries on from them without a colour change.
          background_color: siteConfig.backgroundColor,
          theme_color: siteConfig.backgroundColor,
          lang: 'en-GB',
          dir: 'ltr',
          categories: ['education', 'games'],
          // Backups exported from the app can be opened with it from a file manager.
          file_handlers: [
            {
              action: base,
              accept: { 'application/json': ['.json'] },
            },
          ],
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icons/icon-monochrome-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'monochrome',
            },
          ],
          // Shown in the install dialog (scripts/generate-screenshots.mjs renders them).
          // Not precached: they are only ever needed online, at install time.
          screenshots: [
            {
              src: 'screenshots/wide-puzzles.webp',
              sizes: '1280x800',
              type: 'image/webp',
              form_factor: 'wide',
              label: 'A puzzle at your level, with a hint and the solution a key away',
            },
            {
              src: 'screenshots/wide-analyze.webp',
              sizes: '1280x800',
              type: 'image/webp',
              form_factor: 'wide',
              label: 'A game reviewed by Stockfish, with its evaluation graph',
            },
            {
              src: 'screenshots/narrow-puzzles.webp',
              sizes: '780x1688',
              type: 'image/webp',
              form_factor: 'narrow',
              label: 'Puzzles on a phone',
            },
            {
              src: 'screenshots/narrow-lesson.webp',
              sizes: '780x1688',
              type: 'image/webp',
              form_factor: 'narrow',
              label: 'An interactive lesson on a phone',
            },
          ],
          shortcuts: [
            {
              name: 'Solve puzzles',
              short_name: 'Puzzles',
              url: `${base}puzzles`,
              icons: [{ src: 'icons/shortcut-puzzles.png', sizes: '96x96', type: 'image/png' }],
            },
            {
              name: 'Play the engine',
              short_name: 'Play',
              url: `${base}play`,
              icons: [{ src: 'icons/shortcut-play.png', sizes: '96x96', type: 'image/png' }],
            },
            {
              name: 'Lessons',
              short_name: 'Learn',
              url: `${base}learn`,
              icons: [{ src: 'icons/shortcut-learn.png', sizes: '96x96', type: 'image/png' }],
            },
          ],
        },
        injectManifest: {
          // Everything the app needs offline is static, so precache all of it —
          // including the single-threaded engine WASM and the puzzle chunks.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,json,webmanifest,woff2}'],
          // The threaded engine build is cached on first use instead, the full engine (99 MB a
          // build) only when the learner downloads it, and the puzzle chunks beyond the first
          // one of each rating band (b*-00.json) as they are played. The engine's version.json
          // is a record for people, not something the app reads.
          globIgnores: [
            '**/screenshots/**',
            '**/engine/stockfish-19-lite.js',
            '**/engine/stockfish-19-lite.wasm',
            '**/engine/stockfish-19.js',
            '**/engine/stockfish-19.wasm',
            '**/engine/stockfish-19-single.js',
            '**/engine/stockfish-19-single.wasm',
            '**/engine/version.json',
            '**/puzzles/b*-@(0[1-9]|[1-9][0-9]).json',
            // The textured boards' pictures (about 2 MB): cached once a board is shown.
            '**/boards/**',
            // The human-like opponent (about 25 MB): downloaded only when the learner asks for it.
            '**/maia/**',
          ],
          // The Stockfish WASM binary is ~1.8 MB; Workbox's default cap is 2 MB.
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    worker: {
      format: 'es',
      plugins: () => [ortWasmReference()],
    },
    build: {
      target: 'es2022',
      // Maps without the sourceMappingURL comment: scripts/postbuild.mjs moves them out
      // of dist/ (never deployed, never precached) and CI keeps them as an artifact.
      sourcemap: 'hidden',
      chunkSizeWarningLimit: 700,
      rolldownOptions: {
        output: {
          // The framework rarely changes between releases: keeping it in its own
          // chunk means an app update only re-downloads the app, not React.
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              },
            ],
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: false,
    },
    preview: {
      port: 4173,
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/vmGlobals.ts', './src/test/setup.ts'],
      // Stylesheets are stubbed out of component tests; only their text is
      // served (`?raw`), for the stylesheet-scope test in src/styles.
      css: { include: [/\.css\?raw$/] },
      // The app's tests run in the vmThreads pool: each file in a fresh context of a worker that
      // stays up, so its modules and stores are its own, as in a process of its own, but jsdom is
      // loaded once per worker instead of once per file, which took half the run.
      projects: [
        {
          extends: true,
          test: {
            name: 'vm',
            pool: 'vmThreads',
            include: ['src/**/*.test.{ts,tsx}'],
            exclude: [...configDefaults.exclude, ...FORKED_TEST_FILES],
          },
        },
        { extends: true, test: { name: 'forks', pool: 'forks', include: FORKED_TEST_FILES } },
      ],
      // What a file loads stays in its vm worker (Node cannot unload modules), so a worker is
      // replaced once its heap passes this. Low for coverage, which reads every script a worker
      // still holds after each file: a third faster than with the default limit.
      vmMemoryLimit: '512MB',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/test/**',
          'src/main.tsx',
          'src/**/*.d.ts',
          // Content and fixtures are data, checked by the content tests: counting them as
          // covered code would only pad the figures.
          'src/features/learn/lessons/{beginner,intermediate,advanced}*.ts',
          'src/features/learn/lessonMeta.ts',
          'src/**/fixtures/**',
          // Runs only in a browser's service-worker scope; its helpers in src/sw/ are tested.
          'src/sw.ts',
        ],
        // The floor `npm run test:coverage` (CI) enforces: a little under the 0.12 figures
        // (84.8 % statements, 75.7 % branches, 81.2 % functions, 87.4 % lines).
        thresholds: { statements: 83, branches: 74, functions: 80, lines: 86 },
      },
    },
  };
});
