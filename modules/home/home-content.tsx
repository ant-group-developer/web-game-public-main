'use client';

import { games } from '@/constants/games';
import { GameCard } from '@/components/game-card';
import { useT } from '@/hooks/use-locale';
import { matchGame, useSearch } from '@/hooks/use-search';
import { HeroCarousel } from './hero-carousel';
import { RecentGames } from './recent-games';

export function HomeContent() {
  const { t } = useT();
  const query = useSearch();
  const list = games.filter((game) => matchGame(game, query));
  return (
    <div className="page">
      <h1 className="sr-only">{t('site.tagline')}</h1>
      <HeroCarousel />
      <section id="catalog" aria-labelledby="all-games" className="section">
        <h2 id="all-games" className="section-title">{t('home.allGames')}</h2>
        <p className="count" aria-live="polite">{t(list.length === 1 ? 'home.countOne' : 'home.count', { count: String(list.length) })}</p>
        <div className="game-grid">
          {list.map((game, i) => <GameCard key={game.slug} game={game} priority={i < 4} />)}
          {list.length === 0 && <p className="empty">{t('home.empty', { query: query.trim() })}</p>}
        </div>
      </section>
      <RecentGames />
    </div>
  );
}
