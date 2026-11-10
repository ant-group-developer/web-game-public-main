'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/hooks/use-locale';
import { CategoryNav } from './category-nav';
import { LanguageSwitcher } from './language-switcher';
import { SearchBox } from './search-box';
import { useSite } from './site-provider';

/** Tên web nhiều chữ thì tô màu chữ cuối (giữ kiểu "ANT <b>Play</b>" cũ). */
function BrandName({ name }: { name: string }) {
  const i = name.lastIndexOf(' ');
  if (i <= 0) return <span>{name}</span>;
  return (
    <span>
      {name.slice(0, i)} <b>{name.slice(i + 1)}</b>
    </span>
  );
}

/** Header: logo trái, ô tìm game giữa, chọn ngôn ngữ phải; hàng chip danh mục bên dưới. */
export function SiteHeader() {
  const { t } = useT();
  const { siteName, logoUrl } = useSite();
  return (
    <header className="site-header">
      <a href="#main" className="skip-link">{t('site.skip')}</a>
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label={`${siteName} — ${t('site.home')}`}>
          <Image src={logoUrl} alt="" width={36} height={36} priority unoptimized />
          <BrandName name={siteName} />
        </Link>
        <SearchBox />
        <LanguageSwitcher />
      </div>
      <CategoryNav />
    </header>
  );
}
