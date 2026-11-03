'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/hooks/use-locale';
import { LanguageSwitcher } from './language-switcher';

/** Header tối giản: logo + chọn ngôn ngữ (theo pattern Poki / Lagged — không đặt danh sách game ở đây). */
export function SiteHeader() {
  const { t } = useT();
  return (
    <header className="site-header">
      <a href="#main" className="skip-link">{t('site.skip')}</a>
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label={t('site.home')}>
          <Image src="/brand/logo64.png" alt="" width={38} height={38} priority />
          <span>ANT <b>Play</b></span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
