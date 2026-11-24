import { type Ref, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Icon } from '@/components/ui';
import { San } from '@/chess/San';
import type { LongColor } from '@/chess/types';
import { scrollIntoContainer } from '@/lib/scroll';
import { renderInline } from './inline';
import { LessonText } from './LessonText';
import type { CoachTone, LessonMessage } from './useLessonStep';
import './learn.css';
import './coach.css';

/** The small heading over a coach message, by tone: none for the plain ones. */
const LABELS: Partial<Record<CoachTone, string>> = {
  why: 'Why it works',
  hint: 'Hint',
};

const SIDE: Record<LongColor, string> = { white: 'White', black: 'Black' };

/** How far the words fade in under the top of a scrolled box, in pixels (`.coach--more-above`). */
const FADE = 16;

/**
 * The first message of the newest turn (see `LessonMessage`): where what the
 * coach has said in answer to the learner's latest doing begins. None while
 * the step's opening question is the newest turn.
 */
function turnStart(messages: readonly LessonMessage[]): number | null {
  const turn = messages.at(-1)?.turn ?? 0;
  if (turn === 0) return null;
  return messages.find((m) => m.turn === turn)?.id ?? null;
}

/** What the conversation box last looked like, to tell what changed since. */
interface Seen {
  /** The first message: another one means a new step (or Replay). */
  first: LessonMessage | undefined;
  /** How many messages there were; -1 before the first look. */
  count: number;
  anchor: number | null;
  /** The box that scrolled and where it was left, to tell whether the learner has scrolled it since. */
  box: HTMLElement | null;
  top: number;
}

/**
 * A lesson step as a conversation with the coach: what the coach says to open
 * it (`intro`, the step's text), then the questions, the moves played (the
 * learner's and the opponent's) and what the coach says to each. The question
 * waiting for a move (`activePrompt`) stands out, with the side to move; the
 * rest stays to be read again.
 */
export function CoachLog({
  intro,
  messages,
  activePrompt,
  turn,
  promptRef,
}: {
  intro?: string;
  messages: readonly LessonMessage[];
  activePrompt: number | null;
  turn: LongColor;
  promptRef?: Ref<HTMLDivElement>;
}) {
  const regionRef = useRef<HTMLDivElement>(null);
  const anchor = turnStart(messages);
  const seen = useRef<Seen>({ first: undefined, count: -1, anchor: null, box: null, top: 0 });
  // Where the conversation scrolls in a box (its own on the lesson page on wide screens,
  // the side panel on a phone held sideways), the coach's answer to the learner's latest
  // move (or shown answer, or going on) starts at the top of the box, and the words stay
  // where they are until the learner does something else: nothing scrolls them away while
  // they are read. A hint asked for is brought into view.
  useLayoutEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const own = region.scrollHeight > region.clientHeight + 1;
    // A box that scrolls can be scrolled from the keyboard too.
    if (own) region.tabIndex = 0;
    else region.removeAttribute('tabindex');
    const box = own ? region : scrollingAncestor(region);
    const last = seen.current;
    const restarted = last.count < 0 || messages[0] !== last.first;
    const added = restarted ? messages : messages.slice(last.count);
    seen.current = { first: messages[0], count: messages.length, anchor, box, top: 0 };
    if (!box) return;
    const toAnchor = () => {
      const el = region.querySelector<HTMLElement>('[data-anchor]');
      // At the start of a step (no move yet), the box opens at the top. Otherwise the answer
      // starts below the fade at the top of the box (coach.css), clear of it.
      const top = el
        ? el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - FADE
        : 0;
      box.scrollTop = Math.max(0, top);
    };
    const newest = added.length === 1 ? added[0] : undefined;
    const untouched = box === last.box && Math.abs(box.scrollTop - last.top) <= 2;
    if (restarted || anchor !== last.anchor) {
      toAnchor();
    } else if (newest?.kind === 'coach' && newest.tone === 'hint') {
      const el = region.querySelector<HTMLElement>('.coach__log')?.lastElementChild;
      if (el instanceof HTMLElement) scrollIntoContainer(box, el);
    } else if (added.length > 0 && (untouched || box !== last.box)) {
      // More of the same answer (the reply that punishes a wrong move): shown from its start,
      // unless the learner has scrolled the box meanwhile.
      toAnchor();
    }
    seen.current.top = box.scrollTop;
  }, [messages, anchor]);

  // When the newest words run on below the box, a button says so and scrolls down to them;
  // when earlier ones are scrolled away above, the words cut by the top edge fade out.
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [moreAbove, setMoreAbove] = useState(false);
  const [moreBelow, setMoreBelow] = useState(false);
  useEffect(() => {
    const region = regionRef.current;
    const start = startRef.current;
    const end = endRef.current;
    if (!region || !start || !end || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === start) setMoreAbove(!entry.isIntersecting);
          else setMoreBelow(!entry.isIntersecting);
        }
      },
      { root: region },
    );
    observer.observe(start);
    observer.observe(end);
    return () => observer.disconnect();
  }, []);
  const showLatest = () => {
    const region = regionRef.current;
    if (!region) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    region.scrollTo({ top: region.scrollHeight, behavior: still ? 'auto' : 'smooth' });
  };

  return (
    <div className={`coach${moreAbove ? ' coach--more-above' : ''}`} ref={regionRef}>
      <div ref={startRef} className="coach__start" aria-hidden="true" />
      {intro ? (
        <div className="coach__intro">
          <CoachAvatar />
          <div className="coach__bubble">
            <span className="sr-only">The coach: </span>
            <LessonText text={intro} />
          </div>
        </div>
      ) : null}
      <div
        className="coach__log"
        role="log"
        aria-live="polite"
        aria-label="The coach and the moves"
        data-testid="coach-log"
      >
        {messages.map((message) =>
          message.kind === 'move' ? (
            <MoveLine key={message.id} message={message} anchor={message.id === anchor} />
          ) : message.tone === 'prompt' && message.id === activePrompt ? (
            <div
              key={message.id}
              ref={promptRef}
              tabIndex={-1}
              className="lesson__task coach__question"
              role="note"
              data-testid="lesson-task"
              data-anchor={message.id === anchor ? '' : undefined}
            >
              <span className={`turn-dot turn-dot--${turn}`} aria-hidden="true" />
              {SIDE[turn]} to move — {renderInline(message.text)}
            </div>
          ) : (
            <div
              key={message.id}
              className={`coach__msg coach__msg--${message.tone}`}
              data-testid={`coach-${message.tone}`}
              data-anchor={message.id === anchor ? '' : undefined}
            >
              {LABELS[message.tone] ? (
                <span className="coach__label">{LABELS[message.tone]}</span>
              ) : null}
              <span>{renderInline(message.text)}</span>
            </div>
          ),
        )}
      </div>
      <div ref={endRef} className="coach__end" aria-hidden="true" />
      {moreBelow ? (
        <button type="button" className="coach__more" onClick={showLatest}>
          More below <Icon name="chevron-down" size={14} />
        </button>
      ) : null}
    </div>
  );
}

