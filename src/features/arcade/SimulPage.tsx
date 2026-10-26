import { Chess, type Square } from 'chess.js';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate } from 'react-router';
import { Board } from '@/components/board/Board';
import { PromotionPicker } from '@/components/board/PromotionPicker';
import { ClockDisplay } from '@/components/chess/ClockDisplay';
import { PlayerBar } from '@/components/chess/PlayerBar';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Kbd,
  LinkButton,
  Select,
  Spinner,
  Stat,
  Switch,
} from '@/components/ui';
import { San } from '@/chess/San';
import { legalDests, opposite } from '@/chess/helpers';
import { START_FEN } from '@/chess/startFen';
import type { LongColor, PromotionPiece } from '@/chess/types';
import { getLevel } from '@/engine/levels';
import { type ClockState, getTimeControl, remaining } from '@/lib/clock';
import { handOffToAnalysis } from '@/lib/handoff';
import { prefersReducedMotion } from '@/lib/useReducedMotion';
import { useTicker } from '@/lib/useTicker';
import { siteConfig } from '@/site.config';
import { useProgress } from '@/store/progress';
import { DEFAULT_SETTINGS, type SimulColor, useSettings } from '@/store/settings';
import { SetupScreen, SetupSegmented } from '@/components/setup/SetupScreen';
import { EngineLevelField } from './arcadeControls';
import { useArcadeFocus } from './arcadeGame';
import {
  boardColors,
  boardLevels,
  boardPgn,
  describeLevels,
  describeResult,
  engineName,
  formatPoints,
  isFinished,
  isPlayerTurn,
  paceSeconds,
  SIMUL_BOARD_COUNTS,
  SIMUL_TIME_CONTROLS,
  type SimulBoard,
  simulScore,
  type SimulSetup,
  type SimulState,
  tally,
  timeControlOf,
} from './simul';
import { isNextBoardKey } from './simulKeys';
import { characterShortcutsOn } from '@/lib/shortcutKey';
import { SIMUL_ARCADE_ID, type UseSimul, useSimul } from './useSimul';
import '@/features/play/play.css';
import './arcade.css';
import './simul.css';

const COLOR_NAME: Record<LongColor, string> = { white: 'White', black: 'Black' };

