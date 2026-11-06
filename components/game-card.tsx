'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Play } from 'lucide-react';
import type { Game } from '@/types/game';
import { useT } from '@/hooks/use-locale';
import { GameBadge } from './game-badge';

/** Thẻ game: ảnh nằm giữa nền màu của game (màu lấy từ `tint`), tên + mô tả ngắn bên dưới. */
export function GameCard({ game, priority = false }: { game: Game; priority?: boolean }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  return (
    <Link href={`/games/${game.slug}`} className="game-card" style={{ '--tint': game.tint } as CSSProperties} aria-label={t('play.game', { title: text.title })}>
      <span className="game-card-cover">
        <Image src={game.image} alt="" width={160} height={160} priority={priority} unoptimized />
        {game.badge && <GameBadge badge={game.badge} />}
      </span>
      <span className="game-card-info">
        <span className="game-card-text">
          <span className="game-card-name">{text.title}</span>
          <span className="game-card-tag">{text.tagline}</span>
        </span>
        <span className="play-dot" aria-hidden="true"><Play size={15} fill="currentColor" /></span>
      </span>
    </Link>
  );
}
