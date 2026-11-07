'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { games } from '@/constants/games';
import type { Game } from '@/types/game';
import { useT } from '@/hooks/use-locale';
import { GameCard } from '@/components/game-card';
import { GamePlayer } from './game-player';

export function GameDetail({ game }: { game: Game }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  const others = games.filter((item) => item.slug !== game.slug);
  return (
    <div className="page page-game">
      <h1 className="sr-only">{text.title}</h1>
      <Link href="/" className="back"><ArrowLeft size={16} strokeWidth={2.6} aria-hidden="true" /> {t('detail.back')}</Link>
      <div className="game-layout">
        <div className="game-main">
          <GamePlayer key={game.slug} game={game} />
          {/* Thu gọn mặc định: người chơi tập trung vào game, nội dung vẫn có trong HTML cho SEO. */}
          <details className="game-info">
            <summary><span>{t('detail.info')}</span><ChevronDown size={18} strokeWidth={2.6} aria-hidden="true" /></summary>
            {text.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <ol>{text.instructions.map((step) => <li key={step}>{step}</li>)}</ol>
            {game.author && <p className="game-info-credit">{t('detail.author', { name: game.author })}</p>}
          </details>
        </div>
        <aside className="more-games" aria-labelledby="more-games">
          <h2 id="more-games" className="section-title section-title-sm">{t('detail.more')}</h2>
          <div className="more-list">
            {others.map((item) => <GameCard key={item.slug} game={item} />)}
          </div>
        </aside>
      </div>
    </div>
  );
}
