import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { rulesFor } from '@/chess/rules';
import { Notated, San } from '@/chess/San';
import type { Fen, LongColor } from '@/chess/types';
import { Button, Card, Icon, ProgressBar } from '@/components/ui';
import { toast } from '@/components/ui/toastStore';
import { getLessonMeta } from '@/features/learn/lessonMeta';
import {
  type MainLine,
  type OwnPuzzle,
  ownPuzzleFromMoment,
  type OwnPuzzleMeta,
} from '@/features/puzzles/ownPuzzles';
import { useProgress } from '@/store/progress';
import { explainReviewedMove, MOTIF_HELP } from './commentary';
import { fixSummaryLine, judgementWords, mistakeCounts, tallyFixes } from './fixMistakesRules';
import type { ReviewSummary } from './gameReview';
import { moveNumberOfPly } from './timeUse';
import type { UseFixMistakes } from './useFixMistakes';
import './fix-mistakes.css';

/** "14." or "14…" before a move. */
function moveLabel(ply: number, mover: LongColor, startFen: Fen): string {
  return `${moveNumberOfPly(ply, startFen)}${mover === 'white' ? '.' : '…'}`;
}

/**
 * The way into "Fix your mistakes" under a game review: one button when the
 * learner's side is known, otherwise a question about which side was theirs.
 */
export function FixMistakesStart({
  review,
  learnerSide,
  onStart,
  focus = false,
}: {
  review: ReviewSummary;
  learnerSide: LongColor | null;
  onStart: (side: LongColor) => void;
  /** Take the keyboard focus on arrival (coming back from the pass). */
  focus?: boolean;
}) {
  const counts = useMemo(() => mistakeCounts(review), [review]);
  const [asking, setAsking] = useState(false);
  const questionId = useId();
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focus) startRef.current?.focus({ preventScroll: true });
  }, [focus]);
  if (learnerSide) {
    const count = counts[learnerSide];
    if (count === 0) {
      return (
        <p className="small muted fix__start" data-testid="fix-none">
          You made no inaccuracies, mistakes or blunders to fix in this game.
        </p>
      );
    }
    return (
      <div className="fix__start">
        <Button size="sm" variant="primary" onClick={() => onStart(learnerSide)} ref={startRef}>
          <Icon name="repeat" size={14} /> Fix your mistakes ({count})
        </Button>
        <span className="small muted">Find a better move for each of them.</span>
      </div>
    );
  }
  if (counts.white + counts.black === 0) return null;
  if (!asking) {
    return (
      <div className="fix__start">
        <Button size="sm" variant="primary" onClick={() => setAsking(true)} ref={startRef}>
          <Icon name="repeat" size={14} /> Fix your mistakes
        </Button>
        <span className="small muted">Find a better move for each of them.</span>
      </div>
    );
  }
  return (
    <div className="fix__start" role="group" aria-labelledby={questionId}>
      <span className="small" id={questionId}>
        Which side did you play?
      </span>
      {(['white', 'black'] as const).map((side) => (
        <Button
          key={side}
          size="sm"
          onClick={() => onStart(side)}
          disabled={counts[side] === 0}
          title={counts[side] === 0 ? `Nothing to fix for ${side}` : undefined}
        >
          {side === 'white' ? 'White' : 'Black'} ({counts[side]})
        </Button>
      ))}
      <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
        Cancel
      </Button>
    </div>
  );
}

/**
 * The card that stands in for the side panel while the learner fixes their
 * mistakes: the question, the verdict on each try, "Show the move", the
 * explanation once the move is on the board, and a summary at the end, from
 * which the ones missed can become puzzles.
 */
