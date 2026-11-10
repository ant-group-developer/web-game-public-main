'use client';

import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import type { Category, CategoryDetail } from '@/types/category';
import type { Game, GameSort } from '@/types/game';
import { Breadcrumb } from '@/components/breadcrumb';
import { CategoryTile } from '@/components/category-tile';
import { GameCard } from '@/components/game-card';
import { SortBar } from '@/components/sort-bar';
import { useT } from '@/hooks/use-locale';
import { useSort } from '@/hooks/use-sort';
import { formatCount, gameMeta, PUBLIC_PLAYS_MIN, sortGames } from '@/helpers/games';

const CATEGORY_SORTS: readonly GameSort[] = ['manual', 'popular', 'newest', 'plays', 'name'];

/** Đoạn văn trong bài viết SEO: xuống 2 dòng = đoạn mới. */
const paragraphs = (body: string) => body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export function CategoryContent({ category, games, others }: { category: CategoryDetail; games: Game[]; others: Category[] }) {
  const { locale, t } = useT();
  const text = category.text[locale];
  const [sort, setSort] = useSort(category.defaultSort);
  const list = sortGames(games, sort, locale);
  const plays30 = games.reduce((sum, g) => sum + g.plays.last30d, 0);
  const hasArticle = text.content.length > 0;
  return (
    <div className="page">
      <Breadcrumb items={[{ label: t('home.categories'), href: '/categories' }, { label: text.name }]} />

      <section className="cat-hero">
        <Image src={category.banner} alt="" fill sizes="(max-width: 640px) 100vw, 60vw" priority unoptimized className="cat-hero-art" />
        <div className="cat-hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />{t('cat.eyebrow')}</p>
          <h1>{text.name}</h1>
          {text.intro && <p className="cat-hero-intro">{text.intro}</p>}
          <div className="cat-hero-stats">
            <span>{t('cat.count', { count: String(games.length) })}</span>
            {plays30 >= PUBLIC_PLAYS_MIN && <span>{t('meta.plays30', { count: formatCount(plays30, locale) })}</span>}
          </div>
        </div>
      </section>

      <section aria-labelledby="cat-games" className="section section-tight">
        <div className="section-head section-head-wrap">
          <h2 id="cat-games" className="section-title section-title-md">{t('cat.games', { name: text.name })}</h2>
          {games.length > 1 && <SortBar value={sort} options={CATEGORY_SORTS} onChange={setSort} />}
        </div>
        <div className="game-grid">
          {list.map((game, i) => <GameCard key={game.slug} game={game} meta={gameMeta(game, sort, locale, t)} priority={i < 4} />)}
          {list.length === 0 && <p className="empty">{t('cat.empty')}</p>}
        </div>
      </section>

      {(hasArticle || text.faq.length > 0) && (
        <section className="section cat-seo">
          {hasArticle && (
            <article className="cat-article">
              {text.content.map((block, i) => (
                <div key={i}>
                  {block.heading && (i === 0 ? <h2>{block.heading}</h2> : <h3>{block.heading}</h3>)}
                  {paragraphs(block.body).map((p, j) => <p key={j}>{p}</p>)}
                </div>
              ))}
            </article>
          )}
          {text.faq.length > 0 && (
            <div className="faq">
              <h2 className="section-title section-title-sm">{t('cat.faq')}</h2>
              {text.faq.map((item, i) => (
                <details key={i} open={i === 0}>
                  <summary><span>{item.q}</span><ChevronDown size={18} strokeWidth={2.4} aria-hidden="true" /></summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          )}
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="other-cats" className="section">
          <h2 id="other-cats" className="section-title section-title-sm">{t('cat.others')}</h2>
          <div className="cat-grid">
            {others.map((c) => <CategoryTile key={c.slug} category={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
