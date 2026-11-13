import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getGameBySlug, getGames, resolveRedirect } from '@/lib/api/games';
import { getSiteConfig } from '@/lib/api/site';
import type { SiteConfig } from '@/types/site';
import { GameDetail } from '@/modules/games/game-detail';
import { getAnnouncements } from '@/lib/api/announcements';
import { absoluteUrl } from '@/helpers/seo';
import { relatedGames } from '@/helpers/games';
import type { Game } from '@/types/game';

// Game mới tạo trong admin có trang ngay, không cần build lại.
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getGames()).map(({ slug }) => ({ slug }));
  } catch {
    return []; // API chưa chạy lúc build: trang game được tạo khi có request đầu tiên.
  }
}

/** SEO của game theo tiếng Việt (ngôn ngữ server render). Trường để trống trong CMS thì suy ra từ nội dung game. */
function resolveSeo(game: Game, site: SiteConfig) {
  const text = game.text.vi;
  const seo = game.seo.vi;
  const title = seo.title?.trim() || `${text.title}${site.seo.gameTitleSuffix.vi}`;
  const description = seo.description?.trim() || text.description;
  return {
    name: text.title,
    title,
    description,
    keywords: seo.keywords.filter(Boolean),
    canonical: seo.canonicalUrl?.trim() || `/games/${game.slug}`,
    robots: { index: seo.robotsIndex, follow: seo.robotsFollow },
    ogTitle: seo.ogTitle?.trim() || title,
    ogDescription: seo.ogDescription?.trim() || description,
    image: seo.ogImageUrl?.trim() || game.ogImage || game.cover,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [game, site] = await Promise.all([getGameBySlug((await params).slug), getSiteConfig()]);
  if (!game) return { title: 'Không tìm thấy game', robots: { index: false, follow: false } };
  const seo = resolveSeo(game, site);
  return {
    title: seo.title,
    description: seo.description,
    ...(seo.keywords.length ? { keywords: seo.keywords } : {}),
    alternates: { canonical: seo.canonical },
    robots: { ...seo.robots, googleBot: { ...seo.robots, 'max-image-preview': 'large' } },
    openGraph: { type: 'website', siteName: site.general.siteName, locale: 'vi_VN', title: seo.ogTitle, description: seo.ogDescription, url: '/games/' + game.slug, images: [{ url: seo.image, alt: seo.name }] },
    twitter: { card: 'summary_large_image', title: seo.ogTitle, description: seo.ogDescription, images: [seo.image] },
  };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [game, games, site, events] = await Promise.all([
    getGameBySlug(slug),
    getGames(),
    getSiteConfig(),
    getAnnouncements({ status: ['live', 'open'], game: slug, limit: 5 }),
  ]);
  if (!game) {
    // Slug cũ (đã đổi trong admin) → 301 sang slug mới để giữ link và SEO.
    const target = await resolveRedirect('game', slug);
    if (target) permanentRedirect(`/games/${target}`);
    notFound();
  }
  const seo = resolveSeo(game, site);
  const url = absoluteUrl('/games/' + game.slug);
  const primary = game.categories.find((c) => c.isPrimary) ?? game.categories[0];
  const faq = game.text.vi.faq;
  const data = [
    {
      '@context': 'https://schema.org', '@type': 'VideoGame', name: seo.name,
      url, image: absoluteUrl(seo.image),
      ...(game.screenshots.length ? { screenshot: game.screenshots.map((src) => absoluteUrl(src)) } : {}),
      description: seo.description,
      genre: game.categories.length ? game.categories.map((c) => c.name.vi) : game.text.vi.tags,
      inLanguage: ['vi', 'en'],
      gamePlatform: 'Web browser', operatingSystem: 'Any', isAccessibleForFree: true,
      ...(game.releasedAt ? { datePublished: game.releasedAt } : {}),
      ...(game.updatedAt ? { dateModified: game.updatedAt } : {}),
      ...(game.author ? { author: { '@type': 'Organization', name: game.author } } : {}),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: absoluteUrl('/') },
        ...(primary ? [{ '@type': 'ListItem', position: 2, name: primary.name.vi, item: absoluteUrl(`/categories/${primary.slug}`) }] : []),
        { '@type': 'ListItem', position: primary ? 3 : 2, name: seo.name, item: url },
      ],
    },
    ...(faq.length
      ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }]
      : []),
  ];
  // Escape "<" để nội dung từ CMS không thể đóng thẻ </script>.
  const jsonLd = JSON.stringify(data).replace(/</g, '\\u003c');
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /><GameDetail game={game} related={relatedGames(game, games)} events={events} /></>;
}
