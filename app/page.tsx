import type { Metadata } from 'next';
import { games } from '@/constants/games';
import { GameCard } from '@/components/game-card';
import { HeroCarousel } from '@/modules/home/hero-carousel';
import { RecentGames } from '@/modules/home/recent-games';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function HomePage() {
  return (
    <div className="page">
      <h1 className="sr-only">ANT Play — Chơi game online miễn phí</h1>
      <HeroCarousel />
      <section aria-labelledby="all-games" className="section">
        <h2 id="all-games" className="section-title">Tất cả game</h2>
        <div className="game-grid">
          {games.map((game, i) => <GameCard key={game.slug} game={game} priority={i < 4} />)}
        </div>
      </section>
      <RecentGames />
    </div>
  );
}
