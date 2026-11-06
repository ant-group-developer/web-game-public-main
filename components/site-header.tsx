'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/hooks/use-locale';
import { LanguageSwitcher } from './language-switcher';
import { SearchBox } from './search-box';

/** Header: logo trái, ô tìm game giữa, chọn ngôn ngữ phải. Mọi control cao bằng nhau và căn giữa theo trục dọc. */
export function SiteHeader() {
  const { t } = useT();
  return (
    <header className="site-header">
      <a href="#main" className="skip-link">{t('site.skip')}</a>
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label={t('site.home')}>
          <Image src="/brand/logo64.png" alt="" width={36} height={36} priority />
          <span>ANT <b>Play</b></span>
        </Link>
        <SearchBox />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
