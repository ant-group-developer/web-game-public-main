import { getSiteConfig } from '@/lib/api/site';
import { siteUrl } from '@/helpers/seo';

/**
 * Trình duyệt/bot luôn xin /favicon.ico dù trang đã khai báo <link rel="icon">.
 * Chuyển hướng tới favicon cấu hình trong admin (getSiteConfig được cache theo tag `site-config`).
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const { branding } = await getSiteConfig();
  const target = new URL(branding.faviconUrl, siteUrl);
  return new Response(null, {
    status: 307,
    headers: { location: target.toString(), 'cache-control': 'public, max-age=300' },
  });
}
