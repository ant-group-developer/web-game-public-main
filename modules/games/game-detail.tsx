import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { games } from '@/constants/games';
import type { Game } from '@/types/game';
import { GamePlayer } from './game-player';

export function GameDetail({ game }: { game: Game }) {
  const others = games.filter((item) => item.slug !== game.slug);
  return (
    <div className="page page-game">
      <h1 className="sr-only">{game.title}</h1>
      <div className="game-layout">
        <div className="game-main">
          <GamePlayer key={game.slug} game={game} />
          <details className="game-info">
            <summary>Giới thiệu &amp; cách chơi</summary>
            {game.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <ol>{game.instructions.map((step) => <li key={step}>{step}</li>)}</ol>
            {game.author && <p className="game-info-credit">Tác giả: {game.author}</p>}
          </details>
        </div>
        <aside className="more-games" aria-labelledby="more-games">
          <h2 id="more-games" className="section-title section-title-sm">Chơi thêm</h2>
          <div className="more-list">
            {others.map((item) => (
              <Link key={item.slug} href={`/games/${item.slug}`} className="more-card" aria-label={`Chơi ${item.title}`}>
                <span className="more-card-art"><Image src={item.image} alt="" fill sizes="(max-width: 640px) 33vw, 280px" unoptimized /></span>
                <span className="more-card-info">
                  <span className="more-card-text"><strong>{item.title}</strong><span>{item.tagline}</span></span>
                  <span className="play-dot" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
