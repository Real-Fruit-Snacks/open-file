#!/usr/bin/env node
/**
 * Prints the CHANGELOG.md section for one version, for the GitHub release of its tag,
 * with a link to the live app (read from src/site.config.ts) and a word on the offline
 * copy and the dev kit the release workflow attaches (scripts/package-offline.mjs,
 * scripts/build-dev-kit.mjs).
 *
 * Usage:  node scripts/release-notes.mjs 0.7.0
 *         node scripts/release-notes.mjs --check v0.12.0
 *
 * `--check` (the release workflow) also fails unless package.json carries the
 * tag's version, so a tag can never publish a build that calls itself something else.
 */
import { readFileSync } from 'node:fs';
import { devKitZipName } from './lib/dev-kit.mjs';
import { offlineZipName } from './lib/offline.mjs';
import {
  changelogSection,
  releaseNotes,
  siteUrlFrom,
  tagVersion,
  versionMismatch,
} from './lib/release.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const args = process.argv.slice(2);
const check = args.includes('--check');
const tag = args.find((arg) => !arg.startsWith('--')) ?? '';
if (!tag) {
  console.error('Usage: node scripts/release-notes.mjs [--check] <version or tag>');
  process.exit(1);
}

if (check) {
  const mismatch = versionMismatch(tag, JSON.parse(read('package.json')).version);
  if (mismatch) {
    console.error(mismatch);
    process.exit(1);
  }
}

const version = tagVersion(tag);
const section = changelogSection(read('CHANGELOG.md'), version);
if (section === null) {
  console.error(`No "## [${version}]" section in CHANGELOG.md`);
  process.exit(1);
}
process.stdout.write(
  releaseNotes(
    section,
    siteUrlFrom(read('src/site.config.ts')),
    offlineZipName(version),
    devKitZipName(version),
  ),
);
