import type { Metadata } from 'next';
import { getAnnouncements } from '@/lib/api/announcements';
import { getCategories, getGames } from '@/lib/api/games';
import { getSiteConfig } from '@/lib/api/site';
import { absoluteUrl, siteUrl } from '@/helpers/seo';
import { HomeContent } from '@/modules/home/home-content';

// Tiêu đề / mô tả trang chủ = mặc định của layout (cấu hình "SEO trang chủ" trong admin).
// `?sort=` chỉ đổi thứ tự hiển thị phía client nên canonical luôn là "/".
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const [games, categories, site, events] = await Promise.all([
    getGames(),
    getCategories().catch(() => []),
    getSiteConfig(),
    getAnnouncements({ status: ['live', 'open', 'upcoming'], limit: 3 }),
  ]);
  const jsonLd = JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'WebSite', name: site.general.siteName, url: siteUrl, description: site.seo.homeDescription.vi, inLanguage: ['vi', 'en'] },
    { '@context': 'https://schema.org', '@type': 'Organization', name: site.general.siteName, url: siteUrl, logo: absoluteUrl(site.branding.logoUrl) },
  ]).replace(/</g, '\\u003c'); // nội dung từ CMS không thể đóng thẻ </script>
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <HomeContent games={games} categories={categories} events={events} />
    </>
  );
}
