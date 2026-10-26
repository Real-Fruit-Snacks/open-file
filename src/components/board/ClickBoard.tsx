import type { Square } from 'chess.js';
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  memo,
  useRef,
  useState,
} from 'react';
import type { LongColor } from '@/chess/types';
import { useSettings } from '@/store/settings';
import { BOARD_PALETTES, boardBackground } from './boardThemes';
import { defaultCursor, isDarkSquare, moveCursor, squareFromKeys } from './keyboard';
import './click-board.css';

export type PieceRole = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface ClickBoardPiece {
  color: LongColor;
  role: PieceRole;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export interface ClickBoardProps {
  pieces?: ReadonlyMap<Square, ClickBoardPiece>;
  orientation?: LongColor;
  coordinates?: boolean;
  /** Extra class per square, e.g. 'selected', 'correct', 'wrong', 'target'. */
  marks?: ReadonlyMap<Square, string>;
  onSquare?: (square: Square) => void;
  disabled?: boolean;
  ariaLabel: string;
  /** Accessible label per square; defaults to the square name and its piece. */
  squareLabel?: (square: Square, piece: ClickBoardPiece | undefined) => string;
}

/**
 * A plain 8×8 group of buttons — no drag and drop, no rules. Used where the
 * interaction is "click a square": the board editor and the vision drills.
 * Pieces reuse the chessground piece sprites via the `cg-wrap` class.
 *
 * One tab stop: the arrow keys move between squares (roving tabindex), a
 * typed square such as "e4" jumps to it, Enter or Space presses the square.
 */
export const ClickBoard = memo(function ClickBoard({
  pieces,
  orientation = 'white',
  coordinates = true,
  marks,
  onSquare,
  disabled = false,
  ariaLabel,
  squareLabel,
}: ClickBoardProps) {
  const theme = useSettings((s) => s.boardTheme);
  const palette = BOARD_PALETTES[theme];
  const ranks = orientation === 'white' ? [...RANKS].reverse() : [...RANKS];
  const files = orientation === 'white' ? [...FILES] : [...FILES].reverse();
  const [cursor, setCursor] = useState<Square>(() => defaultCursor(orientation));
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFile = useRef<string | null>(null);

  const focusSquare = (square: Square) => {
    setCursor(square);
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-square="${square}"]`)
      ?.focus({ preventScroll: true });
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = (e.target as HTMLElement).dataset.square as Square | undefined;
    const current = target ?? cursor;
    const arrow = moveCursor(current, e.key, orientation);
    if (arrow) {
      focusSquare(arrow);
      pendingFile.current = null;
    } else if (e.key === 'Home') {
      focusSquare(`${files[0]}${ranks[ranks.length - 1]}` as Square);
    } else if (e.key === 'End') {
      focusSquare(`${files[7]}${ranks[0]}` as Square);
    } else if (/^[a-hA-H]$/.test(e.key)) {
      // The first half of a typed square; swallowed so page letter shortcuts never fire.
      pendingFile.current = e.key;
    } else if (/^[1-8]$/.test(e.key) && pendingFile.current) {
      const square = squareFromKeys(pendingFile.current, e.key);
      pendingFile.current = null;
      if (square) focusSquare(square);
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={rootRef}
      className={`clickboard cg-wrap${coordinates ? ' clickboard--coords' : ''}${palette.image ? ' clickboard--texture' : ''}`}
      role="group"
      aria-label={ariaLabel}
      style={
        {
          '--light': palette.light,
          '--dark': palette.dark,
          ...(palette.image ? { '--board-bg': boardBackground(theme) } : {}),
        } as CSSProperties
      }
      onKeyDown={onKeyDown}
    >
      {ranks.map((rank) => (
        <div className="clickboard__row" key={rank}>
          {files.map((file) => {
            const square = `${file}${rank}` as Square;
            const piece = pieces?.get(square);
            const dark = isDarkSquare(square);
            const mark = marks?.get(square);
            const label =
              squareLabel?.(square, piece) ??
              `${square}${piece ? `, ${piece.color} ${piece.role}` : ', empty'}`;
            return (
              <button
                type="button"
                key={square}
                className={[
                  'clickboard__square',
                  dark ? 'clickboard__square--dark' : 'clickboard__square--light',
                  mark && `clickboard__square--${mark}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={onSquare ? () => onSquare(square) : undefined}
                onFocus={() => setCursor(square)}
                disabled={disabled}
                tabIndex={square === cursor ? 0 : -1}
                aria-label={label}
                aria-pressed={mark === 'selected' ? true : undefined}
                data-square={square}
              >
                {/* The board's edge labels, drawn by CSS from data-coord: they mark the board, not
                    the square's button, whose name ("a8, black rook") already starts with them. */}
                {coordinates && file === files[0] ? (
                  <span
                    className="clickboard__coord clickboard__coord--rank"
                    data-coord={rank}
                    aria-hidden="true"
                  />
                ) : null}
                {coordinates && rank === ranks[ranks.length - 1] ? (
                  <span
                    className="clickboard__coord clickboard__coord--file"
                    data-coord={file}
                    aria-hidden="true"
                  />
                ) : null}
                {piece ? <piece className={`${piece.role} ${piece.color}`} /> : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});
