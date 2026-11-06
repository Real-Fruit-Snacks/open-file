import { useEffect, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { chooseEngineBuild, detectThreadEnvironment } from '@/engine/build';
import { EngineClient, isEngineSupported } from '@/engine/EngineClient';
import { isBuildAvailable } from '@/engine/fullEngine';
import { engineOptionsFromSettings } from '@/engine/useEngine';
import { readIsolationFlag } from '@/sw/isolation';
import { useSettings } from '@/store/settings';
import { type Benchmark, benchmarkEngine, describeBenchmark, diagnosticRows } from './engineReport';
import { currentEngineDownload, subscribeToEngineDownload } from './fullEngineDownload';
import './settings.css';

/**
 * "Is the engine working, and how fast?" — the environment facts behind the
 * threads setting, plus a one-click benchmark that boots a fresh engine,
 * searches the initial position and reports nodes per second.
 */
export function EngineDiagnostics() {
  const wantThreads = useSettings((s) => s.engineThreads);
  const wantFull = useSettings((s) => s.engineFull);
  const [flag, setFlag] = useState<boolean | null>(null);
  const [fullDownloaded, setFullDownloaded] = useState<boolean | null>(null);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Benchmark | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The flag row is re-read whenever the threads switch moves (the setting
  // writes the flag right after), so it never shows a stale value.
  useEffect(() => {
    let cancelled = false;
    void readIsolationFlag().then((stored) => {
      if (!cancelled) setFlag(stored);
    });
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
    const onChange = () => setTick((t) => t + 1);
    sw?.addEventListener('controllerchange', onChange);
    return () => {
      cancelled = true;
      sw?.removeEventListener('controllerchange', onChange);
    };
  }, [wantThreads]);

  // Whether the full build these settings pick is here: asked again when the panel
  // opens and when a download ends, which can happen while the panel is open.
  const fullBuild = chooseEngineBuild(wantThreads, detectThreadEnvironment(), true).build;
  useEffect(
    () =>
      subscribeToEngineDownload(() => {
        if (!currentEngineDownload()) setTick((t) => t + 1);
      }),
    [],
  );
  useEffect(() => {
    if (!wantFull) return;
    let cancelled = false;
    // What the engine itself checks: stored, and served from the device's copy.
    void isBuildAvailable(fullBuild).then((stored) => {
      if (!cancelled) setFullDownloaded(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [wantFull, fullBuild, tick]);

  const rows = diagnosticRows({
    env: detectThreadEnvironment(),
    wantThreads,
    wantFull,
    fullDownloaded,
    workers: typeof Worker !== 'undefined',
    wasm: typeof WebAssembly === 'object',
    serviceWorkerControlled:
      typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller,
    isolationFlag: flag,
  });
  void tick;

  const runBenchmark = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    const engine = new EngineClient(engineOptionsFromSettings());
    try {
      setResult(await benchmarkEngine(engine));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      engine.terminate();
      setRunning(false);
    }
  };

  return (
    <details
      className="settings__diagnostics"
      data-testid="engine-diagnostics"
      onToggle={(event) => {
        if (event.currentTarget.open) setTick((t) => t + 1);
      }}
    >
      <summary>Engine diagnostics</summary>
      <dl className="diagnostics">
        {rows.map((row) => (
          <div className="diagnostics__row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <Badge
                tone={row.tone === 'good' ? 'success' : row.tone === 'warn' ? 'warning' : 'neutral'}
              >
                {row.value}
              </Badge>
            </dd>
          </div>
        ))}
      </dl>
      <div className="row" style={{ marginTop: 8 }}>
        <Button
          size="sm"
          onClick={() => void runBenchmark()}
          loading={running}
          disabled={running || !isEngineSupported()}
        >
          Test the engine
        </Button>
        <span className="small muted" role="status" data-testid="engine-benchmark">
          {running
            ? 'Searching the initial position…'
            : error
              ? `The engine failed: ${error}`
              : result
                ? describeBenchmark(result)
                : 'Runs a short search and reports the speed.'}
        </span>
      </div>
    </details>
  );
}
