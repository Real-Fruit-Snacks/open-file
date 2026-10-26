/**
 * The build-time transforms of `index.html` (used by the html plugins in
 * vite.config.ts, and by the test that checks them against the real file).
 *
 * - `fillSitePlaceholders` fills the `%SITE_…%` placeholders from site.config.ts.
 * - `withContentSecurityPolicy` adds a `<meta http-equiv="Content-Security-Policy">`
 *   whose `script-src` allows the bundle (`'self'`) and exactly the inline
 *   scripts of the page, by SHA-256 hash. The hashes are computed from the final
 *   HTML at build time, so editing the pre-paint theme script can never leave a
 *   stale hash behind.
 */
import { createHash } from 'node:crypto';

/**
 * The origins the app fetches from, each only when the learner turns the
 * feature on: game imports (`src/lib/gameImport.ts`), the opening explorer
 * (`src/lib/explorer.ts`) and the tablebase (`src/lib/tablebase.ts`).
 */
export const CONNECT_ORIGINS = [
  'https://lichess.org',
  'https://api.chess.com',
  'https://explorer.lichess.org',
  'https://tablebase.lichess.ovh',
] as const;

/**
 * The relay's origins, for connect-src: its own (device sync's requests) and the same host over
 * WebSockets (live games), `wss:` for an https relay and `ws:` for a plain-http one such as a
 * local relay. Both are listed because an https source does not cover a secure WebSocket. None
 * when the build has no relay (an empty URL).
 */
export function relayOrigins(relayUrl: string): string[] {
  if (!relayUrl) return [];
  const url = new URL(relayUrl);
  return [url.origin, `${url.protocol === 'http:' ? 'ws:' : 'wss:'}//${url.host}`];
}

/** The parts of site.config.ts that index.html quotes. */
interface SiteMetadata {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  siteUrl: string;
  lightBackgroundColor: string;
  backgroundColor: string;
}

/** The value of every `%SITE_…%` placeholder in index.html. */
export function sitePlaceholders(site: SiteMetadata): Record<string, string> {
  return {
    SITE_NAME: site.name,
    SITE_SHORT_NAME: site.shortName,
    SITE_TAGLINE: site.tagline,
    SITE_DESCRIPTION: site.description,
    SITE_URL: site.siteUrl,
    SITE_LIGHT_BACKGROUND: site.lightBackgroundColor,
    SITE_BACKGROUND: site.backgroundColor,
  };
}

/** Replaces every `%SITE_…%` placeholder; an unknown one is an error, not a silent blank. */
export function fillSitePlaceholders(html: string, values: Readonly<Record<string, string>>) {
  return html.replace(/%(SITE_[A-Z_]+)%/g, (match, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`index.html: unknown placeholder ${match}`);
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  });
}

/**
 * The text of every inline `<script>` (one without `src`), in document order,
 * as the browser hashes it: the HTML parser turns CRLF and lone CR into LF
 * first, so a checkout with Windows line endings still gets the right hash.
 */
export function inlineScripts(html: string): string[] {
  const scripts: string[] = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\ssrc\s*=/i.test(match[1] ?? '')) continue;
    scripts.push((match[2] ?? '').replace(/\r\n?/g, '\n'));
  }
  return scripts;
}

/** A CSP hash source for a script's text, as the browser computes it (UTF-8, SHA-256, base64). */
export function hashSource(script: string): string {
  return `'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`;
}

/**
 * The policy. Styles keep `'unsafe-inline'`: Chessground and React set style
 * attributes, and the `<noscript>` notice carries one. WebAssembly needs
 * `'wasm-unsafe-eval'` wherever a browser applies the page's policy to the
 * engine. `frame-ancestors` cannot be set from a meta tag; the service worker
 * adds it as a header (src/sw/framing.ts).
 */
export function contentSecurityPolicy(
  scriptHashes: readonly string[],
  extraConnect: readonly string[] = [],
): string {
  const directives: [string, readonly string[]][] = [
    ['default-src', ["'self'"]],
    ['script-src', ["'self'", "'wasm-unsafe-eval'", ...scriptHashes]],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'blob:']],
    ['connect-src', ["'self'", ...CONNECT_ORIGINS, ...extraConnect]],
    ['worker-src', ["'self'"]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'none'"]],
    ['form-action', ["'self'"]],
  ];
  return directives.map(([name, sources]) => `${name} ${sources.join(' ')}`).join('; ');
}

/**
 * Adds the policy right after `<meta charset>`: a policy delivered by a meta
 * tag only governs what comes after it, so it has to precede every script.
 */
export function withContentSecurityPolicy(
  html: string,
  extraConnect: readonly string[] = [],
): string {
  const charset = /<meta\s+charset=[^>]*>/i.exec(html);
  if (!charset) throw new Error('index.html: no <meta charset> to put the security policy after');
  const policy = contentSecurityPolicy(inlineScripts(html).map(hashSource), extraConnect);
  const at = charset.index + charset[0].length;
  const meta = `\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`;
  return html.slice(0, at) + meta + html.slice(at);
}
