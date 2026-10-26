import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteConfig } from '@/site.config';
import { applyColorScheme, applyPieceSet } from './theme';

describe('colour scheme', () => {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.append(meta);
  /** The scheme the device asks for, as the stubbed media queries answer; null states none. */
  let prefers: 'light' | 'dark' | null = null;
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: prefers !== null && query === `(prefers-color-scheme: ${prefers})`,
    media: query,
  }));

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    prefers = null;
  });

  it('puts the scheme on <html> and tints the browser chrome to match', () => {
    applyColorScheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    // The page background, not the accent: the browser chrome matches the page.
    expect(meta.content).toBe(siteConfig.lightBackgroundColor);
    applyColorScheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(meta.content).toBe(siteConfig.backgroundColor);
    applyColorScheme('system');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    // A device that states no preference gets Nightshift, the default.
    expect(meta.content).toBe(siteConfig.backgroundColor);
  });

  it('shows the system scheme light only where the device asks for light', () => {
    prefers = 'light';
    applyColorScheme('system');
    expect(meta.content).toBe(siteConfig.lightBackgroundColor);
    prefers = 'dark';
    applyColorScheme('system');
    expect(meta.content).toBe(siteConfig.backgroundColor);
    // A scheme the learner picked holds whatever the device asks for.
    prefers = 'light';
    applyColorScheme('dark');
    expect(meta.content).toBe(siteConfig.backgroundColor);
    prefers = 'dark';
    applyColorScheme('light');
    expect(meta.content).toBe(siteConfig.lightBackgroundColor);
  });

  it('collapses the media-keyed tags from index.html into one resolved colour', () => {
    const light = document.createElement('meta');
    light.name = 'theme-color';
    light.media = '(prefers-color-scheme: light)';
    document.head.append(light);
    applyColorScheme('dark');
    const tags = document.querySelectorAll('meta[name="theme-color"]');
    expect(tags).toHaveLength(1);
    expect(tags[0]?.getAttribute('media')).toBeNull();
    expect(tags[0]?.getAttribute('content')).toBe(siteConfig.backgroundColor);
  });

  it('always names the piece set on <html>, the classic one included', () => {
    const root = document.createElement('html');
    applyPieceSet('merida', root);
    expect(root.dataset.pieces).toBe('merida');
    applyPieceSet('classic', root);
    expect(root.dataset.pieces).toBe('classic');
    applyPieceSet('maestro', root);
    expect(root.dataset.pieces).toBe('maestro');
    // A set this version no longer has (one of 0.19's own sets, from an old settings blob)
    // shows the classic pieces.
    applyPieceSet('staunton' as never, root);
    expect(root.dataset.pieces).toBe('classic');
  });
});
