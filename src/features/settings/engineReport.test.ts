import { describe, expect, it } from 'vitest';
import type { EngineClient } from '@/engine/EngineClient';
import { benchmarkEngine, describeBenchmark, diagnosticRows } from './engineReport';

const base = {
  env: { isolated: false, sharedMemory: false, cores: 8 },
  wantThreads: false,
  workers: true,
  wasm: true,
  serviceWorkerControlled: true,
  isolationFlag: false,
};

describe('engine diagnostics', () => {
  it('describes a healthy single-threaded environment', () => {
    const rows = diagnosticRows(base);
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(byLabel['Build selected']?.value).toBe('Stockfish 19 lite');
    expect(byLabel.WebAssembly?.tone).toBe('good');
    expect(byLabel['Cross-origin isolated']?.tone).toBe('neutral');
    expect(rows.some((r) => r.label === 'Why single-threaded')).toBe(false);
  });

  it('explains why threads are not active', () => {
    const rows = diagnosticRows({ ...base, wantThreads: true, isolationFlag: true });
    const why = rows.find((r) => r.label === 'Why single-threaded');
    expect(why?.value).toBe(
      'The page is not cross-origin isolated yet — the threaded engine starts after a reload.',
    );
    expect(rows.find((r) => r.label === 'Cross-origin isolated')?.tone).toBe('warn');
    const active = diagnosticRows({
      ...base,
      wantThreads: true,
      env: { isolated: true, sharedMemory: true, cores: 8 },
    });
    expect(active.find((r) => r.label === 'Build selected')?.value).toBe(
      'Stockfish 19 lite · 7 threads',
    );
  });

  it('shows the full engine, and the lite one standing in until it is downloaded', () => {
    const isolated = { isolated: true, sharedMemory: true, cores: 8 };
    const row = (rows: ReturnType<typeof diagnosticRows>, label: string) =>
      rows.find((r) => r.label === label);

    const off = diagnosticRows({ ...base, wantThreads: true, env: isolated });
    expect(row(off, 'Full engine')).toMatchObject({ value: 'Off', tone: 'neutral' });

    const ready = diagnosticRows({
      ...base,
      wantThreads: true,
      env: isolated,
      wantFull: true,
      fullDownloaded: true,
    });
    expect(row(ready, 'Build selected')?.value).toBe('Stockfish 19 · 7 threads');
    expect(row(ready, 'Full engine')).toMatchObject({ value: 'On — downloaded', tone: 'good' });

    const missing = diagnosticRows({
      ...base,
      wantThreads: true,
      env: isolated,
      wantFull: true,
      fullDownloaded: false,
    });
    expect(row(missing, 'Build selected')?.value).toBe('Stockfish 19 lite · 7 threads');
    expect(row(missing, 'Full engine')).toMatchObject({
      value: 'On — not downloaded, so the lite engine runs',
      tone: 'warn',
    });

    const oneCore = diagnosticRows({ ...base, wantFull: true, fullDownloaded: true });
    expect(row(oneCore, 'Build selected')?.value).toBe('Stockfish 19');
    const checking = diagnosticRows({ ...base, wantFull: true, fullDownloaded: null });
    expect(row(checking, 'Build selected')?.value).toBe('Stockfish 19');
    expect(row(checking, 'Full engine')?.value).toBe('On — checking the download');
  });

  it('flags missing WebAssembly', () => {
    const rows = diagnosticRows({ ...base, wasm: false });
    expect(rows.find((r) => r.label === 'WebAssembly')?.tone).toBe('warn');
  });

  it('formats a benchmark', () => {
    expect(
      describeBenchmark({
        name: 'Stockfish 19 lite',
        depth: 14,
        nodes: 250_000,
        nps: 400_000,
        ms: 625,
        fallback: null,
      }),
    ).toBe('Stockfish 19 lite: depth 14 in 0.6 s (400 k nodes/s, 250,000 nodes).');
    const slow = { name: 'x', depth: 10, nodes: null, nps: null, ms: 2000 };
    expect(describeBenchmark({ ...slow, fallback: 'failed' })).toBe(
      'x: depth 10 in 2.0 s (speed unknown) — the build the settings ask for could not start, so a lighter one ran.',
    );
    expect(describeBenchmark({ ...slow, fallback: 'not-downloaded' })).toContain(
      'the full engine is not downloaded, so the lite one ran',
    );
  });

  it('reports why the benchmark engine is lighter than asked', async () => {
    const engine = (fellBack: boolean, fallbackReason: 'not-downloaded' | 'failed' | null) =>
      ({
        name: 'Stockfish 19 lite',
        fellBack,
        fallbackReason,
        init: () => Promise.resolve(),
        search: () => ({
          result: Promise.resolve({
            lines: new Map([[1, { depth: 14, nodes: 1000, nps: 50_000 }]]),
          }),
        }),
      }) as unknown as EngineClient;
    expect((await benchmarkEngine(engine(false, null))).fallback).toBeNull();
    expect((await benchmarkEngine(engine(true, 'not-downloaded'))).fallback).toBe('not-downloaded');
    expect((await benchmarkEngine(engine(true, 'failed'))).fallback).toBe('failed');
  });
});
