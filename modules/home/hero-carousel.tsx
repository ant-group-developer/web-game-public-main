'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import type { Game } from '@/types/game';
import { GameBadge } from '@/components/game-badge';
import { useT } from '@/hooks/use-locale';
import { cn } from '@/helpers/tailwind';

const INTERVAL = 6000;

/**
 * Banner game nổi bật: tên game + nút CHƠI NGAY bên trái, ảnh bìa 16:9 bên phải, dãy ảnh nhỏ để chuyển game.
 * Hiện các game được đánh dấu "nổi bật" trong admin; chưa đánh dấu game nào thì hiện tất cả.
 */
export function HeroCarousel({ games }: { games: Game[] }) {
  const { locale, t } = useT();
  const featured = games.filter((game) => game.isFeatured);
  const slides = featured.length ? featured : games;
  const [current, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const index = current % slides.length;
  const game = slides[index];
  const text = game.text[locale];
  // Từ cuối của tên game tô màu nhấn, xuống dòng riêng.
  const words = text.title.split(' ');
  const lastWord = words.pop();

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  return (
    <section className="hero" aria-roledescription="carousel" aria-label={t('hero.label')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Link href={`/games/${game.slug}`} className="hero-art" tabIndex={-1} aria-hidden="true">
        <Image key={game.slug} src={game.banner || game.cover} alt="" fill sizes="(max-width: 640px) 100vw, 780px" priority unoptimized />
      </Link>
      <div className="hero-copy" key={game.slug}>
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          {text.tags.join(' · ')}
          {game.badge && <GameBadge badge={game.badge} inline />}
        </p>
        <h2>{words.length > 0 && <>{words.join(' ')} </>}<em>{lastWord}</em></h2>
        <Link href={`/games/${game.slug}`} className="play-button" aria-label={t('play.game', { title: text.title })}>
          <Play size={18} fill="currentColor" aria-hidden="true" />
          <span>{t('play.cta')}<span className="hide-sm">{t('play.ctaNow')}</span></span>
        </Link>
        <div className="hero-thumbs" role="tablist" aria-label={t('hero.pick')}>
          {slides.map((item, i) => (
            <button key={item.slug} type="button" role="tab" aria-selected={i === index} aria-label={item.text[locale].title} className={cn('hero-thumb', i === index && 'is-active')} onClick={() => setIndex(i)}>
              <Image src={item.image} alt="" width={48} height={48} unoptimized />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
