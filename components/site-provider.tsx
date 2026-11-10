'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '@/constants/i18n';
import type { SiteConfig } from '@/types/site';

/** Danh mục hiện trên thanh chip dưới header. */
export interface NavCategory {
  slug: string;
  name: Record<Locale, string>;
  count: number;
}

/** Phần cấu hình web mà component phía client cần (header, footer, trang chủ). */
export type SiteBrand = Pick<SiteConfig['general'], 'siteName' | 'tagline' | 'footerText'> & { logoUrl: string; navCategories: NavCategory[] };

const SiteContext = createContext<SiteBrand | null>(null);

export function SiteProvider({ value, children }: { value: SiteBrand; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteBrand {
  const site = useContext(SiteContext);
  if (!site) throw new Error('useSite() must be used inside <SiteProvider>');
  return site;
}
