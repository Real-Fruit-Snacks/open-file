#!/usr/bin/env node
/**
 * Renders the PWA icon set from the SVG sources in scripts/icons/ using the
 * Chromium that ships with Playwright (already a dev dependency for e2e tests),
 * so no native image libraries are needed.
 *
 *   public/favicon.svg              – copied from scripts/icons/logo.svg
 *   public/icons/icon-192.png       – standard launcher icon
 *   public/icons/icon-512.png       – standard launcher icon / splash
 *   public/icons/icon-maskable-512.png – full-bleed icon for adaptive masks
 *   public/icons/icon-monochrome-512.png – one-colour silhouette for themed launcher icons
 *   public/icons/apple-touch-icon.png  – 180×180, iOS home screen (square: iOS rounds it)
 *   public/icons/shortcut-*.png     – 96×96 manifest shortcut icons
 *
 * Usage: node scripts/generate-icons.mjs
 */
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(__dirname, 'icons');
const OUT = join(ROOT, 'public', 'icons');

/** The brand tile's fill (RFS Cyclorama Dawn LX 263), behind every icon. */
const BRAND = '#050507';

/** Simple white glyphs for manifest shortcuts (96×96, on the brand tile). */
const shortcutGlyphs = {
  puzzles:
    '<path d="M36 22h24a6 6 0 0 1 6 6v10h-4a6 6 0 1 0 0 12h4v10a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V50h4a6 6 0 1 0 0-12h-4V28a6 6 0 0 1 6-6z"/>',
  play: '<path d="M36 26v44l36-22z"/>',
  learn:
    '<path d="M26 26h18a6 6 0 0 1 6 6v40a6 6 0 0 0-6-6H26zM70 26H52a6 6 0 0 0-6 6v40a6 6 0 0 1 6-6h18z"/>',
};

function shortcutSvg(glyph) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs>
    <linearGradient id="cyc-h" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#133954"/>
      <stop offset="44%" stop-color="#1F547A"/>
      <stop offset="76%" stop-color="#CC5016"/>
      <stop offset="100%" stop-color="#F06E2B"/>
    </linearGradient>
    <linearGradient id="cyc-f" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="46%" stop-color="#FFFFFF" stop-opacity="0.06"/>
      <stop offset="78%" stop-color="#FFFFFF" stop-opacity="0.48"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.88"/>
    </linearGradient>
    <mask id="cyc-m" maskContentUnits="objectBoundingBox">
      <rect width="1" height="1" fill="url(#cyc-f)"/>
    </mask>
    <linearGradient id="rule-d" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#74B8E8"/>
      <stop offset="50%" stop-color="#1F547A"/>
      <stop offset="100%" stop-color="#F06E2B"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="21" fill="${BRAND}"/>
  <rect width="96" height="96" rx="21" fill="url(#cyc-h)" opacity="0.72" mask="url(#cyc-m)"/>
  <rect x="1" y="1" width="94" height="94" rx="20" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2"/>
  <g fill="#f4f5f8" transform="translate(48 43) scale(0.84) translate(-48 -48)">${glyph}</g>
  <rect x="21" y="75" width="54" height="6" rx="3" fill="url(#rule-d)"/>
</svg>`;
}

/**
 * Maskable icons must fill the whole canvas (no transparent corners) and keep
 * the artwork inside the central "safe zone" (a circle of 80% diameter).
 */
function maskableSvg(logoSvg) {
  const inner = logoSvg.replace(/<svg[^>]*>/, '').replace('</svg>', '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${BRAND}"/>
  <g transform="translate(64 64) scale(0.75)">${inner}</g>
</svg>`;
}

/**
 * iOS rounds the home-screen icon itself and paints any transparent corner black, so the Apple
 * icon is the logo with square corners: the tile's (the first rect), not the rule's.
 */
function squareSvg(logoSvg) {
  return logoSvg.replaceAll(' rx="112"', '');
}

/**
 * Themed launcher icons (Android 13 and later) use only the alpha channel of a
 * `monochrome` icon and paint it in the system colour: the rook and its rule, without the tile,
 * in the same safe zone as the maskable icon, on a transparent canvas.
 */
function monochromeSvg(logoSvg) {
  const rook = /<g id="rook"[\s\S]*?<\/g>/.exec(logoSvg)?.[0];
  const rule = /<rect id="rule"[^>]*\/>/.exec(logoSvg)?.[0];
  if (!rook || !rule)
    throw new Error('logo.svg: the rook group or the rule (id="rook", id="rule") was not found');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g transform="translate(64 64) scale(0.75)">${rook}${rule.replace(/fill="[^"]*"/, 'fill="#ffffff"')}</g>
</svg>`;
}

async function render(page, svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:transparent">${svg.replace(
      /width="\d+" height="\d+"/,
      `width="${size}" height="${size}"`,
    )}</body></html>`,
  );
  await page.screenshot({ path: join(OUT, file), omitBackground: true, type: 'png' });
  console.log(`  ✓ icons/${file} (${size}×${size})`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const logo = await readFile(join(SRC, 'logo.svg'), 'utf8');
  await copyFile(join(SRC, 'logo.svg'), join(ROOT, 'public', 'favicon.svg'));
  console.log('  ✓ favicon.svg');

  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  await render(page, logo, 192, 'icon-192.png');
  await render(page, logo, 512, 'icon-512.png');
  await render(page, squareSvg(logo), 180, 'apple-touch-icon.png');
  await render(page, maskableSvg(logo), 512, 'icon-maskable-512.png');
  await render(page, monochromeSvg(logo), 512, 'icon-monochrome-512.png');
  for (const [name, glyph] of Object.entries(shortcutGlyphs)) {
    await render(page, shortcutSvg(glyph), 96, `shortcut-${name}.png`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
