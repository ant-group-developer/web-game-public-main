'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/hooks/use-locale';
import { useSite } from './site-provider';

/** Hàng chip danh mục dưới header (trang chủ, trang danh mục). Trang game ẩn để khung chơi rộng hơn. */
export function CategoryNav() {
  const { locale, t } = useT();
  const { navCategories } = useSite();
  const pathname = usePathname();
  if (!navCategories.length || pathname.startsWith('/games/')) return null;
  const active = pathname.startsWith('/categories/') ? pathname.split('/')[2] : pathname === '/' ? '' : null;
  return (
    <nav className="cat-nav" aria-label={t('nav.label')}>
      <Link href="/" className="chip" aria-current={active === '' ? 'page' : undefined}>{t('nav.all')}</Link>
      {navCategories.map((c) => (
        <Link key={c.slug} href={`/categories/${c.slug}`} className="chip" aria-current={active === c.slug ? 'page' : undefined}>
          {c.name[locale]}
          <span className="chip-count">{c.count}</span>
        </Link>
      ))}
    </nav>
  );
}
