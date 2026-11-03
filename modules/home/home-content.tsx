'use client';

import { games } from '@/constants/games';
import { GameCard } from '@/components/game-card';
import { useT } from '@/hooks/use-locale';
import { HeroCarousel } from './hero-carousel';
import { RecentGames } from './recent-games';

export function HomeContent() {
  const { t } = useT();
  return (
    <div className="page">
      <h1 className="sr-only">{t('site.tagline')}</h1>
      <HeroCarousel />
      <section aria-labelledby="all-games" className="section">
        <h2 id="all-games" className="section-title">{t('home.allGames')}</h2>
        <div className="game-grid">
          {games.map((game, i) => <GameCard key={game.slug} game={game} priority={i < 4} />)}
        </div>
      </section>
      <RecentGames />
    </div>
  );
}
