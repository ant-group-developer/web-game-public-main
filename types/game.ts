import type { Locale } from '@/constants/i18n';

/** Phần chữ của game, có một bản cho mỗi ngôn ngữ. */
export interface GameText {
  title: string;
  /** Nhãn ngắn hiển thị trên banner. */
  tags: string[];
  description: string;
  about: string[];
  instructions: string[];
}

/** SEO riêng của game cho một ngôn ngữ. Trường null thì dùng giá trị mặc định suy ra từ nội dung game. */
export interface GameSeo {
  title: string | null;
  description: string | null;
  keywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

/** Game do API trả về (`GET /api/v1/public/games`), quản lý trong admin CMS. */
export interface Game {
  slug: string;
  /** URL iframe của game. Portal tự thêm ?lang=vi|en khi game hỗ trợ đổi ngôn ngữ. */
  embedUrl: string;
  /** Ảnh vuông (ảnh nhỏ trên banner, thanh game, màn tải). */
  image: string;
  /** Ảnh bìa 16:9 cho thẻ game và banner trang chủ. */
  cover: string;
  /** Ảnh chia sẻ 1200×630 (Open Graph). */
  ogImage: string | null;
  /** Ảnh lớn cho banner trang chủ (API đã thay bằng ảnh bìa nếu trống). */
  banner: string;
  /** Ảnh chụp màn hình trong game, theo thứ tự hiển thị. */
  screenshots: string[];
  /** Nhãn góc thẻ game. */
  badge: 'new' | 'hot' | null;
  /** Ưu tiên hiện trên banner trang chủ. */
  isFeatured: boolean;
  /** Tỉ lệ khung (rộng / cao) cố định cho game chỉ hiện đủ giao diện ở một tỉ lệ, ví dụ 16 / 9. */
  aspectRatio: number | null;
  /** Game nhận thêm ?parentOrigin=... để xác thực postMessage (City Bloxx). */
  passParentOrigin: boolean;
  /** Game nhận ?lang= và message `ant-play:locale` để đổi ngôn ngữ. */
  supportsLocale: boolean;
  /** Các quyền cho thuộc tính `allow` của iframe. */
  iframeAllow: string[];
  /** Giá trị thuộc tính `sandbox`; null = không sandbox. */
  iframeSandbox: string | null;
  author: string | null;
  text: Record<Locale, GameText>;
  seo: Record<Locale, GameSeo>;
  updatedAt: string;
}
