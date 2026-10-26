import catalog from './games.json';
import type { Game } from '@/types/game';
import { cityBloxx } from './city-bloxx';
import { appleWormDetails } from './apple-worm';

// Add an authorized embedUrl here when connecting your own game catalog/API.
export const games: Game[] = [cityBloxx, ...catalog.map((game) => ({ ...game, ...(game.slug === 'apple-worm' ? appleWormDetails : {}), featured: game.featured === 0 ? -1 : game.featured }))];
export const popularSlugs = ['subway-surfers', 'master-chess', 'aquaparkio', 'scary-teacher-3d', 'minefun-io', 'paperio-2', 'drift-boss', 'retro-bowl', 'stickman-hook', 'monkey-mart', 'blocky-blast-puzzle', 'level-devil'];
export const popularGames = [cityBloxx, ...popularSlugs.flatMap((slug) => games.find((game) => game.slug === slug) ?? [])];
export const getGame = (slug: string) => games.find((game) => game.slug === slug);
