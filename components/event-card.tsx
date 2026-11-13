'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Clock, Trophy, Users } from 'lucide-react';
import type { MessageKey } from '@/constants/i18n';
import { useT } from '@/hooks/use-locale';
import { cn } from '@/helpers/tailwind';
import type { Announcement } from '@/types/announcement';

type T = ReturnType<typeof useT>['t'];

const subscribeMinute = (cb: () => void) => {
  const id = window.setInterval(cb, 30_000);
  return () => window.clearInterval(id);
};
/** "Bây giờ" theo phút, chỉ có ở trình duyệt (server render ra ngày cố định → không lệch khi hydrate). */
export function useNow(): number | null {
  return useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60_000) * 60_000, () => null);
}

export function fmtLeft(ms: number, t: T): string {
  const m = Math.max(1, Math.round(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return t('ev.days', { d: String(d), h: String(h) });
  if (h > 0) return t('ev.hours', { h: String(h), m: String(m % 60) });
  return t('ev.minutes', { m: String(m) });
}

const fmtDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(iso));

/** Dòng thời gian của thẻ: đếm ngược (trình duyệt) hoặc ngày giờ cố định (server, đã kết thúc). */
export function timeLine(a: Announcement, now: number | null, t: T, locale: string): string {
  if (a.status === 'finished' || a.status === 'cancelled') return t('ev.endedOn', { date: fmtDate(a.endsAt, locale) });
  if (now === null) return `${fmtDate(a.startsAt, locale)} – ${fmtDate(a.endsAt, locale)}`;
  if (a.status === 'open' && a.registrationEndsAt) return t('ev.regLeft', { time: fmtLeft(Date.parse(a.registrationEndsAt) - now, t) });
  if (a.status === 'upcoming') return t('ev.startsIn', { time: fmtLeft(Date.parse(a.startsAt) - now, t) });
  return t('ev.left', { time: fmtLeft(Date.parse(a.endsAt) - now, t) });
}

export function statusKey(a: Announcement): MessageKey {
  if (a.status === 'live') return a.kind === 'tournament' ? 'ev.st.liveT' : 'ev.st.live';
  return `ev.st.${a.status}` as MessageKey;
}

export function ctaKey(a: Announcement): MessageKey {
  if (a.status === 'open') return 'ev.cta.register';
  if (a.status === 'live') return a.kind === 'tournament' ? 'ev.cta.view' : 'ev.cta.join';
  if (a.status === 'finished') return 'ev.cta.results';
  return 'ev.cta.view';
}

const AVATAR_BG = ['var(--acid)', 'var(--violet)', 'var(--hot)'];
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

export function StatusBadge({ a }: { a: Announcement }) {
  const { t } = useT();
  return (
    <span className={cn('ev-status', `ev-status-${a.status}`)}>
      {a.status === 'live' && <span className="ev-pulse" aria-hidden="true" />}
      {t(statusKey(a))}
    </span>
  );
}

/** Thẻ sự kiện / giải đấu (trang chủ, /su-kien). `featured`: thẻ to đầu dải trang chủ. */
export function EventCard({ a, featured = false }: { a: Announcement; featured?: boolean }) {
  const { t, locale } = useT();
  const now = useNow();
  const art = a.bannerUrl ?? a.game.thumbnailUrl;
  const people =
    a.capacity !== null && a.participants !== null
      ? t('ev.slots', { count: String(a.participants), cap: String(a.capacity) })
      : a.participants !== null
        ? t('ev.people', { count: String(a.participants) })
        : null;
  return (
    <Link href={a.href} className={cn('ev-card', featured && 'ev-card-featured')} data-testid="event-card">
      <div className="ev-art">
        {art ? <Image src={art} alt="" fill sizes="(max-width: 760px) 90vw, 33vw" unoptimized /> : <span className="ev-art-fallback" aria-hidden="true">{initials(a.game.title[locale])}</span>}
        <StatusBadge a={a} />
        <span className="ev-game">
          {a.game.iconUrl && <Image src={a.game.iconUrl} alt="" width={18} height={18} unoptimized />}
          {a.game.title[locale]}
        </span>
      </div>
      <div className="ev-body">
        <p className="ev-kind">{t(`ev.kind.${a.kind}` as MessageKey)}</p>
        <h3 className="ev-title">{a.title}</h3>
        <p className="ev-meta">
          <span><Clock size={14} strokeWidth={2.4} aria-hidden="true" />{timeLine(a, now, t, locale)}</span>
          {people && <span><Users size={14} strokeWidth={2.4} aria-hidden="true" />{people}</span>}
          {a.metaText && <span>{a.metaText}</span>}
        </p>
        {a.highlights.length > 0 ? (
          <ol className="ev-top" aria-label={t('ev.top')}>
            {a.highlights.slice(0, 3).map((h, i) => (
              <li key={`${h.name}-${i}`}>
                <span className="ev-rank">{i + 1}</span>
                {h.avatarUrl ? <Image className="ev-av" src={h.avatarUrl} alt="" width={26} height={26} unoptimized /> : <span className="ev-av" style={{ background: AVATAR_BG[i] }} aria-hidden="true">{initials(h.name)}</span>}
                <span className="ev-name">{h.name}</span>
                <span className="ev-val">{h.value}</span>
              </li>
            ))}
          </ol>
        ) : (
          a.summary && <p className="ev-summary">{a.summary}</p>
        )}
        <div className="ev-foot">
          {a.rewardText && <span className="ev-reward"><Trophy size={15} strokeWidth={2.4} aria-hidden="true" />{a.rewardText}</span>}
          <span className={cn('ev-cta', a.status === 'upcoming' || a.status === 'finished' || a.status === 'cancelled' ? 'ev-cta-ghost' : '')}>{t(ctaKey(a))}</span>
        </div>
      </div>
    </Link>
  );
}
