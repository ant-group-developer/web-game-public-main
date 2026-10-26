import type { MetadataRoute } from 'next';
import { games } from '@/constants/games';
import { absoluteUrl } from '@/helpers/seo';
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 }, ...games.map((game) => ({ url: absoluteUrl('/games/' + game.slug), changeFrequency: 'monthly' as const, priority: game.slug === 'apple-worm' ? 0.9 : 0.7 }))];
}
