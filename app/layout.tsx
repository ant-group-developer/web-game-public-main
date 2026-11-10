import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// Baloo 2 tự host qua npm (Fontsource): build không cần gọi Google Fonts.
import '@fontsource-variable/baloo-2';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SiteProvider } from '@/components/site-provider';
import { getSiteConfig } from '@/lib/api/site';
import { getNavCategories } from '@/lib/api/games';
import '@/styles/globals.css';
import { siteUrl } from '@/helpers/seo';

// Tên web, logo, favicon, màu và SEO mặc định đều lấy từ admin CMS (tag cache `site-config`).
export async function generateMetadata(): Promise<Metadata> {
  const { general, branding, seo } = await getSiteConfig();
  const name = general.siteName;
  const title = seo.homeTitle.vi;
  const description = seo.homeDescription.vi;
  const apple = branding.appleTouchIconUrl || branding.faviconUrl;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    ...(seo.keywords.length ? { keywords: seo.keywords } : {}),
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: { type: 'website', locale: 'vi_VN', siteName: name, title, description, images: [{ url: branding.ogImageUrl, width: 1200, height: 630, alt: name }] },
    twitter: { card: 'summary_large_image', title, description, images: [branding.ogImageUrl] },
    icons: { icon: [{ url: branding.faviconUrl }], shortcut: branding.faviconUrl, apple },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { branding } = await getSiteConfig();
  return { width: 'device-width', initialScale: 1, themeColor: branding.themeColor, viewportFit: 'cover' };
}

const ASSETS_ORIGIN = (() => {
  try {
    return process.env.ASSETS_ORIGIN ? new URL(process.env.ASSETS_ORIGIN).origin : '';
  } catch {
    return '';
  }
})();

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [{ general, branding }, categories] = await Promise.all([getSiteConfig(), getNavCategories()]);
  const navCategories = categories.map((c) => ({ slug: c.slug, name: { vi: c.text.vi.name, en: c.text.en.name }, count: c.gameCount }));
  return (
    <html lang="vi">
      {/* Ảnh game nằm trên Cloudflare R2 (ASSETS_ORIGIN, vd https://assets.zozo.bio): mở sẵn kết nối để ảnh tải nhanh hơn. */}
      {ASSETS_ORIGIN && <head><link rel="preconnect" href={ASSETS_ORIGIN} /></head>}
      <body>
        <SiteProvider value={{ siteName: general.siteName, tagline: general.tagline, footerText: general.footerText, logoUrl: branding.logoUrl, navCategories }}>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </SiteProvider>
      </body>
    </html>
  );
}
