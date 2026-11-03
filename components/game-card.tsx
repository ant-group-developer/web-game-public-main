'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Game } from '@/types/game';
import { useT } from '@/hooks/use-locale';
import { GameBadge } from './game-badge';

export function GameCard({ game, priority = false }: { game: Game; priority?: boolean }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  return (
    <Link href={`/games/${game.slug}`} className="game-card" aria-label={t('play.game', { title: text.title })}>
      <span className="game-card-art">
        <Image src={game.image} alt="" fill sizes="(max-width: 640px) 50vw, 300px" priority={priority} unoptimized />
        {game.badge && <GameBadge badge={game.badge} />}
        <span className="game-card-play" aria-hidden="true"><span><Play size={28} fill="currentColor" /></span></span>
      </span>
      <span className="game-card-name">{text.title}</span>
      <span className="game-card-tag">{text.tagline}</span>
    </Link>
  );
}
