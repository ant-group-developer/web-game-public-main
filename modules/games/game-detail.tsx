'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, ExternalLink, Heart, Maximize, Play } from 'lucide-react';
import type { Game } from '@/types/game';
import { games } from '@/constants/games';
import { categories } from '@/constants/categories';
import { useLibrary } from '@/hooks/use-library';
import { GameCard } from '@/components/game-card';
import { CityBloxxPlayer } from './city-bloxx-player';
import { cityBloxxModes } from '@/constants/city-bloxx';

export function GameDetail({ game }: { game: Game }) {
  const isCityBloxx = game.slug === 'city-bloxx';
  const { favorites, toggleFavorite } = useLibrary();
  const [playing, setPlaying] = useState(false);
  const player = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('ant-recent') || '[]');
      const recent = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
      localStorage.setItem('ant-recent', JSON.stringify([game.slug, ...recent.filter((slug) => slug !== game.slug)].slice(0, 20)));
      window.dispatchEvent(new Event('ant-library'));
    } catch { /* Storage is optional. */ }
  }, [game.slug]);
  const related = games.filter((item) => item.slug !== game.slug && item.categories.some((category) => game.categories.filter((name) => name !== 'adventure').includes(category))).slice(0, 16);

  return <div className="game-page" lang={game.language}>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={14} /><span>{game.title}</span></nav>
    <div className="game-page-layout"><section className="game-player-section">
      <div ref={player} className={`game-player ${isCityBloxx ? 'game-player-city-bloxx' : ''}`}>
        {isCityBloxx ? <CityBloxxPlayer onPlay={() => setPlaying(true)} /> : playing && game.embedUrl ? <iframe src={game.embedUrl} title={game.title} allow="fullscreen; autoplay; gamepad" allowFullScreen sandbox="allow-scripts allow-same-origin allow-pointer-lock" /> : <>
          <Image src={game.image} alt="" fill sizes="(max-width: 990px) 100vw, 960px" unoptimized className="player-background" />
          <div className="player-launch"><Image src={game.image} alt={game.title} width={154} height={154} unoptimized className="launch-image" /><h1>{game.title}</h1>
            {game.embedUrl ? <button className="play-button" onClick={() => setPlaying(true)}><Play size={22} fill="currentColor" /> Play now</button> : <a className="play-button" href={game.sourcePage} target="_blank" rel="noopener noreferrer"><Play size={22} fill="currentColor" /> Play on Poki <ExternalLink size={16} /></a>}
            {!game.embedUrl && <p>Opens the original game in a new tab</p>}
          </div>
        </>}
      </div>
      <div className="game-toolbar"><div className="flex min-w-0 items-center gap-3"><Image src={game.image} alt="" width={44} height={44} unoptimized className="rounded-lg" /><div className="min-w-0"><h2 className="truncate font-display text-xl font-bold">{game.title}</h2><span className="text-xs text-slate-500">{game.tagline ?? 'A little time for fun'}</span></div></div><div className="ml-auto flex gap-2"><button className={`icon-button favorite-button ${favorites.includes(game.slug) ? 'is-saved' : ''}`} aria-label={favorites.includes(game.slug) ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={favorites.includes(game.slug)} onClick={() => toggleFavorite(game.slug)}><Heart size={23} fill={favorites.includes(game.slug) ? 'currentColor' : 'none'} /></button>{playing && <button className="icon-button" aria-label="Fullscreen game" onClick={() => player.current?.requestFullscreen().catch(() => {})}><Maximize size={22} /></button>}</div></div>
      <div className="game-description">{isCityBloxx ? <h1>City Bloxx — Xây dựng thành phố</h1> : <h2>{game.title}</h2>}{game.about ? game.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : <p>Ready for your next challenge? Discover {game.title}, save it to your favorites, and come back whenever you feel like playing.</p>}
        {game.instructions && <><h3>Cách chơi City Bloxx</h3><ol>{game.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol></>}
        {isCityBloxx && <><h3>Chọn cách chơi của bạn</h3><div className="game-mode-descriptions">{cityBloxxModes.map((mode) => <div key={mode.screen}><h4>{mode.title}</h4><p>{mode.description}</p></div>)}</div></>}
        {game.tips && <><h3>Mẹo để xây tháp tốt hơn</h3><ul>{game.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></>}
        {isCityBloxx && <><h3>Câu hỏi thường gặp</h3><h4>Có cần tải game không?</h4><p>Không. Bấm Chơi ngay để mở City Bloxx trong khung game trên trang này.</p><h4>Làm sao chuyển sang Solo PvP?</h4><p>Chọn Solo PvP 1v1 trong danh sách chế độ ngay dưới khung game để mở sảnh đấu. Các bước tài khoản và ghép trận được xử lý trong game.</p><h4>Điện thoại có chơi được không?</h4><p>Có. Chạm vào vùng chơi để thả tầng nhà. Bạn có thể mở toàn màn hình khi game đã khởi động.</p></>}
        <div className="category-chips">{categories.filter((category) => game.categories.includes(category.slug)).map((category) => <Link href={`/?category=${category.slug}`} key={category.slug}>{category.title}</Link>)}</div><Link href="/" className="back-link"><ArrowLeft size={17} /> {isCityBloxx ? 'Khám phá thêm game' : 'Discover more games'}</Link></div>
    </section><aside className="related-games" aria-label="You might also like">{related.slice(0, 12).map((item) => <GameCard game={item} key={item.slug} />)}</aside></div>
    <h2 className="related-title">Keep the fun going</h2><div className="regular-grid">{related.map((item) => <GameCard game={item} key={item.slug} />)}</div>
  </div>;
}
