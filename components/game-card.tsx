import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Game } from '@/types/game';

export function GameCard({ game, priority = false }: { game: Game; priority?: boolean }) {
  return (
    <Link href={`/games/${game.slug}`} className="game-card" aria-label={`Chơi ${game.title}`}>
      <span className="game-card-art">
        <Image src={game.image} alt="" fill sizes="(max-width: 640px) 50vw, 300px" priority={priority} unoptimized />
        {game.badge && <span className={`badge ${game.badge === 'HOT' ? 'badge-hot' : ''}`}>{game.badge}</span>}
        <span className="game-card-play" aria-hidden="true"><span><Play size={28} fill="currentColor" /></span></span>
      </span>
      <span className="game-card-name">{game.title}</span>
      <span className="game-card-tag">{game.tagline}</span>
    </Link>
  );
}
