import type { Square } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DrawShape } from '@/components/board/Board';
import { parseUci } from '@/chess/helpers';
import type { PlayedMove } from '@/chess/rules';
import type { GameTree, TreeNode } from '@/chess/tree';
import type { Fen, LongColor, PromotionPiece, San, Uci } from '@/chess/types';
import { playMoveSound } from '@/lib/sound';
import { useSettings } from '@/store/settings';
import { classifyAttempt, type FixResult, isGoodEnough, mistakesToFix } from './fixMistakesRules';
import type { ReviewedMove, ReviewSummary } from './gameReview';
import { judgeSuggestion } from './selfReview';
import type { UseAnalysis } from './useAnalysis';

export type FixPhase =
  | 'off'
  /** The position before a mistake: the learner looks for a better move. */
  | 'asking'
  /** A move is on the board while the engine compares it with its own. */
  | 'checking'
  /** A good move was found. */
  | 'found'
  /** The engine's move was shown. */
  | 'shown'
  /** Every mistake has been through: how it went. */
  | 'summary';

export interface FixFeedback {
  tone: 'info' | 'success' | 'warning';
  text: string;
}

/** What the board shows while fixing (it stands in for the analysis board's own position). */
export interface FixBoard {
  fen: Fen;
  turn: LongColor;
  dests: Map<Square, Square[]>;
  lastMove: [Square, Square] | null;
  check: boolean;
  /** The side that may move pieces: the learner's, while they look for a move. */
  movable: LongColor | undefined;
  shapes: DrawShape[];
}

export interface UseFixMistakes {
  phase: FixPhase;
  side: LongColor | null;
  steps: ReviewedMove[];
  index: number;
  step: ReviewedMove | null;
  /** The move on the board after a find or "Show the move". */
  answer: { san: San; uci: Uci } | null;
  feedback: FixFeedback | null;
  results: FixResult[];
  board: FixBoard | null;
  /** The game is Chess960: its moves follow those rules. */
  chess960?: boolean;
  pendingPromotion: { from: Square; to: Square; color: LongColor } | null;
  /** Starts a pass through `side`'s mistakes in the game's review. */
  start: (side: LongColor) => void;
  /** Ends the pass: the board, the engine and the orientation as they were. */
  leave: () => void;
  play: (from: Square, to: Square, promotion?: PromotionPiece) => void;
  /** A typed move (SAN or UCI); false when it is not legal here. */
  playNotation: (text: string) => boolean;
  resolvePromotion: (piece: PromotionPiece | null) => void;
  show: () => void;
  next: () => void;
  /** Goes through the ones that were shown again. */
  retryMissed: () => void;
}

interface Saved {
  tree: GameTree;
  node: TreeNode;
  engineOn: boolean;
  orientation: LongColor;
  review: ReviewSummary;
}

interface Placed {
  uci: Uci;
  san: San;
  fen: Fen;
}

const squaresOf = (uci: Uci): [Square, Square] => {
  const { from, to } = parseUci(uci);
  return [from, to];
};

/**
 * Drives "Fix your mistakes" on the analysis board: the analysis is paused
 * and its tree left alone while the board shows the position before each of
 * the learner's mistakes. The engine's own move is right at once; any other
 * is searched against it (`judgeSuggestion`). Leaving puts the board, the
 * engine and the orientation back as they were.
 */
