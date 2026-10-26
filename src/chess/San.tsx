import { Fragment, type ReactNode } from 'react';
import { useSettings } from '@/store/settings';
import { PIECE_ROLES, type PieceLetter, SAN_IN_TEXT, sanParts } from './notation';
import './notation.css';

/**
 * Moves shown in the current notation. With figurines on, the piece letter is
 * drawn as the piece itself from whichever piece set is active. The letter is
 * inside the drawing, in transparent ink: screen readers, searches and copying
 * get it, and the move's text is the same in either notation, so a button that
 * shows a move can be named by it (WCAG 2.5.3, Label in Name).
 */
function Figurine({ piece }: { piece: PieceLetter }) {
  return <piece className={`white ${PIECE_ROLES[piece]} san__piece`}>{piece}</piece>;
}

/** One move. */
export function San({ san, className }: { san: string; className?: string }) {
  const notation = useSettings((s) => s.notation);
  const parts = sanParts(san);
  if (notation === 'letters' || !parts.some((p) => p.piece)) {
    return <span className={className}>{san}</span>;
  }
  return (
    <span className={className ? `san cg-wrap ${className}` : 'san cg-wrap'}>
      {parts.map((p, i) => (p.piece ? <Figurine key={i} piece={p.piece} /> : p.text))}
    </span>
  );
}

/** A run of prose that may mention moves. */
export function Notated({ text }: { text: string }) {
  const notation = useSettings((s) => s.notation);
  if (notation === 'letters' || !/[KQRBN]/.test(text)) return <>{text}</>;
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(SAN_IN_TEXT)) {
    const san = match[0];
    if (!/[KQRBN]/.test(san)) continue;
    const start = match.index;
    if (start > last) nodes.push(text.slice(last, start));
    nodes.push(<San san={san} />);
    last = start + san.length;
  }
  if (last === 0) return <>{text}</>;
  if (last < text.length) nodes.push(text.slice(last));
  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </>
  );
}
