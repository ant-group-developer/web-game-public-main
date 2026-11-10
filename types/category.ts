import type { Locale } from '@/constants/i18n';
import type { FaqItem, GameSeo, GameSort } from './game';

/** Danh mục game do admin CMS quản lý (`GET /api/v1/public/categories`). */
export interface Category {
  slug: string;
  /** Ảnh vuông cho chip / thanh danh mục. */
  icon: string;
  /** Ảnh 16:9 cho thẻ danh mục. */
  thumbnail: string;
  /** Ảnh đầu trang danh mục (API đã thay bằng thumbnail nếu trống). */
  banner: string;
  ogImage: string | null;
  showInNav: boolean;
  defaultSort: GameSort;
  /** Số game đã publish trong danh mục. */
  gameCount: number;
  updatedAt: string;
  text: Record<Locale, { name: string; intro: string }>;
}

export interface CategoryContentBlock {
  heading: string;
  body: string;
}

/** `GET /api/v1/public/categories/:slug` — thêm bài viết SEO, FAQ và SEO riêng. */
export interface CategoryDetail extends Omit<Category, 'text'> {
  text: Record<Locale, { name: string; intro: string; content: CategoryContentBlock[]; faq: FaqItem[] }>;
  seo: Record<Locale, GameSeo>;
}
