import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, Dialog } from '@/components/ui';
import { toast } from '@/components/ui/toastStore';
import { formatDate } from '@/lib/dates';
import { revokeLichessToken } from '@/lib/lichess/auth';
import { stopSync } from '@/lib/sync/deviceSync';
import { siteConfig } from '@/site.config';
import { useDeviceSyncStore } from '@/store/deviceSync';
import { useLichess } from '@/store/lichess';
import { useProfiles } from '@/store/profiles';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { DeviceSyncCard } from './DeviceSyncCard';
import { LichessCard } from './LichessCard';
import { ProfilesCard } from './ProfilesCard';
import { StorageUsage } from './StorageUsage';
import { useBackupActions } from './useBackupActions';
import { useImportBackup } from './useImportBackup';

/**
 * Settings → Sync & data: where the learner's data goes — sync between
 * devices, the Lichess account, backup files — and the profiles and storage
 * that hold it on this device.
 */
export function DataSettings() {
  return (
    <>
      <p className="small muted settings__lead">
        No sign-up, no tracking: everything stays in this browser unless you turn on sync between
        devices (end-to-end encrypted) or connect your Lichess account. The{' '}
        <Link to="/reference#faq">FAQ</Link> explains what leaves your device and when.
      </p>
      <div className="settings__grid">
        <div className="stack">
          <DeviceSyncCard />
          <BackupsCard />
          <StorageCard />
        </div>
        <div className="stack">
          <LichessCard />
          <ProfilesCard />
        </div>
      </div>
    </>
  );
}

function BackupsCard() {
  const lastBackupAt = useProgress((s) => s.lastBackupAt);
  const backup = useBackupActions();
  const importer = useImportBackup();
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <Card id="backups" data-testid="backups">
      <h2 style={{ fontSize: '1.15rem' }}>Backups</h2>
      <div className="settings__group">
        <div className="settings__row">
          <span className="small">
            Back up or move your progress — puzzles, lessons, repertoires, library and imported
            games
            {backup.canShare ? ', shared straight to another device' : ''}.
            {lastBackupAt ? ` Last backup ${formatDate(lastBackupAt, siteConfig.locale)}.` : ''}
          </span>
          <div className="row">
            {backup.canShare ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => void backup.share()}
                disabled={backup.busy}
              >
                Share
              </Button>
            ) : null}
            <Button size="sm" onClick={backup.download}>
              Export
            </Button>
            <Button size="sm" onClick={() => fileInput.current?.click()}>
              Import
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              hidden
              data-testid="import-file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importer.offerFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>
      {importer.dialog}
    </Card>
  );
}

function StorageCard() {
  const resetAll = useProgress((s) => s.resetAll);
  const resetSettings = useSettings((s) => s.reset);
  const profiles = useProfiles((s) => s.profiles);
  const [confirming, setConfirming] = useState(false);
  const otherProfiles = profiles.length - 1;
  return (
    <Card id="storage">
      <h2 style={{ fontSize: '1.15rem' }}>Storage</h2>
      <div className="settings__group">
        <StorageUsage />
        <div className="settings__row">
          <span className="small">
            Delete this profile’s progress, imported games and settings, and this device’s engine
            settings.
          </span>
          <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
            Reset everything
          </Button>
        </div>
      </div>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Reset everything?"
        danger
        actions={
          <>
            <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="btn--danger-solid"
              data-testid="reset-confirm"
              onClick={() => {
                void (async () => {
                  // Sync goes off here first, so the empty profile is not synced as deletions:
                  // the synced copy and the other devices keep their data.
                  if (useDeviceSyncStore.getState().secret) await stopSync();
                  // The Lichess permission is withdrawn too: the reset forgets the connection.
                  const lichessToken = useLichess.getState().account?.token;
                  if (lichessToken) void revokeLichessToken(lichessToken);
                  resetAll();
                  resetSettings();
                  setConfirming(false);
                  toast('This profile’s data and settings, and the engine settings, were cleared.');
                })();
              }}
            >
              Yes, reset
            </Button>
          </>
        }
      >
        <p className="muted">
          This deletes the puzzle rating, lesson progress, repertoires, analysis library, game
          history, imported games and settings of this profile, and this device’s engine settings:
          the engine goes back to its defaults, and a downloaded full engine is deleted. Sync
          between devices is turned off on this device (the synced copy and your other devices keep
          their data), and a connected Lichess account is disconnected (what was synced stays on
          Lichess). Export a backup first if you want to keep them.
        </p>
        <p className="muted">
          Kept:{' '}
          {otherProfiles > 0
            ? `the profile list and the ${otherProfiles === 1 ? 'other profile' : `${otherProfiles} other profiles`} with their data`
            : 'the profile list'}
          , and any puzzles downloaded for offline use.
        </p>
      </Dialog>
    </Card>
  );
}
