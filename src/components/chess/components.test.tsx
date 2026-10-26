import { Chess } from 'chess.js';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameTree } from '@/chess/tree';
import type { SearchInfo } from '@/engine/uci';
import { useSettings } from '@/store/settings';
import { EngineLines } from './EngineLines';
import { EvalBar } from './EvalBar';
import { EvalGraph } from './EvalGraph';
import { Material } from './Material';
import { MoveList } from './MoveList';
import { TreeMoveList, TreeNavigation } from './TreeMoveList';

describe('EvalBar', () => {
  it('reads "No evaluation" with no label until a score arrives, then keeps the last score as stale', () => {
    const { rerender } = render(<EvalBar score={null} turn="white" />);
    const meter = screen.getByRole('meter', { name: 'Engine evaluation' });
    expect(meter).toHaveAttribute('aria-valuetext', 'No evaluation');
    expect(meter).toHaveAttribute('aria-valuenow', '50');
    expect(meter.querySelector('.evalbar__label')).toBeNull();

    rerender(<EvalBar score={{ type: 'cp', value: 150 }} turn="white" />);
    expect(meter).toHaveTextContent('+1.5');
    expect(meter).not.toHaveClass('evalbar--stale');
    const now = meter.getAttribute('aria-valuenow');

    // Between searches the score is gone, but the bar stays put and is marked stale.
    rerender(<EvalBar score={null} turn="black" />);
    expect(meter).toHaveTextContent('+1.5');
    expect(meter).toHaveClass('evalbar--stale');
    expect(meter).toHaveAttribute('aria-valuenow', now);
    expect(meter.getAttribute('aria-valuetext')).toContain('last evaluation');

    rerender(<EvalBar score={{ type: 'mate', value: 3 }} turn="black" />);
    expect(meter).toHaveTextContent('-M3');
    expect(meter).not.toHaveClass('evalbar--stale');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows the result of a finished game', () => {
    render(<EvalBar score={null} turn="white" result="1-0" />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveTextContent('1-0');
    expect(meter).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('EvalGraph', () => {
  it('is a slider whose arrow keys step one ply and never reach the page', () => {
    const onSelect = vi.fn();
    const pageHandler = vi.fn();
    render(
      <div onKeyDown={pageHandler}>
        <EvalGraph
          wins={[0.5, 0.55, 0.3, 0.8]}
          judgements={[undefined, 'blunder', undefined]}
          currentPly={2}
          onSelect={onSelect}
        />
      </div>,
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '3');
    expect(slider).toHaveAttribute('aria-valuenow', '2');
    expect(slider).toHaveAttribute('aria-valuetext', 'After 1…, White 30%, blunder');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenCalledWith(3);
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(onSelect).toHaveBeenCalledWith(1);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(onSelect).toHaveBeenCalledWith(0);
    fireEvent.keyDown(slider, { key: 'End' });
    expect(onSelect).toHaveBeenCalledWith(3);
    expect(pageHandler).not.toHaveBeenCalled();
    fireEvent.keyDown(slider, { key: 'x' });
    expect(pageHandler).toHaveBeenCalledTimes(1);
  });
});

describe('Material', () => {
  beforeEach(() => useSettings.getState().reset());

  it('summarises the captured pieces in words', () => {
    // White has taken a knight and two pawns; Black has taken a pawn.
    const fen = 'r1bqkbnr/ppp2ppp/8/8/8/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1';
    useSettings.getState().update({ materialDisplay: 'count' });
    render(<Material fen={fen} color="white" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'aria-label',
      'Captured by white: 1 knight, 2 pawns, 4 pawns ahead',
    );
    expect(img.querySelectorAll('piece')).toHaveLength(3);
  });

  it('describes the difference and the empty state', () => {
    useSettings.getState().update({ materialDisplay: 'difference' });
    const fen = 'r1bqkbnr/ppp2ppp/8/8/8/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1';
    const { rerender } = render(<Material fen={fen} color="black" />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'No material advantage for black',
    );
    rerender(<Material fen={new Chess().fen()} color="white" />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'No material advantage for white',
    );
  });
});

describe('EngineLines', () => {
  const info = (pv: string[], cp: number, multipv = 1): SearchInfo => ({
    depth: 12,
    multipv,
    score: { type: 'cp', value: cp },
    pv,
  });
  const start = new Chess().fen();

  it('announces only the best line, once, when thinking stops', () => {
    const lines = new Map([
      [1, info(['e2e4', 'e7e5', 'g1f3'], 30)],
      [2, info(['d2d4', 'd7d5'], 20, 2)],
    ]);
    const { container, rerender } = render(
      <EngineLines fen={start} turn="white" lines={lines} count={2} thinking moveLabel="1." />,
    );
    expect(container.querySelector('.lines')).not.toHaveAttribute('aria-live');
    const live = container.querySelector('[aria-live]');
    expect(live).toHaveTextContent('');
    rerender(
      <EngineLines
        fen={start}
        turn="white"
        lines={lines}
        count={2}
        thinking={false}
        moveLabel="1."
      />,
    );
    expect(live).toHaveTextContent('Engine: +0.3, 1. e4 e5 Nf3');
    // Further updates while idle stay quiet.
    const next = new Map([[1, info(['d2d4'], 40)]]);
    rerender(
      <EngineLines
        fen={start}
        turn="white"
        lines={next}
        count={2}
        thinking={false}
        moveLabel="1."
      />,
    );
    expect(live).toHaveTextContent('Engine: +0.3, 1. e4 e5 Nf3');
  });

  it('offers the first move of a line as a labelled button', () => {
    const onPlayMove = vi.fn();
    const lines = new Map([[1, info(['e2e4', 'e7e5'], 30)]]);
    render(
      <EngineLines
        fen={start}
        turn="white"
        lines={lines}
        count={1}
        thinking={false}
        onPlayMove={onPlayMove}
        moveLabel="1."
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Play e4' }));
    expect(onPlayMove).toHaveBeenCalledWith('e2e4');
  });

  it('reads a Chess960 line, castling as king takes rook', () => {
    const onPlayMove = vi.fn();
    // Position 274: the engine castles long by taking its own rook.
    const fen = 'bnrknbrq/pppppppp/8/8/8/8/PPPPPPPP/BNRKNBRQ w KQkq - 0 1';
    const lines = new Map([[1, info(['d1c1', 'd8c8', 'e2e4'], 10)]]);
    render(
      <EngineLines
        chess960
        fen={fen}
        turn="white"
        lines={lines}
        count={1}
        thinking={false}
        onPlayMove={onPlayMove}
        moveLabel="1."
      />,
    );
    expect(screen.getByText('e4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play O-O-O' }));
    expect(onPlayMove).toHaveBeenCalledWith('d1c1');
  });
});

describe('MoveList', () => {
  const chess = new Chess();
  for (const san of ['e4', 'e5', 'Nf3']) chess.move(san);
  const moves = chess.history({ verbose: true });

  it('renders buttons that jump to a ply when asked to', () => {
    const onSelectPly = vi.fn();
    render(<MoveList moves={moves} currentPly={3} onSelectPly={onSelectPly} />);
    const group = screen.getByRole('group', { name: 'Move list' });
    expect(group).not.toHaveAttribute('tabindex');
    expect(screen.getAllByRole('button')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'e5' }));
    expect(onSelectPly).toHaveBeenCalledWith(2);
  });

  it('renders plain text in a keyboard-scrollable region without onSelectPly', () => {
    render(<MoveList moves={moves} currentPly={3} />);
    const region = screen.getByRole('region', { name: 'Move list' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(region.querySelector('[aria-current="true"]')).toHaveTextContent('Nf3');
  });
});

describe('TreeMoveList', () => {
  it('speaks moves in words and names the navigation ends', () => {
    const tree = GameTree.fromPgn('1. e4 e5 2. Nf3?? (2. Qh5 Nc6) Nc6');
    const onSelect = vi.fn();
    render(
      <TreeMoveList
        tree={tree}
        version={1}
        current={tree.root.children[0] as never}
        onSelect={onSelect}
      />,
    );
    // The move as written first (what the button shows), then in words.
    expect(screen.getByRole('button', { name: '1. e4, pawn e2 to e4' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: '1 Black e5, pawn e7 to e5' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '2. Nf3, knight g1 to f3, blunder' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2. Qh5, queen d1 to h5' })).toBeInTheDocument();
    // A Black move whose number is shown (after a variation) says whose it is after the number.
    expect(
      screen.getByRole('button', { name: '2… Nc6, Black, knight b8 to c6' }),
    ).toBeInTheDocument();
    render(
      <TreeNavigation
        canBack
        canForward
        onStart={vi.fn()}
        onBack={vi.fn()}
        onForward={vi.fn()}
        onEnd={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Start of game' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End of game' })).toBeInTheDocument();
  });
});