export function useFixMistakes(
  analysis: UseAnalysis,
  view: { orientation: LongColor; setOrientation: (color: LongColor) => void },
): UseFixMistakes {
  const autoQueen = useSettings((s) => s.autoQueen);
  const [phase, setPhase] = useState<FixPhase>('off');
  const [side, setSide] = useState<LongColor | null>(null);
  const [steps, setSteps] = useState<ReviewedMove[]>([]);
  const [index, setIndex] = useState(0);
  const [tries, setTries] = useState(0);
  const [attempt, setAttempt] = useState<Placed | null>(null);
  const [answer, setAnswer] = useState<Placed | null>(null);
  const [wrong, setWrong] = useState<Uci | null>(null);
  const [feedback, setFeedback] = useState<FixFeedback | null>(null);
  const [results, setResults] = useState<FixResult[]>([]);
  const [pendingPromotion, setPendingPromotion] =
    useState<UseFixMistakes['pendingPromotion']>(null);
  const saved = useRef<Saved | null>(null);
  /** Bumped whenever the step changes: a verdict still on its way for an older one is dropped. */
  const run = useRef(0);
  const step = phase === 'off' ? null : (steps[index] ?? null);
  const { tree, review, setEngineOn, goTo, engine, current, engineOn } = analysis;
  /** The game's rules: a Chess960 game's moves (castling as king onto rook) are its own. */
  const rules = tree.rules;

  const resetStep = useCallback(() => {
    run.current += 1;
    setTries(0);
    setAttempt(null);
    setAnswer(null);
    setWrong(null);
    setFeedback(null);
    setPendingPromotion(null);
  }, []);

  const start = useCallback(
    (learner: LongColor) => {
      if (!review) return;
      const list = mistakesToFix(review, learner);
      if (list.length === 0) return;
      saved.current ??= { tree, node: current, engineOn, orientation: view.orientation, review };
      setEngineOn(false);
      view.setOrientation(learner);
      setSide(learner);
      setSteps(list);
      setIndex(0);
      setResults([]);
      resetStep();
      setPhase('asking');
    },
    [review, tree, current, engineOn, view, setEngineOn, resetStep],
  );

  const leave = useCallback(() => {
    resetStep();
    setPhase('off');
    setSteps([]);
    const was = saved.current;
    saved.current = null;
    if (!was) return;
    setEngineOn(was.engineOn);
    // The same game still on the board: back to the move it was on, the way it was turned.
    // (Another game, loaded meanwhile, keeps the way it opened.)
    if (tree === was.tree) {
      view.setOrientation(was.orientation);
      goTo(was.node);
    }
  }, [resetStep, setEngineOn, view, tree, goTo]);

  // A new game, or a changed main line, drops the review: the pass ends with it.
  useEffect(() => {
    if (phase !== 'off' && saved.current && review !== saved.current.review) leave();
  }, [phase, review, leave]);

  const found = useCallback(
    (move: ReviewedMove, placed: Placed, verdict: 'engine' | 'best' | 'good') => {
      setResults((list) => [
        ...list,
        { ply: move.ply, outcome: tries === 0 ? 'first' : 'retry', found: placed.san },
      ]);
      setAnswer(placed);
      setAttempt(null);
      setWrong(null);
      setPhase('found');
      setFeedback({
        tone: 'success',
        text:
          verdict === 'engine'
            ? `Yes: ${placed.san} is the engine’s move.`
            : verdict === 'best'
              ? `Yes: ${placed.san} is as good as the engine’s move, ${move.best ?? ''}.`
              : `Good: ${placed.san} is nearly as good as the engine’s move, ${move.best ?? ''}.`,
      });
    },
    [tries],
  );

  const miss = useCallback((uci: Uci, text: string, counts = true) => {
    if (counts) setTries((n) => n + 1);
    setAttempt(null);
    setWrong(uci);
    setPhase('asking');
    setFeedback({ tone: 'warning', text });
  }, []);

  /** Judges a legal move made in the position before the mistake. */
  const tryAnswer = useCallback(
    (move: PlayedMove) => {
      if (phase !== 'asking' || !step) return;
      playMoveSound(move, { inCheck: () => rules.position(move.after).inCheck });
      const placed: Placed = { uci: move.uci, san: move.san, fen: move.after };
      const kind = classifyAttempt(step, placed.uci, rules);
      if (kind === 'best') {
        found(step, placed, 'engine');
        return;
      }
      if (kind === 'played') {
        miss(placed.uci, `${placed.san} is the move you played in the game. Find a better one.`);
        return;
      }
      const id = ++run.current;
      setAttempt(placed);
      setWrong(null);
      setPhase('checking');
      setFeedback({ tone: 'info', text: `Checking ${placed.san}…` });
      judgeSuggestion(engine(), step.fen, placed.uci, step.bestUci, tree.chess960)
        .then((judged) => {
          if (run.current !== id) return;
          if (!judged) {
            miss(placed.uci, `${placed.san} could not be checked. Try another move.`, false);
          } else if (isGoodEnough(judged)) {
            found(step, placed, judged.verdict === 'best' ? 'best' : 'good');
          } else {
            miss(placed.uci, `${placed.san} is not good enough here. Try another move.`);
          }
        })
        .catch(() => {
          if (run.current !== id) return;
          miss(placed.uci, `${placed.san} could not be checked. Try another move.`, false);
        });
    },
    [phase, step, found, miss, engine, rules, tree],
  );

  const play = useCallback(
    (from: Square, to: Square, promotion?: PromotionPiece) => {
      if (phase !== 'asking' || !step) return;
      if (!promotion && rules.isPromotion(step.fen, from, to)) {
        if (autoQueen) promotion = 'q';
        else {
          setPendingPromotion({ from, to, color: rules.position(step.fen).turn });
          return;
        }
      }
      const move = rules.play(step.fen, { from, to, promotion });
      if (move) tryAnswer(move);
    },
    [phase, step, autoQueen, tryAnswer, rules],
  );

  const playNotation = useCallback(
    (text: string) => {
      if (phase !== 'asking' || !step) return false;
      const move = rules.playTyped(step.fen, text, { autoQueen });
      if (!move) return false;
      tryAnswer(move);
      return true;
    },
    [phase, step, autoQueen, tryAnswer, rules],
  );

  const resolvePromotion = useCallback(
    (piece: PromotionPiece | null) => {
      const pending = pendingPromotion;
      setPendingPromotion(null);
      if (pending && piece) play(pending.from, pending.to, piece);
    },
    [pendingPromotion, play],
  );

  const show = useCallback(() => {
    if ((phase !== 'asking' && phase !== 'checking') || !step?.bestUci) return;
    run.current += 1;
    const move = rules.play(step.fen, parseUci(step.bestUci));
    if (!move) return;
    setResults((list) => [...list, { ply: step.ply, outcome: 'shown', found: null }]);
    setAnswer({ uci: step.bestUci, san: move.san, fen: move.after });
    setAttempt(null);
    setWrong(null);
    setPendingPromotion(null);
    setPhase('shown');
    setFeedback({ tone: 'info', text: `The move was ${move.san}.` });
  }, [phase, step, rules]);

  const next = useCallback(() => {
    if (phase !== 'found' && phase !== 'shown') return;
    if (index + 1 >= steps.length) {
      run.current += 1;
      setFeedback(null);
      setPhase('summary');
      return;
    }
    resetStep();
    setIndex(index + 1);
    setPhase('asking');
  }, [phase, index, steps.length, resetStep]);

  const retryMissed = useCallback(() => {
    const missed = steps.filter((s) => results.find((r) => r.ply === s.ply)?.outcome === 'shown');
    if (missed.length === 0) return;
    resetStep();
    setSteps(missed);
    setIndex(0);
    setResults([]);
    setPhase('asking');
  }, [steps, results, resetStep]);

  const board = useMemo((): FixBoard | null => {
    if (phase === 'off' || !step) return null;
    const placed = phase === 'checking' ? attempt : answer;
    const fen = placed?.fen ?? step.fen;
    const info = rules.position(fen);
    // Before the mistake, the last move on the board is the one that led to the position.
    const previous = tree.mainLine()[step.ply - 2];
    const lastMove = placed
      ? squaresOf(placed.uci)
      : previous?.uci
        ? squaresOf(previous.uci)
        : null;
    const asking = phase === 'asking';
    return {
      fen,
      turn: info.turn,
      dests: asking ? info.dests : new Map<Square, Square[]>(),
      lastMove,
      check: info.inCheck,
      movable: asking ? (side ?? undefined) : undefined,
      shapes:
        asking && wrong
          ? [{ orig: squaresOf(wrong)[0], dest: squaresOf(wrong)[1], brush: 'red' }]
          : [],
    };
  }, [phase, step, attempt, answer, wrong, side, tree, rules]);

  return {
    phase,
    side,
    steps,
    index,
    step,
    answer: answer ? { san: answer.san, uci: answer.uci } : null,
    feedback,
    results,
    board,
    chess960: tree.chess960,
    pendingPromotion,
    start,
    leave,
    play,
    playNotation,
    resolvePromotion,
    show,
    next,
    retryMissed,
  };
}
