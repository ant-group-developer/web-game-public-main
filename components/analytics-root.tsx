'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useT } from '@/hooks/use-locale';
import { setAnalyticsPlayer, setConsent, startAnalytics, trackPageView, useConsentPending } from '@/lib/analytics';
import { useZozo } from '@/lib/zozo/session';

/** Gắn một lần trong layout: khởi động GA4 (nếu có mã), user_id theo phiên ZOZO ID, page_view mỗi lần đổi trang, banner cookie. */
export function AnalyticsRoot() {
  const pathname = usePathname();
  const { player, ready } = useZozo();

  useEffect(() => { startAnalytics(); }, []);
  useEffect(() => { setAnalyticsPlayer(player, ready); }, [player, ready]);
  // Chờ một nhịp để document.title là tiêu đề của trang mới.
  useEffect(() => {
    const timer = setTimeout(trackPageView, 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return <ConsentBanner />;
}

function ConsentBanner() {
  const { t } = useT();
  const pending = useConsentPending();
  if (!pending) return null;
  return (
    <div className="consent" role="region" aria-label={t('consent.label')}>
      <span>{t('consent.text')}</span>
      <button type="button" className="choice-secondary" onClick={() => setConsent('denied')}>{t('consent.decline')}</button>
      <button type="button" className="play-button play-button-sm" onClick={() => setConsent('granted')}>{t('consent.accept')}</button>
    </div>
  );
}
