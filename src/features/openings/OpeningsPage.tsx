import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  Field,
  Input,
  Select,
  Stat,
  LinkButton,
} from '@/components/ui';
import { toast } from '@/components/ui/toastStore';
import { GameTree } from '@/chess/tree';
import type { LongColor } from '@/chess/types';
import { formatDate } from '@/lib/dates';
import { readShare, type SharedRepertoire } from '@/lib/shareCodes';
import { useNow } from '@/lib/useNow';
import { siteConfig } from '@/site.config';
import { cardsFor, useRepertoire } from '@/store/repertoire';
import { repertoireStats } from './model';
import { BUILT_IN_REPERTOIRES, type Repertoire } from './repertoires';
import { mergePgnGames } from './pgnImport';
import './openings.css';

export default function OpeningsPage() {
  const cards = useRepertoire((s) => s.cards);
  const custom = useRepertoire((s) => s.custom);
  const sessions = useRepertoire((s) => s.sessions);
  const addCustom = useRepertoire((s) => s.addCustom);
  const removeCustom = useRepertoire((s) => s.removeCustom);
  const [importOpen, setImportOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<LongColor>('white');
  const [pgnText, setPgnText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [shared, setShared] = useState<SharedRepertoire | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `Openings · ${siteConfig.name}`;
  }, []);

  // A shared repertoire link: `/openings#rep=…` offers to add it.
  useEffect(() => {
    if (!location.hash) return;
    let cancelled = false;
    void readShare(location.hash).then((read) => {
      if (cancelled) return;
      if (read.ok && read.payload.kind === 'repertoire') setShared(read.payload);
      else {
        toast(
          !read.ok && read.kind === 'unsupported'
            ? 'This browser cannot open compressed links. Ask for the repertoire as a PGN instead.'
            : !read.ok && read.kind === 'too-large'
              ? 'That link is too large to be a repertoire.'
              : 'That link does not contain a repertoire.',
          { tone: 'warning' },
        );
      }
      void navigate(location.pathname, { replace: true });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the fragment matters
  }, [location.hash]);

  const acceptShared = () => {
    if (!shared) return;
    try {
      const tree = GameTree.fromPgn(shared.pgn);
      if (tree.root.children.length === 0) throw new Error('empty');
      const rep = addCustom({ name: shared.name, color: shared.color, pgn: tree.toPgn() });
      setShared(null);
      toast(`Added "${rep.name}" to your repertoires.`, { tone: 'success' });
      void navigate(`/openings/${rep.id}`);
    } catch {
      setShared(null);
      toast('The shared repertoire could not be read.', { tone: 'warning' });
    }
  };

  const now = useNow();
  const all: Repertoire[] = useMemo(
    () => [
      ...BUILT_IN_REPERTOIRES,
      ...custom.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        line: 'Custom repertoire',
        description: 'Imported from your own PGN.',
        level: 'intermediate' as const,
        openingTags: [],
        pgn: c.pgn,
      })),
    ],
    [custom],
  );

  const stats = useMemo(
    () =>
      Object.fromEntries(
        all.map((rep) => {
          try {
            const tree = GameTree.fromPgn(rep.pgn);
            return [rep.id, repertoireStats(tree, rep.color, cardsFor(cards, rep.id), now)];
          } catch {
            return [rep.id, { total: 0, due: 0, fresh: 0, learned: 0 }];
          }
        }),
      ),
    [all, cards, now],
  );

  const totalDue = Object.values(stats).reduce((sum, s) => sum + s.due, 0);
  const recent = sessions.slice(0, 5);

  const doImport = () => {
    setImportError(null);
    try {
      const merged = mergePgnGames(pgnText);
      if (merged.root.children.length === 0) throw new Error('No moves found in that PGN.');
      const rep = addCustom({ name: name.trim() || 'My repertoire', color, pgn: merged.toPgn() });
      toast(`Imported "${rep.name}".`, { tone: 'success' });
      setImportOpen(false);
      setName('');
      setPgnText('');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <div className="page-header row row--between">
        <div>
          <h1>Openings</h1>
          <p>
            Learn a repertoire move by move. Lines you know come back less often; a move you miss
            comes back ten minutes later, then at growing intervals. Everything is spaced
            repetition, like flashcards.
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)}>Import PGN</Button>
      </div>

      <Card className="openings__summary">
        <div className="puzzle-stats">
          <Stat value={totalDue} label="Moves due today" />
          <Stat
            value={Object.values(stats).reduce((sum, s) => sum + s.learned, 0)}
            label="Moves learned"
          />
          <Stat value={sessions.length} label="Sessions" />
        </div>
        {recent.length ? (
          <p className="small muted" style={{ margin: '12px 0 0' }}>
            Last session: {recent[0]?.correct}/{recent[0]?.total} moves recalled in{' '}
            {all.find((r) => r.id === recent[0]?.repertoireId)?.name ?? 'a repertoire'}
            {recent[0] ? ` on ${formatDate(recent[0].at)}` : ''}.
          </p>
        ) : null}
      </Card>

      {(['white', 'black'] as const).map((side) => (
        <section key={side} className="openings__section">
          <h2>As {side === 'white' ? 'White' : 'Black'}</h2>
          <div className="grid grid--cards">
            {all
              .filter((rep) => rep.color === side)
              .map((rep) => {
                const s = stats[rep.id] ?? { total: 0, due: 0, fresh: 0, learned: 0 };
                const isCustom = rep.id.startsWith('custom-');
                return (
                  <div key={rep.id} className="card repertoire-card">
                    <p className="card__eyebrow repertoire-card__level">
                      {isCustom ? 'Your own' : (LEVEL_LABEL[rep.level] ?? rep.level)}
                    </p>
                    <Link to={`/openings/${rep.id}`} className="card__title">
                      {rep.name}
                    </Link>
                    {isCustom ? null : <code className="small muted">{rep.line}</code>}
                    <p className="small muted" style={{ margin: 0 }}>
                      {rep.description}
                    </p>
                    {/* Progress and buttons at the foot: they line up across a row of cards. */}
                    <div className="repertoire-card__foot">
                      <div className="row row--between">
                        <span className="small muted">
                          {s.learned}/{s.total} moves learned
                        </span>
                        {s.due > 0 ? (
                          <Badge tone="warning">{s.due} due</Badge>
                        ) : s.learned === s.total && s.total > 0 ? (
                          <Badge tone="success">All learned</Badge>
                        ) : null}
                      </div>
                      <div
                        className="repertoire-card__progress"
                        role="progressbar"
                        aria-label="Moves learned"
                        aria-valuemin={0}
                        aria-valuemax={s.total}
                        aria-valuenow={s.learned}
                      >
                        <span style={{ width: `${s.total ? (s.learned / s.total) * 100 : 0}%` }} />
                      </div>
                      <div className="row">
                        <LinkButton size="sm" to={`/openings/${rep.id}`}>
                          {s.learned === 0 ? 'Learn' : s.due > 0 ? 'Review' : 'Practise'}
                        </LinkButton>
                        <LinkButton
                          size="sm"
                          to={`/play/computer?book=${encodeURIComponent(rep.id)}`}
                          title="Play a game in which the opponent follows this repertoire"
                        >
                          Play
                        </LinkButton>
                        {isCustom ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelete(rep.id)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      ))}

      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import a repertoire"
        actions={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={doImport} disabled={!pgnText.trim()}>
              Import
            </Button>
          </>
        }
      >
        <div className="stack">
          <p className="small muted" style={{ margin: 0 }}>
            Paste PGN with variations — one game or many. Every branch becomes a line to learn;
            comments are shown as tips. Exports from Lichess studies and chess.com work well.
          </p>
          <Field label="Name">
            {(id) => (
              <Input
                id={id}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Sicilian"
              />
            )}
          </Field>
          <Field label="You play">
            {(id) => (
              <Select id={id} value={color} onChange={(e) => setColor(e.target.value as LongColor)}>
                <option value="white">White</option>
                <option value="black">Black</option>
              </Select>
            )}
          </Field>
          <Field label="PGN">
            {(id) => (
              <textarea
                id={id}
                className="textarea"
                rows={8}
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder={
                  '1. e4 c5 2. Nf3 d6 (2... Nc6 3. d4 cxd4 4. Nxd4) 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 *'
                }
                spellCheck={false}
              />
            )}
          </Field>
          {importError ? <Alert tone="danger">{importError}</Alert> : null}
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete “${custom.find((c) => c.id === confirmDelete)?.name ?? 'this repertoire'}”?`}
        cancelLabel="Keep it"
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!confirmDelete) return;
          removeCustom(confirmDelete);
          toast('Repertoire deleted.');
        }}
        onClose={() => setConfirmDelete(null)}
      >
        <p className="muted">
          Its lines and your review history for them will be removed. This cannot be undone.
        </p>
      </ConfirmDialog>
      <Dialog
        open={shared !== null}
        onClose={() => setShared(null)}
        title="Add a shared repertoire"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShared(null)}>
              Not now
            </Button>
            <Button variant="primary" onClick={acceptShared} data-testid="accept-shared-repertoire">
              Add to my repertoires
            </Button>
          </>
        }
      >
        {shared ? (
          <p>
            Someone shared <strong>{shared.name}</strong> (for{' '}
            {shared.color === 'white' ? 'White' : 'Black'}) with you — a main line of{' '}
            {countMoves(shared.pgn)} moves. Adding it makes a copy you can edit and train like any
            custom repertoire.
          </p>
        ) : null}
      </Dialog>
    </div>
  );
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/** Full moves on the main line (the deepest line counts, not every branch). */
function countMoves(pgn: string): number {
  try {
    return Math.ceil(GameTree.fromPgn(pgn).mainLine().length / 2);
  } catch {
    return 0;
  }
}
