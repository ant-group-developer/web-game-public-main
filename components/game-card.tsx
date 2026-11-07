'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Game } from '@/types/game';
import { useT } from '@/hooks/use-locale';
import { GameBadge } from './game-badge';

/** Thẻ game: ảnh bìa 16:9 tràn thẻ, tên game bên dưới. */
export function GameCard({ game, priority = false }: { game: Game; priority?: boolean }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  return (
    <Link href={`/games/${game.slug}`} className="game-card" aria-label={t('play.game', { title: text.title })}>
      <span className="game-card-cover">
        <Image src={game.cover} alt="" fill sizes="(max-width: 640px) 50vw, 320px" priority={priority} unoptimized />
        {game.badge && <GameBadge badge={game.badge} />}
      </span>
      <span className="game-card-info">
        <span className="game-card-name">{text.title}</span>
        <span className="play-dot" aria-hidden="true"><Play size={15} fill="currentColor" /></span>
      </span>
    </Link>
  );
}
