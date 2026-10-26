import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../src/site.config.ts';
import {
  CONNECT_ORIGINS,
  fillSitePlaceholders,
  relayOrigins,
  sitePlaceholders,
  withContentSecurityPolicy,
} from './html.ts';

// Paths, not URL objects: this test runs under jsdom, whose URL class Node's fs cannot read.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

/** index.html as the build writes it: placeholders filled, then the policy added. */
function builtHtml(source = read('index.html')): string {
  return withContentSecurityPolicy(fillSitePlaceholders(source, sitePlaceholders(siteConfig)));
}

/** The policy's directives, parsed out of the page by the browser's rules (jsdom). */
function policyOf(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const meta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
  const directives = new Map<string, string[]>();
  for (const part of (meta?.getAttribute('content') ?? '').split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) directives.set(name, sources);
  }
  return { doc, meta, directives };
}

const sha256 = (text: string) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;

describe('Content-Security-Policy of index.html', () => {
  it('allows exactly the inline scripts of the built page, by hash', () => {
    const { doc, directives } = policyOf(builtHtml());
    // Parsed independently of the build's own extraction: the browser's view of the page.
    const inline = Array.from(doc.querySelectorAll('script:not([src])'), (s) => s.textContent);
    expect(inline.length).toBeGreaterThan(0);
    const allowed = (directives.get('script-src') ?? []).filter((s) => s.startsWith("'sha256-"));
    expect(allowed.sort()).toEqual(inline.map(sha256).sort());
  });

  it('hashes what the browser hashes, whatever line endings the checkout has', () => {
    const crlf = read('index.html').replace(/\r?\n/g, '\r\n');
    expect(policyOf(builtHtml(crlf)).directives.get('script-src')).toEqual(
      policyOf(builtHtml()).directives.get('script-src'),
    );
  });

  it('follows the theme script when it changes', () => {
    const edited = read('index.html').replace("'dark'", "'dark' /* edited */");
    const before = policyOf(builtHtml()).directives.get('script-src');
    const after = policyOf(builtHtml(edited)).directives.get('script-src');
    expect(after).not.toEqual(before);
  });

  it('comes before every script, so it governs them all', () => {
    const { doc, meta } = policyOf(builtHtml());
    const first = doc.querySelector('script');
    expect(meta).not.toBeNull();
    expect(first).not.toBeNull();
    expect(
      meta && first && meta.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('locks down everything the app does not use', () => {
    const { directives } = policyOf(builtHtml());
    expect(directives.get('default-src')).toEqual(["'self'"]);
    expect(directives.get('object-src')).toEqual(["'none'"]);
    expect(directives.get('base-uri')).toEqual(["'none'"]);
    expect(directives.get('form-action')).toEqual(["'self'"]);
    expect(directives.get('worker-src')).toEqual(["'self'"]);
    const scripts = directives.get('script-src') ?? [];
    expect(scripts).toContain("'self'");
    expect(scripts).toContain("'wasm-unsafe-eval'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it('lets the app reach every API it calls, and nothing else', () => {
    const { directives } = policyOf(builtHtml());
    const sources = ['src/lib/gameImport.ts', 'src/lib/explorer.ts', 'src/lib/tablebase.ts'];
    const used = new Set(
      sources.flatMap((path) =>
        [...read(path).matchAll(/(?:API|ENDPOINT)\s*=\s*'(https:\/\/[^/']+)/g)].map((m) => m[1]),
      ),
    );
    expect(used.size).toBe(4);
    expect(directives.get('connect-src')).toEqual(["'self'", ...CONNECT_ORIGINS]);
    expect(new Set(CONNECT_ORIGINS)).toEqual(used);
    // The explorer at the host Lichess documents for it.
    expect(used).toContain('https://explorer.lichess.org');
  });

  it('lets the app reach its relay, over WebSockets too for live games', () => {
    expect(relayOrigins('https://relay.example.workers.dev/')).toEqual([
      'https://relay.example.workers.dev',
      'wss://relay.example.workers.dev',
    ]);
    expect(relayOrigins('http://localhost:8787')).toEqual([
      'http://localhost:8787',
      'ws://localhost:8787',
    ]);
    expect(relayOrigins('https://relay.example:8443/v1')).toEqual([
      'https://relay.example:8443',
      'wss://relay.example:8443',
    ]);
    expect(relayOrigins('')).toEqual([]);

    // As the build adds it (vite.config.ts): the page may open sockets to the relay, and only it.
    const html = withContentSecurityPolicy(
      fillSitePlaceholders(read('index.html'), sitePlaceholders(siteConfig)),
      relayOrigins(siteConfig.syncRelay),
    );
    const relay = new URL(siteConfig.syncRelay);
    expect(policyOf(html).directives.get('connect-src')).toEqual([
      "'self'",
      ...CONNECT_ORIGINS,
      relay.origin,
      `wss://${relay.host}`,
    ]);
  });

  it('needs a <meta charset> to follow', () => {
    expect(() => withContentSecurityPolicy('<html><head></head></html>')).toThrow(/charset/);
  });
});
