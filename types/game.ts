import type { Locale } from '@/constants/i18n';

/** Phần chữ của game, có một bản cho mỗi ngôn ngữ. */
export interface GameText {
  title: string;
  /** Câu ngắn (≤ 6 chữ) hiển thị trên thẻ game. */
  tagline: string;
  /** Nhãn ngắn hiển thị trên banner. */
  tags: string[];
  description: string;
  about: string[];
  instructions: string[];
}

export interface Game {
  slug: string;
  /** Ảnh vuông dùng cho thẻ game. */
  image: string;
  /** Ảnh chia sẻ 1200×630 (Open Graph). */
  ogImage?: string;
  /** Màu nền nhạt phía sau ảnh game trên banner trang chủ. */
  tint: string;
  /** Nhãn góc thẻ game. */
  badge?: 'new' | 'hot';
  /** Tỉ lệ khung (rộng / cao) cố định cho game chỉ hiện đủ giao diện ở một tỉ lệ, ví dụ 16 / 9. */
  aspectRatio?: number;
  /** URL iframe của game (route embed của từng game). Portal tự thêm ?lang=vi|en. */
  embedUrl: string;
  /** Game nhận thêm ?parentOrigin=... để xác thực postMessage (City Bloxx). */
  passParentOrigin?: boolean;
  author?: string;
  text: Record<Locale, GameText>;
}
