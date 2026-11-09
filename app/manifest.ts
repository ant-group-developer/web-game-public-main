import type { MetadataRoute } from 'next';
import { getSiteConfig } from '@/lib/api/site';
import { pickText } from '@/types/site';

/** /manifest.webmanifest — tên, icon, màu theo cấu hình web trong admin. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { general, branding } = await getSiteConfig();
  const icon = branding.appleTouchIconUrl || branding.faviconUrl;
  return {
    name: `${general.siteName} — ${pickText(general.tagline, 'vi')}`,
    short_name: general.siteName,
    description: pickText(general.tagline, 'vi'),
    start_url: '/',
    display: 'standalone',
    background_color: branding.themeColor,
    theme_color: branding.themeColor,
    icons: [{ src: icon, sizes: 'any', purpose: 'any' }],
  };
}
