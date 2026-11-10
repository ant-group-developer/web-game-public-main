import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getCategories, getCategory, getCategoryGames, resolveRedirect } from '@/lib/api/games';
import { getSiteConfig } from '@/lib/api/site';
import { absoluteUrl } from '@/helpers/seo';
import type { CategoryDetail } from '@/types/category';
import type { SiteConfig } from '@/types/site';
import { CategoryContent } from '@/modules/categories/category-content';

// Danh mục mới tạo trong admin có trang ngay, không cần build lại.
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getCategories()).map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

/** SEO theo tiếng Việt (ngôn ngữ server render). Trường trống trong CMS thì suy ra từ tên + giới thiệu. */
function resolveSeo(category: CategoryDetail, site: SiteConfig) {
  const text = category.text.vi;
  const seo = category.seo.vi;
  const title = seo.title?.trim() || `Game ${text.name} — Chơi online miễn phí`;
  const description = seo.description?.trim() || text.intro || `Tổng hợp game ${text.name} chơi miễn phí trên ${site.general.siteName}.`;
  return {
    name: text.name,
    title,
    description,
    keywords: seo.keywords.filter(Boolean),
    canonical: seo.canonicalUrl?.trim() || `/categories/${category.slug}`,
    robots: { index: seo.robotsIndex, follow: seo.robotsFollow },
    ogTitle: seo.ogTitle?.trim() || title,
    ogDescription: seo.ogDescription?.trim() || description,
    image: seo.ogImageUrl?.trim() || category.ogImage || category.banner || category.thumbnail,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [category, site] = await Promise.all([getCategory((await params).slug), getSiteConfig()]);
  if (!category) return { title: 'Không tìm thấy danh mục', robots: { index: false, follow: false } };
  const seo = resolveSeo(category, site);
  return {
    title: { absolute: `${seo.title} | ${site.general.siteName}` },
    description: seo.description,
    ...(seo.keywords.length ? { keywords: seo.keywords } : {}),
    alternates: { canonical: seo.canonical },
    robots: { ...seo.robots, googleBot: { ...seo.robots, 'max-image-preview': 'large' } },
    openGraph: { type: 'website', siteName: site.general.siteName, locale: 'vi_VN', title: seo.ogTitle, description: seo.ogDescription, url: `/categories/${category.slug}`, images: [{ url: seo.image, alt: seo.name }] },
    twitter: { card: 'summary_large_image', title: seo.ogTitle, description: seo.ogDescription, images: [seo.image] },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, games, all, site] = await Promise.all([getCategory(slug), getCategoryGames(slug), getCategories(), getSiteConfig()]);
  if (!category) {
    const target = await resolveRedirect('category', slug);
    if (target) permanentRedirect(`/categories/${target}`);
    notFound();
  }
  const seo = resolveSeo(category, site);
  const url = absoluteUrl(`/categories/${category.slug}`);
  const faq = category.text.vi.faq;
  const jsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: seo.title, description: seo.description, url,
      image: absoluteUrl(seo.image),
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: games.length,
        itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/games/${g.slug}`), name: g.text.vi.title })),
      },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Danh mục', item: absoluteUrl('/categories') },
        { '@type': 'ListItem', position: 3, name: seo.name, item: url },
      ],
    },
    ...(faq.length
      ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }]
      : []),
  ]).replace(/</g, '\\u003c'); // nội dung từ CMS không thể đóng thẻ </script>
  const others = all.filter((c) => c.slug !== category.slug && c.gameCount > 0);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <CategoryContent category={category} games={games} others={others} />
    </>
  );
}
