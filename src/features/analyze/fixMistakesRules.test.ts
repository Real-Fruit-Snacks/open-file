import { describe, expect, it } from 'vitest';
import { rulesFor } from '@/chess/rules';
import { reviewOf } from '@/test/fakeReview';
import {
  classifyAttempt,
  fixSummaryLine,
  isGoodEnough,
  judgementWords,
  mistakeCounts,
  mistakesToFix,
  tallyFixes,
} from './fixMistakesRules';

const SANS = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Nc3', 'Nxh5'];
const REVIEW = reviewOf(SANS, {
  3: { judgement: 'inaccuracy', best: 'g1f3' },
  6: { judgement: 'blunder', best: 'd8e7' },
  7: { judgement: 'blunder', best: 'h5f7' },
  // A flagged move with no better move on record cannot be a question.
  8: { judgement: 'mistake' },
});

/** A reviewed move to vary. */
function nc3Of() {
  const move = REVIEW.moves[6];
  if (!move) throw new Error('The review has no seventh move');
  return move;
}

describe('which moves to fix', () => {
  it('takes the side’s inaccuracies, mistakes and blunders with a better move, in order', () => {
    expect(mistakesToFix(REVIEW, 'white').map((m) => m.san)).toEqual(['Bc4', 'Nc3']);
    expect(mistakesToFix(REVIEW, 'black').map((m) => m.san)).toEqual(['Nf6']);
    expect(mistakeCounts(REVIEW)).toEqual({ white: 2, black: 1 });
  });

  it('knows the engine’s move and the move played from any other', () => {
    const nc3 = REVIEW.moves[6]!;
    expect(classifyAttempt(nc3, 'h5f7')).toBe('best');
    expect(classifyAttempt(nc3, 'b1c3')).toBe('played');
    expect(classifyAttempt(nc3, 'd2d3')).toBe('other');
  });

  it('knows a Chess960 castling played in the game, written as king takes rook', () => {
    const castled = {
      ...nc3Of(),
      fen: 'bnrknbrq/pppppppp/8/8/8/8/PPPPPPPP/BNRKNBRQ w KQkq - 0 1',
      san: 'O-O-O',
      bestUci: 'e2e4',
    };
    expect(classifyAttempt(castled, 'd1c1', rulesFor('chess960'))).toBe('played');
    expect(classifyAttempt(castled, 'e2e4', rulesFor('chess960'))).toBe('best');
  });

  it('counts a move as found when the engine rates it as good as its own, or nearly', () => {
    expect(isGoodEnough({ verdict: 'best', loss: 0.01, best: 'h5f7' })).toBe(true);
    expect(isGoodEnough({ verdict: 'good', loss: 0.04, best: 'h5f7' })).toBe(true);
    expect(isGoodEnough({ verdict: 'ok', loss: 0.08, best: 'h5f7' })).toBe(false);
    expect(isGoodEnough({ verdict: 'worse', loss: 0.3, best: 'h5f7' })).toBe(false);
  });
});

describe('how it went', () => {
  const tally = (first: number, retry: number, shown: number) =>
    fixSummaryLine(
      tallyFixes([
        ...Array.from({ length: first }, (_, i) => ({
          ply: i,
          outcome: 'first' as const,
          found: 'a',
        })),
        ...Array.from({ length: retry }, (_, i) => ({
          ply: 10 + i,
          outcome: 'retry' as const,
          found: 'b',
        })),
        ...Array.from({ length: shown }, (_, i) => ({
          ply: 20 + i,
          outcome: 'shown' as const,
          found: null,
        })),
      ]),
    );

  it('sums the pass up in a sentence', () => {
    expect(tally(1, 0, 0)).toBe('You found it at the first try.');
    expect(tally(5, 0, 0)).toBe('You found all 5 at the first try.');
    expect(tally(3, 2, 0)).toBe('You found all 5, 3 at the first try.');
    expect(tally(0, 1, 0)).toBe('You found it after more than one try.');
    expect(tally(2, 1, 2)).toBe(
      'You found 3 of 5, 2 at the first try; you were shown the other 2.',
    );
    expect(tally(4, 0, 1)).toBe('You found 4 of 5 at the first try; you were shown the other one.');
    expect(tally(0, 0, 1)).toBe('You were shown this one.');
    expect(tally(0, 0, 3)).toBe('You were shown all 3.');
    expect(tally(0, 0, 0)).toBe('Nothing to fix.');
    expect(tallyFixes([{ ply: 1, outcome: 'retry', found: 'Nf3' }])).toEqual({
      total: 1,
      first: 0,
      retry: 1,
      shown: 0,
    });
  });

  it('names the review’s verdicts with their article', () => {
    expect(judgementWords('inaccuracy')).toBe('an inaccuracy');
    expect(judgementWords('mistake')).toBe('a mistake');
    expect(judgementWords('blunder')).toBe('a blunder');
  });
});
