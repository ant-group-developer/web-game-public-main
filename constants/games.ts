import catalog from './games.json';
import type { Game } from '@/types/game';
import { cityBloxx } from './city-bloxx';
import { appleWorm } from './apple-worm';

// Our playable games lead the catalog and occupy separate featured tiles.
export const games: Game[] = [cityBloxx, appleWorm, ...catalog.filter((game) => game.slug !== appleWorm.slug).map((game) => ({
  ...game,
  featured: game.featured === 0 ? -1 : game.featured === 1 ? 24 : game.featured,
}))];
export const popularSlugs = ['subway-surfers', 'master-chess', 'aquaparkio', 'scary-teacher-3d', 'minefun-io', 'paperio-2', 'drift-boss', 'retro-bowl', 'stickman-hook', 'monkey-mart', 'blocky-blast-puzzle', 'level-devil'];
export const popularGames = [cityBloxx, appleWorm, ...popularSlugs.flatMap((slug) => games.find((game) => game.slug === slug) ?? [])];
export const getGame = (slug: string) => games.find((game) => game.slug === slug);