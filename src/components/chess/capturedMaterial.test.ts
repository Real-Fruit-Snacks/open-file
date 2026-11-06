import { describe, expect, it } from 'vitest';
import { capturedMaterial } from './capturedMaterial';

// After 1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5: a pawn each, nothing else.
const PAWN_EACH = 'rnb1kbnr/ppp1pppp/8/q7/8/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 4';
// White has taken a knight and a pawn, Black a bishop.
const UNEVEN = 'r1bqkbnr/ppp1pppp/8/8/8/8/PPPPPPPP/RNBQK1NR w KQkq - 0 1';

describe('captured material', () => {
  it('shows every capture in count mode and only the imbalance in difference mode', () => {
    expect(capturedMaterial(PAWN_EACH, 'white', 'count')).toEqual({ captured: ['pawn'], diff: 0 });
    expect(capturedMaterial(PAWN_EACH, 'black', 'count')).toEqual({ captured: ['pawn'], diff: 0 });
    expect(capturedMaterial(PAWN_EACH, 'white', 'difference')).toEqual({ captured: [], diff: 0 });
    expect(capturedMaterial(PAWN_EACH, 'black', 'difference')).toEqual({ captured: [], diff: 0 });
  });

  it('counts the balance in pawns from the pieces still on the board', () => {
    const white = capturedMaterial(UNEVEN, 'white', 'count');
    expect(white.captured).toEqual(['knight', 'pawn']);
    expect(white.diff).toBe(1);
    const black = capturedMaterial(UNEVEN, 'black', 'difference');
    expect(black.captured).toEqual(['bishop']);
    expect(black.diff).toBe(-1);
    // The difference view cancels like against like only: a knight for a bishop still shows.
    expect(capturedMaterial(UNEVEN, 'white', 'difference').captured).toEqual(['knight', 'pawn']);
  });
});

describe('capturedMaterial in Chess960', () => {
  it('reads a position whose castling rights chess.js would refuse', () => {
    // Castling rights by file (the castling rook is not the outermost one).
    const fen = 'rk5r/pppppppp/8/8/8/8/PPPPPPP1/RK2R2R w E - 0 1';
    expect(capturedMaterial(fen, 'black', 'difference')).toEqual({ captured: ['pawn'], diff: -4 });
  });
});
