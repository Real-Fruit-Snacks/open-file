import { useEffect } from 'react';
import { Link } from 'react-router';
import { Badge, Icon, LinkButton } from '@/components/ui';
import { siteConfig } from '@/site.config';
import { useProgress } from '@/store/progress';
import { ARCADE_GAMES, describeArcadeBest } from './games';
import './arcade.css';

/** The arcade: eleven games that are not puzzles, each with a score to beat. */
export default function ArcadePage() {
  const arcade = useProgress((s) => s.arcade);
  const dailyOpening = useProgress((s) => s.dailyOpening);
  const oddsLadder = useProgress((s) => s.oddsLadder);

  useEffect(() => {
    document.title = `Arcade · ${siteConfig.name}`;
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Arcade</h1>
        <p>
          Games that are not puzzles — with the engine as a partner, a rival or a referee. Every
          game keeps a score to beat.
        </p>
      </div>
      <div className="grid grid--cards arcade-grid" data-testid="arcade-games">
        {ARCADE_GAMES.map((game) => {
          const best = describeArcadeBest(game, { arcade, dailyOpening, oddsLadder });
          // The game of the day stands out, two columns wide (and the grid comes out even).
          const featured = game.id === 'daily-opening';
          return (
            <div
              key={game.id}
              className={featured ? 'card arcade-card arcade-card--wide' : 'card arcade-card'}
              data-testid={`arcade-${game.id}`}
            >
              <div className="arcade-card__head">
                <span className="arcade-card__icon" aria-hidden="true">
                  <Icon name={game.icon} size={22} />
                </span>
                <span className="arcade-card__heading">
                  <Link to={`/arcade/${game.id}`} className="card__title">
                    {game.name}
                  </Link>
                  <span className="small muted">{game.minutes} min</span>
                </span>
                {featured ? (
                  <Badge tone="accent">New every day</Badge>
                ) : game.engine ? (
                  <Badge>Engine</Badge>
                ) : null}
              </div>
              <p className="arcade-card__tagline">{game.tagline}</p>
              {featured ? (
                <p className="small muted arcade-card__more">{game.description}</p>
              ) : null}
              <p className="small muted arcade-card__trains">Trains: {game.trains}</p>
              <div className="row row--between arcade-card__footer">
                <span className="small muted" data-testid={`arcade-best-${game.id}`}>
                  {best ?? 'Not played yet'}
                </span>
                {/* Ember once on the screen: the game of the day. */}
                <LinkButton
                  variant={featured ? 'primary' : 'secondary'}
                  size="sm"
                  to={`/arcade/${game.id}`}
                  aria-label={`Play ${game.name}`}
                >
                  Play
                </LinkButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
