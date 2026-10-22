import { GameCatalog } from '@/modules/home/game-catalog';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  return <GameCatalog category={category} />;
}
