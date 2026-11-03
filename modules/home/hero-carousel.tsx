'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { games } from '@/constants/games';
import { GameBadge } from '@/components/game-badge';
import { useT } from '@/hooks/use-locale';
import { cn } from '@/helpers/tailwind';

const INTERVAL = 6000;

/** Banner game nổi bật: chữ + nút CHƠI NGAY bên trái, ảnh game bên phải, dãy ảnh nhỏ để chuyển game. */
export function HeroCarousel() {
  const { locale, t } = useT();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const game = games[index];
  const text = game.text[locale];

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % games.length), INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className="hero" aria-roledescription="carousel" aria-label={t('hero.label')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="hero-text" key={game.slug}>
        <div className="hero-tags">
          {game.badge && <GameBadge badge={game.badge} inline />}
          <span className="hero-tag">{text.tags.join(' · ')}</span>
        </div>
        <h2>{text.title}</h2>
        <p>{text.tagline}.</p>
        <Link href={`/games/${game.slug}`} className="play-button" aria-label={t('play.game', { title: text.title })}><Play size={22} fill="currentColor" /> {t('play.cta')}<span className="hide-sm">{t('play.ctaNow')}</span></Link>
        <div className="hero-thumbs" role="tablist" aria-label={t('hero.pick')}>
          {games.map((item, i) => (
            <button key={item.slug} type="button" role="tab" aria-selected={i === index} aria-label={item.text[locale].title} className={cn('hero-thumb', i === index && 'is-active')} onClick={() => setIndex(i)}>
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
