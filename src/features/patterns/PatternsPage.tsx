import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Board } from '@/components/board/Board';
import { Badge, Button, Card, LinkButton } from '@/components/ui';
import { Difficulty } from '@/features/drills/Difficulty';
import { loadPuzzleIndex, type PuzzleIndex } from '@/features/puzzles/puzzleService';
import { shuffle } from '@/lib/random';
import { siteConfig } from '@/site.config';
import { useProgress } from '@/store/progress';
import {
  MATING_PATTERNS,
  type MatingPattern,
  patternDiagram,
  patternDrillId,
} from './matingPatterns';
import { PatternDrill } from './PatternDrill';
import './patterns.css';
import { Notated } from '@/chess/San';
import { formatCount } from '@/lib/format';

/**
 * The gallery of named mating patterns: a diagram and explanation for each,
 * with a drill that runs through them and links to the matching puzzles.
 */
export default function PatternsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const drills = useProgress((s) => s.drills);
  const [index, setIndex] = useState<PuzzleIndex | null>(null);
  const [queue, setQueue] = useState<MatingPattern[] | null>(null);

  useEffect(() => {
    document.title = `Mating patterns · ${siteConfig.name}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPuzzleIndex()
      .then((loaded) => {
        if (!cancelled) setIndex(loaded);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const solvedIds = useMemo(
    () =>
      new Set(
        MATING_PATTERNS.filter((p) => (drills[patternDrillId(p)]?.best ?? 0) > 0).map((p) => p.id),
      ),
    [drills],
  );
  const missed = MATING_PATTERNS.filter((p) => !solvedIds.has(p.id));

  // `?drill=all|missed|<id>` starts a drill straight away (links from the Drills page).
  useEffect(() => {
    const requested = searchParams.get('drill');
    if (!requested) return;
    const wanted =
      requested === 'all'
        ? [...MATING_PATTERNS]
        : requested === 'missed'
          ? MATING_PATTERNS.filter((p) => !solvedIds.has(p.id))
          : MATING_PATTERNS.filter((p) => p.id === requested);
    if (wanted.length > 0) {
      setQueue(requested === 'all' || requested === 'missed' ? shuffle(wanted) : wanted);
    }
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, from the URL
  }, []);

  const startDrill = (patterns: MatingPattern[], random = true) => {
    setQueue(random ? shuffle(patterns) : patterns);
    window.scrollTo({ top: 0 });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Mating patterns</h1>
        <p>
          The named checkmates every player should recognise at a glance. Each diagram is a minimal
          example: study the shape, solve it as a puzzle, then find it in the library’s real games.
        </p>
      </div>

      {queue ? (
        <PatternDrill
          key={queue.map((p) => p.id).join(',')}
          patterns={queue}
          onExit={() => setQueue(null)}
        />
      ) : (
        <>
          <Card className="patterns__toolbar" data-testid="patterns-toolbar">
            <div>
              <p className="card__eyebrow">Pattern drill</p>
              <strong data-testid="patterns-solved">
                {solvedIds.size} of {MATING_PATTERNS.length} patterns solved
              </strong>
              {drills['mating-patterns']?.detail ? (
                <span className="small muted">
                  {' '}
                  · best full run {drills['mating-patterns'].detail}
                </span>
              ) : null}
            </div>
            <div className="row">
              <Button
                variant="primary"
                onClick={() => startDrill([...MATING_PATTERNS])}
                data-testid="drill-all"
              >
                Drill all {MATING_PATTERNS.length}
              </Button>
              {missed.length > 0 && missed.length < MATING_PATTERNS.length ? (
                <Button onClick={() => startDrill(missed)}>
                  Drill the {missed.length} unsolved
                </Button>
              ) : null}
            </div>
          </Card>

          <div className="patterns__grid">
            {MATING_PATTERNS.map((pattern) => {
              const count = index?.themes[pattern.id];
              const solved = solvedIds.has(pattern.id);
              return (
                <Card
                  key={pattern.id}
                  className="pattern-card"
                  data-testid={`pattern-${pattern.id}`}
                >
                  <div className="pattern-card__board">
                    <Board
                      fen={patternDiagram(pattern)}
                      orientation="white"
                      viewOnly
                      animate={false}
                      announceMoves={false}
                      ariaLabel={`${pattern.name} diagram, White to play and mate`}
                    />
                  </div>
                  <div className="pattern-card__body">
                    <div className="row row--between">
                      <h2 className="pattern-card__title">{pattern.name}</h2>
                      {solved ? (
                        <Badge tone="success">Solved</Badge>
                      ) : (
                        <Difficulty level={pattern.difficulty} />
                      )}
                    </div>
                    <p className="small muted pattern-card__meta">
                      {pattern.pieces} · White to play and mate
                      {pattern.line.length > 1 ? ` in ${Math.ceil(pattern.line.length / 2)}` : ''}
                    </p>
                    <p className="pattern-card__text">
                      <Notated text={pattern.explanation} />
                    </p>
                    <p className="pattern-card__spot">
                      <strong>Spot it</strong> {pattern.spot}
                    </p>
                    <div className="row pattern-card__actions">
                      <Button size="sm" onClick={() => startDrill([pattern], false)}>
                        {solved ? 'Solve it again' : 'Solve it'}
                      </Button>
                      <LinkButton size="sm" to={`/puzzles/themes?theme=${pattern.id}`}>
                        {count ? `${formatCount(count, siteConfig.locale)} puzzles` : 'Puzzles'}
                      </LinkButton>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
