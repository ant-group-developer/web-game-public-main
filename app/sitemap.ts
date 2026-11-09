import type { MetadataRoute } from 'next';
import { getGames } from '@/lib/api/games';
import { absoluteUrl } from '@/helpers/seo';

// API lỗi lúc chạy: getGames ném lỗi → Next giữ sitemap đã cache gần nhất (ISR). Lúc build không có API: chỉ có trang chủ.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await getGames();
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
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
