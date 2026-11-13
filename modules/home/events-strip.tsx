'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EventCard } from '@/components/event-card';
import { useT } from '@/hooks/use-locale';
import type { Announcement } from '@/types/announcement';

/** Dải "Sự kiện" dưới banner trang chủ: tối đa 3 thẻ (thẻ đầu to hơn). Không có sự kiện → ẩn cả dải. */
export function EventsStrip({ items }: { items: Announcement[] }) {
  const { t } = useT();
  if (!items.length) return null;
  const live = items.filter((a) => a.status === 'live' || a.status === 'open').length;
  const shown = items.slice(0, 3);
  return (
    <section aria-labelledby="home-events" className="section" data-testid="home-events">
      <div className="section-head">
        <div>
          {live > 0 && <p className="eyebrow ev-eyebrow"><span className="eyebrow-dot" aria-hidden="true" />{t('ev.liveCount', { count: String(live) })}</p>}
          <h2 id="home-events" className="section-title section-title-md">{t('ev.title')}</h2>
        </div>
        <Link href="/su-kien" className="see-all">{t('ev.seeAll')}<ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" /></Link>
      </div>
      <div className={`ev-strip ev-strip-${shown.length}`}>
        {shown.map((a, i) => <EventCard key={a.id} a={a} featured={i === 0 && shown.length === 3} />)}
      </div>
    </section>
  );
}
