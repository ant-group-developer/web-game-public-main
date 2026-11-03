'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { games } from '@/constants/games';
import { cn } from '@/helpers/tailwind';

const INTERVAL = 6000;

/** Banner game nổi bật: chữ + nút CHƠI NGAY bên trái, ảnh game bên phải, dãy ảnh nhỏ để chuyển game. */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const game = games[index];

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % games.length), INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Game nổi bật" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="hero-text" key={game.slug}>
        <div className="hero-tags">
          {game.badge && <span className={`badge badge-inline ${game.badge === 'HOT' ? 'badge-hot' : ''}`}>{game.badge}</span>}
          <span className="hero-tag">{game.tags.join(' · ')}</span>
        </div>
        <h2>{game.title}</h2>
        <p>{game.tagline}.</p>
        <Link href={`/games/${game.slug}`} className="play-button" aria-label={`Chơi ${game.title}`}><Play size={22} fill="currentColor" /> CHƠI<span className="hide-sm"> NGAY</span></Link>
        <div className="hero-thumbs" role="tablist" aria-label="Chọn game nổi bật">
          {games.map((item, i) => (
            <button key={item.slug} type="button" role="tab" aria-selected={i === index} aria-label={item.title} className={cn('hero-thumb', i === index && 'is-active')} onClick={() => setIndex(i)}>
              <Image src={item.image} alt="" width={54} height={54} unoptimized />
            </button>
          ))}
        </div>
      </div>
      <Link href={`/games/${game.slug}`} className="hero-art" style={{ backgroundColor: game.tint }} tabIndex={-1} aria-hidden="true">
        <Image key={game.slug} src={game.image} alt="" width={330} height={330} priority unoptimized />
      </Link>
    </section>
  );
}
