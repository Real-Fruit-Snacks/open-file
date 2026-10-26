import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  Icon,
  Input,
  LinkButton,
  Segmented,
  Spinner,
  Switch,
} from '@/components/ui';
import { toast } from '@/components/ui/toastStore';
import { useTicker } from '@/lib/useTicker';
import { siteConfig } from '@/site.config';
import { useLichess } from '@/store/lichess';
import { useProgress } from '@/store/progress';
import {
  ID_PATTERN,
  isGame,
  MAX_INCREMENT_SECONDS,
  MAX_MINUTES,
  parseTimeControl,
  QUICK_TIME_CONTROLS,
} from '../../../relay/src/live/shared.mjs';
import { type CorrespondenceGame, useCorrespondence, yourMove } from './correspondence';
import { GameDialog } from './GameDialog';
import { lichessSeekAllowed, reconnectLichessForLive } from './lichessLive';
import {
  daysAMove,
  describeTimeControl,
  endTitle,
  formatElapsed,
  formatTimeLeft,
  joinLink,
  lichessStatus,
  othersHere,
  type PlaceStatus,
  relayStatus,
  speedName,
} from './liveView';
import { useLobby } from './lobby';
import { describeSeek, gameNoun, ONLINE_GAMES, onlineGame } from './onlineGames';
import { useLivePrefs } from './prefs';
import { checkOnCorrespondence, liveGamePath } from './sessions';
import type { ColorChoice, GameKind, LobbyConnection, MySeek } from './types';
import './live.css';

/** After this long with nobody, the waiting room suggests a game against the computer meanwhile. */
const NUDGE_MS = 3 * 60_000;

const COLOR_OPTIONS: { value: ColorChoice; label: string }[] = [
  { value: 'random', label: 'Random' },
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
];

/** The links into a game against the computer that once went to /play: they go on to it. */
const COMPUTER_PARAMS = ['fen', 'color', 'level', 'book', 'opponent'];

/**
 * Play: everything that starts a game, in one place. A person online — a game
 * of chess at a tap, an invitation for a friend, the open games to join, and
 * the games made for two (puzzle races, Arbiter, Who Stands Better?, Army
 * Draft, blindfold) — or the computer. A posted game stays up while the player
 * uses the rest of the app; the bar under the header says so, and leads to the
 * board once someone joins.
 */
export default function PlayHubPage() {
  const { search } = useLocation();
  const [searchParams] = useSearchParams();
  // An old link to a game against the computer (/play?fen=…) still leads there.
  if (COMPUTER_PARAMS.some((name) => searchParams.has(name))) {
    return <Navigate to={`/play/computer${search}`} replace />;
  }
  return <PlayHub />;
}

