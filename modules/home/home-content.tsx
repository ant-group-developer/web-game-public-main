'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Category } from '@/types/category';
import type { Game, GameSort } from '@/types/game';
import { GameCard } from '@/components/game-card';
import { CategoryTile } from '@/components/category-tile';
import { SortBar } from '@/components/sort-bar';
import { useT } from '@/hooks/use-locale';
import { useSite } from '@/components/site-provider';
import { pickText } from '@/types/site';
import { matchGame, useSearch } from '@/hooks/use-search';
import { useSort } from '@/hooks/use-sort';
import { gameMeta, sortGames } from '@/helpers/games';
import type { Announcement } from '@/types/announcement';
import { EventsStrip } from './events-strip';
import { HeroCarousel } from './hero-carousel';
import { RecentGames } from './recent-games';

const HOME_SORTS: readonly GameSort[] = ['popular', 'newest', 'plays', 'name'];
const MAX_TILES = 10;

export function HomeContent({ games, categories, events = [] }: { games: Game[]; categories: Category[]; events?: Announcement[] }) {
  const { t, locale } = useT();
  const { siteName, tagline } = useSite();
  const query = useSearch();
  const [sort, setSort] = useSort('popular');
  const list = sortGames(games.filter((game) => matchGame(game, query)), sort, locale);
  const tiles = categories.filter((c) => c.gameCount > 0).slice(0, MAX_TILES);
  return (
    <div className="page">
      <h1 className="sr-only">{siteName} — {pickText(tagline, locale)}</h1>
      {games.length > 0 && <HeroCarousel games={games} />}
      <EventsStrip items={events} />

      {tiles.length > 0 && (
        <section aria-labelledby="home-categories" className="section">
          <div className="section-head">
            <h2 id="home-categories" className="section-title section-title-md">{t('home.categories')}</h2>
            <Link href="/categories" className="see-all">{t('home.seeAll')}<ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" /></Link>
          </div>
          <div className="cat-grid">
            {tiles.map((c) => <CategoryTile key={c.slug} category={c} />)}
          </div>
        </section>
      )}

      <section id="catalog" aria-labelledby="all-games" className="section">
        <div className="section-head section-head-wrap">
          <div>
            <h2 id="all-games" className="section-title">{t('home.allGames')}</h2>
            <p className="count" aria-live="polite">{t(list.length === 1 ? 'home.countOne' : 'home.count', { count: String(list.length) })}</p>
          </div>
          <SortBar value={sort} options={HOME_SORTS} onChange={setSort} />
        </div>
        <div className="game-grid">
          {list.map((game, i) => <GameCard key={game.slug} game={game} meta={gameMeta(game, sort, locale, t)} priority={i < 4} />)}
          {list.length === 0 && query.trim() && <p className="empty">{t('home.empty', { query: query.trim() })}</p>}
        </div>
      </section>
      <RecentGames games={games} />
    </div>
  );
}
