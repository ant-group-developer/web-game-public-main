import type { Metadata } from 'next';
import { getGames } from '@/lib/api/games';
import { HomeContent } from '@/modules/home/home-content';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  return <HomeContent games={await getGames()} />;
}
