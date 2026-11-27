import { useState } from 'react';
import { Button, Card, ConfirmDialog, Field, Select, Switch } from '@/components/ui';
import { toast } from '@/components/ui/toastStore';
import { ENGINE_LEVELS } from '@/engine/levels';
import { HumanOpponentDownload } from '@/features/play/HumanOpponentDownload';
import { CALIBRATION_PUZZLES, formatRating, STARTING_RATINGS } from '@/lib/rating';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { siteConfig } from '@/site.config';

type RatingChoice = 'calibrate' | (typeof STARTING_RATINGS)[number]['id'];

/** Settings → Play: how games and puzzles behave, the human-like opponent, and the puzzle rating. */
export function PlaySettings() {
  return (
    <div className="settings__grid">
      <div className="stack">
        <PlayCard />
      </div>
      <div className="stack">
        <RatingCard />
        <Card id="human-opponent" data-testid="human-opponent-setting">
          <h2 style={{ fontSize: '1.15rem' }}>Human-like opponent</h2>
          <p className="small muted">
            Maia-3, a model trained on real games, plays like a person of the rating you choose in
            Play. It runs on this device.
          </p>
          <HumanOpponentDownload removable />
        </Card>
      </div>
    </div>
  );
}

function PlayCard() {
  const settings = useSettings();
  return (
    <Card>
      <h2 style={{ fontSize: '1.15rem' }}>Play</h2>
      <div className="settings__group">
        <Switch
          checked={settings.autoQueen}
          onChange={(v) => settings.update({ autoQueen: v })}
          label="Always promote to a queen"
          description="Skips the promotion menu."
        />
        <Switch
          checked={settings.livePremoves}
          onChange={(v) => settings.update({ livePremoves: v })}
          label="Premoves in live games"
          description="Against a person, make your next move while they think: it is played the moment they have moved, and a promotion becomes a queen. Click elsewhere or press Escape to cancel it. Not in blindfold games."
        />
        <Switch
          checked={settings.puzzleAutoNext}
          onChange={(v) => settings.update({ puzzleAutoNext: v })}
          label="Auto-advance puzzles"
          description="Load the next puzzle automatically after a solve."
        />
        <Switch
          checked={settings.moveInput}
          onChange={(v) => settings.update({ moveInput: v })}
          label="Keyboard move entry"
          description="Show a box under the board to type moves such as Nf3 or e2e4."
        />
        <Switch
          checked={settings.keyboardShortcuts}
          onChange={(v) => settings.update({ keyboardShortcuts: v })}
          label="Single-key shortcuts"
          description="Letters such as H for a hint, N for the next puzzle and ? for the list of keys. Turn them off if you use speech input or a switch device; Enter, Space and the arrow keys keep working."
        />
        <Switch
          checked={settings.playFocus}
          onChange={(v) => settings.update({ playFocus: v })}
          label="Focus mode"
          description="Hide the header and navigation while you play the engine: in Play, the simul and the arcade games."
        />
        <Switch
          checked={settings.playCoach}
          onChange={(v) => settings.update({ playCoach: v })}
          label="Coach mode by default"
          description="New untimed games against the engine or the human-like opponent start with the coach on: mistakes pause the game with an explanation and a take-back."
        />
        <Switch
          checked={settings.playBlunderCheck}
          onChange={(v) => settings.update({ playBlunderCheck: v })}
          label="Blunder check by default"
          description="New games against the engine or the human-like opponent hold back a move that hangs material or allows mate and ask: checks, captures, threats? You can still play it."
        />
        <Field
          label="Engine level for the next game"
          hint="Every game you start updates this to the level you chose. The rating in brackets is a rough guide, not a measured strength."
        >
          {(id) => (
            <Select
              id={id}
              value={settings.playLevel}
              onChange={(e) => settings.update({ playLevel: Number(e.target.value) })}
            >
              {ENGINE_LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  Level {l.id} · {l.name} (~{l.approxElo})
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </Card>
  );
}

function RatingCard() {
  const completeOnboarding = useProgress((s) => s.completeOnboarding);
  const [choice, setChoice] = useState<RatingChoice>('calibrate');
  const [confirming, setConfirming] = useState(false);
  const option = STARTING_RATINGS.find((o) => o.id === choice);

  const apply = () => {
    if (choice === 'calibrate') {
      completeOnboarding(0, 'calibrate');
      toast(`Calibration started — the next ${CALIBRATION_PUZZLES} rated puzzles find your level.`);
      return;
    }
    if (option) {
      completeOnboarding(option.rating);
      toast(`Puzzle rating set to ${formatRating(option.rating, siteConfig.locale)}.`);
    }
  };

  return (
    <Card id="rating" data-testid="rating-settings">
      <h2 style={{ fontSize: '1.15rem' }}>Puzzle rating</h2>
      <p className="small muted">
        Reset your puzzle rating to a level that matches you better, or let a short run of puzzles
        find it. Your rating history is kept: the chart shows the change.
      </p>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <Field label="Start again from">
          {(id) => (
            <Select
              id={id}
              value={choice}
              onChange={(e) => setChoice(e.target.value as RatingChoice)}
            >
              <option value="calibrate">Find my level with {CALIBRATION_PUZZLES} puzzles</option>
              {STARTING_RATINGS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label} (~{formatRating(o.rating, siteConfig.locale)})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Button onClick={() => setConfirming(true)} data-testid="rating-reset">
          Reset rating…
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={apply}
        title="Reset your puzzle rating?"
        confirmLabel={choice === 'calibrate' ? 'Start calibration' : 'Reset rating'}
        danger
      >
        <p className="muted">
          {choice === 'calibrate'
            ? `Your rating starts uncertain again and the next ${CALIBRATION_PUZZLES} rated puzzles find your level.`
            : `Your puzzle rating is set to about ${option?.rating ?? ''} (“${option?.label ?? ''}”) and adjusts from there.`}{' '}
          Your attempts, statistics and rating history are kept: the chart shows the change.
        </p>
      </ConfirmDialog>
    </Card>
  );
}
