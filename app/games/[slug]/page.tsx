import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { games, getGame } from '@/constants/games';
import { GameDetail } from '@/modules/games/game-detail';

export function generateStaticParams() { return games.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const game = getGame((await params).slug);
  return { title: game?.slug === 'city-bloxx' ? 'City Bloxx — Game xây thành phố online' : game?.title ?? 'Game not found', description: game?.description ?? (game ? `Discover ${game.title} on ANT Play. Save it to your favorites and explore more games.` : undefined) };
}
export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const game = getGame((await params).slug);
  if (!game) notFound();
  return <GameDetail game={game} />;
}
