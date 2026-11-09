'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import type { Game } from '@/types/game';
import { useT } from '@/hooks/use-locale';
import { GameCard } from '@/components/game-card';
import { GamePlayer } from './game-player';

export function GameDetail({ game, others }: { game: Game; others: Game[] }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  return (
    <div className="page page-game">
      <h1 className="sr-only">{text.title}</h1>
      <Link href="/" className="back"><ArrowLeft size={16} strokeWidth={2.6} aria-hidden="true" /> {t('detail.back')}</Link>
      <div className="game-layout">
        <div className="game-main">
          <GamePlayer key={game.slug} game={game} />
          {game.screenshots.length > 0 && (
            <section className="game-shots" aria-labelledby="game-shots">
              <h2 id="game-shots" className="section-title section-title-sm">{t('detail.screenshots')}</h2>
              <div className="game-shots-list">
                {game.screenshots.map((src, i) => (
                  <a key={src + i} href={src} target="_blank" rel="noreferrer" className="game-shot">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${text.title} — ${t('detail.screenshots').toLowerCase()} ${i + 1}`} loading="lazy" decoding="async" />
                  </a>
                ))}
              </div>
            </section>
          )}
          {/* Thu gọn mặc định: người chơi tập trung vào game, nội dung vẫn có trong HTML cho SEO. */}
          <details className="game-info">
            <summary><span>{t('detail.info')}</span><ChevronDown size={18} strokeWidth={2.6} aria-hidden="true" /></summary>
            {text.about.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            {text.instructions.length > 0 && <ol>{text.instructions.map((step, i) => <li key={i}>{step}</li>)}</ol>}
            {game.author && <p className="game-info-credit">{t('detail.author', { name: game.author })}</p>}
          </details>
        </div>
        {others.length > 0 && (
          <aside className="more-games" aria-labelledby="more-games">
            <h2 id="more-games" className="section-title section-title-sm">{t('detail.more')}</h2>
            <div className="more-list">
              {others.map((item) => <GameCard key={item.slug} game={item} />)}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
