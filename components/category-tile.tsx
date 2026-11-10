'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/types/category';
import { useT } from '@/hooks/use-locale';

/** Thẻ danh mục: ảnh mờ làm nền, tên + số game ở góc dưới. */
export function CategoryTile({ category, priority = false }: { category: Pick<Category, 'slug' | 'thumbnail' | 'gameCount' | 'text'>; priority?: boolean }) {
  const { locale, t } = useT();
  return (
    <Link href={`/categories/${category.slug}`} className="cat-tile">
      <Image src={category.thumbnail} alt="" fill sizes="(max-width: 640px) 50vw, 280px" priority={priority} unoptimized />
      <span className="cat-tile-text">
        <strong>{category.text[locale].name}</strong>
        <span>{t('cat.count', { count: String(category.gameCount) })}</span>
      </span>
    </Link>
  );
}
