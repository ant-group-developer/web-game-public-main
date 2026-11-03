import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { games, getGame } from '@/constants/games';
import { GameDetail } from '@/modules/games/game-detail';
import { absoluteUrl } from '@/helpers/seo';

export const dynamicParams = false;
export function generateStaticParams() { return games.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const game = getGame((await params).slug);
  if (!game) return { title: 'Không tìm thấy game', robots: { index: false, follow: false } };
  // SEO giữ tiếng Việt (ngôn ngữ mặc định server render); chọn ngôn ngữ chỉ đổi giao diện phía trình duyệt.
  const { title: name, description } = game.text.vi;
  const title = `${name} — Chơi online miễn phí`;
  const image = game.ogImage ?? game.image;
  return {
    title, description,
    alternates: { canonical: '/games/' + game.slug },
    openGraph: { type: 'website', siteName: 'ANT Play', locale: 'vi_VN', title, description, url: '/games/' + game.slug, images: [{ url: image, alt: name }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const game = getGame((await params).slug);
  if (!game) notFound();
  const text = game.text.vi;
  const data = {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: text.title,
    url: absoluteUrl('/games/' + game.slug), image: absoluteUrl(game.ogImage ?? game.image),
    description: text.description, genre: text.tags, inLanguage: ['vi', 'en'],
    gamePlatform: 'Web browser', operatingSystem: 'Any', isAccessibleForFree: true,
    ...(game.author ? { author: { '@type': 'Organization', name: game.author } } : {}),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\u003c') }} /><GameDetail game={game} /></>;
}
