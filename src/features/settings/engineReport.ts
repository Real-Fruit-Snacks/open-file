import {
  chooseEngineBuild,
  describeEngine,
  fallbackBuilds,
  type ThreadEnvironment,
} from '@/engine/build';
import type { EngineClient } from '@/engine/EngineClient';
import { START_FEN } from '@/chess/helpers';

export interface DiagnosticRow {
  label: string;
  value: string;
  /** 'good' | 'warn' | 'neutral' controls the badge tone. */
  tone: 'good' | 'warn' | 'neutral';
}

export interface DiagnosticsInput {
  env: ThreadEnvironment;
  wantThreads: boolean;
  /** The full-engine switch. */
  wantFull?: boolean;
  /** Whether the full build these settings pick is downloaded (null: not known yet). */
  fullDownloaded?: boolean | null;
  workers: boolean;
  wasm: boolean;
  serviceWorkerControlled: boolean;
  isolationFlag: boolean | null;
}

/** The environment rows of the diagnostics panel. Pure, so it can be unit-tested. */
export function diagnosticRows(input: DiagnosticsInput): DiagnosticRow[] {
  const wantFull = input.wantFull ?? false;
  const choice = chooseEngineBuild(input.wantThreads, input.env, wantFull);
  // The full engine runs only once downloaded; until then its lite twin does.
  const runs =
    wantFull && input.fullDownloaded === false
      ? (fallbackBuilds(choice.build)[0] ?? choice.build)
      : choice.build;
  const rows: DiagnosticRow[] = [
    {
      // What this environment and these settings select; the running client is not probed.
      label: 'Build selected',
      value: describeEngine(runs, choice.threads),
      tone: choice.threads > 1 ? 'good' : 'neutral',
    },
    {
      label: 'Full engine',
      value: !wantFull
        ? 'Off'
        : input.fullDownloaded === null || input.fullDownloaded === undefined
          ? 'On — checking the download'
          : input.fullDownloaded
            ? 'On — downloaded'
            : 'On — not downloaded, so the lite engine runs',
      tone: wantFull ? (input.fullDownloaded ? 'good' : 'warn') : 'neutral',
    },
    {
      label: 'WebAssembly',
      value: input.wasm ? 'Available' : 'Missing — the engine cannot run',
      tone: input.wasm ? 'good' : 'warn',
    },
    {
      label: 'Web Workers',
      value: input.workers ? 'Available' : 'Missing — the engine cannot run',
      tone: input.workers ? 'good' : 'warn',
    },
    {
      label: 'CPU cores reported',
      value: input.env.cores ? String(input.env.cores) : 'Hidden by the browser',
      tone: 'neutral',
    },
    {
      label: 'Cross-origin isolated',
      value: input.env.isolated ? 'Yes' : 'No',
      tone: input.env.isolated ? 'good' : input.wantThreads ? 'warn' : 'neutral',
    },
    {
      label: 'Shared memory (SharedArrayBuffer)',
      value: input.env.sharedMemory ? 'Yes' : 'No',
      tone: input.env.sharedMemory ? 'good' : input.wantThreads ? 'warn' : 'neutral',
    },
    {
      label: 'Offline service worker',
      value: input.serviceWorkerControlled ? 'Controlling this page' : 'Not controlling this page',
      tone: input.serviceWorkerControlled ? 'good' : 'neutral',
    },
    {
      label: 'Isolation flag saved',
      value: input.isolationFlag === null ? 'Unknown' : input.isolationFlag ? 'On' : 'Off',
      tone: 'neutral',
    },
  ];
  if (input.wantThreads && choice.reason) {
    const why: Record<NonNullable<typeof choice.reason>, string> = {
      off: 'Threads are switched off.',
      'not-isolated':
        'The page is not cross-origin isolated yet — the threaded engine starts after a reload.',
      'no-shared-memory': 'This browser does not expose shared memory.',
      'one-core':
        'Fewer than three cores are reported, or the count is hidden, so threads would not help.',
    };
    rows.push({ label: 'Why single-threaded', value: why[choice.reason], tone: 'warn' });
  }
  return rows;
}

export interface Benchmark {
  name: string;
  depth: number;
  nodes: number | null;
  nps: number | null;
  ms: number;
  /** Why a lighter build ran than the settings asked for, if one did. */
  fallback: 'not-downloaded' | 'failed' | null;
}

const BENCH_DEPTH = 14;

/** Runs a fixed-depth search from the initial position and reports the speed. */
export async function benchmarkEngine(engine: EngineClient): Promise<Benchmark> {
  await engine.init();
  const startedAt = performance.now();
  const { lines } = await engine.search({ fen: START_FEN, depth: BENCH_DEPTH }).result;
  const ms = Math.round(performance.now() - startedAt);
  const info = lines.get(1);
  return {
    name: engine.name,
    depth: info?.depth ?? 0,
    nodes: info?.nodes ?? null,
    nps: info?.nps ?? null,
    ms,
    fallback: engine.fellBack ? (engine.fallbackReason ?? 'failed') : null,
  };
}

export function describeBenchmark(b: Benchmark): string {
  const speed = b.nps ? `${Math.round(b.nps / 1000).toLocaleString()} k nodes/s` : 'speed unknown';
  const nodes = b.nodes ? `${b.nodes.toLocaleString()} nodes` : '';
  const fallback =
    b.fallback === 'not-downloaded'
      ? ' — the full engine is not downloaded, so the lite one ran'
      : b.fallback === 'failed'
        ? ' — the build the settings ask for could not start, so a lighter one ran'
        : '';
  return `${b.name}: depth ${b.depth} in ${(b.ms / 1000).toFixed(1)} s (${[speed, nodes].filter(Boolean).join(', ')})${fallback}.`;
}
