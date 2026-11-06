#!/usr/bin/env node
/**
 * Installs the human-like opponent's files into public/maia/:
 *
 *  - the Maia-3 model (5M parameters, half-precision weights; AGPL-3.0, from
 *    the University of Toronto's CSSLab), downloaded from a pinned revision of
 *    its browser-ready ONNX export and checked against its SHA-256;
 *  - ONNX Runtime Web's WebAssembly build (MIT), copied from the installed
 *    `onnxruntime-web` package under a versioned name, so a cached copy can
 *    never be paired with a newer runtime's code. The installed version must
 *    be the pinned one, and the binary its checksum.
 *
 * Neither is kept in git (the model is 10.8 MB, the runtime 14.2 MB). The page
 * downloads both only when the learner asks for human-like opponents. The
 * script is idempotent: files already in place with the right checksums are
 * left alone, and anything else in the folder (an earlier pin's files, a
 * download a stopped run left behind) is removed, so it is never deployed.
 *
 * Usage:  node scripts/setup-maia.mjs [--force] [--optional] [--from <folder>]
 *
 *   --optional  warn instead of failing when the files cannot be installed (`npm run dev`:
 *               the rest of the app works without them; a build needs them).
 *   --from      copy the model from a folder instead of downloading it (the dev kit's
 *               offline/files/maia/, or a file fetched by hand), with the same checksum check.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceFolder } from './lib/dev-kit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'maia');

/** Bump together with `src/sw/maiaFiles.ts` (a test keeps them in step). */
export const MAIA = {
  model: {
    name: 'maia3-5m.fp16.onnx',
    // https://huggingface.co/bqrio/maia3-onnx at a fixed revision: the file can never change under us.
    url: 'https://huggingface.co/bqrio/maia3-onnx/resolve/923df9a2e9396b54a09b168bb858ebbd5e5b76bc/maia3-5m.fp16.onnx',
    sha256: 'ca22fc3031975932e693f9758149302efc177749165443ed52de828add8864fa',
    license: 'AGPL-3.0',
    source: 'https://huggingface.co/UofTCSSLab/Maia3-5M',
  },
  runtime: {
    version: '1.30.0',
    name: 'ort-1.30.0-simd-threaded.wasm',
    from: join('node_modules', 'onnxruntime-web', 'dist', 'ort-wasm-simd-threaded.wasm'),
    sha256: '3398c10d07d229bd91b364548e130e0e51a8e5704b88c7c083ebbeb78842dee2',
    license: 'MIT',
    source: 'https://github.com/microsoft/onnxruntime',
  },
};

const force = process.argv.includes('--force');
const optional = process.argv.includes('--optional');

/** The names in public/maia/ that are neither the pinned files nor the folder's own notes. */
export function staleMaiaFiles(names) {
  const keep = new Set(['README.md', 'version.json', MAIA.model.name, MAIA.runtime.name]);
  return names.filter((name) => !keep.has(name));
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function matches(path, digest) {
  try {
    await stat(path);
  } catch {
    return false;
  }
  return sha256(await readFile(path)) === digest;
}

/** Writes `data` to `target` through a temporary file, so a stopped run leaves nothing half-written. */
async function install(target, data) {
  const tmp = `${target}.download`;
  await writeFile(tmp, data);
  await rename(tmp, target);
}

function refuse(name, expected, received, why) {
  return new Error(
    `Checksum mismatch for ${name}\n  expected ${expected}\n  received ${received}\n${why}`,
  );
}

/** Downloads the pinned model, or copies it from `from` when that names a folder. */
async function installModel(from) {
  const { model } = MAIA;
  const target = join(OUT_DIR, model.name);
  if (!force && (await matches(target, model.sha256))) return false;
  let data;
  if (from) {
    process.stdout.write(`  ← ${model.name} … `);
    const source = join(from, model.name);
    try {
      data = await readFile(source);
    } catch {
      throw new Error(`${model.name} is not in ${from}`);
    }
  } else {
    process.stdout.write(`  ↓ ${model.name} … `);
    const res = await fetch(model.url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`Failed to download ${model.url}: HTTP ${res.status}`);
    data = Buffer.from(await res.arrayBuffer());
  }
  const digest = sha256(data);
  if (digest !== model.sha256) {
    throw refuse(
      model.name,
      model.sha256,
      digest,
      from
        ? 'It is not the pinned file. Refusing to install.'
        : 'The pinned file may have been altered. Refusing to install.',
    );
  }
  await install(target, data);
  process.stdout.write(`${(data.length / 1024 / 1024).toFixed(1)} MB ✓\n`);
  return true;
}

/** The installed `onnxruntime-web` version, or null when it is not installed. */
export async function installedRuntimeVersion(root = ROOT) {
  try {
    const pkg = JSON.parse(
      await readFile(join(root, 'node_modules', 'onnxruntime-web', 'package.json'), 'utf8'),
    );
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

async function installRuntime() {
  const { runtime } = MAIA;
  const target = join(OUT_DIR, runtime.name);
  if (!force && (await matches(target, runtime.sha256))) return false;
  const version = await installedRuntimeVersion();
  if (version !== runtime.version) {
    throw new Error(
      `onnxruntime-web ${version ?? '(not installed)'} is installed, but ${runtime.version} is pinned ` +
        '(scripts/setup-maia.mjs and src/sw/maiaFiles.ts). Run `npm ci`, or update the pins together.',
    );
  }
  const data = await readFile(join(ROOT, runtime.from));
  const digest = sha256(data);
  if (digest !== runtime.sha256) {
    throw refuse(
      runtime.name,
      runtime.sha256,
      digest,
      'The installed package is not the pinned build.',
    );
  }
  await install(target, data);
  console.log(`  ✓ ${runtime.name} (from onnxruntime-web ${version})`);
  return true;
}

/** What `version.json` says: the pinned files, their licences and where they come from. */
export function versionRecord() {
  return JSON.stringify(MAIA, null, 2) + '\n';
}

async function writeVersionFile() {
  const path = join(OUT_DIR, 'version.json');
  const wanted = versionRecord();
  let current = null;
  try {
    current = await readFile(path, 'utf8');
  } catch {
    // Missing: written below.
  }
  if (current === wanted) return false;
  await writeFile(path, wanted);
  return true;
}

async function main() {
  const from = sourceFolder(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });
  // Files of an earlier pin (a different model or runtime version) are of no use any more.
  for (const stale of staleMaiaFiles(await readdir(OUT_DIR))) {
    await rm(join(OUT_DIR, stale), { force: true, recursive: true });
    console.log(`  - removed public/maia/${stale}`);
  }
  const model = await installModel(from);
  const runtime = await installRuntime();
  if (!model && !runtime) {
    console.log('Maia-3 and ONNX Runtime already installed in public/maia/');
  }
  if (await writeVersionFile()) console.log('Wrote public/maia/version.json');
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    if (optional) {
      console.warn(
        `\nsetup-maia: the human-like opponent's files could not be installed (${message}).\n` +
          'Everything else works without them; `npm run maia:setup` tries again.',
      );
      return;
    }
    console.error(`\nsetup-maia failed: ${message}`);
    process.exit(1);
  });
}
