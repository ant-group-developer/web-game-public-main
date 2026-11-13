'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { EventCard, timeLine, useNow } from '@/components/event-card';
import { useT } from '@/hooks/use-locale';
import type { Announcement } from '@/types/announcement';

type Tab = 'live' | 'upcoming' | 'finished';

/** Trang /su-kien: tab trạng thái + lọc theo game, lưới thẻ; tab "Đã kết thúc" có vô địch / bục. */
export function EventsIndex({ active, finished }: { active: Announcement[]; finished: Announcement[] }) {
  const { t, locale } = useT();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('live');
  const [game, setGame] = useState<string>('');
  const lists: Record<Tab, Announcement[]> = useMemo(
    () => ({
      live: active.filter((a) => a.status === 'live' || a.status === 'open'),
      upcoming: active.filter((a) => a.status === 'upcoming'),
      finished,
    }),
    [active, finished],
  );
  const games = useMemo(() => {
    const m = new Map<string, Announcement['game']>();
    for (const a of [...active, ...finished]) m.set(a.game.slug, a.game);
    return [...m.values()];
  }, [active, finished]);
  const shown = lists[tab].filter((a) => !game || a.game.slug === game);
  const tabs: Array<[Tab, string]> = [
    ['live', t('ev.tabLive')],
    ['upcoming', t('ev.tabUpcoming')],
    ['finished', t('ev.tabFinished')],
  ];

  return (
    <div className="page" data-testid="events-page">
      <Breadcrumb items={[{ label: t('ev.title') }]} />
      <h1 className="section-title">{t('ev.title')}</h1>
      <p className="lead">{t('ev.lead')}</p>
      <div className="section-head section-head-wrap ev-controls">
        <div className="sort-bar" role="group" aria-label={t('ev.tabs')}>
          {tabs.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} data-testid={`ev-tab-${k}`}>
              {label} <span className="chip-count">{lists[k].length}</span>
            </button>
          ))}
        </div>
        {games.length > 1 && (
          <div className="ev-games" role="group" aria-label={t('ev.filterGame')}>
            <button type="button" className="chip" aria-pressed={!game} onClick={() => setGame('')}>{t('ev.allGames')}</button>
            {games.map((g) => (
              <button key={g.slug} type="button" className="chip" aria-pressed={game === g.slug} onClick={() => setGame(g.slug)}>{g.title[locale]}</button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="empty">{t('ev.empty')}</p>
      ) : tab === 'finished' ? (
        <div className="ev-done-grid">
          {shown.map((a) => (
            <Link key={a.id} href={a.href} className="ev-done" data-testid="event-card">
              <span className="ev-podium" aria-hidden="true"><i>2</i><i>1</i><i>3</i></span>
              <span className="ev-done-text">
                <span className="ev-kind">{t(a.kind === 'tournament' ? 'ev.kind.tournament' : 'ev.kind.event')} · {a.game.title[locale]}</span>
                <strong>{a.title}</strong>
                {a.highlights[0] && <span className="ev-done-champ">{t('ev.champion', { name: a.highlights[0].name })} · <b>{a.highlights[0].value}</b></span>}
                <span className="ev-done-when">{a.status === 'cancelled' ? t('ev.st.cancelled') : timeLine(a, now, t, locale)}</span>
              </span>
              <span className="see-all ev-done-more">{t('ev.cta.results')}<ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="ev-grid">
          {shown.map((a) => <EventCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
