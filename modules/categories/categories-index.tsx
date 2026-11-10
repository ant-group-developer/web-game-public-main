'use client';

import type { Category } from '@/types/category';
import { Breadcrumb } from '@/components/breadcrumb';
import { CategoryTile } from '@/components/category-tile';
import { useT } from '@/hooks/use-locale';

export function CategoriesIndex({ categories }: { categories: Category[] }) {
  const { t } = useT();
  return (
    <div className="page">
      <Breadcrumb items={[{ label: t('cat.allTitle') }]} />
      <h1 className="section-title">{t('cat.allTitle')}</h1>
      <p className="lead">{t('cat.allIntro')}</p>
      <div className="cat-grid cat-grid-lg">
        {categories.map((c, i) => <CategoryTile key={c.slug} category={c} priority={i < 6} />)}
      </div>
    </div>
  );
}
