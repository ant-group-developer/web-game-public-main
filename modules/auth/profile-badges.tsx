'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from '@/hooks/use-locale';
import { myBadges } from '@/lib/zozo/badges';
import type { PlayerBadge } from '@/types/announcement';

const MEDAL: Record<PlayerBadge['tier'], string> = { gold: '1', silver: '2', bronze: '3', special: '★' };

/** /ho-so — danh hiệu các game cấp (platform 07), mới nhất trước. */
export function ProfileBadges({ playerId }: { playerId: string }) {
  const { t, locale } = useT();
  const [items, setItems] = useState<PlayerBadge[] | null>(null);
  useEffect(() => {
    let alive = true;
    myBadges()
      .then((b) => alive && setItems(b))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [playerId]);
  if (items === null) return null;
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  return (
    <section className="badges-card" aria-labelledby="badges-title" data-testid="profile-badges">
      <div className="badges-head">
        <h2 id="badges-title" className="section-title section-title-sm">{t('badges.title')}{items.length ? <span className="badges-count"> · {items.length}</span> : null}</h2>
        <span className="badges-hint">{t('badges.hint')}</span>
      </div>
      {items.length === 0 ? (
        <p className="comment-empty">{t('badges.empty')}</p>
      ) : (
        <ul className="badges-grid">
          {items.map((b) => {
            const body = (
              <>
                {b.imageUrl ? <Image className={`medal medal-${b.tier}`} src={b.imageUrl} alt="" width={48} height={48} unoptimized /> : <span className={`medal medal-${b.tier}`} aria-hidden="true">{MEDAL[b.tier]}</span>}
                <span className="badge-text">
                  <strong>{b.title}</strong>
                  <span>{[b.game?.title, b.detail, fmt(b.grantedAt)].filter(Boolean).join(' · ')}</span>
                </span>
              </>
            );
            return <li key={b.id}>{b.href ? <Link href={b.href} className="badge-item">{body}</Link> : <div className="badge-item">{body}</div>}</li>;
          })}
        </ul>
      )}
    </section>
  );
}
