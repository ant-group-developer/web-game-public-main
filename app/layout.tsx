import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteNavigation } from '@/components/site-navigation';
import { SiteFooter } from '@/components/site-footer';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'ANT Play — Free Online Games', template: '%s | ANT Play' },
  description: 'Your next favorite game is waiting. Discover action, racing, puzzle and multiplayer games on ANT Play.',
  applicationName: 'ANT Play',
  icons: { icon: [{ url: '/brand/logo16.png', sizes: '16x16', type: 'image/png' }, { url: '/brand/logo32.png', sizes: '32x32', type: 'image/png' }, { url: '/brand/logo128.png', sizes: '128x128', type: 'image/png' }], apple: '/brand/logo128.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#83e4f3' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><a href="#main" className="skip-link">Skip to games</a><SiteNavigation /><main id="main">{children}</main><SiteFooter /></body></html>;
}
