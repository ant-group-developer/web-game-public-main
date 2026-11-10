import type { Locale, MessageKey } from '@/constants/i18n';
import type { Game, GameSort } from '@/types/game';
import { GAME_SORTS } from '@/types/game';

/** Chỉ hiện số lượt chơi công khai khi đủ lớn; ít hơn thì hiện tên danh mục (số liệu mới bắt đầu đếm). */
export const PUBLIC_PLAYS_MIN = 1000;

export const isGameSort = (value: unknown): value is GameSort => GAME_SORTS.includes(value as GameSort);

/** 12400 → "12,4K" (vi) / "12.4K" (en). */
export function formatCount(n: number, locale: Locale) {
  const tag = locale === 'vi' ? 'vi-VN' : 'en-US';
  if (n < 1000) return n.toLocaleString(tag);
  const units: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  const [size, unit] = units.find(([u]) => n >= u)!;
  return (n / size).toLocaleString(tag, { maximumFractionDigits: n / size < 100 ? 1 : 0 }) + unit;
}

/** "2025-04-03" → "03/04/2025" (vi) / "Apr 3, 2025" (en). */
export function formatDate(day: string | null, locale: Locale) {
  if (!day) return '';
  const date = new Date(`${day.slice(0, 10)}T00:00:00`);
  return locale === 'vi'
    ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

type T = (key: MessageKey, values?: Record<string, string>) => string;

export function timeAgo(iso: string | number, t: T, now = Date.now()) {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return t('time.today');
  if (days < 7) return t('time.daysAgo', { count: String(days) });
  if (days < 30) return t('time.weeksAgo', { count: String(Math.floor(days / 7)) });
  if (days < 365) return t('time.monthsAgo', { count: String(Math.floor(days / 30)) });
  return t('time.yearsAgo', { count: String(Math.floor(days / 365)) });
}

const collators: Partial<Record<Locale, Intl.Collator>> = {};
const collator = (locale: Locale) => (collators[locale] ??= new Intl.Collator(locale, { sensitivity: 'base', numeric: true }));
const released = (g: Game) => g.releasedAt ?? g.publishedAt?.slice(0, 10) ?? '';

/**
 * Sắp xếp phía client (danh sách đã tải sẵn). `manual` = giữ thứ tự API trả về (admin xếp).
 * Giống thuật toán của API để server render và client khớp nhau.
 */
export function sortGames(games: Game[], sort: GameSort, locale: Locale) {
  const order = new Map(games.map((g, i) => [g.slug, i]));
  const manual = (a: Game, b: Game) => order.get(a.slug)! - order.get(b.slug)!;
  const compare: Record<GameSort, (a: Game, b: Game) => number> = {
    manual,
    popular: (a, b) => b.plays.last30d - a.plays.last30d || b.plays.total - a.plays.total || manual(a, b),
    plays: (a, b) => b.plays.total - a.plays.total || manual(a, b),
    newest: (a, b) => released(b).localeCompare(released(a)) || manual(a, b),
    name: (a, b) => collator(locale).compare(a.text[locale].title, b.text[locale].title),
  };
  return [...games].sort(compare[sort]);
}

/** Dòng phụ dưới tên game trên thẻ, đổi theo kiểu sắp xếp đang chọn. */
export function gameMeta(game: Game, sort: GameSort, locale: Locale, t: T) {
  const category = game.categories[0]?.name[locale];
  if (sort === 'newest' && game.releasedAt) return t('meta.released', { date: formatDate(game.releasedAt, locale) });
  if (sort === 'plays' && game.plays.total >= PUBLIC_PLAYS_MIN) return t('meta.plays', { count: formatCount(game.plays.total, locale) });
  if ((sort === 'popular' || sort === 'manual') && game.plays.last30d >= PUBLIC_PLAYS_MIN) {
    return t('meta.plays30', { count: formatCount(game.plays.last30d, locale) });
  }
  return category ?? game.text[locale].tags.join(' · ');
}

/** Game liên quan: cùng danh mục chính trước, sau đó cùng danh mục bất kỳ, rồi các game khác; trong mỗi nhóm xếp theo lượt chơi. */
export function relatedGames(game: Game, all: Game[], limit = 8) {
  const primary = game.categories.find((c) => c.isPrimary)?.slug;
  const mine = new Set(game.categories.map((c) => c.slug));
  const score = (g: Game) => (primary && g.categories.some((c) => c.slug === primary) ? 2 : g.categories.some((c) => mine.has(c.slug)) ? 1 : 0);
  return all
    .filter((g) => g.slug !== game.slug)
    .map((g, i) => ({ g, i, s: score(g) }))
    .sort((a, b) => b.s - a.s || b.g.plays.last30d - a.g.plays.last30d || a.i - b.i)
    .slice(0, limit)
    .map(({ g }) => g);
}
