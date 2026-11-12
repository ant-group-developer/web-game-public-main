'use client';

import Image from 'next/image';
import { useT } from '@/hooks/use-locale';
import { analyticsEnabled, reopenConsent } from '@/lib/analytics';
import { pickText } from '@/types/site';
import { useSite } from './site-provider';

export function SiteFooter() {
  const { locale } = useT();
  const { siteName, logoUrl, footerText } = useSite();
  const extra = pickText(footerText, locale).trim();
  return (
    <footer className="site-footer">
      <span className="site-footer-brand">
        <Image src={logoUrl} width={18} height={18} alt="" unoptimized />
        {siteName}
      </span>
      <span>
        © {new Date().getFullYear()}
        {extra ? ` · ${extra}` : ''}
        {analyticsEnabled && <> · <button type="button" className="footer-link" onClick={reopenConsent}>Cookie</button></>}
      </span>
    </footer>
  );
}