/** The nearest element around `from` that scrolls its content (not the page itself), if any. */
function scrollingAncestor(from: HTMLElement): HTMLElement | null {
  for (
    let el = from.parentElement;
    el && el !== document.body && !el.classList.contains('shell__scroll');
    el = el.parentElement
  ) {
    if (
      /(auto|scroll)/.test(getComputedStyle(el).overflowY) &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      return el;
    }
  }
  return null;
}

function MoveLine({
  message,
  anchor,
}: {
  message: Extract<LessonMessage, { kind: 'move' }>;
  anchor: boolean;
}) {
  const mine = message.who === 'you';
  return (
    <div
      className={[
        'coach__move',
        mine ? 'coach__move--you' : 'coach__move--them',
        message.wrong && 'coach__move--wrong',
      ]
        .filter(Boolean)
        .join(' ')}
      data-anchor={anchor ? '' : undefined}
    >
      {mine ? (
        <Icon name={message.wrong ? 'close' : 'check'} size={14} />
      ) : (
        <span className={`turn-dot turn-dot--${message.color}`} aria-hidden="true" />
      )}
      <span>{mine ? 'You' : SIDE[message.color]}</span>
      <San san={message.san} className="coach__san" />
      {message.wrong ? <span className="sr-only"> (not the move)</span> : null}
    </div>
  );
}

/** The coach's mark beside its opening words. */
export function CoachAvatar() {
  return (
    <span className="coach__avatar" aria-hidden="true">
      <Icon name="knight" size={18} />
    </span>
  );
}

/**
 * What the coach has said in answer to the learner's latest move (or shown
 * answer, or going on to the reply), for phones, where the conversation sits
 * below the board: shown right under it, so it is read without scrolling,
 * and kept there until the learner does something else. Before the first move
 * of a step only a hint shows: the step opens with the coach's words in the
 * panel, read in order. A copy for the eye only (the conversation itself is
 * what assistive technology reads), with the way on — "Take back",
 * "Continue" — as a tap target after the words.
 */
export function CoachLatest({
  messages,
  canTakeBack,
  onTakeBack,
  canPlayOn,
  onPlayOn,
}: {
  messages: readonly LessonMessage[];
  canTakeBack: boolean;
  onTakeBack: () => void;
  canPlayOn: boolean;
  onPlayOn: () => void;
}) {
  const turn = messages.at(-1)?.turn ?? 0;
  const words = messages.filter(
    (m): m is Extract<LessonMessage, { kind: 'coach' }> =>
      m.kind === 'coach' && m.turn === turn && (turn > 0 || m.tone === 'hint'),
  );
  if (words.length === 0 && !canTakeBack && !canPlayOn) return null;
  return (
    <div className="coach__latest" aria-hidden="true" data-testid="coach-latest">
      {words.map((message) => (
        <div key={message.id} className={`coach__msg coach__msg--${message.tone}`}>
          {LABELS[message.tone] ? (
            <span className="coach__label">{LABELS[message.tone]}</span>
          ) : null}
          <span>{renderInline(message.text)}</span>
        </div>
      ))}
      {canTakeBack ? (
        <Button variant="primary" size="sm" tabIndex={-1} onClick={onTakeBack}>
          Take back
        </Button>
      ) : canPlayOn ? (
        <Button variant="primary" size="sm" tabIndex={-1} onClick={onPlayOn}>
          Continue
        </Button>
      ) : null}
    </div>
  );
}
