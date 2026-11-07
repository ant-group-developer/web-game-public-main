'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getGame } from '@/constants/games';
import { useRecentGames } from '@/hooks/use-recent';
import { useT } from '@/hooks/use-locale';

/** "Chơi gần đây" — chỉ hiện khi trình duyệt đã từng mở game. */
export function RecentGames() {
  const { locale, t } = useT();
  const recent = useRecentGames().flatMap((slug) => getGame(slug) ?? []);
  if (!recent.length) return null;
  return (
    <section aria-labelledby="recent-games" className="section">
      <h2 id="recent-games" className="section-title section-title-sm">{t('home.recent')}</h2>
      <div className="recent-list">
        {recent.map((game) => (
          <Link key={game.slug} href={`/games/${game.slug}`} className="recent-item">
            <Image src={game.image} alt="" width={40} height={40} unoptimized />
            <span>{game.text[locale].title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
