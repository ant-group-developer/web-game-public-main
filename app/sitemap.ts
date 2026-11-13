import type { MetadataRoute } from 'next';
import { getCategories, getGames } from '@/lib/api/games';
import { absoluteUrl } from '@/helpers/seo';

// API lỗi lúc chạy: getGames ném lỗi → Next giữ sitemap đã cache gần nhất (ISR). Lúc build không có API: chỉ có trang chủ.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [games, categories] = await Promise.all([getGames(), getCategories()]);
  const listed = categories.filter((c) => c.gameCount > 0);
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/su-kien'), changeFrequency: 'daily', priority: 0.6 },
    ...(listed.length ? [{ url: absoluteUrl('/categories'), changeFrequency: 'weekly' as const, priority: 0.7 }] : []),
    ...listed.map((c) => ({
      url: absoluteUrl('/categories/' + c.slug),
      ...(c.updatedAt ? { lastModified: new Date(c.updatedAt) } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...games
      .filter((game) => game.seo.vi.robotsIndex)
      .map((game) => ({
        url: absoluteUrl('/games/' + game.slug),
        ...(game.updatedAt ? { lastModified: new Date(game.updatedAt) } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      })),
  ];
}
