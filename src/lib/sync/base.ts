import { safeLocalStorage, writeStorage } from '@/lib/persistStorage';
import { ACTIVE_PROFILE_ID, storageKeyFor } from '@/store/profiles';
import { learnerSettingsFrom } from '@/store/settings';
import type { SyncBase, SyncSnapshot } from './merge';
import { isSyncPart } from './parts';
import { randomId } from './randomId';
import { gunzipText, gzipText } from './vaultCrypto';

/**
 * The copies of the synced data that merges are measured against: the vault
 * as this device last agreed with the relay (the base), and the data of a
 * write still on its way (see `pending` in `store/deviceSync.ts`). Each copy
 * is kept compressed in the Cache API (large enough, and out of the way of
 * localStorage's few megabytes) under a random id, and the device-sync store
 * names the ids in use. A copy is written once, under a new id, and never
 * changed, so an id always means one exact copy: a later save cannot be
 * mistaken for it, and a save that failed leaves no older copy behind under
 * its name.
 *
 * This tab also keeps the copies it saved or read in memory: the Cache API is
 * missing in some private windows, and a save can fail on a full disk. Another
 * tab, or the next start, without the copy merges without a base, which joins
 * both sides and loses nothing.
 *
 * Forgetting the base (when the data was replaced from outside the sync, or
 * storage failed half-way through a merge) writes a new mark under a
 * localStorage key of its own, which every tab reads straight from storage. A
 * base agreed under another mark is not used, so a tab that still holds the
 * old base in memory does not bring it back.
 */

/** What a copy holds: the synced data, and the vault's record of which device wrote when. */
export interface SyncCopy {
  snapshot: SyncSnapshot;
  writes: SyncWrites;
  /**
   * The parts this device kept to itself when the copy was agreed, each with
   * the version this device and the vault last shared (null when none is
   * known): a part synced again is merged against it.
   */
  parked?: Partial<SyncBase>;
}

/**
 * Each device's last write that a vault holds: the device's random id (made
 * when sync is turned on or joined there) and the generation it wrote. Sealed
 * with the data, so a device whose write's answer never arrived can tell from
 * the vault whether the write went through.
 */
export type SyncWrites = Record<string, number>;

const CACHE = 'open-file-device-sync';
/** A Cache API call that takes longer than this counts as failed (the memory copy serves). */
const CACHE_TIMEOUT_MS = 10_000;
/** The base mark's storage key, per profile. */
export const BASE_MARK_KEY = 'open-file:device-sync-base';

const memory = new Map<string, SyncCopy>();
let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs `task` after every Cache API task asked for before it, so a deletion
 * listed before a copy is saved cannot take that copy with it.
 */
function inTurn<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

const cachesAvailable = () => typeof caches !== 'undefined';

function folder(profile: string): string {
  const origin = typeof location === 'undefined' ? 'http://localhost' : location.origin;
  return `${origin}${import.meta.env.BASE_URL}__device-sync/${encodeURIComponent(profile)}/`;
}

/** Rejects when `work` takes too long, so a stuck storage call cannot hold up the sync. */
function inTime<T>(work: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('The storage did not answer.')),
      CACHE_TIMEOUT_MS,
    );
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

/** A stored copy read back; null when it is not one. */
function asCopy(value: unknown): SyncCopy | null {
  if (typeof value !== 'object' || value === null) return null;
  const { snapshot, writes, parked } = value as Partial<SyncCopy>;
  const parts = snapshot as Partial<SyncSnapshot> | undefined;
  if (
    typeof parts?.progress !== 'object' ||
    typeof parts.repertoire !== 'object' ||
    typeof parts.analyses !== 'object' ||
    typeof parts.games !== 'object' ||
    typeof writes !== 'object' ||
    writes === null
  ) {
    return null;
  }
  const copy: SyncCopy = {
    // A copy kept before settings synced holds none. Its settings are read as a load reads them
    // (the Black scheme of 0.31 as Nightshift), so a setting that only changed its name is not
    // taken for a change on the other side.
    snapshot: {
      ...(snapshot as SyncSnapshot),
      settings: learnerSettingsFrom(parts.settings ?? {}),
    },
    writes,
  };
  if (typeof parked === 'object' && parked !== null) {
    const kept = Object.entries(parked).filter(
      ([part, version]) => isSyncPart(part) && (version === null || typeof version === 'object'),
    );
    copy.parked = Object.fromEntries(kept);
  }
  return copy;
}

/** Keeps a copy under `id` (a new id: copies are never replaced). */
export async function saveCopy(
  id: string,
  copy: SyncCopy,
  profile = ACTIVE_PROFILE_ID,
): Promise<void> {
  memory.set(`${profile}/${id}`, copy);
  if (!cachesAvailable()) return;
  try {
    const body = await gzipText(JSON.stringify(copy));
    await inTurn(() =>
      inTime(
        caches
          .open(CACHE)
          .then((cache) =>
            cache.put(
              `${folder(profile)}${id}`,
              new Response(body, { headers: { 'Content-Type': 'application/gzip' } }),
            ),
          ),
      ),
    );
  } catch {
    // Storage full or unavailable: this tab's copy serves.
  }
}

/** The copy kept under `id`; null when there is none (any more). */
export async function loadCopy(id: string, profile = ACTIVE_PROFILE_ID): Promise<SyncCopy | null> {
  const kept = memory.get(`${profile}/${id}`);
  if (kept) return kept;
  if (!cachesAvailable()) return null;
  try {
    const response = await inTurn(() =>
      inTime(caches.open(CACHE).then((cache) => cache.match(`${folder(profile)}${id}`))),
    );
    if (!response) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    const copy = asCopy(JSON.parse(await gunzipText(bytes)));
    if (copy) memory.set(`${profile}/${id}`, copy);
    return copy;
  } catch {
    return null;
  }
}

/** Deletes the profile's copies, all but `keep`. */
export async function dropCopies(
  profile = ACTIVE_PROFILE_ID,
  keep: readonly (string | null)[] = [],
): Promise<void> {
  const prefix = `${profile}/`;
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix) && !keep.includes(key.slice(prefix.length))) memory.delete(key);
  }
  if (!cachesAvailable()) return;
  try {
    await inTurn(async () => {
      const start = folder(profile);
      const cache = await inTime(caches.open(CACHE));
      const stale = (await inTime(cache.keys())).filter(
        (request) =>
          request.url.startsWith(start) && !keep.includes(request.url.slice(start.length)),
      );
      await inTime(Promise.all(stale.map((request) => cache.delete(request))));
    });
  } catch {
    // Nothing to delete, or no storage to delete it from.
  }
}

/** The profile's base mark: a base agreed under another one was forgotten since. */
export function baseMark(profile = ACTIVE_PROFILE_ID): string {
  const mark = safeLocalStorage.getItem(storageKeyFor(BASE_MARK_KEY, profile));
  return typeof mark === 'string' ? mark : '';
}

/**
 * Forgets the base, in every tab: the next merge has none, so it joins both
 * sides and takes nothing for deleted. Returns false when the new mark could
 * not be stored (a full disk); the copies are deleted either way.
 */
export function forgetBase(profile = ACTIVE_PROFILE_ID): boolean {
  try {
    return writeStorage(storageKeyFor(BASE_MARK_KEY, profile), randomId());
  } finally {
    // Whatever became of the mark: without its copies, no tab can merge against the old base.
    void dropCopies(profile);
  }
}
