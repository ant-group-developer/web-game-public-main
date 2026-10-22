'use client';

import Link from 'next/link';
import { ArrowLeft, Gamepad2, Heart, Sparkles } from 'lucide-react';
import { games } from '@/constants/games';
import { categories } from '@/constants/categories';
import { GameCard } from '@/components/game-card';
import { CategoryGrid } from '@/components/category-grid';
import { useLibrary } from '@/hooks/use-library';

export function GameCatalog({ category }: { category?: string }) {
  const { favorites } = useLibrary();
  const selected = categories.find((item) => item.slug === category);
  const title = selected?.title ?? (category === 'favorites' ? 'Your favorite games' : category === 'new' ? 'New Games' : 'All Games');
  const filtered = !category || category === 'all' ? games : games.filter((game) => category === 'favorites' ? favorites.includes(game.slug) : category === 'new' ? game.isNew : game.categories.includes(category));
  const Icon = selected?.icon ?? (category === 'favorites' ? Heart : category === 'new' ? Sparkles : Gamepad2);

  return <>
    {category ? <section className="catalog-section">
      <Link className="back-link" href="/"><ArrowLeft size={18} /> All the fun starts here</Link>
      <div className="catalog-heading"><Icon size={33} /><h1>{title}</h1><span>{filtered.length} games</span></div>
      <div className="category-chips"><Link href="/?category=all" aria-current={category === 'all' ? 'page' : undefined}>All Games</Link>{categories.map((item) => <Link href={`/?category=${item.slug}`} key={item.slug} aria-current={item.slug === category ? 'page' : undefined}>{item.title}</Link>)}</div>
      {filtered.length ? <div className="regular-grid">{filtered.map((game, index) => <GameCard game={game} key={game.slug} priority={index < 12} />)}</div> : <div className="empty-state"><Heart size={48} /><h2>{category === 'favorites' ? 'Make room for your favorites' : 'More fun is on the way'}</h2><p>{category === 'favorites' ? 'Open a game and tap the heart to start your collection.' : 'Explore more games in another category.'}</p><Link href="/" className="primary-button">Explore games</Link></div>}
    </section> : <><h1 className="sr-only">ANT Play — Free online games</h1><div className="mosaic" aria-label="Discover games"><span className="nav-placeholder" aria-hidden="true" />{games.map((game, index) => <GameCard game={game} key={game.slug} mosaic priority={index < 24} />)}</div></>}
    <CategoryGrid />
    <section id="about" className="about-section"><span className="eyebrow">A world of play</span><h2>Free online games on ANT Play</h2><p>Your next little adventure starts here. Explore racing games, clever puzzles, action-packed challenges and multiplayer favorites, all in one colorful playground.</p><h3>What are you playing today?</h3><p>Go full speed in <Link href="/games/drive-mad">Drive Mad</Link>, find your rhythm in <Link href="/games/stickman-hook">Stickman Hook</Link>, or take a break with <Link href="/games/monkey-mart">Monkey Mart</Link>. Pick a favorite, discover something new, and make a little time for fun.</p><div className="about-links"><Link href="/?category=car">Car games</Link><Link href="/?category=puzzle">Puzzle games</Link><Link href="/?category=multiplayer">2 player games</Link><Link href="/?category=all">Explore all games →</Link></div></section>
  </>;
}
