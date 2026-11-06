import { parsePlacement } from '@/chess/geometry';
import type { Fen, LongColor } from '@/chess/types';
import type { MaterialDisplay } from '@/store/settings';

export const MATERIAL_ORDER = ['queen', 'rook', 'bishop', 'knight', 'pawn'] as const;
export type Role = (typeof MATERIAL_ORDER)[number];
const VALUES: Record<Role, number> = { queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 };
const START: Record<Role, number> = { queen: 1, rook: 2, bishop: 2, knight: 2, pawn: 8 };
const ROLE: Record<string, Role> = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };

function emptyCounts(): Record<Role, number> {
  return { queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 };
}

/** The pieces `color` has taken from the opponent, and the material balance in pawns. */
export function capturedMaterial(
  fen: Fen,
  color: LongColor,
  mode: Exclude<MaterialDisplay, 'off'>,
): { captured: Role[]; diff: number } {
  const opponent: LongColor = color === 'white' ? 'black' : 'white';
  const onBoard: Record<LongColor, Record<Role, number>> = {
    white: emptyCounts(),
    black: emptyCounts(),
  };
  // The pieces alone: any FEN reads, a Chess960 one with castling rights by file too.
  for (const piece of parsePlacement(fen).values()) {
    if (piece.type === 'k') continue;
    const role = ROLE[piece.type];
    if (!role) continue;
    onBoard[piece.color === 'w' ? 'white' : 'black'][role]++;
  }
  const captured: Role[] = [];
  let mine = 0;
  let theirs = 0;
  for (const role of MATERIAL_ORDER) {
    const taken = Math.max(0, START[role] - onBoard[opponent][role]);
    const lost = Math.max(0, START[role] - onBoard[color][role]);
    // "difference" cancels an exchange: a knight for a knight shows nothing.
    const shown = mode === 'difference' ? Math.max(0, taken - lost) : taken;
    for (let i = 0; i < shown; i++) captured.push(role);
    mine += onBoard[color][role] * VALUES[role];
    theirs += onBoard[opponent][role] * VALUES[role];
  }
  return { captured, diff: mine - theirs };
}
