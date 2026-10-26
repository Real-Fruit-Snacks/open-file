import { Fragment, type ReactNode, useEffect, useRef } from 'react';
import { NAG_GLYPHS } from '@/chess/pgn';
import type { GameTree, TreeNode } from '@/chess/tree';
import { describeSan } from '@/components/board/announce';
import { Button, Kbd, Icon } from '@/components/ui';
import type { MoveJudgement } from './MoveList';
import './chess-components.css';
import { scrollIntoContainer } from '@/lib/scroll';
import { San } from '@/chess/San';

const JUDGEMENT_GLYPH: Record<NonNullable<MoveJudgement>, string> = {
  blunder: '??',
  mistake: '?',
  inaccuracy: '?!',
  best: '',
  good: '',
};

/** The spoken form of an annotation glyph. */
const GLYPH_WORDS: Record<string, string> = {
  '!': 'good move',
  '?': 'mistake',
  '!!': 'brilliant move',
  '??': 'blunder',
  '!?': 'interesting move',
  '?!': 'dubious move',
};

export interface TreeMoveListProps {
  tree: GameTree;
  /** Change signal for the mutable tree. */
  version: number;
  current: TreeNode;
  onSelect: (node: TreeNode) => void;
  judgements?: Map<number, MoveJudgement>;
  /** Node ids flagged by the learner (self-analysis: "the game turned here"). */
  marked?: ReadonlySet<number>;
}

function moveNumberFor(node: TreeNode, force: boolean): string {
  const parentFen = node.parent?.fen ?? '';
  const parts = parentFen.split(' ');
  const black = parts[1] === 'b';
  const fullmove = parts[5] ?? '1';
  if (black) return force ? `${fullmove}…` : '';
  return `${fullmove}.`;
}

/**
 * A move list that shows the whole game tree: the main line flows across the
 * card and variations appear as indented blocks under the move they branch
 * from, Lichess-style. Comments and glyphs are shown inline.
 */
export function TreeMoveList({
  tree,
  version,
  current,
  onSelect,
  judgements,
  marked,
}: TreeMoveListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (list && el) scrollIntoContainer(list, el);
  }, [current]);

  const renderMove = (node: TreeNode, forceNumber: boolean): ReactNode => {
    const judgement = judgements?.get(node.id) ?? null;
    const glyphs = node.nags.map((n) => NAG_GLYPHS[n] ?? '').join('');
    const judgementGlyph = judgement && !glyphs ? JUDGEMENT_GLYPH[judgement] : '';
    const number = moveNumberFor(node, forceNumber);
    const shownGlyph = glyphs || judgementGlyph;
    // The name starts with what the button shows, as it is written (WCAG 2.5.3, Label in
    // Name: a learner using speech says what they see), then says the move in words:
    // "12. Nf3, knight g1 to f3, check, blunder", "12 Black Nc6, knight b8 to c6".
    const parentFen = node.parent?.fen ?? '';
    const fenParts = parentFen.split(' ');
    const black = fenParts[1] === 'b';
    const described = describeSan(parentFen, node.san);
    // The check and mate signs are said in the words, when there are words.
    const written = described ? node.san.replace(/[+#]+$/, '') : node.san;
    const lead = number
      ? `${number} ${written}${black ? ', Black' : ''}`
      : `${fenParts[5] ?? '1'} Black ${written}`;
    const words = described ? `, ${described.charAt(0).toLowerCase()}${described.slice(1)}` : '';
    const glyphWords = shownGlyph ? `, ${GLYPH_WORDS[shownGlyph] ?? shownGlyph}` : '';
    const flagged = marked?.has(node.id) ?? false;
    const spoken = `${lead}${words}${glyphWords}${flagged ? ', marked' : ''}`;
    return (
      <button
        type="button"
        key={node.id}
        className={[
          'treemoves__move',
          node === current && 'treemoves__move--current',
          judgement &&
            judgement !== 'good' &&
            judgement !== 'best' &&
            `treemoves__move--${judgement}`,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSelect(node)}
        aria-current={node === current ? 'true' : undefined}
        aria-label={spoken}
      >
        {number ? <span className="treemoves__number">{number}</span> : null}
        <San san={node.san} />
        {glyphs || judgementGlyph ? (
          <span className="treemoves__glyph">{glyphs || judgementGlyph}</span>
        ) : null}
        {flagged ? (
          <span className="treemoves__flag">
            <Icon name="flag" size={12} />
          </span>
        ) : null}
      </button>
    );
  };

  /** Renders the line that starts after `from`, plus the variation blocks branching off it. */
  const renderLine = (from: TreeNode, depth: number, forceFirstNumber: boolean): ReactNode[] => {
    const out: ReactNode[] = [];
    let node = from.children[0];
    let parent = from;
    let needNumber = forceFirstNumber;
    while (node) {
      out.push(renderMove(node, needNumber));
      needNumber = false;
      if (node.comment) {
        out.push(
          <span key={`c${node.id}`} className="treemoves__comment">
            {node.comment}
          </span>,
        );
        needNumber = true;
      }
      const variations = parent.children.slice(1);
      if (variations.length) {
        out.push(
          <div
            key={`v${node.id}`}
            className="treemoves__variations"
            style={{ '--depth': depth + 1 } as React.CSSProperties}
          >
            {variations.map((variation) => (
              <div key={variation.id} className="treemoves__variation">
                <span className="treemoves__paren">(</span>
                {renderMove(variation, true)}
                {variation.comment ? (
                  <span className="treemoves__comment">{variation.comment}</span>
                ) : null}
                {renderLine(variation, depth + 1, !!variation.comment)}
                <span className="treemoves__paren">)</span>
              </div>
            ))}
          </div>,
        );
        needNumber = true;
      }
      parent = node;
      node = node.children[0];
    }
    return out;
  };

  const empty = tree.root.children.length === 0;

  return (
    <div className="treemoves" ref={listRef} role="group" aria-label="Moves" data-version={version}>
      {tree.root.comment ? <span className="treemoves__comment">{tree.root.comment}</span> : null}
      {empty ? (
        <span className="muted small treemoves__empty">
          No moves yet — play on the board or import a game.
        </span>
      ) : (
        <Fragment>{renderLine(tree.root, 0, true)}</Fragment>
      )}
    </div>
  );
}

export function TreeNavigation({
  canBack,
  canForward,
  onStart,
  onBack,
  onForward,
  onEnd,
}: {
  canBack: boolean;
  canForward: boolean;
  onStart: () => void;
  onBack: () => void;
  onForward: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="movenav" role="group" aria-label="Move navigation">
      <Button
        size="sm"
        onClick={onStart}
        disabled={!canBack}
        aria-label="Start of game"
        title="Start (Home)"
      >
        <Icon name="skip-back" size={16} />
      </Button>
      <Button
        size="sm"
        onClick={onBack}
        disabled={!canBack}
        aria-label="Previous move"
        title="Back (←)"
      >
        <Icon name="chevron-left" size={16} />
      </Button>
      <Button
        size="sm"
        onClick={onForward}
        disabled={!canForward}
        aria-label="Next move"
        title="Forward (→)"
      >
        <Icon name="chevron-right" size={16} />
      </Button>
      <Button
        size="sm"
        onClick={onEnd}
        disabled={!canForward}
        aria-label="End of game"
        title="End (End)"
      >
        <Icon name="skip-forward" size={16} />
      </Button>
      <span className="movenav__hint small muted">
        <Kbd>←</Kbd> <Kbd>→</Kbd>
      </span>
    </div>
  );
}
