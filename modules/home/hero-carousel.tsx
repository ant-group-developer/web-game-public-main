'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { Play } from 'lucide-react';
import { games } from '@/constants/games';
import { GameBadge } from '@/components/game-badge';
import { useT } from '@/hooks/use-locale';
import { cn } from '@/helpers/tailwind';

const INTERVAL = 6000;

/** Banner game nổi bật: chữ lớn + nút CHƠI NGAY bên trái, ảnh game trên nền lưới tím bên phải, dãy ảnh nhỏ để chuyển game. */
export function HeroCarousel() {
  const { locale, t } = useT();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const game = games[index];
  const text = game.text[locale];
  // Từ cuối của tên game tô màu nhấn, xuống dòng riêng.
  const words = text.title.split(' ');
  const lastWord = words.pop();

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % games.length), INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className="hero" aria-roledescription="carousel" aria-label={t('hero.label')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Link href={`/games/${game.slug}`} className="hero-art" style={{ '--tint': game.tint } as CSSProperties} tabIndex={-1} aria-hidden="true">
        <span className="hero-ring" />
        <span className="hero-spark hero-spark-a" />
        <span className="hero-spark hero-spark-b" />
        <Image key={game.slug} src={game.image} alt="" width={280} height={280} priority unoptimized />
      </Link>
      <div className="hero-copy" key={game.slug}>
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          {text.tags.join(' · ')}
          {game.badge && <GameBadge badge={game.badge} inline />}
        </p>
        <h2>{words.length > 0 && <>{words.join(' ')} </>}<em>{lastWord}</em></h2>
        <p className="hero-tagline">{text.tagline}.</p>
        <Link href={`/games/${game.slug}`} className="play-button" aria-label={t('play.game', { title: text.title })}>
          <Play size={18} fill="currentColor" aria-hidden="true" />
          <span>{t('play.cta')}<span className="hide-sm">{t('play.ctaNow')}</span></span>
        </Link>
        <div className="hero-thumbs" role="tablist" aria-label={t('hero.pick')}>
          {games.map((item, i) => (
            <button key={item.slug} type="button" role="tab" aria-selected={i === index} aria-label={item.text[locale].title} className={cn('hero-thumb', i === index && 'is-active')} onClick={() => setIndex(i)}>
              <Image src={item.image} alt="" width={48} height={48} unoptimized />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
