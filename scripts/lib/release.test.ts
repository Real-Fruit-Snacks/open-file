// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../src/site.config.ts';
import {
  changelogSection,
  releaseNotes,
  siteUrlFrom,
  tagVersion,
  versionMismatch,
} from './release.mjs';

const CHANGELOG = `# Changelog

## [Unreleased]

## [0.12.0] - 2026-10-03

### Fixed

- Something.

## [0.11.0] - 2026-10-02

- Older.
`;

describe('release checks', () => {
  it('reads the version from a tag', () => {
    expect(tagVersion('v0.12.0')).toBe('0.12.0');
    expect(tagVersion('refs/tags/v1.0.0')).toBe('1.0.0');
    expect(tagVersion('0.9.4')).toBe('0.9.4');
  });

  it('refuses a tag that package.json does not agree with', () => {
    expect(versionMismatch('v0.12.0', '0.12.0')).toBeNull();
    expect(versionMismatch('v0.12.0', '0.11.0')).toMatch(/v0\.12\.0 .*0\.11\.0/);
    expect(versionMismatch('v0.12.1', '0.12.0')).not.toBeNull();
  });

  it('takes one version’s section from the changelog', () => {
    expect(changelogSection(CHANGELOG, '0.12.0')).toBe('### Fixed\n\n- Something.');
    expect(changelogSection(CHANGELOG, '0.11.0')).toBe('- Older.');
    expect(changelogSection(CHANGELOG, '0.10.0')).toBeNull();
  });

  it('links the live app from the one place its URL is written down', () => {
    const source = readFileSync(new URL('../../src/site.config.ts', import.meta.url), 'utf8');
    expect(siteUrlFrom(source)).toBe(siteConfig.siteUrl);
    expect(releaseNotes('- Something.', siteConfig.siteUrl)).toBe(
      `- Something.\n\nLive app: ${siteConfig.siteUrl}\n`,
    );
    // A release with an offline copy says what it is, after the link.
    const withCopy = releaseNotes(
      '- Something.',
      siteConfig.siteUrl,
      'open-file-1.0.0-offline.zip',
    );
    expect(withCopy).toMatch(
      new RegExp(
        `^- Something\\.\\n\\nLive app: ${siteConfig.siteUrl}\\n\\nOffline copy: download \`open-file-1\\.0\\.0-offline\\.zip\` below`,
      ),
    );
    expect(withCopy).toContain('SHA256SUMS.txt holds its checksum.');
    expect(withCopy.endsWith('.\n')).toBe(true);
    // And with a dev kit, what that is, after the offline copy; the checksums are of both.
    const withKit = releaseNotes(
      '- Something.',
      siteConfig.siteUrl,
      'open-file-1.0.0-offline.zip',
      'open-file-1.0.0-dev-windows-x64.zip',
    );
    expect(withKit.startsWith(withCopy.replace(' SHA256SUMS.txt holds its checksum.\n', ''))).toBe(
      true,
    );
    expect(withKit).toMatch(/\n\nDev kit: `open-file-1\.0\.0-dev-windows-x64\.zip` is the source/);
    expect(withKit).toContain('SHA256SUMS.txt holds their checksums.');
    expect(withKit.match(/SHA256SUMS/g)).toHaveLength(1);
    expect(withKit.endsWith('.\n')).toBe(true);
    expect(() => siteUrlFrom('export const siteConfig = {};')).toThrow(/siteUrl/);
  });
});