function PlayHub() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const connection = useLobby((s) => s.connection);
  const mine = useLobby((s) => s.mine);
  const pairing = useLobby((s) => s.pairing);
  const invited = useLobby((s) => s.invited);
  const notice = useLobby((s) => s.notice);
  const correspondence = useCorrespondence((s) => s.games);
  /** The game dialog: a game's own Play, or an invitation (null: closed). */
  const [dialog, setDialog] = useState<{ kind: GameKind; invite: boolean; room?: boolean } | null>(
    null,
  );

  useEffect(() => {
    document.title = `Play · ${siteConfig.name}`;
  }, []);

  // The waiting room stays connected while this page shows (and while a game is posted).
  useEffect(() => useLobby.getState().watch(), []);

  // The correspondence games, as their rooms have them now.
  useEffect(() => checkOnCorrespondence(), []);

  // The bar's "See them" leads to their card.
  const listed = correspondence.length > 0;
  useEffect(() => {
    if (hash !== '#correspondence' || !listed) return;
    document.getElementById('correspondence')?.scrollIntoView?.({ block: 'start' });
  }, [hash, listed]);

  // A shared link (?join=<id>) joins its game once; a link from the arcade (?play=<game>) opens
  // that game's dialog. Either way the address bar is left clean, so a reload does neither again.
  const arrivedRef = useRef(false);
  useEffect(() => {
    if (!searchParams.has('join') && !searchParams.has('play')) return;
    const join = searchParams.get('join');
    const play = searchParams.get('play');
    setSearchParams({}, { replace: true });
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    if (join !== null) {
      if (ID_PATTERN.test(join)) useLobby.getState().join(join);
      else toast('That link does not lead to a game.', { tone: 'warning' });
      return;
    }
    if (isGame(play)) setDialog({ kind: play, invite: false });
    // A race room (from quick search): the race's dialog, a room for up to eight chosen.
    else if (play === 'race-room') setDialog({ kind: 'race', invite: false, room: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  // Paired while this page shows: straight to the board (elsewhere the bar offers the way).
  useEffect(() => {
    if (!pairing) return;
    void navigate(pairing.path);
    useLobby.getState().clearPairing();
  }, [pairing, navigate]);

  // An invitation made: to its board, where the link to send is.
  useEffect(() => {
    if (!invited) return;
    void navigate(invited.path);
    useLobby.getState().clearInvited();
  }, [invited, navigate]);

  const openGame = (kind: GameKind) => setDialog({ kind, invite: false });
  const invite = () => setDialog({ kind: 'chess', invite: true });

  return (
    <div>
      <div className="page-header page-header--lean">
        <h1>Play</h1>
        <p>
          A person online — chess at a tap, a friend by link, or one of the games made for two — or
          the computer, at any strength.
        </p>
      </div>

      <div className="stack">
        <ConnectionStatus connection={connection} />
        {notice ? (
          <Alert tone="warning">
            <div className="live__notice" data-testid="live-notice">
              <span>{notice}</span>
              <Button size="sm" variant="ghost" onClick={() => useLobby.getState().clearNotice()}>
                Dismiss
              </Button>
            </div>
          </Alert>
        ) : null}

        <div className={correspondence.length > 0 ? 'hub hub--corr' : 'hub'}>
          <div className="hub__person">
            {mine ? (
              <WaitingCard mine={mine} />
            ) : (
              <QuickPlayCard connection={connection} onInvite={invite} />
            )}
          </div>
          {correspondence.length > 0 ? <CorrespondenceCard games={correspondence} /> : null}
          <ComputerCard />
          <OpenGamesCard connection={connection} posted={!!mine} />
          <GamesForTwo onPlay={openGame} disabled={connection === 'unavailable'} />
          <NameCard posted={!!mine} />
        </div>
      </div>

      <GameDialog
        open={dialog !== null}
        kind={dialog?.kind ?? 'chess'}
        invite={dialog?.invite ?? false}
        room={dialog?.room ?? false}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function ConnectionStatus({ connection }: { connection: LobbyConnection }) {
  if (connection === 'unavailable') {
    return (
      <Alert tone="warning">
        {siteConfig.syncRelay.length > 0
          ? 'Live games are not set up on this relay yet.'
          : 'This copy of the app has no relay for live games.'}
      </Alert>
    );
  }
  if (connection === 'connecting' || connection === 'retrying') {
    return (
      <div className="live__connection" data-testid="live-connection">
        <Spinner
          label={connection === 'connecting' ? 'Connecting to the waiting room…' : 'Reconnecting…'}
        />
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* A person: a game at a tap, or a friend by link                     */
/* ------------------------------------------------------------------ */

function QuickPlayCard({
  connection,
  onInvite,
}: {
  connection: LobbyConnection;
  onInvite: () => void;
}) {
  const prefs = useLivePrefs();
  const account = useLichess((s) => s.account);
  const [customOpen, setCustomOpen] = useState(false);
  const lichessOn = !!account && prefs.lichess;

  const post = (tc: string) => {
    prefs.update({ tc });
    void useLobby.getState().post({
      game: 'chess',
      tc,
      color: prefs.color,
      private: false,
      lichess: lichessOn ? { rated: prefs.lichessRated } : null,
    });
  };

  /** Without the relay a time control can still go to Lichess, if Lichess takes it. */
  const nowhereToPost = (tc: string) => {
    if (connection !== 'unavailable') return false;
    const spec = parseTimeControl(tc);
    return !(lichessOn && spec && lichessSeekAllowed(spec));
  };

  return (
    <Card as="section" aria-labelledby="live-post-title" data-testid="live-post">
      <div className="hub__head">
        <span className="hub__icon">
          <Icon name="people" size={22} />
        </span>
        <h2 id="live-post-title" className="live__title">
          Play a person
        </h2>
      </div>
      <div className="stack-sm">
        <div className="live__row">
          <span className="live__label">Your colour</span>
          <Segmented<ColorChoice>
            ariaLabel="Your colour"
            value={prefs.color}
            onChange={(color) => prefs.update({ color })}
            options={COLOR_OPTIONS}
          />
        </div>
        <p className="live__label" id="live-tc-label">
          Tap a time control: someone waiting for the same plays you at once, or your game waits for
          an opponent
        </p>
        <div className="live__tcs" role="group" aria-labelledby="live-tc-label">
          {QUICK_TIME_CONTROLS.map((tc) => (
            <button
              key={tc}
              type="button"
              className="live__tc"
              onClick={() => post(tc)}
              disabled={nowhereToPost(tc)}
            >
              <span className="live__tc-time">{tc}</span>{' '}
              <span className="live__tc-speed">{speedName(tc)}</span>
            </button>
          ))}
          <button
            type="button"
            className="live__tc live__tc--custom"
            onClick={() => setCustomOpen(true)}
          >
            <span className="live__tc-time">Custom</span>{' '}
            <span className="live__tc-speed">Set your own</span>
          </button>
        </div>
        <div className="hub__invite">
          <Button
            onClick={onInvite}
            disabled={connection === 'unavailable'}
            data-testid="hub-invite"
          >
            <Icon name="link" size={18} />
            <span>Invite a friend</span>
          </Button>
          <span className="small muted">A game only your link opens.</span>
        </div>
        {account ? (
          <>
            <Switch
              checked={prefs.lichess}
              onChange={(lichess) => prefs.update({ lichess })}
              label="Also look on Lichess"
              description="Your game is posted on Lichess too; whoever accepts first plays you. Rapid and slower games only."
            />
            {lichessOn ? (
              <Switch
                checked={prefs.lichessRated}
                onChange={(lichessRated) => prefs.update({ lichessRated })}
                label="Rated on Lichess"
                description="A game played on Lichess counts towards your rating there."
              />
            ) : null}
          </>
        ) : (
          <p className="small muted live__aside">
            <Link to="/settings#lichess">Sign in to Lichess in Settings</Link> to look for opponents
            there too.
          </p>
        )}
      </div>
      <CustomDialog
        open={customOpen}
        initial={prefs.tc}
        onClose={() => setCustomOpen(false)}
        onPost={post}
      />
    </Card>
  );
}

/** Whole minutes and seconds, as typed: digits only, so "1e2" or "-1" never pass. */
function customTimeControl(minutes: string, seconds: string): string | null {
  if (!/^\d{1,3}$/.test(minutes.trim()) || !/^\d{1,3}$/.test(seconds.trim())) return null;
  return parseTimeControl(`${Number(minutes)}+${Number(seconds)}`)?.id ?? null;
}

function CustomDialog({
  open,
  initial,
  onClose,
  onPost,
}: {
  open: boolean;
  initial: string;
  onClose: () => void;
  onPost: (tc: string) => void;
}) {
  const [minutes, setMinutes] = useState(() => {
    const spec = parseTimeControl(initial);
    return String(spec ? spec.initialMs / 60_000 : 10);
  });
  const [seconds, setSeconds] = useState(() => {
    const spec = parseTimeControl(initial);
    return String(spec ? spec.incrementMs / 1000 : 5);
  });
  const tc = customTimeControl(minutes, seconds);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Custom time control"
      actions={(close) => (
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!tc}
            onClick={() => {
              if (!tc) return;
              onPost(tc);
              close();
            }}
          >
            Post
          </Button>
        </>
      )}
    >
      <div className="stack-sm">
        <Field label="Minutes per side" hint={`1 to ${MAX_MINUTES}.`}>
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_MINUTES}
              step={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          )}
        </Field>
        <Field label="Seconds added per move" hint={`0 to ${MAX_INCREMENT_SECONDS}.`}>
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_INCREMENT_SECONDS}
              step={1}
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
            />
          )}
        </Field>
        <p className="small muted" role="status" data-testid="live-custom-preview">
          {tc
            ? describeTimeControl(tc)
            : `Whole minutes from 1 to ${MAX_MINUTES}, and seconds from 0 to ${MAX_INCREMENT_SECONDS}.`}
        </p>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Waiting                                                            */
/* ------------------------------------------------------------------ */

/** Shares the join link where the device can (a phone's share sheet), copies it otherwise. */
async function shareGame(mine: MySeek): Promise<void> {
  const url = joinLink(mine.id);
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: `Play me: ${describeSeek(mine)}`, url });
      return;
    } catch (err) {
      // Closing the share sheet is a choice, not a failure; anything else falls back to copying.
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied.', { tone: 'success' });
  } catch {
    toast('Could not copy the link.', { tone: 'warning' });
  }
}

