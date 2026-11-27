import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Alert, Button, Card, ConfirmDialog, Stat, Switch } from '@/components/ui';
import { toast } from '@/components/ui/toastStore';
import {
  currentPhrase,
  deleteSyncedCopy,
  setSyncPart,
  stopSync,
  syncNow,
  turnOnSync,
  useDeviceSync,
} from '@/lib/sync/deviceSync';
import { completedLessons, KIND_PART, SYNC_KINDS, type SyncCounts } from '@/lib/sync/counts';
import { deviceSyncOffered } from '@/lib/sync/enabled';
import { SYNC_PARTS } from '@/lib/sync/parts';
import { splitWords } from '@/lib/sync/phrase';
import { useAnalyses } from '@/store/analyses';
import { useDeviceSyncStore } from '@/store/deviceSync';
import { useGames } from '@/store/games';
import { useProgress } from '@/store/progress';
import { useRepertoire } from '@/store/repertoire';
import {
  describeExchange,
  deviceSyncNeedsAttention,
  deviceSyncStatusLine,
  formatCount,
  SYNC_PART_TEXT,
  TOTAL_LABELS,
} from './deviceSyncStatus';
import { JoinSyncDialog } from './JoinSyncDialog';
import { SyncPhraseDialog } from './SyncPhraseDialog';

/** What a join link carries after `#sync=`: the phrase's words, joined by dashes. */
const JOIN_PREFIX = '#sync=';

function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  );
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

/** How much of each kind this profile holds, kept up to date as it changes. */
function useTotals(): SyncCounts {
  return {
    puzzles: useProgress((s) => s.lifetime.attempts),
    lessons: useProgress((s) => completedLessons(s.lessons)),
    repertoires: useRepertoire((s) => s.custom.length),
    moves: useRepertoire((s) => Object.keys(s.cards).length),
    analyses: useAnalyses((s) => Object.keys(s.items).length),
    games: useGames((s) => Object.keys(s.games).length),
  };
}

/**
 * What sync keeps in step, counted: puzzles, lessons, repertoires, analyses,
 * games — those of the parts this device syncs.
 */
function SyncTotals() {
  const totals = useTotals();
  const off = useDeviceSyncStore((s) => s.off);
  const kinds = SYNC_KINDS.filter((kind) => !off.includes(KIND_PART[kind]));
  if (kinds.length === 0) return null;
  return (
    <>
      <p className="small" style={{ margin: 0 }}>
        Kept in step on every device with your recovery phrase:
      </p>
      <div className="stats sync-totals" data-testid="sync-totals">
        {kinds.map((kind) => (
          <Stat key={kind} value={formatCount(totals[kind])} label={TOTAL_LABELS[kind]} />
        ))}
      </div>
    </>
  );
}

/**
 * What syncs on this device, part by part: a part switched off stays as it is
 * here, and the other devices keep theirs. Each device chooses for itself.
 */
function SyncParts() {
  const off = useDeviceSyncStore((s) => s.off);
  return (
    <fieldset className="settings__fieldset sync-parts" data-testid="sync-parts">
      <legend>What syncs on this device</legend>
      {SYNC_PARTS.map((part) => (
        <Switch
          key={part}
          checked={!off.includes(part)}
          onChange={(on) => setSyncPart(part, on)}
          label={SYNC_PART_TEXT[part].label}
          description={SYNC_PART_TEXT[part].description}
        />
      ))}
      <p className="small muted" style={{ margin: 0 }}>
        Switched off, a part stays as it is on this device, and your other devices keep theirs.
        Switched on again, what changed on both sides meanwhile comes together. The Lichess sign-in
        always stays on each device.
      </p>
    </fieldset>
  );
}

/**
 * Settings → Sync between devices: turn the end-to-end encrypted sync on (and
 * get the recovery phrase), join it from another device, see how it goes,
 * show the phrase again to add a device, turn it off here, or delete the
 * synced copy. Shown only when this build has a relay (`siteConfig.syncRelay`).
 */
