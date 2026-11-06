import { type ChessRules, rulesFor } from '@/chess/rules';
import type { LongColor, San, Uci } from '@/chess/types';
import type { ReviewedMove, ReviewSummary } from './gameReview';
import type { JudgedSuggestion } from './selfReview';

/**
 * "Fix your mistakes": a pass through the learner's inaccuracies, mistakes
 * and blunders in a reviewed game, each from the position before the move,
 * to find a better one. The engine's own move is right at once; another is
 * right when a short search finds it as good as that move, or nearly. Pure
 * rules here; `useFixMistakes` drives the board.
 */

const FLAGGED = new Set<ReviewedMove['judgement']>(['inaccuracy', 'mistake', 'blunder']);

/** The side's flagged moves that have a better move to find, in the order they were played. */
export function mistakesToFix(review: ReviewSummary, side: LongColor): ReviewedMove[] {
  return review.moves.filter((m) => m.mover === side && FLAGGED.has(m.judgement) && m.bestUci);
}

/** How many there are for each side (to ask which side was the learner's). */
export function mistakeCounts(review: ReviewSummary): Record<LongColor, number> {
  return {
    white: mistakesToFix(review, 'white').length,
    black: mistakesToFix(review, 'black').length,
  };
}

/** What a move tried in the position makes of the question. */
export type AttemptKind =
  /** The engine's own move: right, no search needed. */
  | 'best'
  /** The move played in the game: the one to improve on. */
  | 'played'
  /** Anything else: the engine decides. */
  | 'other';

/** `rules`: the game's (Chess960's write castling as king takes rook, as the engine does). */
export function classifyAttempt(
  move: ReviewedMove,
  uci: Uci,
  rules: Pick<ChessRules, 'sanToUci'> = rulesFor('standard'),
): AttemptKind {
  if (uci === move.bestUci) return 'best';
  if (uci === rules.sanToUci(move.fen, move.san)) return 'played';
  return 'other';
}

/** A move counts as found when the engine rates it as good as its own choice, or nearly. */
export function isGoodEnough(judged: JudgedSuggestion): boolean {
  return judged.verdict === 'best' || judged.verdict === 'good';
}

/** How a mistake went: found at the first try, found after a wrong try or more, or shown. */
export type FixOutcome = 'first' | 'retry' | 'shown';

export interface FixResult {
  ply: number;
  outcome: FixOutcome;
  /** The move found (null when shown). */
  found: San | null;
}

export interface FixTally {
  total: number;
  first: number;
  retry: number;
  shown: number;
}

export function tallyFixes(results: readonly FixResult[]): FixTally {
  return {
    total: results.length,
    first: results.filter((r) => r.outcome === 'first').length,
    retry: results.filter((r) => r.outcome === 'retry').length,
    shown: results.filter((r) => r.outcome === 'shown').length,
  };
}

/**
 * The end of the pass in a sentence: "You found 3 of 5, 2 at the first try;
 * you were shown the other 2."
 */
export function fixSummaryLine({ total, first, retry, shown }: FixTally): string {
  if (total === 0) return 'Nothing to fix.';
  const found = first + retry;
  if (found === 0) return total === 1 ? 'You were shown this one.' : `You were shown all ${total}.`;
  const head =
    found === total
      ? total === 1
        ? 'You found it'
        : `You found all ${total}`
      : `You found ${found} of ${total}`;
  const how =
    retry === 0
      ? ' at the first try'
      : first === 0
        ? ' after more than one try'
        : `, ${first} at the first try`;
  const rest = shown ? `; you were shown the other ${shown === 1 ? 'one' : shown}` : '';
  return `${head}${how}${rest}.`;
}

/** The review's word for a flagged move, with its article: "a blunder", "an inaccuracy". */
export function judgementWords(judgement: ReviewedMove['judgement']): string {
  return judgement === 'inaccuracy' ? 'an inaccuracy' : `a ${judgement ?? 'mistake'}`;
}
