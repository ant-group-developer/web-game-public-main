import type { Metadata } from 'next';
import { getCategories } from '@/lib/api/games';
import { getSiteConfig } from '@/lib/api/site';
import { absoluteUrl } from '@/helpers/seo';
import { CategoriesIndex } from '@/modules/categories/categories-index';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = 'Tất cả danh mục game';
  const description = `Danh sách thể loại game trên ${site.general.siteName}: chọn danh mục để xem các game cùng loại, chơi miễn phí trên trình duyệt.`;
  return {
    title,
    description,
    alternates: { canonical: '/categories' },
    openGraph: { type: 'website', siteName: site.general.siteName, locale: 'vi_VN', title, description, url: '/categories' },
  };
}

export default async function CategoriesPage() {
  const categories = (await getCategories()).filter((c) => c.gameCount > 0);
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Tất cả danh mục game',
    url: absoluteUrl('/categories'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: categories.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/categories/${c.slug}`), name: c.text.vi.name })),
    },
  }).replace(/</g, '\\u003c');
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <CategoriesIndex categories={categories} />
    </>
  );
}
