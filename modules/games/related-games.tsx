'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Game } from '@/types/game';
import { useT } from '@/hooks/use-locale';
import { formatCount, PUBLIC_PLAYS_MIN } from '@/helpers/games';

/** Game liên quan: dạng danh sách (chế độ thường, cột bên phải) hoặc lưới (chế độ ngang, dưới khung game). */
export function RelatedGames({ games, layout, moreHref }: { games: Game[]; layout: 'list' | 'grid'; moreHref: string }) {
  const { locale, t } = useT();
  return (
    <>
      <div className="side-head">
        <h2 id="related-games" className="section-title section-title-sm">{t('detail.related')}</h2>
        <Link href={moreHref} className="pill">{t('home.seeAll')}</Link>
      </div>
      <div className={`related related-${layout}`}>
        {games.map((game) => {
          const text = game.text[locale];
          const category = game.categories[0]?.name[locale];
          return (
            <Link key={game.slug} href={`/games/${game.slug}`} className="related-item">
              <span className="related-thumb">
                <Image src={game.cover} alt="" fill sizes={layout === 'grid' ? '(max-width: 640px) 50vw, 200px' : '168px'} unoptimized />
              </span>
              <span className="related-text">
                <strong>{text.title}</strong>
                {category && <span>{category}</span>}
                {game.plays.total >= PUBLIC_PLAYS_MIN && <span>{t('meta.plays', { count: formatCount(game.plays.total, locale) })}</span>}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
