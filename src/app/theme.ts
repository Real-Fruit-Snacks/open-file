import { useEffect } from 'react';
import { type ColorScheme, PIECE_SET_IDS, type PieceSet, useSettings } from '@/store/settings';
import { siteConfig } from '@/site.config';

/**
 * What the schemes are called: the brand's names for its two themes. Nightshift is the dark one
 * and Dayshift the light one; the values stored and put on <html> stay 'dark' and 'light'.
 */
export const SCHEME_NAMES: Record<ColorScheme, string> = {
  system: 'System',
  dark: 'Nightshift',
  light: 'Dayshift',
};

/**
 * The system scheme is Dayshift only on a device that asks for light; on any other, one that
 * asks for dark or states no preference, it is Nightshift, as the stylesheet has it.
 */
const LIGHT_QUERY = '(prefers-color-scheme: light)';

/** The browser-UI colour for a scheme: the page background, so the chrome and the page are one. */
export function themeColorFor(scheme: ColorScheme, prefersLight: boolean): string {
  if (scheme === 'light' || (scheme === 'system' && prefersLight)) {
    return siteConfig.lightBackgroundColor;
  }
  return siteConfig.backgroundColor;
}

/**
 * Applies the chosen colour scheme to <html> and keeps the browser UI colour in
 * sync. index.html runs the same logic inline before the first paint; this
 * keeps it current afterwards.
 */
export function applyColorScheme(scheme: ColorScheme): void {
  const root = document.documentElement;
  if (scheme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', scheme);

  const prefersLight = window.matchMedia(LIGHT_QUERY).matches;
  // The page leaves two theme-colour tags for the system scheme (light when the device asks for
  // it, dark otherwise); once the app runs, one tag with the resolved colour is what every
  // browser reads.
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  const [first, ...rest] = Array.from(metas);
  for (const extra of rest) extra.remove();
  const meta = first ?? document.head.appendChild(document.createElement('meta'));
  meta.name = 'theme-color';
  meta.removeAttribute('media');
  meta.content = themeColorFor(scheme, prefersLight);
}

export function useColorScheme(): void {
  const scheme = useSettings((s) => s.colorScheme);
  useEffect(() => {
    applyColorScheme(scheme);
    const media = window.matchMedia(LIGHT_QUERY);
    const onChange = () => applyColorScheme(scheme);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [scheme]);
}

/**
 * Applies the piece set to <html>, where the piece CSS looks for it. A value that is not a known
 * set (an old or edited settings blob) falls back to the classic set, which the piece CSS also
 * shows while the attribute is missing.
 */
export function applyPieceSet(set: PieceSet, root: HTMLElement = document.documentElement): void {
  const known = (PIECE_SET_IDS as readonly string[]).includes(set);
  root.setAttribute('data-pieces', known ? set : 'classic');
  // Every set but Classic has its own stylesheet, fetched the first time the set is shown. Until
  // it arrives (or if it cannot, offline before the first fetch) the board shows Classic.
  if (known && set !== 'classic') {
    void import('@/components/board/pieceStyles').then((styles) => styles.loadPieceSet(set));
  }
}

/** Keeps the piece set on <html> in step with the settings. */
export function usePieceSet(): void {
  const pieceSet = useSettings((s) => s.pieceSet);
  useEffect(() => {
    applyPieceSet(pieceSet);
  }, [pieceSet]);
}
