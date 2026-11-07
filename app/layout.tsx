import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// Baloo 2 tự host qua npm (Fontsource): build không cần gọi Google Fonts.
import '@fontsource-variable/baloo-2';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import '@/styles/globals.css';
import { siteUrl, siteDescription } from '@/helpers/seo';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: { type: 'website', locale: 'vi_VN', siteName: 'ANT Play', title: 'ANT Play — Chơi game online miễn phí', description: siteDescription, images: [{ url: '/seo/ant-play-og.jpg', width: 1200, height: 630, alt: 'ANT Play' }] },
  twitter: { card: 'summary_large_image', title: 'ANT Play — Chơi game online miễn phí', description: siteDescription, images: ['/seo/ant-play-og.jpg'] },
  title: { default: 'ANT Play — Chơi game online miễn phí', template: '%s | ANT Play' },
  description: siteDescription,
  applicationName: 'ANT Play',
  icons: { icon: [{ url: '/brand/logo16.png', sizes: '16x16', type: 'image/png' }, { url: '/brand/logo32.png', sizes: '32x32', type: 'image/png' }, { url: '/brand/logo128.png', sizes: '128x128', type: 'image/png' }], apple: '/brand/logo128.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#111219', viewportFit: 'cover' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
