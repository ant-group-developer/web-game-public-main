'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { ctaKey, StatusBadge, timeLine, useNow } from '@/components/event-card';
import { useT } from '@/hooks/use-locale';
import type { Announcement } from '@/types/announcement';

const HIDE_MS = 24 * 3600_000;
const keyOf = (slug: string) => `ev-bar-hidden:${slug}`;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
function hiddenUntil(slug: string): number {
  try {
    return Number(localStorage.getItem(keyOf(slug))) || 0;
  } catch {
    return 0;
  }
}

/**
 * Thanh sự kiện ngay trên khung chơi: tối đa 2 dòng (đang diễn ra / mở đăng ký trước), nhiều hơn thì "+N sự kiện khác".
 * Bấm "Xem" → `?p=` để iframe mở thẳng trang sự kiện trong game. ✕ ẩn 24 giờ cho game này.
 */
export function GameEventBar({ slug, items }: { slug: string; items: Announcement[] }) {
  const { t, locale } = useT();
  const now = useNow();
  const hidden = useSyncExternalStore(subscribe, () => hiddenUntil(slug) > Date.now(), () => false);
  if (!items.length || hidden) return null;
  const rows = items.slice(0, 2);
  const more = items.length - rows.length;
  const hide = () => {
    try {
      localStorage.setItem(keyOf(slug), String(Date.now() + HIDE_MS));
    } catch {
      /* storage bị chặn: ẩn trong phiên này cũng không được — bỏ qua */
    }
    listeners.forEach((l) => l());
  };
  return (
    <div className="ev-bar" role="region" aria-label={t('ev.bar')} data-testid="game-event-bar">
      {rows.map((a, i) => (
        <div key={a.id} className="ev-bar-row">
          <StatusBadge a={a} />
          <strong className="ev-bar-title">{a.title}</strong>
          <span className="ev-bar-meta">{timeLine(a, now, t, locale)}{a.metaText ? ` · ${a.metaText}` : ''}</span>
          <span className="ev-bar-actions">
            <Link href={`/games/${slug}?p=${encodeURIComponent(a.path)}`} scroll={false} className={a.status === 'live' && i === 0 ? 'action action-primary' : 'action'}>{t(ctaKey(a))}</Link>
            {i === 0 && (
              <button type="button" className="ev-bar-x" onClick={hide} aria-label={t('ev.barHide')}><X size={16} strokeWidth={2.4} /></button>
            )}
          </span>
        </div>
      ))}
      {more > 0 && (
        <Link href="/su-kien" className="ev-bar-more">{t('ev.barMore', { count: String(more) })}</Link>
      )}
    </div>
  );
}