/** Simul: several engines at once, each on its own board. */
export default function SimulPage() {
  const simul = useSimul();

  useEffect(() => {
    document.title = `Simul · ${siteConfig.name}`;
  }, []);

  return (
    <div>
      <div className="page-header page-header--lean">
        <p className="card__eyebrow arcade__eyebrow">
          <Link to="/arcade">Arcade</Link> / Simul
        </p>
        <h1>Simul</h1>
        <p>
          Several engines at once, each on its own board. Move, move on, come back — and with clocks
          on, your time runs on every board where it is your move.
        </p>
      </div>

      {simul.engineStatus === 'error' ? (
        <Alert tone="danger" role="alert">
          The engine could not start: {simul.engineError?.message}{' '}
          <Button size="sm" onClick={() => void simul.retryEngine()}>
            Retry
          </Button>
        </Alert>
      ) : null}

      {simul.state ? (
        <SimulGame key={simul.state.id} simul={simul} state={simul.state} />
      ) : (
        <SimulSetupCard simul={simul} />
      )}
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="simul-announce">
        {simul.announcement}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Setup                                                              */
/* ------------------------------------------------------------------ */

function SimulSetupCard({ simul }: { simul: UseSimul }) {
  const saved = useSettings((s) => s.simul);
  const shortcutsOn = useSettings((s) => s.keyboardShortcuts);
  const update = useSettings((s) => s.update);
  const best = useProgress((s) => s.arcade[SIMUL_ARCADE_ID]);
  const [setup, setSetup] = useState<SimulSetup>(() => ({ ...DEFAULT_SETTINGS.simul, ...saved }));
  const patch = (next: Partial<SimulSetup>) => setSetup((s) => ({ ...s, ...next }));
  const control = timeControlOf(setup);
  const pace = paceSeconds(setup);

  const begin = () => {
    update({ simul: setup });
    simul.start(setup);
  };

  return (
    <div className="simul__setup-layout">
      <SetupScreen
        title="New simul"
        intro="Several boards against Stockfish at once, each its own game."
        onStart={begin}
        startDisabled={simul.engineStatus === 'error'}
        status={simul.engineStatus === 'loading' ? <Spinner label="Loading engine" /> : null}
        startTestId="simul-start"
        testId="simul-setup"
      >
        <SetupSegmented<number>
          label="Boards"
          value={setup.boards}
          onChange={(boards) => patch({ boards })}
          options={SIMUL_BOARD_COUNTS.map((n) => ({ value: n, label: String(n) }))}
        />
        <EngineLevelField
          value={setup.levelId}
          onChange={(levelId) => patch({ levelId })}
          testId="simul-level"
          describe
        />
        <Switch
          checked={setup.rising}
          onChange={(rising) => patch({ rising })}
          label="Rising strength"
          description={`Each board one level stronger than the last: ${describeLevels({ ...setup, rising: true })}.`}
        />
        <SetupSegmented<SimulColor>
          label="Your colour"
          value={setup.color}
          onChange={(color) => patch({ color })}
          options={[
            { value: 'white', label: 'White' },
            { value: 'black', label: 'Black' },
            { value: 'alternate', label: 'Alternate' },
          ]}
        />
        <Field
          label="Clocks"
          hint={
            control
              ? `Your clock runs on every board where it is your move: with ${setup.boards} boards at ${control.label}, about ${Math.max(1, Math.round(pace ?? 0))} seconds a move.`
              : 'No clocks: take as long as you like on every board.'
          }
        >
          {(id) => (
            <Select
              id={id}
              value={setup.timeControlId}
              onChange={(e) => patch({ timeControlId: e.target.value })}
              data-testid="simul-clock"
            >
              {SIMUL_TIME_CONTROLS.map((tc) => (
                <option key={tc} value={tc}>
                  {tc === 'none' ? 'No clocks' : `${getTimeControl(tc).label} on every board`}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Switch
          checked={setup.autoAdvance}
          onChange={(autoAdvance) => patch({ autoAdvance })}
          label="Move on after each move"
          description="After you move, the next board waiting for you comes up — the way a simul giver walks the room."
        />
      </SetupScreen>

      <div className="stack">
        <SimulPreview setup={setup} />
        <Card className="simul__about">
          <h2>How it works</h2>
          <ul className="simul__list">
            <li>
              The big board is the one you are playing. Tap a small board to switch
              {shortcutsOn ? (
                <span className="keyboard-only">
                  , or press <Kbd>N</Kbd> for the next one waiting for you
                </span>
              ) : null}
              .
            </li>
            <li>
              With clocks, yours runs wherever it is your move, so each board you add makes your
              time go faster; the engine’s runs only while it thinks.
            </li>
            <li>No take-backs and no hints: a simul is a test.</li>
            <li>
              Each win scores its board’s level (1 to 8), a draw half of it.{' '}
              {best?.best ? (
                <>
                  Best so far: <strong data-testid="simul-best">{formatPoints(best.best)}</strong>
                  {best.detail ? ` (${best.detail})` : ''}.
                </>
              ) : (
                'Win a board to set a score to beat.'
              )}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

/**
 * The boards as they will start, as the setup changes: how many, the side you play on each, and
 * the level across from you — the small boards of the simul itself, before it begins.
 */
function SimulPreview({ setup }: { setup: SimulSetup }) {
  const levels = boardLevels(setup);
  const colors = boardColors(setup);
  return (
    <Card as="section" aria-labelledby="simul-preview-title" data-testid="simul-preview">
      <h2 id="simul-preview-title" className="simul__preview-title">
        The boards
      </h2>
      <ol className="simul__thumbs simul__preview" role="list">
        {colors.map((color, i) => (
          <li key={i} className="simul-thumb simul-thumb--preview">
            <div className="simul-thumb__board" aria-hidden="true">
              <Board
                fen={START_FEN}
                orientation={color}
                viewOnly
                coordinates={false}
                animate={false}
                announceMoves={false}
                drawable={false}
              />
            </div>
            <div className="simul-thumb__meta">
              <span className="simul-thumb__number" aria-hidden="true">
                {i + 1}
              </span>
              <span className="simul-thumb__state" aria-hidden="true">
                Level {levels[i]}
              </span>
              <span className="sr-only">
                Board {i + 1}: you play {color} against level {levels[i]}.
              </span>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Playing                                                            */
/* ------------------------------------------------------------------ */

function statusOf(board: SimulBoard, loading: boolean, stalled: boolean): string {
  if (board.result) return `${describeResult(board.result)}.`;
  if (board.turn === board.color) return 'Your move.';
  const name = engineName(board.levelId);
  if (board.engine === 'thinking') return `${name} is thinking…`;
  if (stalled) return `${name} is waiting for the engine, which has stopped answering.`;
  return loading ? 'Loading the engine…' : `${name} will answer in a moment…`;
}

function SimulGame({ simul, state }: { simul: UseSimul; state: SimulState }) {
  const navigate = useNavigate();
  // The best score before this simul (it is saved the moment the last board ends).
  const [bestBefore] = useState(() => useProgress.getState().arcade[SIMUL_ARCADE_ID]?.best ?? null);
  const board = state.boards[state.active] ?? state.boards[0];
  const finished = isFinished(state);
  const timed = !!timeControlOf(state.setup);
  // The board a resignation was offered for (not whichever is on the big board by then), or all.
  const [confirm, setConfirm] = useState<number | 'all' | null>(null);
  // Bumped to put the board back when a promotion is cancelled.
  const [boardKey, setBoardKey] = useState(0);
  const playFocus = useSettings((s) => s.playFocus);
  const shortcutsOn = useSettings((s) => s.keyboardShortcuts);
  const update = useSettings((s) => s.update);

  // Focus mode, as in Play: no header and navigation while the simul is on.
  useArcadeFocus(!finished);

  // Leaving mid-simul: ask first, and resign what is still in play so the record adds up
  // (the finished boards are already saved). A reload or a closed tab asks through the browser.
  const inPlay = !finished;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      inPlay && currentLocation.pathname !== nextLocation.pathname,
  );
  const leavingRef = useRef(false);
  // The last board ended (a flag) while the question was up: nothing is left to resign.
  useEffect(() => {
    if (blocker.state === 'blocked' && !inPlay) {
      leavingRef.current = true;
      blocker.proceed();
    }
  }, [blocker, inPlay]);
  const { resignAll } = simul;
  useEffect(() => {
    if (!inPlay) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older browsers need a value to show their prompt.
      e.returnValue = '';
    };
    // The page really goes (the prompt was accepted): the boards in play are resigned.
    const onPageHide = (e: PageTransitionEvent) => {
      if (!e.persisted) resignAll();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [inPlay, resignAll]);

  // A keyboard player keeps the keyboard on the big board when another board comes up:
  // the board is re-created for each game, so its focus would otherwise fall to the page.
  const lastInput = useRef<'key' | 'pointer'>('pointer');
  const boardCol = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = () => (lastInput.current = 'key');
    const onPointer = () => (lastInput.current = 'pointer');
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointer, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onPointer, true);
    };
  }, []);
  const keepKeyboardOnBoard = () => {
    if (!boardCol.current?.contains(document.activeElement)) return;
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && active !== document.body && document.contains(active)) return;
      boardCol.current?.querySelector<HTMLElement>('.board__cg')?.focus();
    });
  };

  // N: the next board waiting for a move (not while a dialog or the promotion picker is
  // open, nor while a field has the keys).
  const { next } = simul;
  const promotionPending = !!simul.promotion;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // N is also the knight in the promotion picker: a pending promotion keeps its move.
      if (!characterShortcutsOn() || !isNextBoardKey(e, promotionPending)) return;
      e.preventDefault();
      keepKeyboardOnBoard();
      next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, promotionPending]);

  const playerTurn = !!board && isPlayerTurn(board) && !simul.promotion;
  const fen = board?.fen;
  const dests = useMemo(
    () => (fen && playerTurn ? legalDests(new Chess(fen)) : new Map()),
    [fen, playerTurn],
  );

  if (!board) return null;
  const engineColor = opposite(board.color);
  const level = getLevel(board.levelId);
  const counts = tally(state);

  const onMove = (from: Square, to: Square) => {
    if (lastInput.current === 'key') keepKeyboardOnBoard();
    simul.move(from, to);
  };

  const onPromotion = (piece: PromotionPiece | null) => {
    if (!simul.resolvePromotion(piece)) setBoardKey((k) => k + 1);
  };

  const analyze = (b: SimulBoard) =>
    void navigate(handOffToAnalysis(boardPgn(state, b), { orientation: b.color }));

  return (
    <>
      {finished ? (
        <SimulSummary
          state={state}
          bestBefore={bestBefore}
          onAgain={() => simul.start(state.setup)}
          onNew={simul.quit}
          onAnalyze={analyze}
        />
      ) : null}

      <div className="trainer simul">
        <div className="play__boardcol" ref={boardCol}>
          <PlayerBar
            name={engineName(board.levelId)}
            color={engineColor}
            fen={board.fen}
            thinking={board.engine === 'thinking'}
            extra={timed ? <SimulClock clock={board.clock} side={engineColor} /> : null}
          />
          <div className="trainer__board">
            <Board
              key={`${state.id}-${state.active}-${boardKey}`}
              fen={board.fen}
              orientation={board.color}
              turnColor={board.turn}
              movableColor={playerTurn ? board.color : undefined}
              dests={dests}
              lastMove={board.lastMove}
              check={board.check}
              onMove={onMove}
              ariaLabel={`Board ${board.index + 1} of ${state.boards.length}: ${level.name}, you play ${board.color}`}
            />
            {simul.promotion?.index === board.index ? (
              <PromotionPicker color={board.color} onSelect={onPromotion} />
            ) : null}
          </div>
          <PlayerBar
            name="You"
            color={board.color}
            fen={board.fen}
            extra={timed ? <SimulClock clock={board.clock} side={board.color} /> : null}
          />
          <p className="arcade__status" role="status" data-testid="simul-status">
            Board {board.index + 1}:{' '}
            {statusOf(board, simul.engineStatus === 'loading', simul.stalled)}
          </p>
          {simul.stalled && !finished && simul.engineStatus !== 'error' ? (
            <Alert tone="warning">
              <span data-testid="simul-stalled">
                The engine has stopped answering; the boards waiting for it are on hold.{' '}
                <Button size="sm" onClick={simul.retry} data-testid="simul-retry">
                  Retry
                </Button>
              </span>
            </Alert>
          ) : null}
          {!finished ? (
            <SimulStrip state={state} onSelect={simul.select} onNext={simul.next} />
          ) : null}
        </div>

        <aside className="trainer__panel stack">
          <Card data-testid="simul-boards">
            <div className="row row--between">
              <h2 className="simul__title">Boards</h2>
              <span className="small muted" data-testid="simul-tally">
                {counts.finished
                  ? `${formatPoints(counts.points)} / ${counts.finished} finished`
                  : `${state.boards.length} games in play`}
              </span>
            </div>
            <div className="simul__thumbs">
              {state.boards.map((b) => (
                <SimulThumb
                  key={`${state.id}-${b.index}`}
                  board={b}
                  active={b.index === state.active}
                  timed={timed}
                  onSelect={simul.select}
                />
              ))}
            </div>
          </Card>

          <Card>
            <div className="row row--between">
              <strong>
                Board {board.index + 1} of {state.boards.length}
              </strong>
              <Badge tone="accent">
                Level {level.id} · {level.name}
              </Badge>
            </div>
            <p className="small muted" style={{ margin: '4px 0 12px' }}>
              You play {COLOR_NAME[board.color]}.{' '}
              {board.result ? describeResult(board.result) : null}
            </p>
            <div className="row">
              <Button onClick={simul.next} disabled={finished} data-testid="simul-next">
                Next board {shortcutsOn ? <Kbd>N</Kbd> : null}
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirm(board.index)}
                disabled={!!board.result}
                data-testid="simul-resign"
              >
                Resign this board
              </Button>
            </div>
            <Switch
              checked={state.setup.autoAdvance}
              onChange={(on) => {
                simul.setAutoAdvance(on);
                // Kept for the next simul too.
                update({ simul: { ...useSettings.getState().simul, autoAdvance: on } });
              }}
              label="Move on after each move"
            />
            <div className="row">
              <Button
                onClick={() => update({ playFocus: !playFocus })}
                aria-pressed={playFocus}
                title="Hide the header and navigation during the simul"
                data-testid="focus-toggle"
              >
                Focus
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirm('all')}
                disabled={finished}
                data-testid="simul-end"
              >
                End the simul
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="simul__title">Moves on board {board.index + 1}</h2>
            <MoveText board={board} />
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={typeof confirm === 'number'}
        title={`Resign board ${(typeof confirm === 'number' ? confirm : board.index) + 1}?`}
        confirmLabel="Resign"
        cancelLabel="Keep playing"
        danger
        onConfirm={() => {
          if (typeof confirm === 'number') simul.resign(confirm);
        }}
        onClose={() => setConfirm(null)}
      >
        <p className="muted">It counts as a loss; the other boards play on.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === 'all'}
        title="End the simul?"
        confirmLabel="Resign every board"
        cancelLabel="Keep playing"
        danger
        onConfirm={simul.resignAll}
        onClose={() => setConfirm(null)}
      >
        <p className="muted">
          Every board still in play counts as a loss; the finished ones keep their results.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave the simul?"
        confirmLabel="Leave and resign"
        cancelLabel="Stay"
        danger
        onConfirm={() => {
          leavingRef.current = true;
          simul.resignAll();
          blocker.proceed?.();
        }}
        onClose={() => {
          if (!leavingRef.current) blocker.reset?.();
        }}
      >
        <p className="muted" data-testid="simul-leave-note">
          {describeLeaving(state.boards.length - counts.finished, counts.finished)}
        </p>
      </ConfirmDialog>
    </>
  );
}

/** What leaving does to the boards, for the confirmation. */
function describeLeaving(inPlay: number, finished: number): string {
  const boards =
    inPlay === 1 ? 'The board still in play is' : `The ${inPlay} boards still in play are`;
  const kept = finished > 0 ? '; the finished ones keep their results.' : '.';
  return `${boards} resigned and ${inPlay === 1 ? 'counts as a loss' : 'count as losses'}${kept}`;
}

/**
 * Under the big board on a phone: every board's number and state, and Next —
 * the thumbnails are in the panel further down, a scroll away from the board.
 * Hidden wherever the panel sits beside the board.
 */
function SimulStrip({
  state,
  onSelect,
  onNext,
}: {
  state: SimulState;
  onSelect: (index: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="simul__strip" role="group" aria-label="Boards" data-testid="simul-strip">
      {state.boards.map((b) => {
        const kind = thumbState(b);
        const active = b.index === state.active;
        return (
          <button
            key={`${state.id}-${b.index}`}
            type="button"
            className={`simul__chip simul__chip--${kind}${active ? ' is-active' : ''}`}
            aria-pressed={active}
            aria-label={`Board ${b.index + 1}: ${STATE_LABEL[kind].toLowerCase()}`}
            onClick={() => onSelect(b.index)}
          >
            {/* A space between the two, so the shown text reads "1 Your move" as the name does. */}
            <span className="simul__chip-number">{b.index + 1}</span>{' '}
            <span className="simul__chip-state" aria-hidden="true">
              {STATE_LABEL[kind]}
            </span>
          </button>
        );
      })}
      <Button
        size="sm"
        className="simul__strip-next"
        onClick={onNext}
        data-testid="simul-strip-next"
      >
        Next board
      </Button>
    </div>
  );
}

/** A clock for one side of one board; only running clocks tick. */
function SimulClock({ clock, side }: { clock: ClockState | null; side: LongColor }) {
  const live = clock?.running === side;
  const now = useTicker(live);
  if (!clock) return null;
  // A tick can lag the board by a moment; never show more than the stored time.
  const ms = live ? Math.min(clock[side], remaining(clock, side, now)) : clock[side];
  return <ClockDisplay ms={ms} running={live} />;
}

const STATE_LABEL = {
  move: 'Your move',
  thinking: 'Thinking',
  waiting: 'Waiting',
  win: 'Won',
  loss: 'Lost',
  draw: 'Draw',
} as const;

function thumbState(board: SimulBoard): keyof typeof STATE_LABEL {
  if (board.result) return board.result.verdict;
  if (board.turn === board.color) return 'move';
  return board.engine === 'thinking' ? 'thinking' : 'waiting';
}

/** One small board: its position, its state and the player's clock; tap to play it. */
const SimulThumb = memo(function SimulThumb({
  board,
  active,
  timed,
  onSelect,
}: {
  board: SimulBoard;
  active: boolean;
  timed: boolean;
  onSelect: (index: number) => void;
}) {
  const kind = thumbState(board);
  const label = STATE_LABEL[kind];
  const level = getLevel(board.levelId);
  return (
    <div
      className={`simul-thumb simul-thumb--${kind}${active ? ' is-active' : ''}`}
      data-testid={`simul-board-${board.index + 1}`}
    >
      <div className="simul-thumb__board" aria-hidden="true">
        <Board
          fen={board.fen}
          orientation={board.color}
          lastMove={board.lastMove}
          check={board.check}
          viewOnly
          coordinates={false}
          animate={false}
          announceMoves={false}
          drawable={false}
        />
      </div>
      <div className="simul-thumb__meta">
        <span className="simul-thumb__number">{board.index + 1}</span>
        <span className="simul-thumb__state" data-testid={`simul-state-${board.index + 1}`}>
          {label}
        </span>
      </div>
      {timed ? (
        <div className="simul-thumb__clock" data-testid={`simul-clock-${board.index + 1}`}>
          <SimulClock clock={board.clock} side={board.color} />
        </div>
      ) : null}
      <button
        type="button"
        className="simul-thumb__select"
        aria-pressed={active}
        aria-label={`Board ${board.index + 1}, ${level.name}, you play ${board.color}: ${label.toLowerCase()}`}
        onClick={() => onSelect(board.index)}
      />
    </div>
  );
});

/** The moves of one board, numbered, in the chosen notation. */
function MoveText({ board }: { board: SimulBoard }) {
  if (!board.sans.length) return <p className="small muted">No moves yet.</p>;
  return (
    <p className="simul__moves" data-testid="simul-moves">
      {board.sans.map((san, i) => (
        <span key={i} className="simul__move">
          {i % 2 === 0 ? <span className="faint">{i / 2 + 1}.</span> : null}
          <San san={san} />
        </span>
      ))}
    </p>
  );
}

/** "1 move", "12 moves": full moves, counting a lone White move as one. */
function moveCount(plies: number): string {
  const moves = Math.ceil(plies / 2);
  return `${moves} move${moves === 1 ? '' : 's'}`;
}

function SimulSummary({
  state,
  bestBefore,
  onAgain,
  onNew,
  onAnalyze,
}: {
  state: SimulState;
  bestBefore: number | null;
  onAgain: () => void;
  onNew: () => void;
  onAnalyze: (board: SimulBoard) => void;
}) {
  const { wins, draws, losses, points } = tally(state);
  const score = simulScore(state);
  const newBest = score > (bestBefore ?? 0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({
      block: 'start',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);
  return (
    <div ref={ref} className="simul__summary-anchor">
      <Card className="simul__summary" data-testid="simul-summary">
        <h2>
          Simul over: {formatPoints(points)} / {state.boards.length}
        </h2>
        <div className="arcade__scoreline">
          <Stat value={wins} label="Won" />
          <Stat value={draws} label="Drawn" />
          <Stat value={losses} label="Lost" />
          <Stat value={formatPoints(score)} label="Score" />
        </div>
        <p className="small muted" style={{ margin: 0 }} data-testid="simul-best-line">
          {newBest
            ? 'A new best.'
            : bestBefore
              ? `Best so far: ${formatPoints(bestBefore)}.`
              : 'Win a board to set a score to beat.'}
        </p>
        <ol className="simul__results" role="list" aria-label="Results by board">
          {state.boards.map((b) => (
            <li key={b.index} data-testid={`simul-result-${b.index + 1}`}>
              <span>
                <strong>Board {b.index + 1}</strong> · {getLevel(b.levelId).name} ·{' '}
                {COLOR_NAME[b.color]} — {b.result ? describeResult(b.result) : 'unfinished'}
                <span className="faint simul__count"> ({moveCount(b.sans.length)})</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAnalyze(b)}
                aria-label={`Analyze game on board ${b.index + 1}`}
              >
                Analyze game
              </Button>
            </li>
          ))}
        </ol>
        <div className="row">
          <Button
            variant="primary"
            onClick={onAgain}
            title="The same boards, levels and clocks"
            data-testid="simul-again"
          >
            Play again
          </Button>
          <Button onClick={onNew} title="Set up a new simul" data-testid="simul-new">
            New game
          </Button>
          <LinkButton to="/arcade">Arcade</LinkButton>
        </div>
      </Card>
    </div>
  );
}