export function FixMistakesPanel({
  fix,
  startFen,
  line,
  meta,
  onLeave,
}: {
  fix: UseFixMistakes;
  /** "Back to the game": ends the pass (the page puts the board back). */
  onLeave: () => void;
  startFen: Fen;
  /** The game's main line and labels, for puzzles made from the misses. */
  line: MainLine;
  meta: OwnPuzzleMeta;
}) {
  const ownPuzzles = useProgress((s) => s.ownPuzzles);
  const addOwnPuzzles = useProgress((s) => s.addOwnPuzzles);
  const { step, phase } = fix;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const summary = phase === 'summary';
  // The button that started the pass is gone: the keyboard carries on from the card's title,
  // and again when the summary replaces the questions.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [summary]);
  const title = (
    <h2 className="fix__title" ref={titleRef} tabIndex={-1}>
      Fix your mistakes
    </h2>
  );

  if (phase === 'summary') {
    const tally = tallyFixes(fix.results);
    const missed = fix.steps.filter(
      (s) => fix.results.find((r) => r.ply === s.ply)?.outcome === 'shown',
    );
    const puzzles = missed
      .map((move) => ownPuzzleFromMoment(line, move, meta))
      .filter((p): p is OwnPuzzle => p !== null);
    const unsaved = puzzles.filter((p) => !ownPuzzles[p.id]);
    const save = () => {
      const added = addOwnPuzzles(unsaved);
      toast(
        added
          ? `Added ${added} puzzle${added === 1 ? '' : 's'} — find ${added === 1 ? 'it' : 'them'} under Puzzles → Mine.`
          : 'Those are already in My puzzles.',
        { tone: added ? 'success' : 'info' },
      );
    };
    return (
      <Card data-testid="fix-mistakes">
        {title}
        <p className="fix__summary" data-testid="fix-summary">
          {fixSummaryLine(tally)}
        </p>
        <ol role="list" className="fix__results">
          {fix.steps.map((move) => {
            const result = fix.results.find((r) => r.ply === move.ply);
            const shown = result?.outcome === 'shown';
            return (
              <li key={move.ply} className="fix__result">
                <span
                  className={shown ? 'fix__mark fix__mark--shown' : 'fix__mark fix__mark--found'}
                >
                  <Icon name={shown ? 'close' : 'check'} size={14} />
                </span>
                <span>
                  {moveLabel(move.ply, move.mover, startFen)} <San san={move.san} /> —{' '}
                  {result?.found ? (
                    <>
                      you found <San san={result.found} />
                      {result.outcome === 'retry' ? ' after another try' : ''}
                    </>
                  ) : (
                    <>
                      shown: <San san={move.best ?? ''} />
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="row fix__actions">
          {puzzles.length > 0 ? (
            <Button size="sm" onClick={save} disabled={unsaved.length === 0}>
              {unsaved.length === 0
                ? 'Saved as puzzles'
                : `Save ${unsaved.length === 1 ? 'the one you missed' : `the ${unsaved.length} you missed`} as puzzles`}
            </Button>
          ) : null}
          {missed.length > 0 ? (
            <Button size="sm" onClick={fix.retryMissed}>
              Try the missed ones again
            </Button>
          ) : null}
          <Button size="sm" variant="primary" onClick={onLeave}>
            Back to the game
          </Button>
        </div>
      </Card>
    );
  }

  if (!step) return null;
  const answered = phase === 'found' || phase === 'shown';
  const explanation = answered ? explainReviewedMove(step) : null;
  const help = explanation ? MOTIF_HELP[explanation.motif] : null;
  const lesson = help ? getLessonMeta(help.lesson) : null;
  const engineLine = answered
    ? rulesFor(fix.chess960 ? 'chess960' : 'standard').lineToSan(step.fen, step.bestPv.slice(0, 6))
    : [];
  const last = fix.index + 1 >= fix.steps.length;

  return (
    <Card data-testid="fix-mistakes">
      <div className="row row--between">
        {title}
        <span className="small muted" data-testid="fix-progress">
          {fix.index + 1} of {fix.steps.length}
        </span>
      </div>
      <div className="fix__progress">
        <ProgressBar
          value={fix.index + (answered ? 1 : 0)}
          max={fix.steps.length}
          label="Mistakes gone through"
          valueText={`${fix.index + (answered ? 1 : 0)} of ${fix.steps.length}`}
        />
      </div>
      <p className="fix__prompt" data-testid="fix-prompt">
        <span className="muted">{moveLabel(step.ply, step.mover, startFen)}</span> You played{' '}
        <strong>
          <San san={step.san} />
        </strong>
        , {judgementWords(step.judgement)}. Find a better move.
      </p>
      <p
        className={`fix__feedback${fix.feedback ? ` fix__feedback--${fix.feedback.tone}` : ''}`}
        role="status"
        data-testid="fix-feedback"
      >
        {fix.feedback ? (
          <>
            {fix.feedback.tone === 'success' ? (
              <Icon name="check" size={16} />
            ) : fix.feedback.tone === 'warning' ? (
              <Icon name="close" size={16} />
            ) : null}
            <span>
              <Notated text={fix.feedback.text} />
            </span>
          </>
        ) : null}
      </p>
      {answered && (explanation || engineLine.length > 0) ? (
        <div className="fix__why" data-testid="fix-why">
          {explanation ? (
            <>
              <p className="fix__why-title">
                Why <San san={step.san} /> was {judgementWords(step.judgement)}
              </p>
              <p>
                <Notated text={explanation.text} />
              </p>
            </>
          ) : null}
          {engineLine.length > 1 ? (
            <p className="small muted">
              The engine’s line: <Notated text={engineLine.join(' ')} />
            </p>
          ) : null}
          {lesson ? (
            <p className="small">
              <Link to={`/learn/${lesson.id}`}>Lesson: {lesson.title}</Link>
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="row fix__actions">
        {answered ? (
          <Button size="sm" variant="primary" onClick={fix.next} data-testid="fix-next">
            {last ? 'See how it went' : 'Next mistake'}
          </Button>
        ) : (
          <Button size="sm" onClick={fix.show} data-testid="fix-show">
            Show the move
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onLeave}>
          Back to the game
        </Button>
      </div>
      <p className="small faint fix__note">
        The engine is paused while you look. A move as good as its own, or nearly, counts.
      </p>
    </Card>
  );
}