function PlaceLine({ place }: { place: PlaceStatus }) {
  return (
    <li className={`live__place live__place--${place.tone}`}>
      {place.tone === 'busy' ? (
        <span className="spinner live__place-mark" aria-hidden="true" />
      ) : (
        <Icon
          name={place.tone === 'done' ? 'check' : 'warning'}
          size={18}
          className="live__place-mark"
        />
      )}
      <span>{place.text}</span>
    </li>
  );
}

function WaitingCard({ mine }: { mine: MySeek }) {
  const now = useTicker(true);
  const waited = Math.max(0, now - mine.postedAt);
  const lichess = lichessStatus(mine.lichess);
  const game = onlineGame(mine.game);

  const allowLichess = () => {
    reconnectLichessForLive('/play').catch(() => {
      toast('Could not reach Lichess. Try again in a moment.', { tone: 'warning' });
    });
  };

  return (
    <Card as="section" aria-labelledby="live-wait-title" data-testid="live-waiting">
      <div className="row row--between">
        <h2 id="live-wait-title" className="live__title">
          {mine.private ? 'Waiting for your friend' : 'Waiting for an opponent'}
        </h2>
        <span className="live__elapsed" role="timer" data-testid="live-elapsed">
          {formatElapsed(waited)}
        </span>
      </div>
      <p className="live__summary">
        {game ? <Icon name={game.icon} size={18} className="live__summary-icon" /> : null}
        <span>
          {describeSeek(mine)}
          {mine.private ? ' · Only people with the link' : ''}
        </span>
      </p>
      <ul className="live__places" role="list" aria-live="polite">
        <PlaceLine place={relayStatus(mine.relay)} />
        {lichess ? <PlaceLine place={lichess} /> : null}
      </ul>
      {mine.lichess.status === 'needs-permission' ? (
        <Button size="sm" onClick={allowLichess} className="live__allow">
          Allow live games on Lichess
        </Button>
      ) : null}
      {mine.private ? (
        <p className="small live__share-hint">
          Send your friend the link: it opens this game for them, in the app.
        </p>
      ) : null}
      <div className="row live__actions">
        <Button onClick={() => useLobby.getState().cancel()}>Cancel</Button>
        <Button variant="primary" onClick={() => void shareGame(mine)}>
          <Icon name="link" size={18} />
          <span>Share link</span>
        </Button>
      </div>
      <p className="small muted live__aside">
        You can leave this page: your game stays posted while the app is open.
      </p>
      {waited >= NUDGE_MS ? (
        <div className="live__later">
          <Alert tone="info">
            <div className="live__nudge" data-testid="live-nudge">
              <span>
                Nobody yet. Play the human-like computer while you wait? Your game stays posted.
              </span>
              <LinkButton size="sm" to="/play/computer?opponent=humanlike">
                Play the human-like computer
              </LinkButton>
            </div>
          </Alert>
        </div>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Correspondence                                                     */
/* ------------------------------------------------------------------ */

/** A correspondence game's line: whose move and the time left, or how it ended. */
function corrStatus(game: CorrespondenceGame): string {
  const days = `${game.chess960 ? 'Chess960 · ' : ''}${daysAMove(game.tc) ?? game.tc}`;
  if (game.status === 'waiting') return `Waiting for your friend to take the other seat · ${days}`;
  if (game.status === 'over') return game.verdict ? endTitle(game.verdict) : 'Over';
  const whose = yourMove(game) ? 'Your move' : 'Their move';
  const left =
    game.deadline !== null ? ` · ${formatTimeLeft(game.deadline - Date.now())} left` : '';
  return `${whose}${left} · ${days}`;
}

function CorrespondenceCard({ games }: { games: readonly CorrespondenceGame[] }) {
  return (
    <Card
      as="section"
      id="correspondence"
      aria-labelledby="live-corr-title"
      className="hub__corr"
      data-testid="live-corr"
    >
      <div className="hub__head">
        <span className="hub__icon">
          <Icon name="mail" size={22} />
        </span>
        <h2 id="live-corr-title" className="live__title">
          Your correspondence games
        </h2>
      </div>
      <ul className="live__seeks" role="list">
        {games.map((game) => {
          const mine = yourMove(game);
          return (
            <li key={game.id} className="live__seek" data-testid="live-corr-game">
              <span className="live__seek-who">
                <span className="live__seek-name">{game.opponent || 'Your invitation'}</span>
              </span>
              <span className={`live__seek-what small${mine ? ' live__corr-turn' : ' muted'}`}>
                {corrStatus(game)}
              </span>
              <LinkButton
                size="sm"
                className="live__seek-join"
                to={liveGamePath('relay', game.id)}
                aria-label={
                  game.opponent
                    ? `${mine ? 'Play your move' : 'Open the game'} against ${game.opponent}`
                    : 'Open your invitation'
                }
              >
                {mine ? 'Play' : 'Open'}
              </LinkButton>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* The computer                                                       */
/* ------------------------------------------------------------------ */

function ComputerCard() {
  return (
    <Card as="section" aria-labelledby="hub-computer-title" className="hub__computer">
      <div className="hub__head">
        <span className="hub__icon">
          <Icon name="chip" size={22} />
        </span>
        <h2 id="hub-computer-title" className="live__title">
          Play the computer
        </h2>
      </div>
      <p className="small muted hub__lead">
        Stockfish at eight levels, from “just learned the rules” to master, or Maia, which plays the
        moves people of a rating play. Take moves back, ask for a hint, or let the coach step in.
      </p>
      <div className="row hub__actions">
        <LinkButton variant="primary" to="/play/computer" data-testid="hub-computer-new">
          New game
        </LinkButton>
        <LinkButton to="/play/computer?opponent=human" data-testid="hub-pass-and-play">
          <Icon name="device" size={18} />
          <span>Pass and play</span>
        </LinkButton>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* The open games, the games for two and the player's name            */
/* ------------------------------------------------------------------ */

function OpenGamesCard({ connection, posted }: { connection: LobbyConnection; posted: boolean }) {
  const seeks = useLobby((s) => s.seeks);
  const players = useLobby((s) => s.players);
  const open = connection === 'open';

  return (
    <Card as="section" aria-labelledby="live-open-title" className="hub__open">
      <div className="live__head">
        <h2 id="live-open-title" className="live__title">
          Open games
        </h2>
        {open ? (
          <p className="small muted live__aside" data-testid="live-players">
            {othersHere(players)}
          </p>
        ) : null}
      </div>
      {seeks.length > 0 ? (
        <>
          {posted ? (
            <p className="small muted live__aside">Joining a game withdraws your own.</p>
          ) : null}
          <ul className="live__seeks" role="list">
            {seeks.map((seek) => {
              const game = onlineGame(seek.game);
              return (
                <li key={seek.id} className="live__seek">
                  <span className="live__seek-who">
                    <span className="live__seek-name">{seek.name}</span>
                    {seek.rating !== null ? (
                      <>
                        {' '}
                        <span className="live__seek-rating">{seek.rating}</span>
                      </>
                    ) : null}
                  </span>
                  <span className="live__seek-what small muted">
                    {game ? <Icon name={game.icon} size={16} className="live__seek-icon" /> : null}
                    <span>{describeSeek(seek)}</span>
                  </span>
                  <Button
                    size="sm"
                    className="live__seek-join"
                    disabled={!open}
                    title={posted ? 'Joining withdraws your own posted game.' : undefined}
                    aria-label={`Join ${seek.name}’s ${gameNoun(seek.game, seek.tc)}`}
                    onClick={() => useLobby.getState().join(seek.id)}
                  >
                    Join
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      ) : open ? (
        <EmptyState icon={<Icon name="people" size={36} />} title="No open games right now">
          <p className="live__empty">
            Post one: it stays up while you use the rest of the app, and you will hear when someone
            joins.
          </p>
        </EmptyState>
      ) : (
        <p className="small muted live__aside">
          {connection === 'unavailable'
            ? 'No open games to show.'
            : 'The open games show once the waiting room is connected.'}
        </p>
      )}
    </Card>
  );
}

function GamesForTwo({
  onPlay,
  disabled,
}: {
  onPlay: (kind: GameKind) => void;
  disabled: boolean;
}) {
  return (
    <section aria-labelledby="hub-games-title" className="hub__games" data-testid="hub-games">
      <div className="hub__section-head">
        <h2 id="hub-games-title">Games for two</h2>
        <p className="muted">
          The arcade, against a person: the same puzzles at the same moment, the same replays, the
          same positions to judge — or a game of chess with a twist.
        </p>
      </div>
      <div className="hub__game-grid">
        {ONLINE_GAMES.map((game) => (
          <div key={game.kind} className="card hub-game" data-testid={`hub-game-${game.kind}`}>
            <span className="hub-game__icon">
              <Icon name={game.icon} size={24} />
            </span>
            <h3 className="hub-game__name">{game.name}</h3>
            <Badge className="hub-game__time">{game.minutes} min</Badge>
            <p className="hub-game__tagline">{game.tagline}</p>
            {game.arcade ? (
              <Link to={game.arcade} className="small hub-game__practise">
                Practise alone
              </Link>
            ) : null}
            <Button
              size="sm"
              className="hub-game__play"
              disabled={disabled}
              onClick={() => onPlay(game.kind)}
              aria-label={`Play ${game.name}`}
            >
              Play
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function NameCard({ posted }: { posted: boolean }) {
  const name = useLivePrefs((s) => s.name);
  const showRating = useLivePrefs((s) => s.showRating);
  const rating = useProgress((s) => Math.round(s.puzzleRating));

  return (
    <Card as="section" aria-labelledby="live-name-title" className="hub__name">
      <h2 id="live-name-title" className="live__title">
        Your name online
      </h2>
      <div className="stack-sm hub__name-body">
        <div className="live__row">
          <p className="live__playas" data-testid="live-name">
            You play as <b>{name}</b>
          </p>
          <Button size="sm" onClick={() => useLivePrefs.getState().rollName()} disabled={posted}>
            New name
          </Button>
        </div>
        <Switch
          checked={showRating}
          onChange={(next) => useLivePrefs.getState().update({ showRating: next })}
          disabled={posted}
          label="Show my puzzle rating"
          description={`${rating}, shown beside your name.`}
        />
        {/* The posted game carries the name and the rating it was posted with. */}
        {posted ? (
          <p className="small muted live__aside">Cancel your posted game to change these.</p>
        ) : null}
        <p className="small muted live__aside">
          Other players see this name and, if you choose, your puzzle rating. Nothing anyone types
          reaches anyone else: names are made up from two word lists, and messages are a few set
          phrases. Moves go through the app’s relay, which deletes a game shortly after it ends.
        </p>
      </div>
    </Card>
  );
}
