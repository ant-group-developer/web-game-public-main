'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useT } from '@/hooks/use-locale';

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb hiển thị (JSON-LD BreadcrumbList do trang server render riêng). */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useT();
  return (
    <nav className="crumbs" aria-label={t('crumb.label')}>
      <ol>
        <li><Link href="/">{t('site.home')}</Link></li>
        {items.map((item, i) => (
          <li key={i}>
            <ChevronRight size={14} strokeWidth={2.4} aria-hidden="true" />
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