export function DeviceSyncCard() {
  if (!deviceSyncOffered()) return null;
  return <DeviceSync />;
}

function DeviceSync() {
  const on = useDeviceSyncStore((s) => s.secret !== null);
  const lastSyncAt = useDeviceSyncStore((s) => s.lastSyncAt);
  const stoppedBecause = useDeviceSyncStore((s) => s.stoppedBecause);
  const status = useDeviceSync();
  const online = useOnline();
  const [now, setNow] = useState(() => Date.now());
  const [turningOn, setTurningOn] = useState(false);
  const [phrase, setPhrase] = useState<{ words: string[]; fresh: boolean } | null>(null);
  const [join, setJoin] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'off' | 'delete' | null>(null);
  const { hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(tick);
  }, []);

  // A join link (the QR code's) opens Settings here with the phrase after #sync=. The
  // phrase leaves the address straight away, so it stays out of the history.
  useEffect(() => {
    if (!hash.startsWith(JOIN_PREFIX)) return;
    void navigate({ hash: '' }, { replace: true });
    const raw = hash.slice(JOIN_PREFIX.length);
    let text = raw;
    try {
      text = decodeURIComponent(raw);
    } catch {
      // A mangled link: its words as they are (the dialog names any it cannot read).
    }
    const words = splitWords(text).join(' ');
    void (async () => {
      const current = await currentPhrase();
      if (current?.join(' ') === words) {
        toast('This device syncs with that phrase already.');
        return;
      }
      setJoin(words);
    })();
  }, [hash, navigate]);

  const turnOn = async () => {
    setTurningOn(true);
    const result = await turnOnSync();
    setTurningOn(false);
    if (!result.ok) {
      toast(result.reason, { tone: 'danger' });
      return;
    }
    setPhrase({ words: result.words, fresh: true });
  };

  const showPhrase = async () => {
    const words = await currentPhrase();
    if (words) setPhrase({ words, fresh: false });
  };

  const remove = async () => {
    const result = await deleteSyncedCopy();
    if (result.ok) toast('The synced copy was deleted. Each device keeps its data.');
    else toast(result.reason, { tone: 'danger' });
  };

  // A run that finished after the last tick reads "just now", not some minutes in the future.
  const statusLine = deviceSyncStatusLine(status, lastSyncAt, Math.max(now, lastSyncAt ?? 0));
  // What the last run moved, while its "Synced …" is the line shown.
  const moved = status.phase === 'done' ? describeExchange(status.last) : null;
  const statusText = moved ? `${statusLine} ${moved}` : statusLine;

  return (
    <Card id="sync" data-testid="sync-card">
      <h2 style={{ fontSize: '1.15rem' }}>Sync between devices</h2>
      {on ? (
        <div className="settings__group">
          <div className="settings__row">
            {deviceSyncNeedsAttention(status) ? (
              <Alert tone="warning">
                <p style={{ margin: 0 }} role="status" data-testid="sync-status">
                  {statusText}
                </p>
              </Alert>
            ) : (
              <span className="small muted" role="status" data-testid="sync-status">
                {statusText}
              </span>
            )}
            <Button
              size="sm"
              onClick={() => void syncNow({ asked: true })}
              disabled={status.phase === 'syncing' || !online}
              data-testid="sync-now"
            >
              Sync now
            </Button>
          </div>
          <SyncTotals />
          <SyncParts />
          <div className="settings__row">
            <span className="small">Add a device: show the recovery phrase, or its QR code.</span>
            <Button size="sm" onClick={() => void showPhrase()} data-testid="sync-show-phrase">
              Show recovery phrase
            </Button>
          </div>
          <div className="settings__row">
            <span className="small">Stop syncing here. The data stays, here and elsewhere.</span>
            <Button size="sm" onClick={() => setConfirm('off')} data-testid="sync-turn-off">
              Turn off
            </Button>
          </div>
          <div className="settings__row">
            <span className="small">Delete the encrypted copy kept for your devices.</span>
            <Button
              size="sm"
              onClick={() => setConfirm('delete')}
              disabled={!online}
              data-testid="sync-delete"
            >
              Delete synced copy
            </Button>
          </div>
          <p className="small faint" style={{ margin: 0 }}>
            End-to-end encrypted: your data is encrypted on this device, with a key from your
            recovery phrase, before it leaves. The sync service keeps only scrambled data and never
            sees the phrase.
          </p>
        </div>
      ) : (
        <div className="settings__group">
          {stoppedBecause === 'deleted' ? (
            <Alert tone="warning">
              <p style={{ margin: 0 }} data-testid="sync-stopped">
                The synced copy was deleted — from another device, or by the sync service after it
                went unused — so this device stopped syncing. Everything on it is still here. Turn
                sync on again to make a new synced copy.
              </p>
              <div className="row" style={{ marginTop: 8 }}>
                <Button size="sm" onClick={() => useDeviceSyncStore.getState().clearStopped()}>
                  OK
                </Button>
              </div>
            </Alert>
          ) : null}
          <p className="small muted" style={{ margin: 0 }}>
            Keep your phone, tablet and computer in step — no account, no email. Your data is
            encrypted on this device before it leaves, so the sync service stores only scrambled
            data it cannot read.
          </p>
          <ul className="small settings__list">
            <li>
              Progress, lessons, review schedules, repertoires, saved analyses, imported games and
              settings sync, so every device is ready to play as you left it. Each device can keep
              any of them to itself.
            </li>
            <li>Changes made offline wait, and join the rest when the device is back online.</li>
            <li>A 12-word recovery phrase, or its QR code, adds a device.</li>
          </ul>
          <details className="settings__diagnostics" data-testid="sync-parts-choice">
            <summary>Choose what this device syncs</summary>
            <SyncParts />
          </details>
          <div className="row">
            <Button
              variant="primary"
              onClick={() => void turnOn()}
              loading={turningOn}
              disabled={!online}
              data-testid="sync-turn-on"
            >
              Turn on sync
            </Button>
            <Button onClick={() => setJoin('')} disabled={!online} data-testid="sync-join">
              I have a recovery phrase
            </Button>
          </div>
          <p className="small faint" style={{ margin: 0 }}>
            {online
              ? 'Turning sync on gives you the recovery phrase: the only key to your synced data, so keep it safe.'
              : 'Syncing needs a connection: try again when this device is online.'}
          </p>
        </div>
      )}

      <SyncPhraseDialog
        words={phrase?.words ?? null}
        fresh={phrase?.fresh ?? false}
        onClose={() => setPhrase(null)}
      />
      <JoinSyncDialog open={join !== null} initial={join ?? ''} onClose={() => setJoin(null)} />

      {/* Mounted only while asked, so the page holds one set of confirmation buttons. */}
      {confirm === 'off' ? (
        <ConfirmDialog
          open
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            void stopSync().then(() => toast('Sync is off on this device.'));
          }}
          title="Turn off sync on this device?"
          confirmLabel="Turn off"
          danger
        >
          <p className="muted">
            This device stops syncing and forgets the recovery phrase. Its data stays here, and the
            synced copy stays for your other devices. To sync this device again, enter the phrase.
          </p>
        </ConfirmDialog>
      ) : null}
      {confirm === 'delete' ? (
        <ConfirmDialog
          open
          onClose={() => setConfirm(null)}
          onConfirm={() => void remove()}
          title="Delete the synced copy?"
          confirmLabel="Delete synced copy"
          danger
        >
          <p className="muted">
            The encrypted copy on the sync service is deleted and the recovery phrase stops working.
            Every device keeps the data it has; your other devices stop syncing at their next sync.
          </p>
        </ConfirmDialog>
      ) : null}
    </Card>
  );
}
