import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { games, getGame } from '@/constants/games';
import { GameDetail } from '@/modules/games/game-detail';
import { absoluteUrl } from '@/helpers/seo';

export function generateStaticParams() { return games.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const game = getGame((await params).slug);
  if (!game) return { title: 'Game not found', robots: { index: false, follow: false } };
  const title = game.slug === 'city-bloxx' ? 'City Bloxx — Game xây thành phố online' : game.slug === 'apple-worm' ? 'Apple Worm — Game sâu ăn táo online' : game.title;
  const description = game.description || ('Discover ' + game.title + ' on ANT Play. Save it to your favorites and explore more games.');
  const image = game.slug === 'apple-worm' ? '/seo/apple-worm-og.jpg' : game.image;
  return {
    title, description,
    alternates: { canonical: '/games/' + game.slug },
    openGraph: { type: 'website', siteName: 'ANT Play', locale: game.language === 'vi' ? 'vi_VN' : 'en_US', title, description, url: '/games/' + game.slug, images: [{ url: image, alt: game.title, ...(game.slug === 'apple-worm' ? { width: 1200, height: 630 } : {}) }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const game = getGame((await params).slug);
  if (!game) notFound();
  const data = {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: game.title,
    url: absoluteUrl('/games/' + game.slug), image: absoluteUrl(game.slug === 'apple-worm' ? '/seo/apple-worm-og.jpg' : game.image),
    description: game.description || ('Play ' + game.title + ' on ANT Play.'), genre: game.categories,
    gamePlatform: 'Web browser', operatingSystem: 'Any',
    ...(game.slug === 'apple-worm' ? { author: { '@type': 'Organization', name: 'Gibton' }, playMode: 'SinglePlayer', isAccessibleForFree: true } : {}),
    ...(game.embedUrl ? { potentialAction: { '@type': 'PlayAction', target: new URL(game.embedUrl, absoluteUrl('/')).href } } : {}),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\u003c') }} /><GameDetail game={game} /></>;
}
