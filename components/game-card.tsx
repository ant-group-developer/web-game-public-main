import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/helpers/tailwind';
import type { Game } from '@/types/game';

export function GameCard({ game, mosaic = false, priority = false }: { game: Game; mosaic?: boolean; priority?: boolean }) {
  return (
    <Link href={`/games/${game.slug}`} title={game.title} className={cn('game-card', mosaic && game.featured >= 0 && `featured-${game.featured}`)}>
      <Image src={game.image} alt={game.title} fill sizes={mosaic && game.featured >= 0 ? '(max-width: 660px) 33vw, 314px' : '(max-width: 660px) 33vw, 204px'} priority={priority} unoptimized className="object-cover" />
      {game.isNew && <span className="new-badge" aria-label="New game"><Sparkles size={15} fill="currentColor" /></span>}
      <span className="game-card-title">{game.title}</span>
    </Link>
  );
}
